const mongoose = require('mongoose');

const MedicalReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  rawExtractedText: { type: String },
  biomarkers: [{
    testName: String,
    value: Number,
    unit: String,
    status: { type: String, enum: ['normal', 'borderline_low', 'borderline_high', 'low', 'high', 'critical'] }
  }],
  hasCriticalFlag: { type: Boolean, default: false },
  analysisStatus: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' }
});

module.exports = mongoose.model('MedicalReport', MedicalReportSchema);
