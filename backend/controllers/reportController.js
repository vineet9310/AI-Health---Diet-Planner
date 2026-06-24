const fs = require('fs');
const path = require('path');
const MedicalReport = require('../models/MedicalReport');
const { extractTextFromFile } = require('../services/ocrService');
const { extractBiomarkers } = require('../services/biomarkerService');

// @desc    Upload medical report & trigger OCR extraction
// @route   POST /api/reports/upload
// @access  Private
const uploadReport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded. Please upload a PDF or image report.' });
  }

  const filePath = req.file.path;
  const fileUrl = `/uploads/${req.file.filename}`; // Serve locally via Express static
  
  // Create report entry in 'pending' status
  const report = new MedicalReport({
    user: req.user._id,
    fileUrl,
    fileName: req.file.originalname,
    analysisStatus: 'pending'
  });

  await report.save();

  // Run OCR processing in background (asynchronously to avoid request timeout)
  // But for simple local testing, we can do it asynchronously and let client poll, 
  // or await it if small. Let's start the background task and return immediately 
  // with a 'pending' report status, so the UI can show a loader and poll. 
  // This is highly professional!
  
  // Start background task
  setTimeout(async () => {
    try {
      console.log(`Starting OCR processing for report ID: ${report._id}...`);
      const extractedText = await extractTextFromFile(filePath, req.file.mimetype);
      
      console.log(`Extracting biomarkers from OCR text...`);
      const { biomarkers, hasCriticalFlag } = await extractBiomarkers(extractedText);

      // Generate clinical risk score, summary, and custom recommendations
      const { generateReportAnalytics } = require('../services/analyticsService');
      const { riskScore, riskCategory, doctorSummary, healthRecommendations, riskFactors } = generateReportAnalytics(biomarkers);

      report.rawExtractedText = extractedText;
      report.biomarkers = biomarkers;
      report.hasCriticalFlag = hasCriticalFlag;
      report.riskScore = riskScore;
      report.riskCategory = riskCategory;
      report.riskFactors = riskFactors;
      report.doctorSummary = doctorSummary;
      report.healthRecommendations = healthRecommendations;
      report.analysisStatus = 'processed';
      
      await report.save();
      console.log(`Report processing completed for ID: ${report._id}. Biomarkers: ${biomarkers.length}, Risk Score: ${riskScore}, Critical: ${hasCriticalFlag}`);
    } catch (error) {
      console.error(`Failed to process report ID ${report._id}:`, error);
      report.analysisStatus = 'failed';
      await report.save();
    }
  }, 100);

  res.status(202).json({
    message: 'Report uploaded and analysis started in the background.',
    report
  });
};

// @desc    Get all reports for current user
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const reports = await MedicalReport.find({ user: req.user._id }).sort({ uploadedAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Medical report not found' });
    }

    // Verify ownership or admin privileges
    if (report.user.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'nutritionist') {
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
  try {
    const report = await MedicalReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Medical report not found' });
    }

    // Verify ownership
    if (report.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    // Attempt to delete file from disk
    const filename = path.basename(report.fileUrl);
    const diskPath = path.join(__dirname, '..', 'uploads', filename);
    
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    await report.deleteOne();
    res.json({ message: 'Medical report and file deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadReport,
  getReports,
  getReportById,
  deleteReport
};
