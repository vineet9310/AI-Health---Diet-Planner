const mongoose = require('mongoose');

const MedicalReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
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
  riskScore: { type: Number, default: 0 },              // Calculated clinical risk score (0-100)
  riskCategory: { type: String, enum: ['Low', 'Mild', 'Moderate', 'High'], default: 'Low' },
  riskFactors: [{                                        // Breakdown of contributing risk factors
    factor: { type: String, required: true },
    points: { type: Number, required: true }
  }],
  doctorSummary: { type: String },                       // Clinically structured summary of report findings
  healthRecommendations: [{ type: String }],             // List of custom clinical action items based on biomarkers
  patientExplanation: { type: mongoose.Schema.Types.Mixed }, // Structured patient-friendly explanation
  clinicalReasoning: { type: mongoose.Schema.Types.Mixed },  // Structured physician-level reasoning
  hasCriticalFlag: { type: Boolean, default: false },
  analysisStatus: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  failureReason: { type: String },
  extractionConfidence: { type: Number },
  clinicalReasoningConfidence: { type: Number },
  overallConfidence: { type: Number }
});

module.exports = mongoose.model('MedicalReport', MedicalReportSchema);
