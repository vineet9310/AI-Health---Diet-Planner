const { GoogleGenAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * Generate mock plan if no API keys are provided.
 */
const generateMockPlan = (healthProfile, flaggedBiomarkers) => {
  const { dailyCalories, macros, dietaryPreference, goal, allergies } = healthProfile;
  console.log('Generating fallback mock diet and workout plan...');

  // Basic mock diet plan based on preference
  const isVeg = dietaryPreference === 'vegetarian' || dietaryPreference === 'vegan';
  
  const mockMeals = [
    {
      type: 'Breakfast',
      items: isVeg 
        ? ['Oatmeal with almond milk, chia seeds, and sliced banana', '1 cup of green tea'] 
        : ['3 scrambled egg whites with spinach', '2 slices of whole wheat toast', '1 cup of black coffee'],
      kcal: Math.round(dailyCalories * 0.25)
    },
    {
      type: 'Lunch',
      items: isVeg
        ? ['Quinoa salad with mixed vegetables (cucumbers, bell peppers, tomatoes)', '150g grilled tofu', 'Olive oil dressing']
        : ['150g grilled chicken breast', 'Brown rice (1 cup)', 'Steamed broccoli and carrots'],
      kcal: Math.round(dailyCalories * 0.35)
    },
    {
      type: 'Snack',
      items: isVeg
        ? ['A handful of mixed raw nuts (almonds, walnuts)', '1 medium apple']
        : ['1 cup of low-fat Greek yogurt', 'Mixed berries (blueberries, raspberries)'],
      kcal: Math.round(dailyCalories * 0.15)
    },
    {
      type: 'Dinner',
      items: isVeg
        ? ['Lentil soup (1 bowl)', 'Sautéed spinach with garlic', 'Sweet potato (100g)']
        : ['150g baked salmon fillet', 'Asparagus spears', 'Quinoa (1/2 cup)'],
      kcal: Math.round(dailyCalories * 0.25)
    }
  ];

  // Remove any items containing allergens if matching simple strings
  if (allergies && allergies.length > 0) {
    allergies.forEach(allergy => {
      const allergyLower = allergy.toLowerCase();
      mockMeals.forEach(meal => {
        meal.items = meal.items.filter(item => !item.toLowerCase().includes(allergyLower));
      });
    });
  }

  const mockWorkout = [
    { day: 'Monday', focus: 'Upper Body Strength', exercises: ['Push-ups: 3 sets of 12 reps', 'Dumbbell rows: 3 sets of 10 reps', 'Shoulder press: 3 sets of 12 reps'] },
    { day: 'Tuesday', focus: 'Cardio & Core', exercises: ['30 mins brisk walking/jogging', 'Plank: 3 sets of 45 seconds', 'Russian twists: 3 sets of 15 reps'] },
    { day: 'Wednesday', focus: 'Active Recovery', exercises: ['15-30 mins light stretching or yoga', 'Hydration focus'] },
    { day: 'Thursday', focus: 'Lower Body Strength', exercises: ['Bodyweight squats: 3 sets of 15 reps', 'Lunges: 3 sets of 10 reps per leg', 'Glute bridges: 3 sets of 15 reps'] },
    { day: 'Friday', focus: 'Full Body HIIT', exercises: ['Jumping jacks: 45 seconds work, 15 seconds rest', 'Burpees: 30 seconds', 'Mountain climbers: 45 seconds'] },
    { day: 'Saturday', focus: 'Cardio Endurance', exercises: ['40 mins cycling or outdoor walking', 'Light stretching'] },
    { day: 'Sunday', focus: 'Rest Day', exercises: ['Full rest', 'Muscle recovery and hydration'] }
  ];

  const flags = flaggedBiomarkers.map(fb => `${fb.testName} is ${fb.status.toUpperCase()}`);

  return {
    dailyCalories,
    macros,
    meals: mockMeals,
    workout: mockWorkout,
    flagsConsidered: flags,
    notes: `Mock AI generated plan. Fit for dietary preference: ${dietaryPreference}, goal: ${goal}. Allergies ignored: ${allergies.join(', ') || 'None'}.`
  };
};

/**
 * Call Gemini API to generate structured plan
 */
const generateGeminiPlan = async (apiKey, healthProfile, flaggedBiomarkers) => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are a certified nutrition and fitness planning assistant. Create a highly customized, safe, 1-day sample meal plan and a 7-day workout schedule for a user.

User Health Profile:
- Age: ${healthProfile.age}
- Gender: ${healthProfile.gender}
- Height: ${healthProfile.heightCm} cm
- Weight: ${healthProfile.weightKg} kg
- Activity Level: ${healthProfile.activityLevel}
- Goal: ${healthProfile.goal}
- Dietary Preference: ${healthProfile.dietaryPreference}
- Allergies: ${healthProfile.allergies.join(', ') || 'None'}
- Existing Medical Conditions: ${healthProfile.existingConditions.join(', ') || 'None'}

Calculated Target Nutrients:
- Daily Calories: ${healthProfile.dailyCalories} kcal
- Protein Target: ${healthProfile.macros.protein} grams
- Carbohydrates Target: ${healthProfile.macros.carbs} grams
- Fats Target: ${healthProfile.macros.fat} grams

Flagged Medical Biomarkers from Report:
${flaggedBiomarkers.map(fb => `- ${fb.testName}: Value is ${fb.status} (${fb.unit})`).join('\n') || 'No flagged biomarkers'}

DIETARY COMPLIANCE RULES:
1. STRICTLY avoid any ingredients related to user allergies.
2. DO NOT prescribe meat/seafood/eggs if dietary preference is vegetarian or vegan.
3. Incorporate safety guidelines for medical conditions (e.g., limit sodium/simple sugars for diabetes/hypertension, avoid thyroid-interfering foods for thyroid conditions).
4. Do NOT diagnose any condition. Only use flags as dietary and exercise considerations.

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
    { "type": "Breakfast", "items": ["Item name with size/quantity", "Other item"], "kcal": 450 },
    { "type": "Lunch", "items": ["Item name"], "kcal": 650 },
    { "type": "Snack", "items": ["Item name"], "kcal": 200 },
    { "type": "Dinner", "items": ["Item name"], "kcal": 500 }
  ],
  "workout": [
    { "day": "Monday", "focus": "Cardio", "exercises": ["30 mins jogging", "Stretching"] },
    ...
  ],
  "flagsConsidered": ["List of conditions/biomarkers accommodated"],
  "notes": "Advice on hydration, food prep, or exercise safety considerations."
}
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    // Clean up markdown block if model wrapped it anyway
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API planning failed, attempting to parse output:', error);
    throw error;
  }
};

