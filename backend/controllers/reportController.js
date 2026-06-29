const fs = require('fs');
const path = require('path');
const MedicalReport = require('../models/MedicalReport');
const { extractTextFromFile } = require('../services/ocrService');
const { extractBiomarkers } = require('../services/biomarkerService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

// @desc    Upload medical report & trigger OCR extraction
// @route   POST /api/reports/upload
// @access  Private
const uploadReport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded. Please upload a PDF or image report.' });
  }

  const filePath = req.file.path;
  let fileUrl = `/uploads/${req.file.filename}`; // Serve locally via Express static by default

  // Upload to Cloudinary if configured
  try {
    const cloudinaryUrl = await uploadToCloudinary(filePath);
    if (cloudinaryUrl) {
      fileUrl = cloudinaryUrl;
    }
  } catch (cloudinaryErr) {
    console.error('Cloudinary upload error, falling back to local storage path:', cloudinaryErr);
  }
  
  // Create report entry in 'pending' status
  const report = new MedicalReport({
    user: req.user ? req.user._id : undefined,
    fileUrl,
    fileName: req.file.originalname,
    analysisStatus: 'pending'
  });

  await report.save();

  const processOCR = async () => {
    let extractedText = '';
    
    // Step 1: Run OCR / Text Extraction
    try {
      console.log(`Starting OCR processing for report ID: ${report._id}...`);
      
      extractedText = await extractTextFromFile(filePath, req.file.mimetype);
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('OCR extracted empty text. The file might contain unsupported graphics or empty pages.');
      }
    } catch (ocrErr) {
      console.error(`OCR processing failed for report ID ${report._id}:`, ocrErr);
      report.analysisStatus = 'failed';
      report.failureReason = ocrErr.message || 'We could not extract any readable text from this PDF file. Please ensure it is a valid document.';
      await report.save();
      return; // Fail fast
    }

    // Step 2: Run Biomarker Extraction & Clinical Analysis
    try {
      console.log(`Extracting biomarkers from OCR text...`);
      const { biomarkers, hasCriticalFlag, extractionConfidence, providerName: biomarkerProvider } = await extractBiomarkers(extractedText);

      if (!biomarkers || biomarkers.length === 0) {
        throw new Error('No valid biomarkers could be confidently extracted from this report.');
      }

      // Generate clinical risk score, summary, and custom recommendations (async AI clinical reasoning)
      const { generateReportAnalytics } = require('../services/analyticsService');
      const { 
        riskScore, 
        riskCategory, 
        doctorSummary, 
        healthRecommendations, 
        riskFactors, 
        clinicalReasoningConfidence, 
        patientExplanation, 
        clinicalReasoning,
        providerName: clinicalProvider
      } = await generateReportAnalytics(biomarkers);

      // Determine successful AI provider for logging (or fallback rules engine)
      const activeAIProvider = biomarkerProvider || clinicalProvider || 'Medical Rules Engine';

      // Confidence engine calculations: Extraction + Clinical + Rules (100)
      const extConf = extractionConfidence || 85.0;
      const clinConf = clinicalReasoningConfidence || 90.0;
      const rulesConf = 100.0;
      const calculatedOverall = Math.round((extConf + clinConf + rulesConf) / 3);

      // Print logs matching required format exactly
      console.log('===== AI PROVIDER =====');
      console.log(activeAIProvider);
      console.log('\n===== BIOMARKER JSON =====');
      console.log(JSON.stringify(biomarkers, null, 2));
      console.log('\n===== PATIENT VIEW =====');
      console.log(JSON.stringify(patientExplanation, null, 2));
      console.log('\n===== DOCTOR VIEW =====');
      console.log(JSON.stringify(clinicalReasoning, null, 2));
      console.log('\n===== CONFIDENCE =====');
      console.log(`Extraction: ${Math.round(extConf)}%`);
      console.log(`Clinical: ${Math.round(clinConf)}%`);
      console.log(`Overall: ${calculatedOverall}%`);

      report.rawExtractedText = extractedText;
      report.biomarkers = biomarkers;
      report.hasCriticalFlag = hasCriticalFlag;
      report.riskScore = riskScore;
      report.riskCategory = riskCategory;
      report.riskFactors = riskFactors;
      report.doctorSummary = doctorSummary;
      report.healthRecommendations = healthRecommendations;
      report.patientExplanation = patientExplanation;
      report.clinicalReasoning = clinicalReasoning;
      report.extractionConfidence = extConf;
      report.clinicalReasoningConfidence = clinConf;
      report.overallConfidence = calculatedOverall;
      report.analysisStatus = 'processed';
      
      await report.save();
      console.log(`Report processing completed for ID: ${report._id}. Biomarkers: ${biomarkers.length}, Risk Score: ${riskScore}, Critical: ${hasCriticalFlag}, Overall Confidence: ${report.overallConfidence}%`);
    } catch (aiErr) {
      console.error(`AI analysis failed for report ID ${report._id}:`, aiErr);
      report.analysisStatus = 'failed';
      report.failureReason = aiErr.message || 'AI service is temporarily busy or unavailable. We could not confidently analyze your report.';
      await report.save();
    } finally {
      // Cleanup local temporary file if uploaded to Cloudinary OR if running on Vercel
      if (fileUrl.includes('cloudinary.com') || process.env.VERCEL) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Temporary file deleted: ${filePath}`);
          }
        } catch (unlinkErr) {
          console.error(`Failed to delete temporary file ${filePath}:`, unlinkErr);
        }
      }
    }
  };

  // Run OCR processing
  // On Vercel's serverless environment, background tasks are suspended after the response is sent,
  // so we must run it synchronously. Otherwise we can run it asynchronously.
  if (process.env.VERCEL) {
    await processOCR();
  } else {
    setTimeout(processOCR, 100);
  }

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

    // Verify ownership or admin privileges if report has an associated user
    if (report.user) {
      if (!req.user || (report.user.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'nutritionist')) {
        return res.status(403).json({ message: 'Not authorized to view this report' });
      }
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

    if (report.fileUrl && report.fileUrl.includes('cloudinary.com')) {
      await deleteFromCloudinary(report.fileUrl);
    } else {
      // Attempt to delete file from disk
      const filename = path.basename(report.fileUrl);
      const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'uploads');
      const diskPath = path.join(uploadDir, filename);
      
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    }

    await report.deleteOne();
    res.json({ message: 'Medical report and file deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Claim guest report
// @route   PUT /api/reports/claim
// @access  Private
const claimReport = async (req, res) => {
  const { reportId } = req.body;
  try {
    const report = await MedicalReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Medical report not found' });
    }

    if (report.user) {
      return res.status(400).json({ message: 'Report already owned by a user' });
    }

    report.user = req.user._id;
    await report.save();

    res.json({ message: 'Report successfully claimed', report });
  } catch (error) {
    console.error('Error claiming report:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadReport,
  getReports,
  getReportById,
  deleteReport,
  claimReport
};
