const { GoogleGenerativeAI } = require('@google/generative-ai');
const { callAI } = require('./aiService');

/**
 * Calls Gemini AI to perform deep clinical reasoning and correlation.
 */
const generateClinicalReasoningWithAI = async (biomarkers) => {
  const biomarkersText = biomarkers.map(b => 
    `- ${b.testName}: ${b.value} ${b.unit} (Status: ${b.status})`
  ).join('\n');

  const prompt = `
You are an expert clinical diagnostic physician. Perform an in-depth clinical analysis and differential correlation on the following patient biomarkers.

PATIENT BIOMARKERS:
${biomarkersText}

CRITICAL DUAL-LAYER REPORTING GUIDELINES:

Return TWO layers in your response:

1. PATIENT LAYER (patientExplanation)
Rules:
- No medical jargon. Explain like to an 8th-grade student.
- The patient explanation section MUST NOT return single-word symptoms or simple strings.
- Format PATIENT LAYER as a JSON object containing keys:
  - "mainProblem": A short description of the main problems found (under 150 words, simple terms, no medical jargon, mentioning likely symptoms).
  - "symptoms": List of symptoms the patient likely feels. For every symptom, you MUST return:
    - "symptom": The symptom name (e.g., "Extreme fatigue").
    - "reason": Why this symptom may occur in simple terms, referencing the relevant biomarkers.
    - "supportedBy": Array of biomarker names supporting this symptom (e.g. ["Vitamin D", "Vitamin B12", "TSH"]).
    - "likelihood": Estimated likelihood (e.g., "Very likely (85-95%)" or "Likely (70-80%)").
  - "possibleCauses": List of possible causes. For every cause, you MUST return:
    - "cause": Cause name (e.g., "Low sunlight exposure").
    - "explanation": Simple explanation.
    - "likelihood": Likelihood level (e.g., "High", "Moderate", "Possible").
  - "nextSteps": List of clear priority actions for the patient. For every step, you MUST return:
    - "step": Action step (e.g., "Consult a physician within 1-2 weeks").
    - "reason": Why the patient should do this next.
    - "priority": Priority level (e.g., "Priority 1", "Priority 2", "Priority 3").

2. DOCTOR LAYER (clinicalReasoning)
Rules:
- Use cautious language.
- Never diagnose.
- Use likelihood percentages.
- Mention supporting biomarkers.
- Mention possible alternative causes.
- Format DOCTOR LAYER as a JSON object containing keys:
  - "differentialDiagnosis": Top possible causes/conditions in order.
  - "likelihoods": Probability scores for the patterns observed in a safe, hedged format using likelihood percentages (e.g. "Vitamin D deficiency: ~95% likelihood"). Mention supporting biomarkers and possible alternative causes.
  - "recommendations": Clinical recommendations.
  - "nextTests": List of next recommended tests.
  - "redFlags": List of clinical red flags to watch out for.

Format your response as a strict JSON object with these exact keys:
{
  "patientExplanation": {
    "mainProblem": "What does this report mean explanation...",
    "symptoms": [
      {
        "symptom": "Extreme fatigue",
        "reason": "Low Vitamin D, borderline Vitamin B12 deficiency and elevated TSH commonly cause fatigue.",
        "supportedBy": ["Vitamin D", "Vitamin B12", "TSH"],
        "likelihood": "Very likely (85-95%)"
      }
    ],
    "possibleCauses": [
      {
        "cause": "Low sunlight exposure",
        "explanation": "Limited exposure to direct outdoor sunlight, leading to low Vitamin D synthesis.",
        "likelihood": "High"
      }
    ],
    "nextSteps": [
      {
        "step": "Consult a physician within 1-2 weeks.",
        "reason": "To evaluate early thyroid changes and establish a medical care plan.",
        "priority": "Priority 1"
      }
    ]
  },
  "clinicalReasoning": {
    "differentialDiagnosis": ["differential 1"],
    "likelihoods": ["likelihood 1"],
    "recommendations": ["rec 1"],
    "nextTests": ["test 1"],
    "redFlags": ["flag 1"]
  },
  "clinicalReasoningConfidence": 0.92
}

Ensure your response is valid JSON only. Do not wrap in markdown block formatting, do not use backticks, and write no introductory or concluding text.
`;

  const aiResult = await callAI(prompt, 'clinical');
  if (!aiResult || !aiResult.data) {
    throw new Error('AI clinical reasoning returned empty response.');
  }

  const parsed = aiResult.data;
  return {
    patientExplanation: parsed.patientExplanation,
    clinicalReasoning: parsed.clinicalReasoning,
    clinicalReasoningConfidence: parsed.clinicalReasoningConfidence ? parseFloat(parsed.clinicalReasoningConfidence) : 0.90,
    providerName: aiResult.providerName
  };
};

