const mongoose = require('mongoose');

const ReferenceRangeSchema = new mongoose.Schema({
  testName: { type: String, required: true },        // e.g. "Fasting Glucose"
  unit: { type: String, required: true },             // e.g. "mg/dL"
  minNormal: { type: Number, required: true },
  maxNormal: { type: Number, required: true },
  criticalLow: { type: Number },                       // below this = urgent attention needed
  criticalHigh: { type: Number },                      // above this = urgent attention needed
  borderlineLowThreshold: { type: Number },            // factor to multiply minNormal by for borderline low (default 0.8)
  borderlineHighThreshold: { type: Number },           // factor to multiply maxNormal by for borderline high (default 1.2)
  category: { type: String },                          // e.g. "blood sugar", "lipid profile", "thyroid"
  aliases: [{ type: String }]                          // alternate names OCR might extract, e.g. ["FBS", "Fasting Blood Sugar", "Glucose"]
});

module.exports = mongoose.model('ReferenceRange', ReferenceRangeSchema);
