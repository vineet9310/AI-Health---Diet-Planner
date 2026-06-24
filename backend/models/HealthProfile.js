const mongoose = require('mongoose');

const HealthProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  heightCm: { type: Number, required: true },
  weightKg: { type: Number, required: true },
  activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'], required: true },
  goal: { type: String, enum: ['lose_weight', 'maintain', 'gain_muscle'], required: true },
  allergies: [{ type: String }],
  existingConditions: [{ type: String }], // e.g. ["diabetes", "thyroid", "kidney_disease", "heart_disease"]
  dietaryPreference: { type: String, enum: ['vegetarian', 'non_vegetarian', 'vegan', 'eggetarian'], default: 'vegetarian' },
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
