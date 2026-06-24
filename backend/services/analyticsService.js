/**
 * Analytics Service for VitalPlan
 * Computes clinical risk scores, doctor summaries, and health recommendations.
 */

/**
 * Calculates cardiovascular/metabolic risk score and compiles medical insights.
 * @param {Array} biomarkers - Array of extracted biomarker documents {testName, value, unit, status}
 * @returns {Object} - { riskScore, riskCategory, doctorSummary, healthRecommendations }
 */
const generateReportAnalytics = (biomarkers) => {
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

  // Other normals
  if (hb && hb.status === 'normal') normalFindings.push('Hemoglobin');
  if (creat && creat.status === 'normal') normalFindings.push('Kidney function (Creatinine)');
  if (tbil && tbil.status === 'normal') normalFindings.push('Total Bilirubin');

  // Cap score at 100
  score = Math.min(score, 100);

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

  // Fallbacks if profile is mostly normal
  if (recommendations.length === 0) {
    recommendations.push("Maintain current balanced caloric baseline with a variety of nutrient-dense whole foods.");
    recommendations.push("Engage in a mixture of resistance training (strength) and moderate-intensity steady-state (MISS) aerobic exercises weekly.");
  }

  // --- 3. GENERATE CLINICAL DOCTOR SUMMARY ---
  let doctorSummary = '';
  
  if (abnormalFindings.length === 0) {
    doctorSummary = "Patient presents with all checked metabolic biomarkers, lipid indexes, and thyroid markers within standard reference ranges. No clinical abnormalities detected.";
  } else {
    doctorSummary = `Clinical assessment reveals a ${riskCategory.toLowerCase()} risk profile (Score: ${score}/100) based on abnormal findings. Key lab variations noted: `;
    doctorSummary += abnormalFindings.join(', ') + '.';
    
    if (normalFindings.length > 0) {
      doctorSummary += ` Normal physiological function was preserved in: ${normalFindings.join(', ')}.`;
    }
    
    doctorSummary += " Recommend clinical correlation and diagnostic review if patient is symptomatic. Findings do not establish a diagnosis and should be interpreted in conjunction with clinical history and physician assessment.";
  }

  return {
    riskScore: score,
    riskCategory,
    doctorSummary,
    healthRecommendations: recommendations,
    riskFactors
  };
};

module.exports = { generateReportAnalytics };
