const mongoose = require('mongoose');

const ProgressLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  weightKg: Number,
  mealsFollowed: Number,   // count out of total meals planned for the day
  workoutCompleted: Boolean,
  notes: String
});

module.exports = mongoose.model('ProgressLog', ProgressLogSchema);
