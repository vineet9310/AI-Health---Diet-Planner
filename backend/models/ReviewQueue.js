const mongoose = require('mongoose');

const ReviewQueueSchema = new mongoose.Schema({
  dietPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'DietPlan', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String }, // e.g. "User has diabetes flag — requires nutritionist review"
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReviewQueue', ReviewQueueSchema);
