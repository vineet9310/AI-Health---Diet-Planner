const { GoogleGenerativeAI } = require('@google/generative-ai');
const ReferenceRange = require('../models/ReferenceRange');
const { callAI } = require('./aiService');

/**
 * Helper to build a regular expression with word boundaries where appropriate.
 * Only prepends/appends \b if the first/last character of the term is a word character.
 * This prevents failure when terms contain symbols like parentheses.
 * @param {string} term 
 * @returns {RegExp}
 */
const buildBoundaryRegex = (term) => {
  const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const startBoundary = /^\w/.test(term) ? '\\b' : '';
  const endBoundary = /\w$/.test(term) ? '\\b' : '';
  return new RegExp(startBoundary + escaped + endBoundary, 'i');
};
const cleanAIErrorMessage = (message) => {
  if (!message) return '503 Service Unavailable';
  if (message.includes('429') || message.includes('Quota exceeded') || message.includes('rate-limits') || message.includes('Too Many Requests')) {
    return 'Google Gemini API quota has been exceeded. Please check your plan/billing details or try again in a few minutes.';
  }
  if (message.includes('503') || message.includes('demand') || message.includes('overloaded') || message.includes('Service Unavailable')) {
    return 'Google Gemini service is temporarily overloaded or experiencing high demand. Please try again in 1-2 minutes.';
  }
  if (message.includes('ENOTFOUND') || message.includes('fetch failed') || message.includes('connect')) {
    return 'Network Error: The server could not connect to Google Gemini service. Please check your internet connection.';
  }
  if (message.includes('GoogleGenerativeAI Error') || message.includes('https://') || message.includes('[{')) {
    const cleanMsg = message.split('For more information')[0].split('head to:')[0].split('[{"')[0].replace(/\[.*?\]/g, '').replace(/https?:\/\/\S+/g, '').replace(/[\{\}\[\]"']/g, '').trim();
    if (cleanMsg && cleanMsg.length > 5) {
      return cleanMsg;
    }
  }
  return message;
};
/**
 * Calls Gemini AI to parse biomarkers from raw text using the catalog of expected ranges.
 * @param {string} rawText 
 * @param {Array} ranges 
 * @returns {Promise<Array>}
 */
const extractBiomarkersWithAI = async (rawText, ranges) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash which is supported by the API version
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const catalogText = ranges.map(r => 
    `- ${r.testName} (Aliases: ${r.aliases?.join(', ') || 'none'}, Standard Unit: ${r.unit}, Expected Normal Range: ${r.minNormal} to ${r.maxNormal})`
  ).join('\n');

  const prompt = `
You are a highly accurate clinical data extraction AI assistant.
Your task is to analyze the raw OCR text from a medical diagnostic report and extract only the relevant biomarkers that were actually measured and are listed in the expected catalog.

EXPECTED BIOMARKER CATALOG:
${catalogText}

RAW REPORT OCR TEXT:
"""
${rawText}
"""

CRITICAL EXTRACTION RULES:
1. ONLY extract tests that were actually performed and have a measured value. If a test says "Test not taken", "No Data", "Not Taken", or is absent, DO NOT extract it. For example, in the report, if it says "Cholesterol Total: Test not taken", DO NOT extract Total Cholesterol.
2. Carefully associate values and units. Do not get confused by unrelated text, machine info, or numbers on adjacent lines.
3. Correct obvious OCR failures:
   - For example, if the text shows "Haemoglobin (HB) : 12.2 g/dL", the value is 12.2, not 3 (which might be from a layout indicator like "Smart Report 3.0" or "tests performed - 3").
   - If the text shows TSH value is 5.27, do not associate 5.27 with Cholesterol if Cholesterol was not taken.
   - If a value looks medically implausible (e.g. Hemoglobin = 3, which is near-fatal anemia) and the text has a normal number (like 12.2 or 13.0) nearby, correct it to the plausible number.
4. UNIT CONVERSION:
   - If a lipid marker (e.g. Total Cholesterol, LDL, HDL, Triglycerides) is reported in "mmol/L" (e.g., 5.27 mmol/L), convert it to the standard "mg/dL" by multiplying by 38.67 (e.g., 5.27 * 38.67 = 203.79 mg/dL) and set unit to "mg/dL".
   - For other units, keep them as is.
5. output the result in a strict JSON array matching the structure:
[
  {
    "testName": "Exact name from catalog",
    "value": 12.2,
    "unit": "g/dL",
    "status": "normal",
    "confidence": 0.98,
    "reasoning": "Successfully extracted from Hematology/CBC section next to HB label."
  }
]
Determine the status based on standard reference ranges:
- TSH: normal is 0.4 to 4.0 mIU/L
- Vitamin D: normal is 30 to 100 ng/mL, low is 10 to 30, critical is < 10 or > 150
- Hemoglobin: normal is 12.0 to 17.5 g/dL
- Total Cholesterol: normal is 100 to 200 mg/dL
- HbA1c: normal is 4.0 to 5.6 %

Respond with the JSON array only, without any markdown formatting, backticks, or explanation.
`;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();
  
  if (responseText.startsWith('```')) {
    responseText = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(responseText);
  if (!Array.isArray(parsed)) {
    throw new Error('Generative AI did not return a valid array of biomarkers.');
  }

  return parsed;
};

/**
 * Extracts biomarkers from raw text using database reference ranges.
 * Handles both inline values and multi-line column-shifted values (like in Thyrocare reports).
 * @param {string} rawText - The text parsed from OCR.
 * @returns {Promise<object>} - Object with biomarkers array and hasCriticalFlag boolean.
 */
const extractBiomarkers = async (rawText) => {
  if (!rawText) {
    return { biomarkers: [], hasCriticalFlag: false, extractionConfidence: 0, providerName: 'None' };
  }

  const ranges = await ReferenceRange.find({});
  let extractedBiomarkers = [];
  let hasCriticalFlag = false;
  let extractionConfidence = 85.0; // Default fallback confidence
  let activeProvider = 'Medical Rules Engine';
  let aiSucceeded = false;

  // 1. Try Multi-Provider AI-based extraction
  const catalogText = ranges.map(r => 
    `- ${r.testName} (Aliases: ${r.aliases?.join(', ') || 'none'}, Standard Unit: ${r.unit}, Expected Normal Range: ${r.minNormal} to ${r.maxNormal})`
  ).join('\n');

  const prompt = `
You are a highly accurate clinical data extraction AI assistant.
Your task is to analyze the raw OCR text from a medical diagnostic report and extract only the relevant biomarkers that were actually measured and are listed in the expected catalog.

EXPECTED BIOMARKER CATALOG:
${catalogText}

RAW REPORT OCR TEXT:
"""
${rawText}
"""

CRITICAL EXTRACTION RULES:
1. ONLY extract tests that were actually performed and have a measured value. If a test says "Test not taken", "No Data", "Not Taken", or is absent, DO NOT extract it. For example, in the report, if it says "Cholesterol Total: Test not taken", DO NOT extract Total Cholesterol.
2. Carefully associate values and units. Do not get confused by unrelated text, machine info, or numbers on adjacent lines.
3. Correct obvious OCR failures:
   - For example, if the text shows "Haemoglobin (HB) : 12.2 g/dL", the value is 12.2, not 3 (which might be from a layout indicator like "Smart Report 3.0" or "tests performed - 3").
   - If the text shows TSH value is 5.27, do not associate 5.27 with Cholesterol if Cholesterol was not taken.
   - If a value looks medically implausible (e.g. Hemoglobin = 3, which is near-fatal anemia) and the text has a normal number (like 12.2 or 13.0) nearby, correct it to the plausible number.
4. UNIT CONVERSION:
   - If a lipid marker (e.g. Total Cholesterol, LDL, HDL, Triglycerides) is reported in "mmol/L" (e.g., 5.27 mmol/L), convert it to the standard "mg/dL" by multiplying by 38.67 (e.g., 5.27 * 38.67 = 203.79 mg/dL) and set unit to "mg/dL".
   - For other units, keep them as is.
5. Return the result in a STRICT JSON array matching the structure:
[
  {
    "testName": "Exact name from catalog",
    "value": 12.2,
    "unit": "g/dL",
    "confidence": 0.98,
    "reasoning": "Successfully extracted from Hematology/CBC section next to HB label."
  }
]

Respond with the JSON array only, without any markdown formatting, backticks, or explanation.
`;

  try {
    const aiResult = await callAI(prompt, 'biomarker');
    if (aiResult && aiResult.data) {
      const aiBiomarkers = aiResult.data;
      activeProvider = aiResult.providerName;
      console.log(`[AI Engine] ${activeProvider} successfully extracted ${aiBiomarkers.length} raw biomarkers.`);

      // Validate extraction confidence
      let totalConfidence = 0;
      let countConfidence = 0;
      const verifiedBiomarkers = [];

      for (const bio of aiBiomarkers) {
        const conf = typeof bio.confidence === 'number' ? bio.confidence : parseFloat(bio.confidence) || 0.90;
        
        // Filter out individual low confidence extractions (< 80%)
        if (conf < 0.80) {
          console.warn(`Filtering out biomarker "${bio.testName}" due to low extraction confidence (${(conf * 100).toFixed(1)}%).`);
          continue;
        }

        totalConfidence += conf;
        countConfidence++;
        verifiedBiomarkers.push(bio);
      }

      const avgConfidence = countConfidence > 0 ? totalConfidence / countConfidence : 0;
      console.log(`[AI Engine] AI biomarker extraction average confidence score: ${(avgConfidence * 100).toFixed(1)}%`);
      extractionConfidence = parseFloat((avgConfidence * 100).toFixed(1));

      // If average confidence is below 90% (0.90), throw error to trigger next/regex fallback
      if (avgConfidence < 0.90 && verifiedBiomarkers.length > 0) {
        throw new Error(`Overall AI extraction confidence (${(avgConfidence * 100).toFixed(1)}%) is below the safety threshold of 90%.`);
      }

      // Apply code validation layer on top of AI extraction
      for (const bio of verifiedBiomarkers) {
        const ref = ranges.find(r => r.testName.toLowerCase() === bio.testName.toLowerCase());
        if (ref) {
          let value = parseFloat(bio.value);
          if (isNaN(value)) continue;

          let unit = bio.unit || ref.unit;
          // Standardize unit conversion
          if (unit.toLowerCase() === 'mmol/l' && ref.unit.toLowerCase() === 'mg/dl') {
            value = parseFloat((value * 38.67).toFixed(2));
            unit = 'mg/dL';
          }

          let status = 'normal';
          const min = ref.minNormal;
          const max = ref.maxNormal;
          const critLow = ref.criticalLow || (min / 2);
          const critHigh = ref.criticalHigh || (max * 2);

          if (value <= critLow || value >= critHigh) {
            status = 'critical';
            hasCriticalFlag = true;
          } else if (value < min) {
            const lowFactor = ref.borderlineLowThreshold || 0.8;
            if (value >= min * lowFactor) {
              status = 'borderline_low';
            } else {
              status = 'low';
            }
          } else if (value > max) {
            const highFactor = ref.borderlineHighThreshold || 1.2;
            if (value <= max * highFactor) {
              status = 'borderline_high';
            } else {
              status = 'high';
            }
          }

          extractedBiomarkers.push({
            testName: ref.testName,
            value,
            unit: ref.unit,
            status
          });
        }
      }
      aiSucceeded = true;
    }
  } catch (aiError) {
    console.warn(`[AI Engine] Multi-provider AI extraction failed: ${aiError.message}`);
    console.log(`[AI Engine] Transitioning to Deterministic Medical Rules Engine...`);
  }

  // 2. Fallback check: Deterministic Medical Rules Engine (Regex-based parser)
  if (!aiSucceeded) {
    console.log('Running regex-based fallback biomarker extraction (Deterministic Medical Rules Engine)...');
    activeProvider = 'Medical Rules Engine';
    extractionConfidence = 70.0; // Rules Engine has a baseline confidence of 70%

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

    for (const ref of ranges) {
      const terms = [ref.testName, ...(ref.aliases || [])];
      
      let finalValue = null;

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.replace(/\b(PHOTOMETRY|CALCULATED|CHEMILUMINESCENCE|ELISA|ECLIA|EST|ESTIMATED)([A-Z])/gi, '$1 $2');

        let matchedTerm = '';
        const isMatch = terms.some(term => {
          const regex = buildBoundaryRegex(term);
          if (regex.test(line)) {
            if (/\bratio\b/i.test(line)) return false;
            if (line.toLowerCase().includes('urinary') || line.toLowerCase().includes('urine')) return false;
            if (line.toLowerCase().includes('average')) return false;
            if (term.toLowerCase().includes('hdl') && line.toLowerCase().includes('non-hdl')) return false;
            if (term.toLowerCase() === 'cholesterol' && (line.toLowerCase().includes('hdl') || line.toLowerCase().includes('ldl'))) return false;
            if (term.toLowerCase() === 'trig' && !line.toLowerCase().includes('triglycerides')) return false;
            
            matchedTerm = term;
            return true;
          }
          return false;
        });

        if (isMatch) {
          const isSummarySection = (
            (lines[i - 1] && lines[i - 1].toLowerCase() === 'ready') ||
            (lines[i + 1] && lines[i + 1].toLowerCase() === 'ready') ||
            line.toLowerCase().includes('test name') ||
            line.toLowerCase().includes('ordered') ||
            line.toLowerCase().includes('clinical significance')
          );
          
          if (isSummarySection) {
            continue;
          }

          let value = null;

          // Method 1: Same line extraction
          const escapedTerm = matchedTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const sameLineRegex = new RegExp(`(?:${escapedTerm})\\s*[:\\-]?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
          const sameLineMatch = line.match(sameLineRegex);
          if (sameLineMatch) {
            value = parseFloat(sameLineMatch[1]);
          }

          // Method 2: Lines above extraction
          if (value === null) {
            for (let offset = 1; offset <= 3; offset++) {
              const prevLineIndex = i - offset;
              if (prevLineIndex >= 0) {
                const prevLine = lines[prevLineIndex];
                const isOnlyRange = /^\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?$/.test(prevLine);
                if (isOnlyRange) continue;

                const numbers = prevLine.match(/\d+(?:\.\d+)?/g);
                if (numbers && numbers.length > 0) {
                  value = parseFloat(numbers[numbers.length - 1]);
                  break;
                }
              }
            }
          }

          // Apply post-validation rules
          if (value !== null) {
            // Check for units and convert mmol/L to mg/dL
            if (ref.testName === 'Total Cholesterol' || ref.testName === 'LDL Cholesterol' || ref.testName === 'HDL Cholesterol') {
              if (value < 15) { // Likely mmol/L
                value = parseFloat((value * 38.67).toFixed(2));
              }
            }

            // Exclude layout text numbers matching
            if (ref.testName === 'Hemoglobin' && value < 5) continue;
            if (ref.testName === 'Vitamin D' && value > 150) continue;

            finalValue = value;
            break;
          }
        }
      }

      if (finalValue !== null) {
        let status = 'normal';
        const min = ref.minNormal;
        const max = ref.maxNormal;
        const critLow = ref.criticalLow || (min / 2);
        const critHigh = ref.criticalHigh || (max * 2);

        if (finalValue <= critLow || finalValue >= critHigh) {
          status = 'critical';
          hasCriticalFlag = true;
        } else if (finalValue < min) {
          const lowFactor = ref.borderlineLowThreshold || 0.8;
          const borderlineLowLimit = min * lowFactor;
          if (finalValue >= borderlineLowLimit) {
            status = 'borderline_low';
          } else {
            status = 'low';
          }
        } else if (finalValue > max) {
          const highFactor = ref.borderlineHighThreshold || 1.2;
          const borderlineHighLimit = max * highFactor;
          if (finalValue <= borderlineHighLimit) {
            status = 'borderline_high';
          } else {
            status = 'high';
          }
        }

        extractedBiomarkers.push({
          testName: ref.testName,
          value: finalValue,
          unit: ref.unit,
          status
        });
      }
    }
  }

  // Calculate and append derived clinical ratios if base lipids are present
  const hdlObj = extractedBiomarkers.find(b => b.testName === 'HDL Cholesterol');
  const ldlObj = extractedBiomarkers.find(b => b.testName === 'LDL Cholesterol');
  const trigObj = extractedBiomarkers.find(b => b.testName === 'Triglycerides');

  if (hdlObj && ldlObj && hdlObj.value && ldlObj.value) {
    const hdlLdlRatio = parseFloat((hdlObj.value / ldlObj.value).toFixed(2));
    extractedBiomarkers.push({
      testName: 'HDL/LDL Ratio',
      value: hdlLdlRatio,
      unit: 'Ratio',
      status: hdlLdlRatio < 0.40 ? 'low' : 'normal'
    });
  }

  if (trigObj && hdlObj && trigObj.value && hdlObj.value) {
    const trigHdlRatio = parseFloat((trigObj.value / hdlObj.value).toFixed(2));
    let status = 'normal';
    if (trigHdlRatio > 3.12) {
      status = trigHdlRatio > (3.12 * 1.2) ? 'high' : 'borderline_high';
    }
    extractedBiomarkers.push({
      testName: 'Trig/HDL Ratio',
      value: trigHdlRatio,
      unit: 'Ratio',
      status
    });
  }

  return {
    biomarkers: extractedBiomarkers,
    hasCriticalFlag,
    extractionConfidence,
    providerName: activeProvider
  };
};

module.exports = { extractBiomarkers };
