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
    kcal: Number
  }],
  workout: [{
    day: String,
    focus: String,
    exercises: [String]
  }],
  flagsConsidered: [String],
  status: { type: String, enum: ['ai_generated', 'pending_review', 'approved', 'rejected'], default: 'ai_generated' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DietPlan', DietPlanSchema);
