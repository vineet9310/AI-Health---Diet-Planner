require('dotenv').config();
const mongoose = require('mongoose');
const MedicalReport = require('../models/MedicalReport');
const { generateReportAnalytics } = require('../services/analyticsService');

const patch = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not set in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas Cluster.');

    const reports = await MedicalReport.find({});
    console.log(`Found ${reports.length} reports in the database.`);

    for (const report of reports) {
      if (report.biomarkers && report.biomarkers.length > 0) {
        console.log(`Re-analyzing report: ${report.fileName || 'Unnamed'} (ID: ${report._id})`);
        
        const { riskScore, riskCategory, doctorSummary, healthRecommendations, riskFactors } = generateReportAnalytics(report.biomarkers);
        
        report.riskScore = riskScore;
        report.riskCategory = riskCategory;
        report.doctorSummary = doctorSummary;
        report.healthRecommendations = healthRecommendations;
        report.riskFactors = riskFactors;

        await report.save();
        console.log(`-> Updated: Category=${riskCategory}, Score=${riskScore}, Factors=${riskFactors.length}`);
      }
    }

    console.log('Database patching complete.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during patching:', error);
    process.exit(1);
  }
};

patch();
