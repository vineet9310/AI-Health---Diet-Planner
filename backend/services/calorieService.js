/**
 * Calculates BMR, TDEE, Calorie targets and macronutrient splits
 * using the Mifflin-St Jeor formula and standard nutrition profiles.
 */
const calculateNutrition = (profile, latestReport = null) => {
  const { age, gender, heightCm, weightKg, activityLevel, goal, goals, existingConditions, exerciseExperience } = profile;

  // 1. Calculate BMR
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // Other: Average of male and female formula
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // 2. Activity Multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  const tdee = bmr * multiplier;

  // Get goals list
  const goalsList = Array.isArray(goals) ? goals.map(g => g.toLowerCase()) : [];
  const primaryGoal = goal || 'maintain';

  // 3. Goal Adjustment for Calorie Targets
  let dailyCalories = tdee;
  if (primaryGoal === 'lose_weight' || goalsList.includes('weight_loss') || goalsList.includes('lose_weight')) {
    dailyCalories = tdee - 500;
  } else if (primaryGoal === 'gain_muscle' || goalsList.includes('muscle_gain') || goalsList.includes('gain_muscle') || goalsList.includes('weight_gain')) {
    dailyCalories = tdee + 300;
  }
  // Enforce a sensible minimum calories floor (e.g., 1200 kcal)
  dailyCalories = Math.max(1200, Math.round(dailyCalories));

  // Determine if there is high triglycerides or general lipid condition
  const triglyceridesHigh = (latestReport && latestReport.biomarkers && latestReport.biomarkers.some(b => 
    b.testName.toLowerCase().includes('triglycerides') && b.status !== 'normal'
  )) || (existingConditions && existingConditions.some(c => 
    c.toLowerCase().includes('triglycerides')
  ));

  const hasLipidCondition = triglyceridesHigh || (existingConditions && existingConditions.some(c => 
    c.toLowerCase().includes('cholesterol') || 
    c.toLowerCase().includes('lipid') || 
    c.toLowerCase().includes('cardiovascular')
  )) || goalsList.includes('improve_cholesterol');

  // 4. Dynamic Protein Rationale & Multiplier Calculation
  const hasKidneyDisease = existingConditions && existingConditions.some(c => 
    c.toLowerCase().includes('kidney') || c.toLowerCase().includes('renal')
  );

  let baseMultiplier = 1.0; // General Health
  let goalText = "General Health (1.0 g/kg)";

  if (primaryGoal === 'gain_muscle' || goalsList.includes('muscle_gain') || goalsList.includes('weight_gain')) {
    baseMultiplier = 1.8;
    goalText = "Muscle Gain (1.8 g/kg)";
  } else if (primaryGoal === 'lose_weight' || goalsList.includes('weight_loss') || goalsList.includes('lose_weight')) {
    baseMultiplier = 1.4;
    goalText = "Weight Loss (1.4 g/kg)";
  }

  let expAdjustment = 0.0;
  let experienceText = "Intermediate (0.0 g/kg)";
  const exp = exerciseExperience || 'intermediate';
  if (exp === 'advanced') {
    expAdjustment = 0.2;
    experienceText = "Advanced (+0.2 g/kg)";
  } else if (exp === 'beginner') {
    expAdjustment = -0.1;
    experienceText = "Beginner (-0.1 g/kg)";
  }

  let finalMultiplier = baseMultiplier + expAdjustment;
  let kidneyText = "No Kidney Disease";

  // Build macro splits
  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatGrams = 0;

  if (hasKidneyDisease) {
    finalMultiplier = 0.8; // Capped for renal health
    goalText = "Renal Adaptation";
    experienceText = "Not Applicable";
    kidneyText = "Chronic Kidney Disease Capped (0.8 g/kg)";

    proteinGrams = Math.round(weightKg * 0.8);
    const proteinCalories = proteinGrams * 4;
    const proteinPct = proteinCalories / dailyCalories;

    // Remaining splits
    const fatPct = 0.30; // standard fat cap
    const carbsPct = 1.0 - proteinPct - fatPct;

    fatGrams = Math.round((dailyCalories * fatPct) / 9);
    carbsGrams = Math.round((dailyCalories * carbsPct) / 4);
  } else if (triglyceridesHigh) {
    // 🔴 HIGH PRIORITY: Carbs restricted to 40-50%, Fat to 25-30%
    let proteinPct = 0.25; // Goal based (25%)
    let fatPct = 0.30;     // 30% fat
    let carbsPct = 0.45;   // 45% carbs

    if (primaryGoal === 'maintain' && !goalsList.includes('muscle_gain') && !goalsList.includes('weight_gain')) {
      proteinPct = 0.20;
      carbsPct = 0.50;
    }

    proteinGrams = Math.round((dailyCalories * proteinPct) / 4);
    carbsGrams = Math.round((dailyCalories * carbsPct) / 4);
    fatGrams = Math.round((dailyCalories * fatPct) / 9);

    finalMultiplier = parseFloat((proteinGrams / weightKg).toFixed(2));
    goalText = `Triglyceride Restricted Cap (${Math.round(carbsPct * 100)}% Carbs)`;
    experienceText = `Goal Adapted (${Math.round(proteinPct * 100)}% Protein)`;
    kidneyText = "No Kidney Disease";
  } else {
    // Standard splits
    proteinGrams = Math.round(weightKg * finalMultiplier);
    const proteinCalories = proteinGrams * 4;
    const proteinPct = proteinCalories / dailyCalories;

    let fatPct = 0.30; // Default
    if (hasLipidCondition) {
      fatPct = 0.30;
    } else if (primaryGoal === 'gain_muscle' || goalsList.includes('muscle_gain')) {
      fatPct = 0.25; 
    } else if (primaryGoal === 'lose_weight' || goalsList.includes('weight_loss')) {
      fatPct = 0.30;
    }

    fatGrams = Math.round((dailyCalories * fatPct) / 9);
    const fatCalories = fatGrams * 9;

    // Remaining calories to carbs
    const remainingCalories = dailyCalories - proteinCalories - fatCalories;
    carbsGrams = Math.round(remainingCalories / 4);

    if (carbsGrams < 100) {
      carbsGrams = 100;
    }
  }

  // Recalculate exact calorie math compatibility to eliminate rounding discrepancies
  let pCalories = proteinGrams * 4;
  let fCalories = fatGrams * 9;
  let cCalories = carbsGrams * 4;
  let totalComputedCalories = pCalories + fCalories + cCalories;

  // Align dailyCalories to match actual sum of macros
  dailyCalories = totalComputedCalories;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalories,
    macros: {
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams
    },
    proteinRatioJustification: {
      goalText,
      experienceText,
      kidneyText,
      multiplierVal: parseFloat(finalMultiplier.toFixed(2))
    }
  };
};

module.exports = { calculateNutrition };
