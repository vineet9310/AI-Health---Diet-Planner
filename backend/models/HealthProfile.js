const mongoose = require('mongoose');

const HealthProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  heightCm: { type: Number, required: true },
  weightKg: { type: Number, required: true },
  bodyFatPercent: { type: Number },
  waistCircumference: { type: Number },
  activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], required: true },
  sleepDuration: { type: Number },
  stressLevel: { type: String, enum: ['low', 'medium', 'high'] },
  occupation: { type: String },
  goal: { type: String, enum: ['lose_weight', 'maintain', 'gain_muscle'], required: true }, // Keep singular for calculations / backward compatibility
  goals: [{ type: String }], // Weight Loss, Weight Gain, Muscle Gain, Maintenance, Improve Cholesterol, Improve Thyroid Health, Improve Blood Sugar, General Wellness
  cuisinePreference: { type: String },
  dietaryPreference: { type: String, enum: ['vegetarian', 'non_vegetarian', 'vegan', 'eggetarian'], default: 'vegetarian' },
  allergies: [{ type: String }],
  religiousRestrictions: [{ type: String }],
  foodsToAvoid: [{ type: String }],
  foodsPreferred: [{ type: String }],
  existingConditions: [{ type: String }],
  currentMedications: [{ type: String }],
  previousSurgeries: [{ type: String }],
  familyHistory: [{ type: String }],
  smoking: { type: String, enum: ['never', 'former', 'occasional', 'daily'] },
  alcohol: { type: String, enum: ['never', 'occasional', 'regular', 'heavy'] },
  exerciseExperience: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  bmr: { type: Number },
  tdee: { type: Number },
  dailyCalories: { type: Number },
  macros: {
    protein: { type: Number }, // in grams
    carbs: { type: Number },   // in grams
    fat: { type: Number }      // in grams
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthProfile', HealthProfileSchema);
