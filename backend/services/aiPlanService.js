const { callAI } = require('./aiService');

/**
 * Generate mock plan if no API keys are provided.
 */
const generateMockPlan = (healthProfile, flaggedBiomarkers, reportDetails) => {
  const { dailyCalories, macros, dietaryPreference, goal, goals, allergies, country } = healthProfile;
  console.log(`Generating fallback mock diet and workout plan for country: ${country || 'USA'}...`);

  const isVeg = dietaryPreference === 'vegetarian' || dietaryPreference === 'vegan';
  const cLower = (country || '').toLowerCase();

  let meals = [];
  if (cLower.includes('india')) {
    const stateLower = (healthProfile.state || '').toLowerCase();
    const cityLower = (healthProfile.city || '').toLowerCase();
    let breakfastItems = [];
    let lunchItems = [];
    let dinnerItems = [];

    if (stateLower.includes('punjab') || stateLower.includes('delhi') || stateLower.includes('haryana') || stateLower.includes('north') || cityLower.includes('amritsar') || cityLower.includes('chandigarh') || cityLower.includes('ludhiana')) {
      breakfastItems = isVeg 
        ? ['Paneer bhurji (low fat, 100g) with spinach', '1-2 small multi-grain Rotis', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds']
        : ['2 egg whites cooked as bhurji with onions and tomatoes', '1 slice whole wheat toast', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds'];
      lunchItems = isVeg
        ? ['1 cup cooked Brown Rice or wheat Roti', '1 cup Rajma (kidney beans curry, low oil)', '1 cup Sarson da Saag (mustard greens) with minimal ghee', '1 cup cucumber tomato salad']
        : ['1 cup cooked Brown Rice or wheat Roti', '150g grilled chicken breast tikka', '1 cup Dal Makhani (healthy, low fat/cream version)', '1 cup cucumber tomato salad'];
      dinnerItems = isVeg
        ? ['2 small wheat Rotis', '1 cup Paneer curry cooked in light tomato-onion gravy', '1 cup mixed steamed vegetables']
        : ['2 small wheat Rotis', '150g baked chicken curry', '1 cup mixed steamed vegetables'];
    } else if (stateLower.includes('gujarat') || stateLower.includes('rajasthan') || stateLower.includes('west') || cityLower.includes('ahmedabad') || cityLower.includes('surat') || cityLower.includes('vadodara') || cityLower.includes('jaipur')) {
      breakfastItems = ['2 small Methi Theplas (cooked with minimal oil)', '1 cup low-fat curd (yogurt)', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds'];
      lunchItems = isVeg
        ? ['1 cup Gujarati Dal (lentil curry, low sugar/jaggery)', '1 cup steamed brown rice or Khichdi', '1 cup steamed cabbage and green peas shaak', '1 cup cucumber raita']
        : ['150g grilled chicken tikka', '1 cup Gujarati Dal (healthy version)', '1 cup steamed brown rice', '1 cup cucumber raita'];
      dinnerItems = isVeg
        ? ['2 small multigrain chapatis', '1 cup Moong dal Khichdi (lightly spiced with minimal oil)', '1 cup mixed steamed vegetables']
        : ['2 small multigrain chapatis', '150g baked fish', '1 cup mixed steamed vegetables'];
    } else if (stateLower.includes('south') || stateLower.includes('karnataka') || stateLower.includes('tamil') || stateLower.includes('andhra') || stateLower.includes('kerala') || cityLower.includes('bangalore') || cityLower.includes('chennai') || cityLower.includes('hyderabad') || cityLower.includes('cochi')) {
      breakfastItems = isVeg
        ? ['2 small Ragi Idlis or Oats Idlis', '1/2 cup vegetable Sambar (low oil)', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds']
        : ['2 egg whites scramble with curry leaves and mustard seeds', '1 small Ragi Dosa / pancake', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds'];
      lunchItems = isVeg
        ? ['1 cup cooked Brown Rice or Ragi mudde', '1 cup mixed vegetable Sambar', '1 cup spinach poriyal (steamed spinach with light coconut seasoning)', '1 cup low-fat curd']
        : ['1 cup cooked Brown Rice', '150g grilled fish fillet', '1 cup mixed vegetable Sambar', '1 cup spinach poriyal'];
      dinnerItems = isVeg
        ? ['2 small Ragi Rotis', '1 cup boiled Moong Dal', '1 cup mixed steamed vegetables']
        : ['2 small Ragi Rotis', '150g steamed fish curry (Kerala style, thin gravy)', '1 cup mixed steamed vegetables'];
    } else {
      // Default India general
      breakfastItems = isVeg
        ? ['2 small Oats Idlis with mint chutney', '1 cup low-fat curd (yogurt)', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds']
        : ['2 egg whites cooked as bhurji with onions and tomatoes', '1 slice whole wheat toast', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds'];
      lunchItems = isVeg
        ? ['1 cup cooked Brown Rice', '1 cup Rajma (kidney beans curry)', '1 cup mixed green salad with cucumbers and tomatoes', '1 cup steamed spinach']
        : ['1 cup cooked Brown Rice', '150g grilled chicken breast tikka (healthy version)', '1 cup Dal (lentil curry)', '1 cup green salad'];
      dinnerItems = isVeg
        ? ['2 small multigrain Rotis', '150g Paneer curry (lightly spiced with minimal oil)', '1 cup mixed steamed vegetables']
        : ['2 small multigrain Rotis', '150g baked fish curry', '1 cup steamed cauliflower and carrots'];
    }

    meals = [
      {
        type: 'Breakfast',
        items: breakfastItems,
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['Cardiovascular Wellness', 'LDL Cholesterol Reduction', 'Supports overall nutritional needs relevant to thyroid function']
      },
      {
        type: 'Lunch',
        items: lunchItems,
        kcal: Math.round(dailyCalories * 0.35),
        supports: ['HDL/LDL Ratio Improvement', 'Triglyceride Management']
      },
      {
        type: 'Snack',
        items: ['1 cup roasted Chana (chickpeas)', '1 cup unsweetened Green Tea'],
        kcal: Math.round(dailyCalories * 0.15),
        supports: ['Satiety and low glycemic response']
      },
      {
        type: 'Dinner',
        items: dinnerItems,
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['Protein Target Support', 'Omega-3 Level Optimization']
      }
    ];
  } else if (cLower.includes('pakistan')) {
    meals = [
      {
        type: 'Breakfast',
        items: ['2 egg whites scramble with spinach', '1 whole wheat Chapati (small)', '1 cup Plain low-fat Yogurt', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds'],
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['Cardiovascular Wellness', 'LDL Cholesterol Reduction']
      },
      {
        type: 'Lunch',
        items: ['1 cup cooked Brown Rice', '150g Chicken Karahi (healthy version with 1 tsp olive oil and lots of tomatoes)', '1 cup mixed green salad (cucumber, lettuce, tomato)'],
        kcal: Math.round(dailyCalories * 0.35),
        supports: ['HDL/LDL Ratio Improvement', 'Triglyceride Management']
      },
      {
        type: 'Snack',
        items: ['1 apple', '10 raw walnuts'],
        kcal: Math.round(dailyCalories * 0.15),
        supports: ['Healthy Fats Integration']
      },
      {
        type: 'Dinner',
        items: ['1 small whole wheat Chapati', '1 cup yellow Daal (lentils)', '150g grilled fish fillet', '1 cup steamed cabbage and green beans'],
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['Protein Target Support', 'Omega-3 Level Optimization']
      }
    ];
  } else if (cLower.includes('japan')) {
    meals = [
      {
        type: 'Breakfast',
        items: ['1 bowl of Miso soup with Tofu and seaweed', '1 soft-boiled egg', '1 cup Green Tea', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds'],
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['Thyroid support', 'Low calorie satiety']
      },
      {
        type: 'Lunch',
        items: ['1 cup steamed white or brown Rice', '150g grilled Salmon fillet', '1 cup boiled Edamame beans', 'Side of pickled cucumbers'],
        kcal: Math.round(dailyCalories * 0.35),
        supports: ['Omega-3 levels', 'Triglyceride management']
      },
      {
        type: 'Snack',
        items: ['1 medium pear', '1 cup unsweetened Matcha'],
        kcal: Math.round(dailyCalories * 0.15),
        supports: ['Antioxidant intake']
      },
      {
        type: 'Dinner',
        items: ['150g grilled Tofu', '1 cup steamed broccoli and shiitake mushrooms', '1 cup seaweed salad', 'Drizzle of light soy sauce and sesame oil'],
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['HDL/LDL Ratio Improvement']
      }
    ];
  } else if (cLower.includes('mediterranean') || cLower.includes('italy') || cLower.includes('greece') || cLower.includes('spain')) {
    meals = [
      {
        type: 'Breakfast',
        items: ['1 cup Plain Greek Yogurt (0% fat)', '1/2 cup Mixed Berries', '1 tbsp Ground Flaxseed', '1 slice Whole Wheat Bread toasted with 1 tsp extra virgin olive oil', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds'],
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['LDL Reduction', 'Omega-3 Level Optimization']
      },
      {
        type: 'Lunch',
        items: ['1.5 cups Chickpea salad with cucumbers, red onions, tomatoes, and parsley', '150g grilled Cod fillet', '1 tbsp Extra Virgin Olive Oil & Lemon dressing'],
        kcal: Math.round(dailyCalories * 0.35),
        supports: ['HDL/LDL Ratio Improvement', 'Cardiovascular Health']
      },
      {
        type: 'Snack',
        items: ['1 cup baby carrots and cucumber slices with 2 tbsp hummus'],
        kcal: Math.round(dailyCalories * 0.15),
        supports: ['Fiber and satiety']
      },
      {
        type: 'Dinner',
        items: ['1 cup cooked Quinoa or Whole Grain couscous', '150g baked Sea Bass', '2 cups steamed broccoli and asparagus drizzled with olive oil'],
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['Omega-3 Level Optimization']
      }
    ];
  } else {
    // Default/USA
    meals = [
      {
        type: 'Breakfast',
        items: isVeg
          ? ['1 cup (80g dry) Rolled Oats cooked with water', '1.5 scoops (45g) vegan protein powder', '1/2 cup Mixed Berries', '1 tbsp Ground Flaxseed', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds']
          : ['1 cup (80g dry) Rolled Oats cooked with water', '1.5 scoops (45g) Whey Protein Powder', '1/2 cup Mixed Berries', '1 tbsp Ground Flaxseed', '1-2 Brazil nuts per day (strictly limited to avoid selenium toxicity)', '10 almonds'],
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['LDL Cholesterol Reduction', 'Triglyceride Management', 'Supports overall nutritional needs relevant to thyroid function']
      },
      {
        type: 'Lunch',
        items: isVeg
          ? ['1.5 cups cooked Quinoa', '150g grilled Tofu', '2 cups mixed green salad with cucumber and cherry tomatoes', '1/4 Avocado', '0.5 tbsp Extra Virgin Olive Oil & Lemon dressing']
          : ['2 slices Whole Wheat Bread', '150g sliced Turkey breast', '1 cup baby spinach', '1/4 Avocado', '1 cup sliced strawberries on the side'],
        kcal: Math.round(dailyCalories * 0.35),
        supports: ['Weight Management', 'HDL/LDL Ratio Improvement']
      },
      {
        type: 'Snack',
        items: ['1 cup baby carrots', '2 tbsp Hummus', '1 apple'],
        kcal: Math.round(dailyCalories * 0.15),
        supports: ['Healthy Fats Integration']
      },
      {
        type: 'Dinner',
        items: isVeg
          ? ['1 cup cooked Quinoa', '1 cup Lentil soup (brown lentils)', '2 cups steamed broccoli and green beans', '0.5 tbsp Extra Virgin Olive Oil']
          : ['1 cup cooked Quinoa', '150g baked Salmon fillet', '2 cups steamed broccoli and asparagus', '0.5 tbsp Extra Virgin Olive Oil'],
        kcal: Math.round(dailyCalories * 0.25),
        supports: ['Omega-3 Level Optimization', 'Cardiovascular Wellness']
      }
    ];
  }

  // Adjust for allergies
  if (allergies && allergies.length > 0) {
    allergies.forEach(allergy => {
      const allergyLower = allergy.toLowerCase();
      meals.forEach(m => {
        m.items = m.items.filter(item => !item.toLowerCase().includes(allergyLower));
      });
    });
  }

  const mockWorkout = [
    { day: 'Monday', focus: 'Upper Body Strength', exercises: ['Push-ups: 3 sets of 12 reps', 'Dumbbell rows: 3 sets of 10 reps', 'Shoulder press: 3 sets of 12 reps'], targets: ['Muscle Building', 'Energy Output Increase'] },
    { day: 'Tuesday', focus: 'Moderate Intensity Cardio', exercises: ['30 mins brisk walking/jogging or cycling at steady pace'], targets: ['High Triglycerides Oxidation', 'LDL Cholesterol Control'] },
    { day: 'Wednesday', focus: 'Active Recovery & Stretch', exercises: ['15-30 mins light stretching or yoga', 'Hydration focus'], targets: ['Cortisol Level Reduction', 'Muscle Recovery'] },
    { day: 'Thursday', focus: 'Lower Body Strength', exercises: ['Bodyweight squats: 3 sets of 15 reps', 'Lunges: 3 sets of 10 reps per leg', 'Glute bridges: 3 sets of 15 reps'], targets: ['Insulin Sensitivity Improvement', 'Leg Strength'] },
    { day: 'Friday', focus: 'HIIT Workout', exercises: ['Burpees: 3 sets x 30 sec work / 30 sec rest', 'Mountain climbers: 3 sets x 30 sec', '(Note: 1-2 sessions/week depending on fitness level - beginners start with 1 session or low-impact cardio first)'], targets: ['Trig/HDL Ratio Optimization', 'High Triglycerides Reduction'] },
    { day: 'Saturday', focus: 'Moderate Intensity Cardio', exercises: ['40 mins cycling or outdoor walking', 'Light stretching'], targets: ['High LDL Reduction', 'Cardiorespiratory Endurance'] },
    { day: 'Sunday', focus: 'Rest Day', exercises: ['Full rest', 'Muscle recovery and hydration'], targets: ['Muscle Recovery & Repair', 'Nervous System Recovery'] }
  ];

  const flags = flaggedBiomarkers.map(fb => `${fb.testName} is ${fb.status.toUpperCase()}`);
  if (reportDetails) {
    if (reportDetails.riskCategory) flags.push(`Cardiovascular/Endocrine Risk Category: ${reportDetails.riskCategory}`);
    if (reportDetails.riskScore) flags.push(`Cardiovascular/Endocrine Risk Score: ${reportDetails.riskScore}`);
  }

  const mockSupplements = [];
  if (flaggedBiomarkers.some(b => b.testName.toLowerCase().includes('cholesterol') || b.testName.toLowerCase().includes('ldl') || b.testName.toLowerCase().includes('trig'))) {
    mockSupplements.push("Omega-3 Fish Oil (1000mg daily) | Reason: Elevated Triglycerides and LDL Cholesterol | Evidence Level: Moderate - Discuss with your healthcare provider whether supplementation is appropriate.");
    mockSupplements.push("Coenzyme Q10 (CoQ10) (100mg daily) | Reason: General cardiovascular and statin-use support | Evidence Level: Moderate - Discuss with your healthcare provider whether supplementation is appropriate.");
  }
  if (flaggedBiomarkers.some(b => b.testName.toLowerCase().includes('tsh') || b.testName.toLowerCase().includes('thyroid'))) {
    mockSupplements.push("Selenium (100 mcg daily) | Reason: Elevated TSH and thyroid hormone conversion support | Evidence Level: Moderate - Discuss with your healthcare provider whether supplementation is appropriate.");
    mockSupplements.push("Zinc (15 mg daily) | Reason: General thyroid hormone receptor support | Evidence Level: Moderate - Discuss with your healthcare provider whether supplementation is appropriate.");
  }
  if (mockSupplements.length === 0) {
    mockSupplements.push("Vitamin D3 (2000 IU daily) | Reason: Basic bone health and metabolic support | Evidence Level: High - Discuss with your healthcare provider whether supplementation is appropriate.");
    mockSupplements.push("Daily Multivitamin | Reason: Basic micro-nutrient intake insurance | Evidence Level: High - Discuss with your healthcare provider whether supplementation is appropriate.");
  }

  const personalizationExplanation = [];
  const flaggedTestNames = flaggedBiomarkers.map(fb => fb.testName.toLowerCase());
  
  if (flaggedTestNames.some(name => name.includes('cholesterol') || name.includes('ldl'))) {
    personalizationExplanation.push("Reduced dietary saturated fat intake due to elevated LDL Cholesterol levels.");
  }
  if (flaggedTestNames.some(name => name.includes('triglycerides') || name.includes('trig'))) {
    personalizationExplanation.push("Increased soluble fiber (from oats/lentils) and limited single-meal carbs because Triglycerides are elevated.");
  }
  if (flaggedTestNames.some(name => name.includes('tsh') || name.includes('thyroid'))) {
    personalizationExplanation.push("Included selenium and zinc support in nutrition because TSH is elevated.");
  }
  
  const cPref = healthProfile.cuisinePreference || healthProfile.country || 'General';
  personalizationExplanation.push(`Selected ${cPref} diet and food preferences because your country/cuisine preference is ${cPref}.`);
  personalizationExplanation.push(`Adapted daily calorie ceiling (${dailyCalories} kcal) to match your primary goal: ${(goals || []).join(', ') || goal}.`);
  
  if (personalizationExplanation.length < 3) {
    personalizationExplanation.push("Balanced essential vitamins, healthy fats, and proteins to maintain metabolic fitness.");
  }

  let workoutExplanation = `This workout plan is optimized for a ${healthProfile.age}-year-old ${healthProfile.gender} at a ${healthProfile.exerciseExperience} exercise experience level. `;
  if (flaggedTestNames.some(name => name.includes('cholesterol') || name.includes('trig'))) {
    workoutExplanation += "It focuses on low-impact steady-state cardiovascular sessions to assist in lipid clearance and triglyceride oxidation, paired with structured resistance training to improve overall insulin sensitivity.";
  } else {
    workoutExplanation += "It prioritizes balanced strength training and moderate-intensity metabolic conditioning to support general wellness and health goals.";
  }

  let notes = `Mock AI generated plan for country ${country || 'unspecified'}. Fit for dietary preference: ${dietaryPreference}, goals: ${(goals || []).join(', ') || goal}. Allergies ignored: ${allergies.join(', ') || 'None'}.`;
  if (reportDetails && reportDetails.doctorSummary) {
    notes += ` Under consideration of medical findings: ${reportDetails.doctorSummary}`;
  }

  return {
    dailyCalories,
    macros,
    meals,
    workout: mockWorkout,
    flagsConsidered: flags,
    supplements: mockSupplements,
    confidenceScore: 96,
    personalizationExplanation,
    workoutExplanation,
    mealPersonalizedForCountry: country || 'India',
    notes
  };
};

/**
 * Shared function to construct the robust, safe planning prompt
 */
const buildPrompt = (healthProfile, flaggedBiomarkers, reportDetails) => {
  let reportContext = '';
  let biomarkersContext = '';
  let rawTextContext = '';

  if (reportDetails) {
    reportContext = `
Clinical Risk Assessment from Report:
- Cardiovascular/Endocrine Risk Score: ${reportDetails.riskScore} (out of 100)
- Risk Category: ${reportDetails.riskCategory}
- Doctor's Findings Summary: ${reportDetails.doctorSummary || 'None'}
- Clinical Recommendations:
${(reportDetails.healthRecommendations || []).map(r => `  * ${r}`).join('\n') || '  None'}
`;

    if (reportDetails.biomarkers) {
      biomarkersContext = reportDetails.biomarkers.map(b => `- ${b.testName}: ${b.value} ${b.unit || ''} (Status: ${b.status})`).join('\n');
    }
    
    if (reportDetails.rawExtractedText) {
      rawTextContext = `\nFull PDF Extracted Text (for AI verification):\n"""\n${reportDetails.rawExtractedText.substring(0, 3000)}\n"""\n`;
    }
  }

  if (!biomarkersContext) {
    biomarkersContext = flaggedBiomarkers.map(fb => `- ${fb.testName}: Value is ${fb.status} (${fb.unit})`).join('\n') || 'No biomarkers provided';
  }

  return `
You are a certified nutrition and fitness planning assistant. Create a highly customized, safe, 1-day sample meal plan and a 7-day workout schedule for a user.

User Health Profile:
- Full Name: ${healthProfile.fullName || 'User'}
- Age: ${healthProfile.age}
- Gender: ${healthProfile.gender}
- Country: ${healthProfile.country || 'USA'}
- State/City: ${healthProfile.state || 'None'} / ${healthProfile.city || 'None'}
- Height: ${healthProfile.heightCm} cm
- Weight: ${healthProfile.weightKg} kg
- Body Fat %: ${healthProfile.bodyFatPercent || 'Not provided'}%
- Waist Circumference: ${healthProfile.waistCircumference || 'Not provided'} cm
- Activity Level: ${healthProfile.activityLevel}
- Sleep Duration: ${healthProfile.sleepDuration || 'Not provided'} hours/night
- Stress Level: ${healthProfile.stressLevel || 'low'}
- Occupation: ${healthProfile.occupation || 'Not provided'}
- Health Goals: ${(healthProfile.goals || []).join(', ') || healthProfile.goal}
- Cuisine Preference: ${healthProfile.cuisinePreference || 'General / Local'}
- Dietary Preference: ${healthProfile.dietaryPreference}
- Allergies: ${(healthProfile.allergies || []).join(', ') || 'None'}
- Religious Restrictions: ${(healthProfile.religiousRestrictions || []).join(', ') || 'None'}
- Foods to Avoid: ${(healthProfile.foodsToAvoid || []).join(', ') || 'None'}
- Foods Preferred: ${(healthProfile.foodsPreferred || []).join(', ') || 'None'}
- Current Medications: ${(healthProfile.currentMedications || []).join(', ') || 'None'}
- Previous Surgeries: ${(healthProfile.previousSurgeries || []).join(', ') || 'None'}
- Family History: ${(healthProfile.familyHistory || []).join(', ') || 'None'}
- Lifestyle Habits: Smoking: ${healthProfile.smoking || 'never'}, Alcohol: ${healthProfile.alcohol || 'never'}, Exercise Experience: ${healthProfile.exerciseExperience || 'beginner'}

Calculated Target Nutrients:
- Daily Calories: ${healthProfile.dailyCalories} kcal
- Protein Target: ${healthProfile.macros.protein} grams
- Carbohydrates Target: ${healthProfile.macros.carbs} grams
- Fats Target: ${healthProfile.macros.fat} grams

Original Extracted Biomarkers from Laboratory Report:
${biomarkersContext}
${reportContext}
${rawTextContext}

AI VERIFICATION & SAFETY LAYER:
You MUST verify all facts and perform a safety/consistency check:
1. Validate that the biomarker status matches the user profile and medical history.
2. Verify that there are no medical contraindications in the meal plan or workout plan. If the user has cardiovascular risk (or heart_disease), ensure the workouts are adapted, safe, and do not contain extreme strain. Include a warning disclaimer if necessary.
3. If inconsistencies are detected in the input (e.g. recommending foods they are allergic to, or food preferences like vegan with animal products, or religious restrictions like pork for Halal users, or intense HIIT for critical cardiovascular risks), resolve the conflict and regenerate a safe, cohesive plan.

COUNTRY-BASED MEAL PLANNING:
Construct the diet utilizing ingredients local to the user's country (${healthProfile.country || 'USA'}) and matching their cuisine preference (${healthProfile.cuisinePreference || 'General'}):
- If the country is India: Prioritize foods matching the user's specific State (${healthProfile.state || 'unspecified'}), City (${healthProfile.city || 'unspecified'}), and local Cuisine. Specifically:
  * For North India / Punjab / Delhi: Prioritize Rajma, Sarson da Saag, Paneer, Whole Wheat Roti, Dal Makhani (low fat), and Poha.
  * For West India / Gujarat / Rajasthan: Prioritize Methi Thepla, Gujarati Dal (low sugar), Khichdi, Kadhi, and Dhokla.
  * For South India (Karnataka, Tamil Nadu, Andhra, Kerala): Prioritize Idli, Sambar, Ragi mudde/Roti, Dosa, Rasam, and spinach poriyal.
  * For East India / Bengal: Prioritize healthy fish curries (like Machher Jhol), steamed brown rice, lentils, and steamed vegetables.
  * Otherwise, customize with standard balanced regional foods relevant to their state and city.
- If the country is Pakistan: Prioritize Chapati, Daal, Chicken Karahi (healthy version), Brown Rice, Yogurt, and local spices.
- If the country is USA: Prioritize Oats, Turkey, Salmon, Whole Wheat Bread, berries, and leafy greens.
- If the country is Japan: Prioritize Rice, Miso, Fish, Tofu, seaweed, and steamed green vegetables.
- If the country is a Mediterranean country: Prioritize Olive Oil, Chickpeas, Fish, Whole Grains, and legumes.
- For other countries: Prioritize locally available whole foods.

GOAL PRIORITIZATION & COHERENCY RULES:
You must determine a clear hierarchy of priorities to make recommendations coherent:
1. If abnormal biomarkers (e.g., High Triglycerides, High LDL Cholesterol, High TSH) are present:
   - The PRIMARY CLINICAL GOAL is "Improve Lipid Profile & Cardiovascular Risk Management" (or the relevant clinical correction).
   - Any physical/fitness goals (like "Muscle Gain" or "Weight Loss") are subordinated as SECONDARY GOALS.
   - You must structure the recommendations such that the primary medical goal is met first (e.g., prioritizing low saturated fat, low glycemic index carbs, high soluble fiber) before satisfying the secondary goal (e.g., adding clean calories for muscle building). Do not recommend high-glycemic sweeteners (honey/juice/dates) or high saturated fats if triglycerides or LDL are high, even if they help hit calorie targets.
2. Clearly mention this priority hierarchy in the "personalizationExplanation" and meal choices.

DIETARY COMPLIANCE RULES:
1. STRICTLY avoid any ingredients related to user allergies.
2. DO NOT prescribe meat/seafood/eggs if dietary preference is vegetarian or vegan.
3. Incorporate safety guidelines for medical conditions (e.g., limit sodium/simple sugars for diabetes/hypertension, avoid thyroid-interfering foods for thyroid conditions). Specifically adjust the plan to address the cardiovascular/endocrine risks and clinical recommendations detailed in the report.
4. Do NOT diagnose any condition. Only use flags and clinical findings as dietary and exercise considerations.
5. CRITICAL NUTRITIONAL SAFETY: Limit Brazil nuts strictly to exactly '1-2 Brazil nuts per day' (approx. 5g) to avoid selenium toxicity. Suggest other healthy fats like almonds, walnuts, or pistachios instead for fat targets.
6. HIIT WORKOUT FREQUENCY & SAFETY: Limit HIIT conditioning to at most 1-2 sessions per week. Always add a beginner safety notice to HIIT sessions: '(1-2 sessions/week depending on fitness level - beginners start with 1 session or low-impact cardio first)'.
7. THYROID SAFETY WARNING: If recommending foods/targets for TSH/thyroid, do NOT imply that diet alone treats thyroid conditions or use the phrase 'Thyroid Health Support'. Instead, strictly write: 'Supports overall nutritional needs relevant to thyroid function'.
8. CARBOHYDRATE PORTION SIZE LIMIT: If triglycerides or lipids are flagged as HIGH/abnormal, strictly limit single-meal portions of cooked complex carbohydrates (e.g. brown rice, oats, quinoa, sweet potato, lentils) to a maximum of '1 cup cooked' (or approx. 150g). Compensate for meal volume and satiety by suggesting extra non-starchy leafy greens or cruciferous vegetables.
9. SAFETY PHRASING CONSTRAINT: Never state that the AI has diagnosed a disease. Use wording such as "possible", "suggestive of", "consistent with", or "recommend physician evaluation". Never replace professional medical advice.
10. CONSERVATIVE SUPPLEMENTS RULE & FORMAT: All supplement recommendations must be presented as optional educational suggestions in a structured pipe-delimited format: "Supplement Name (dosage) | Reason: [Specific biomarker/goal why recommended] | Evidence Level: [High/Moderate/Low] - Discuss with your healthcare provider whether supplementation is appropriate." Every single string in the 'supplements' array MUST match this format.
11. EXPLAINABILITY & LOCALIZATION:
- Fill "confidenceScore" with a calculated verification confidence score (between 90 and 100) based on biomarker quality and profile detail completeness.
- Fill "personalizationExplanation" with an array of 3-5 clear, educational bullet points explaining exactly why specific dietary targets or food choices were selected (e.g. why fat was reduced for LDL, why soluble fiber was added for triglycerides, why Indian meals were chosen for country India).
- Fill "workoutExplanation" with a short paragraph explaining why this physical activity volume and split is safe and appropriate for their age, medical conditions, goals, and experience level.
- Fill "mealPersonalizedForCountry" with their country name (${healthProfile.country || 'USA'}).

FORMATTING RULE:
You MUST respond with a single valid JSON object only. Do not wrap the JSON in markdown code blocks, do not write any introductory or concluding text.

Required JSON Structure:
{
  "dailyCalories": ${healthProfile.dailyCalories},
  "macros": {
    "protein": ${healthProfile.macros.protein},
    "carbs": ${healthProfile.macros.carbs},
    "fat": ${healthProfile.macros.fat}
  },
  "meals": [
    { 
      "type": "Breakfast", 
      "items": ["Item name with size/quantity", "Other item"], 
      "kcal": 450,
      "supports": ["Biomarker target (e.g., LDL Reduction, Triglyceride Reduction, Supports overall nutritional needs relevant to thyroid function)"]
    },
    { 
      "type": "Lunch", 
      "items": ["Item name"], 
      "kcal": 650,
      "supports": ["Biomarker target"]
    },
    { 
      "type": "Snack", 
      "items": ["Item name"], 
      "kcal": 200,
      "supports": ["Biomarker target"]
    },
    { 
      "type": "Dinner", 
      "items": ["Item name"], 
      "kcal": 500,
      "supports": ["Biomarker target"]
    }
  ],
  "workout": [
    { 
      "day": "Monday", 
      "focus": "Cardio", 
      "exercises": ["30 mins jogging", "Stretching"],
      "targets": ["Biomarker or risk targeted (e.g., High Triglycerides, Trig/HDL Ratio Optimization, Cardiovascular Fitness)"]
    },
    ...
  ],
  "flagsConsidered": ["List of conditions/biomarkers accommodated and verification safety findings"],
  "supplements": ["Evidence-based supplement suggestions with dosages, if appropriate, else empty array"],
  "confidenceScore": 96,
  "personalizationExplanation": ["3-5 clear bullet points explaining WHY these recommendations were chosen based on their country, dietary preference, specific biomarkers like LDL/Triglycerides/TSH, and goals."],
  "workoutExplanation": "A short paragraph explaining why this workout split and volume is appropriate for their age, goal, medical history, and experience level.",
  "mealPersonalizedForCountry": "${healthProfile.country || 'USA'}",
  "notes": "Advice on hydration, food prep, or exercise safety considerations. Add warning text if physical activity constraints were resolved."
}
`;
};

/**
 * Main service method to generate plans using Multi-Provider AI Engine
 */
const generateAIPlan = async (healthProfile, flaggedBiomarkers, reportDetails = null) => {
  const prompt = buildPrompt(healthProfile, flaggedBiomarkers, reportDetails);

  try {
    console.log('[AI Engine] Generating diet and exercise plan using Multi-Provider AI Engine...');
    const result = await callAI(prompt, 'plan');
    if (result && result.data) {
      console.log(`[AI Engine] Plan generated successfully using ${result.providerName}.`);
      return result.data;
    }
  } catch (error) {
    console.warn('[AI Engine] All AI providers failed for plan generation, falling back to Deterministic Medical Rules / Mock Plan Generator:', error.message);
  }

  // Fallback to mock generation
  return generateMockPlan(healthProfile, flaggedBiomarkers, reportDetails);
};

module.exports = { generateAIPlan };