/**
 * Call Anthropic API to generate structured plan
 */
const generateAnthropicPlan = async (apiKey, healthProfile, flaggedBiomarkers) => {
  const anthropic = new Anthropic({ apiKey });

  const prompt = `
You are a certified nutrition and fitness planning assistant. Create a highly customized, safe, 1-day sample meal plan and a 7-day workout schedule for a user.

User Health Profile:
- Age: ${healthProfile.age}
- Gender: ${healthProfile.gender}
- Height: ${healthProfile.heightCm} cm
- Weight: ${healthProfile.weightKg} kg
- Activity Level: ${healthProfile.activityLevel}
- Goal: ${healthProfile.goal}
- Dietary Preference: ${healthProfile.dietaryPreference}
- Allergies: ${healthProfile.allergies.join(', ') || 'None'}
- Existing Medical Conditions: ${healthProfile.existingConditions.join(', ') || 'None'}

Calculated Target Nutrients:
- Daily Calories: ${healthProfile.dailyCalories} kcal
- Protein Target: ${healthProfile.macros.protein} grams
- Carbohydrates Target: ${healthProfile.macros.carbs} grams
- Fats Target: ${healthProfile.macros.fat} grams

Flagged Medical Biomarkers from Report:
${flaggedBiomarkers.map(fb => `- ${fb.testName}: Value is ${fb.status} (${fb.unit})`).join('\n') || 'No flagged biomarkers'}

DIETARY COMPLIANCE RULES:
1. STRICTLY avoid any ingredients related to user allergies.
2. DO NOT prescribe meat/seafood/eggs if dietary preference is vegetarian or vegan.
3. Incorporate safety guidelines for medical conditions.
4. Do NOT diagnose any condition.

Respond with ONLY valid JSON matching this structure:
{
  "dailyCalories": ${healthProfile.dailyCalories},
  "macros": {
    "protein": ${healthProfile.macros.protein},
    "carbs": ${healthProfile.macros.carbs},
    "fat": ${healthProfile.macros.fat}
  },
  "meals": [
    { "type": "Breakfast", "items": ["Item name with quantity"], "kcal": 450 },
    { "type": "Lunch", "items": ["Item name"], "kcal": 650 },
    { "type": "Snack", "items": ["Item name"], "kcal": 200 },
    { "type": "Dinner", "items": ["Item name"], "kcal": 500 }
  ],
  "workout": [
    { "day": "Monday", "focus": "Cardio", "exercises": ["30 mins jogging"] },
    ...
  ],
  "flagsConsidered": ["List of flags considered"],
  "notes": "Advice on hydration and recovery."
}
`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.2,
      system: 'You generate personalized diet and workout plans in JSON format only.',
      messages: [{ role: 'user', content: prompt }]
    });

    let text = msg.content[0].text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Anthropic API planning failed:', error);
    throw error;
  }
};

/**
 * Main service method to generate plans
 */
const generateAIPlan = async (healthProfile, flaggedBiomarkers) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (geminiKey) {
    try {
      return await generateGeminiPlan(geminiKey, healthProfile, flaggedBiomarkers);
    } catch (e) {
      console.warn('Gemini Generation failed, falling back to mock plan:', e.message);
    }
  }

  if (anthropicKey) {
    try {
      return await generateAnthropicPlan(anthropicKey, healthProfile, flaggedBiomarkers);
    } catch (e) {
      console.warn('Anthropic Generation failed, falling back to mock plan:', e.message);
    }
  }

  // Fallback to mock generation
  return generateMockPlan(healthProfile, flaggedBiomarkers);
};

module.exports = { generateAIPlan };
