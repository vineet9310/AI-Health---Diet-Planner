/**
 * Calculates BMR, TDEE, Calorie targets and macronutrient splits
 * using the Mifflin-St Jeor formula and standard nutrition profiles.
 */
const calculateNutrition = (profile) => {
  const { age, gender, heightCm, weightKg, activityLevel, goal } = profile;

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

  // 3. Goal Adjustment
  let dailyCalories = tdee;
  if (goal === 'lose_weight') {
    dailyCalories = tdee - 500;
  } else if (goal === 'gain_muscle') {
    dailyCalories = tdee + 300;
  }
  // Enforce a sensible minimum calories floor (e.g., 1200 kcal)
  dailyCalories = Math.max(1200, Math.round(dailyCalories));

  // 4. Macro Splits (percentages)
  let proteinPct = 0.25;
  let carbsPct = 0.50;
  let fatPct = 0.25;

  if (goal === 'lose_weight') {
    proteinPct = 0.35;
    carbsPct = 0.35;
    fatPct = 0.30;
  } else if (goal === 'gain_muscle') {
    proteinPct = 0.30;
    carbsPct = 0.45;
    fatPct = 0.25;
  }

  // 5. Convert percentages of calories to grams
  // Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g
  const proteinGrams = Math.round((dailyCalories * proteinPct) / 4);
  const carbsGrams = Math.round((dailyCalories * carbsPct) / 4);
  const fatGrams = Math.round((dailyCalories * fatPct) / 9);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalories,
    macros: {
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams
    }
  };
};

module.exports = { calculateNutrition };
