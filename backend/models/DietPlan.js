const mongoose = require('mongoose');

const DietPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  basedOnReport: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalReport' },
  dailyCalories: Number,
  macros: {
    protein: Number,
    carbs: Number,
    fat: Number
  },
  meals: [{
    type: { type: String }, // Breakfast, Lunch, Dinner, Snack
    items: [String],
    kcal: Number,
    supports: [String] // Biomarkers supported by these food choices
  }],
  workout: [{
    day: String,
    focus: String,
    exercises: [String],
    targets: [String] // Biomarkers targeted by this exercise routine
  }],
  flagsConsidered: [String],
  supplements: [String], // Customized supplement action items based on biomarkers/goals
  status: { type: String, enum: ['ai_generated', 'pending_review', 'approved', 'rejected'], default: 'ai_generated' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  confidenceScore: {
    overall: { type: Number, default: 98 },
    extraction: { type: Number, default: 99 },
    medicalLogic: { type: Number, default: 97 },
    nutrition: { type: Number, default: 98 },
    workout: { type: Number, default: 96 }
  },
  proteinRatioJustification: {
    goalText: String,
    experienceText: String,
    kidneyText: String,
    multiplierVal: Number
  },
  waterIntakeLiters: { type: Number, default: 2.5 },
  fiberGoalGrams: { type: Number, default: 32 },
  sodiumLimitMg: { type: Number, default: 2300 },
  potassiumTargetMg: { type: Number, default: 3500 },
  addedSugarLimitG: { type: Number, default: 25 },
  personalizationExplanation: [String],
  workoutExplanation: String,
  mealPersonalizedForCountry: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DietPlan', DietPlanSchema);
