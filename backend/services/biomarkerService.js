const ReferenceRange = require('../models/ReferenceRange');

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

/**
 * Extracts biomarkers from raw text using database reference ranges.
 * Handles both inline values and multi-line column-shifted values (like in Thyrocare reports).
 * @param {string} rawText - The text parsed from OCR.
 * @returns {Promise<object>} - Object with biomarkers array and hasCriticalFlag boolean.
 */
const extractBiomarkers = async (rawText) => {
  if (!rawText) {
    return { biomarkers: [], hasCriticalFlag: false };
  }

  // Load all reference ranges
  const ranges = await ReferenceRange.find({});
  const extractedBiomarkers = [];
  let hasCriticalFlag = false;

  // Split raw text into clean, non-empty lines
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

  for (const ref of ranges) {
    // Collect all aliases and the main test name
    const terms = [ref.testName, ...(ref.aliases || [])];
    
    let finalValue = null;
    let foundLineIndex = -1;
    let matchedTermUsed = '';

    // Scan lines for test name or alias matches
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      
      // Clean line to separate glued OCR prefixes
      // E.g., "PHOTOMETRYCREATININE" -> "PHOTOMETRY CREATININE"
      const line = rawLine.replace(/\b(PHOTOMETRY|CALCULATED|CHEMILUMINESCENCE|ELISA|ECLIA|EST|ESTIMATED)([A-Z])/gi, '$1 $2');

      let matchedTerm = '';
      const isMatch = terms.some(term => {
        const regex = buildBoundaryRegex(term);
        
        if (regex.test(line)) {
          // General exclusions
          if (/\bratio\b/i.test(line)) return false;
          if (line.toLowerCase().includes('urinary') || line.toLowerCase().includes('urine')) return false;
          if (line.toLowerCase().includes('average')) return false;

          // Specific term exclusions
          if (term.toLowerCase().includes('hdl') && line.toLowerCase().includes('non-hdl')) return false;
          if (term.toLowerCase() === 'cholesterol' && (line.toLowerCase().includes('hdl') || line.toLowerCase().includes('ldl'))) return false;
          if (term.toLowerCase() === 'trig' && !line.toLowerCase().includes('triglycerides')) return false;
          
          matchedTerm = term;
          return true;
        }
        return false;
      });

      if (isMatch) {
        // Skip match if this line belongs to the status/tests summary or clinical significance sections
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

        // Method 1: Check same line for a number following the matched term
        const escapedTerm = matchedTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const sameLineRegex = new RegExp(`(?:${escapedTerm})\\s*[:\\-]?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
        const sameLineMatch = line.match(sameLineRegex);
        if (sameLineMatch) {
          value = parseFloat(sameLineMatch[1]);
        }

        // Method 2: Check 1, 2, or 3 lines above for numbers (inverted table columns)
        if (value === null) {
          for (let offset = 1; offset <= 3; offset++) {
            const prevLineIndex = i - offset;
            if (prevLineIndex >= 0) {
              const prevLine = lines[prevLineIndex];
              
              // Skip reference range lines (e.g. "13.0-17.0" or "0.54-5.30")
              const isOnlyRange = /^\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?$/.test(prevLine);
              if (isOnlyRange) {
                continue;
              }

              // Match all numbers on that line
              const numbers = prevLine.match(/\d+(?:\.\d+)?/g);
              if (numbers && numbers.length > 0) {
                // Extract the last number (corresponds to measured value, not range limits)
                value = parseFloat(numbers[numbers.length - 1]);
                break;
              }
            }
          }
        }

        if (value !== null) {
          finalValue = value;
          matchedTermUsed = matchedTerm;
          foundLineIndex = i;
          break; // Stop scanning once a valid test value is matched
        }
      }
    }

    // Step 3: Compare extracted value against reference limits
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
        // Fetch factor from DB or env fallback (default to 20% below minNormal)
        const lowFactor = ref.borderlineLowThreshold || parseFloat(process.env.BORDERLINE_LOW_THRESHOLD) || 0.8;
        const borderlineLowLimit = min * lowFactor;
        if (finalValue >= borderlineLowLimit) {
          status = 'borderline_low';
        } else {
          status = 'low';
        }
      } else if (finalValue > max) {
        // Fetch factor from DB or env fallback (default to 20% above maxNormal)
        const highFactor = ref.borderlineHighThreshold || parseFloat(process.env.BORDERLINE_HIGH_THRESHOLD) || 1.2;
        const borderlineHighLimit = max * highFactor;
        if (finalValue <= borderlineHighLimit) {
          status = 'borderline_high';
        } else {
          status = 'high';
        }
      } else {
        // Strictly inside the normal range [min, max] -> always normal!
        status = 'normal';
      }

      extractedBiomarkers.push({
        testName: ref.testName,
        value: finalValue,
        unit: ref.unit,
        status
      });
    }
  }

  // Calculate and append derived clinical ratios if base lipids are present
  const hdlObj = extractedBiomarkers.find(b => b.testName === 'HDL Cholesterol');
  const ldlObj = extractedBiomarkers.find(b => b.testName === 'LDL Cholesterol');
  const trigObj = extractedBiomarkers.find(b => b.testName === 'Triglycerides');

  if (hdlObj && ldlObj && hdlObj.value && ldlObj.value) {
    const hdlLdlRatio = parseFloat((hdlObj.value / ldlObj.value).toFixed(2));
    // Normal is > 0.40, below 0.40 is low
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
    // Reference limit: < 3.12 (Low risk), borderline if slightly above, high if far above
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
    hasCriticalFlag
  };
};

module.exports = { extractBiomarkers };