/**
 * Calculates cardiovascular/metabolic risk score and compiles medical insights.
 * @param {Array} biomarkers - Array of extracted biomarker documents {testName, value, unit, status}
 * @returns {Object} - { riskScore, riskCategory, doctorSummary, healthRecommendations }
 */
const generateReportAnalytics = async (biomarkers) => {
  let score = 0;
  const recommendations = [];
  const abnormalFindings = [];
  const normalFindings = [];

  // Find biomarkers
  const getBio = (name) => biomarkers.find(b => b.testName === name);

  const hba1c = getBio('HbA1c');
  const tc = getBio('Total Cholesterol');
  const ldl = getBio('LDL Cholesterol');
  const hdl = getBio('HDL Cholesterol');
  const trig = getBio('Triglycerides');
  const tsh = getBio('TSH');
  const hb = getBio('Hemoglobin');
  const creat = getBio('Creatinine');
  const tbil = getBio('Total Bilirubin');
  const dbil = getBio('Direct Bilirubin');
  const ibil = getBio('Indirect Bilirubin');
  const hdlLdl = getBio('HDL/LDL Ratio');
  const trigHdl = getBio('Trig/HDL Ratio');
  const vitB12 = getBio('Vitamin B12');
  const vitD = getBio('Vitamin D');
  const rdw = getBio('RDW-CV');
  const mpv = getBio('MPV');
  const alc = getBio('Absolute Lymphocyte Count');

  // --- 1. RISK SCORE MATH ---
  const riskFactors = [];
  
  // LDL Cholesterol
  if (ldl) {
    if (ldl.value > 160) {
      score += 25;
      abnormalFindings.push(`significantly elevated LDL Cholesterol (${ldl.value} ${ldl.unit})`);
      riskFactors.push({ factor: 'LDL Cholesterol', points: 25 });
    } else if (ldl.value > 130) {
      score += 15;
      abnormalFindings.push(`elevated LDL Cholesterol (${ldl.value} ${ldl.unit})`);
      riskFactors.push({ factor: 'LDL Cholesterol', points: 15 });
    } else {
      normalFindings.push('LDL Cholesterol');
    }
  }

  // Triglycerides
  if (trig) {
    if (trig.value > 200) {
      score += 25;
      abnormalFindings.push(`high Triglycerides (${trig.value} ${trig.unit})`);
      riskFactors.push({ factor: 'Triglycerides', points: 25 });
    } else if (trig.value > 150) {
      score += 15;
      abnormalFindings.push(`moderately high Triglycerides (${trig.value} ${trig.unit})`);
      riskFactors.push({ factor: 'Triglycerides', points: 15 });
    } else {
      normalFindings.push('Triglycerides');
    }
  }

  // TSH (Thyroid)
  if (tsh) {
    if (tsh.value > 10) {
      score += 20;
      abnormalFindings.push(`severely elevated TSH (${tsh.value} ${tsh.unit}) suggesting hypothyroidism`);
      riskFactors.push({ factor: 'TSH Elevation', points: 20 });
    } else if (tsh.value > 4.0) {
      score += 10;
      abnormalFindings.push(`mildly elevated TSH (${tsh.value} ${tsh.unit}) suggesting subclinical hypothyroidism`);
      riskFactors.push({ factor: 'TSH Elevation', points: 10 });
    } else {
      normalFindings.push('Thyroid activity (TSH)');
    }
  }

  // HbA1c (Blood Sugar)
  if (hba1c) {
    if (hba1c.value >= 6.5) {
      score += 30;
      abnormalFindings.push(`diabetic level HbA1c (${hba1c.value}%)`);
      riskFactors.push({ factor: 'HbA1c Elevation (Diabetes)', points: 30 });
    } else if (hba1c.value >= 5.7) {
      score += 15;
      abnormalFindings.push(`prediabetic level HbA1c (${hba1c.value}%)`);
      riskFactors.push({ factor: 'HbA1c Elevation (Prediabetes)', points: 15 });
    } else {
      normalFindings.push('Glycemic control (HbA1c)');
    }
  }

  // HDL Cholesterol
  if (hdl) {
    if (hdl.value < 40) {
      score += 15;
      abnormalFindings.push(`low HDL Cholesterol (${hdl.value} ${hdl.unit})`);
      riskFactors.push({ factor: 'Low HDL Cholesterol', points: 15 });
    } else {
      normalFindings.push('HDL Cholesterol');
    }
  }

  // Trig/HDL Ratio
  if (trigHdl) {
    if (trigHdl.value > 3.0) {
      score += 10;
      abnormalFindings.push(`high Trig/HDL risk ratio (${trigHdl.value})`);
      riskFactors.push({ factor: 'Trig/HDL Ratio', points: 10 });
    }
  }

  // HDL/LDL Ratio
  if (hdlLdl) {
    if (hdlLdl.value < 0.40) {
      score += 10; // Adjusted from 5 to 10 to match clinical weight feedback
      abnormalFindings.push(`low HDL/LDL ratio (${hdlLdl.value})`);
      riskFactors.push({ factor: 'HDL/LDL Ratio', points: 10 });
    }
  }

  // Indirect Bilirubin
  if (ibil) {
    if (ibil.value > 0.8) {
      // Keeps 0 score value contribution as it is not a direct cardiovascular/endocrine marker
      abnormalFindings.push(`borderline elevated Indirect Bilirubin (${ibil.value} ${ibil.unit})`);
      riskFactors.push({ factor: 'Indirect Bilirubin', points: 0 });
    } else {
      normalFindings.push('Indirect Bilirubin');
    }
  }

  // Vitamin B12
  if (vitB12) {
    if (vitB12.value < 150) {
      score += 20;
      abnormalFindings.push(`deficient Vitamin B12 (${vitB12.value} ${vitB12.unit})`);
      riskFactors.push({ factor: 'Vitamin B12 Deficiency', points: 20 });
    } else if (vitB12.value < 200) {
      score += 10;
      abnormalFindings.push(`borderline low Vitamin B12 (${vitB12.value} ${vitB12.unit})`);
      riskFactors.push({ factor: 'Vitamin B12 Borderline', points: 10 });
    } else {
      normalFindings.push('Vitamin B12');
    }
  }

  // RDW-CV
  if (rdw) {
    if (rdw.status !== 'normal') {
      score += 5;
      abnormalFindings.push(`${rdw.status.replace('_', ' ')} RDW-CV (${rdw.value}${rdw.unit})`);
      riskFactors.push({ factor: 'Abnormal RDW-CV', points: 5 });
    } else {
      normalFindings.push('RDW-CV');
    }
  }

  // MPV
  if (mpv) {
    if (mpv.status !== 'normal') {
      score += 5;
      abnormalFindings.push(`${mpv.status.replace('_', ' ')} MPV (${mpv.value} ${mpv.unit})`);
      riskFactors.push({ factor: 'Abnormal MPV', points: 5 });
    } else {
      normalFindings.push('MPV');
    }
  }

  // Absolute Lymphocyte Count
  if (alc) {
    if (alc.status !== 'normal') {
      score += 5;
      abnormalFindings.push(`${alc.status.replace('_', ' ')} Absolute Lymphocyte Count (${alc.value} ${alc.unit})`);
      riskFactors.push({ factor: 'Abnormal ALC', points: 5 });
    } else {
      normalFindings.push('Absolute Lymphocyte Count');
    }
  }

  // Vitamin D Score Calculation
  if (vitD) {
    if (vitD.status === 'critical' || vitD.value < 10) {
      score += 20;
      abnormalFindings.push(`critical low Vitamin D (${vitD.value} ${vitD.unit})`);
      riskFactors.push({ factor: 'Severe Vitamin D Deficiency', points: 20 });
    } else if (vitD.status === 'low' || vitD.value < 30) {
      score += 10;
      abnormalFindings.push(`low Vitamin D (${vitD.value} ${vitD.unit})`);
      riskFactors.push({ factor: 'Vitamin D Insufficiency', points: 10 });
    } else {
      normalFindings.push('Vitamin D');
    }
  }

  // Multiple Abnormalities Synergy Bonus
  const abnormalCount = biomarkers.filter(b => b.status !== 'normal').length;
  if (abnormalCount >= 3) {
    score += 10;
    riskFactors.push({ factor: 'Multiple Biomarker Synergy Risk Bonus', points: 10 });
  }

  // Post-scan: Loop through all extracted biomarkers to compile all abnormal/normal findings generically
  biomarkers.forEach(b => {
    if (b.status !== 'normal') {
      const formattedStatus = b.status.replace('_', ' ');
      const valStr = `${b.value} ${b.unit === 'Ratio' ? '' : b.unit}`.trim();
      const lowercaseFindings = abnormalFindings.map(f => f.toLowerCase());
      const isAlreadyAdded = lowercaseFindings.some(f => f.includes(b.testName.toLowerCase()));
      if (!isAlreadyAdded) {
        abnormalFindings.push(`${formattedStatus} ${b.testName} (${valStr})`);
      }
    } else {
      const lowercaseNormals = normalFindings.map(n => n.toLowerCase());
      const isAlreadyAdded = lowercaseNormals.some(n => n.includes(b.testName.toLowerCase()));
      if (!isAlreadyAdded) {
        normalFindings.push(b.testName);
      }
    }
  });

  // Cap score at 100
  score = Math.min(score, 100);

  // Step 5: Risk Score Validation - If any biomarker status is critical, minimum risk score must be 30
  const hasCritical = biomarkers.some(b => b.status === 'critical');
  if (hasCritical && score < 30) {
    score = 30;
  }

  // Categorize Risk
  let riskCategory = 'Low';
  if (score > 75) {
    riskCategory = 'High';
  } else if (score > 50) {
    riskCategory = 'Moderate';
  } else if (score > 25) {
    riskCategory = 'Mild';
  } else {
    riskCategory = 'Low';
  }

  // --- 2. COMPILE HEALTH RECOMMENDATIONS ---
  let hasHighLipids = false;
  
  if (ldl && ldl.value > 100) {
    hasHighLipids = true;
    recommendations.push("Increase daily intake of soluble dietary fiber (e.g. oat bran, beta-glucan, psyllium husk) to block LDL cholesterol absorption.");
    recommendations.push("Replace saturated fat sources (butter, fatty meats) with monounsaturated fats (extra virgin olive oil, avocados, almonds).");
  }

  if (trig && trig.value > 150) {
    hasHighLipids = true;
    recommendations.push("Limit refined sugars, high-fructose corn syrups, and alcohol, as they are rapidly synthesized into triglycerides by the liver.");
    recommendations.push("Incorporate omega-3 polyunsaturated fatty acids (EPA/DHA) through fish oils or flaxseed to lower circulating VLDL levels.");
  }

  if (hasHighLipids) {
    recommendations.push("Aim for 150–300 minutes of moderate-intensity aerobic exercise weekly (e.g. brisk walking, cycling, or swimming) to manage elevated lipid levels.");
  }

  if (tsh && tsh.value > 4.0) {
    recommendations.push("Ensure adequate selenium and zinc intake through a balanced diet or physician-guided supplementation if deficiency is suspected.");
    recommendations.push("If symptomatic (fatigue, weight gain), consult your physician to evaluate anti-TPO antibody status for Hashimoto's thyroiditis.");
  }

  if (hba1c && hba1c.value >= 5.7) {
    recommendations.push("Engage in regular post-meal walks (10-15 minutes) to trigger GLUT4 glucose transporter translocation and lower glucose spikes.");
  }

  if (trigHdl && trigHdl.value > 3.0) {
    recommendations.push("Integrate high-intensity cardiovascular conditioning (HIIT) twice weekly to promote fat oxidation and optimize the Trig/HDL ratio.");
  }

  // Vitamin D recommendations
  if (vitD && vitD.status !== 'normal') {
    recommendations.push("Ensure sufficient daily synthesis of Vitamin D3 through 15-20 minutes of midday sunlight exposure or physician-guided oral cholecalciferol supplementation.");
  }

  // Hemoglobin recommendations
  if (hb && hb.status !== 'normal') {
    recommendations.push("Increase consumption of iron-rich foods (lean meats, spinach, legumes) paired with Vitamin C to assist in absorption and elevate hemoglobin levels.");
  }

  // Vitamin B12 recommendations
  if (vitB12 && vitB12.status !== 'normal') {
    recommendations.push("Increase consumption of Vitamin B12-rich foods (dairy, eggs, fortified cereals, fish) or discuss methylcobalamin supplementation with your physician.");
  }

  // CBC markers recommendations
  const hasCbcAbnormalities = (rdw && rdw.status !== 'normal') || (mpv && mpv.status !== 'normal') || (alc && alc.status !== 'normal');
  if (hasCbcAbnormalities) {
    recommendations.push("Discuss blood count variations (RDW-CV, MPV, ALC) with your doctor to rule out nutritional deficits (such as iron or folate deficiency) or subclinical inflammation.");
  }

  // Fallbacks if profile is mostly normal
  if (recommendations.length === 0) {
    recommendations.push("Maintain current balanced caloric baseline with a variety of nutrient-dense whole foods.");
    recommendations.push("Engage in a mixture of resistance training (strength) and moderate-intensity steady-state (MISS) aerobic exercises weekly.");
  }

  // Step 6: AI Clinical Reasoning Layer (Dual-Layer Analysis)
  let patientExplanation = null;
  let clinicalReasoning = null;
  let clinicalReasoningConfidence = 90.0; // Default fallback confidence
  let activeProvider = 'Medical Rules Engine';

  try {
    console.log('Attempting AI clinical reasoning via Multi-Provider framework...');
    const aiAnalysis = await generateClinicalReasoningWithAI(biomarkers);
    patientExplanation = aiAnalysis.patientExplanation;
    clinicalReasoning = aiAnalysis.clinicalReasoning;
    clinicalReasoningConfidence = parseFloat((aiAnalysis.clinicalReasoningConfidence * 100).toFixed(1));
    activeProvider = aiAnalysis.providerName;
    console.log(`[AI Engine] AI clinical reasoning completed successfully using ${activeProvider}.`);
  } catch (aiErr) {
    console.error('All AI providers failed for clinical reasoning, falling back to Deterministic Medical Rules Engine:', aiErr.message);
  }

  // Fallback structures if AI failed or key was missing
  if (!patientExplanation) {
    let summaryText = '';
    if (abnormalFindings.length === 0) {
      summaryText = "Patient presents with all checked metabolic biomarkers, lipid indexes, and thyroid markers within standard reference ranges. No clinical abnormalities detected.";
    } else {
      summaryText = `Clinical assessment reveals a ${riskCategory.toLowerCase()} risk profile (Score: ${score}/100) based on abnormal findings. Key lab variations noted: ${abnormalFindings.join(', ')}.`;
    }
    
    // Construct structured symptoms
    const structuredSymptoms = [];
    if (abnormalFindings.length > 0) {
      abnormalFindings.forEach(f => {
        const matchingBios = biomarkers.filter(b => f.toLowerCase().includes(b.testName.toLowerCase())).map(b => b.testName);
        structuredSymptoms.push({
          symptom: `Physiological variation - ${f.split('(')[0].trim()}`,
          reason: `Associated with variation in ${f}`,
          supportedBy: matchingBios.length > 0 ? matchingBios : ["Biomarkers"],
          likelihood: "Possible (50-70%)"
        });
      });
    } else {
      structuredSymptoms.push({
        symptom: "General fatigue",
        reason: "Mild deficiency or daily lifestyle factors.",
        supportedBy: [],
        likelihood: "Unlikely (10-30%)"
      });
    }

    const structuredCauses = [];
    if (abnormalFindings.length > 0) {
      abnormalFindings.forEach(f => {
        structuredCauses.push({
          cause: `Suboptimal level of ${f.split('(')[0].trim()}`,
          explanation: `Lab report indicated level outside optimal ranges: ${f}`,
          likelihood: "Moderate"
        });
      });
    } else {
      structuredCauses.push({
        cause: "General nutrition baseline",
        explanation: "Normal dietary variations.",
        likelihood: "Low"
      });
    }

    const structuredSteps = recommendations.map((rec, index) => ({
      step: rec,
      reason: "To support wellness and restore baseline levels.",
      priority: `Priority ${index + 1}`
    }));

    patientExplanation = {
      mainProblem: summaryText,
      symptoms: structuredSymptoms,
      possibleCauses: structuredCauses,
      nextSteps: structuredSteps
    };
  }

  if (!clinicalReasoning) {
    clinicalReasoning = {
      differentialDiagnosis: abnormalFindings.length > 0 ? abnormalFindings : ["All biomarkers normal"],
      likelihoods: abnormalFindings.map(f => `${f.split('(')[0].trim()}: Estimated ~70-80% likelihood`),
      recommendations: recommendations,
      nextTests: ["Comprehensive metabolic panel", "CBC follow-up"],
      redFlags: ["Persistent fatigue lasting > 4 weeks", "Unexplained muscle weakness"]
    };
  }

  // Backwards compatibility mapping for legacy fields
  const doctorSummary = typeof patientExplanation.mainProblem === 'string' ? patientExplanation.mainProblem : "Refer to detailed patient analysis.";
  const healthRecommendations = clinicalReasoning.recommendations || recommendations;

  return {
    riskScore: score,
    riskCategory,
    doctorSummary,
    healthRecommendations,
    riskFactors,
    clinicalReasoningConfidence,
    patientExplanation,
    clinicalReasoning,
    providerName: activeProvider
  };
};

module.exports = { generateReportAnalytics };
