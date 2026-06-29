require('dotenv').config();
const mongoose = require('mongoose');
const ReferenceRange = require('../models/ReferenceRange');

const sampleRanges = [
  {
    testName: "Fasting Glucose",
    unit: "mg/dL",
    minNormal: 70,
    maxNormal: 100,
    criticalLow: 45,
    criticalHigh: 250,
    category: "blood sugar",
    aliases: ["FBS", "Fasting Blood Sugar", "Glucose", "Fasting Glucose"]
  },
  {
    testName: "HbA1c",
    unit: "%",
    minNormal: 4.0,
    maxNormal: 5.6,
    criticalLow: 2.5,
    criticalHigh: 10.0,
    category: "blood sugar",
    aliases: ["Glycated Hemoglobin", "A1c", "Hb-A1c", "HbA1c"]
  },
  {
    testName: "Total Cholesterol",
    unit: "mg/dL",
    minNormal: 100,
    maxNormal: 200,
    criticalLow: 70,
    criticalHigh: 350,
    category: "lipid profile",
    aliases: ["Cholesterol", "Total Cholesterol", "TC"]
  },
  {
    testName: "LDL Cholesterol",
    unit: "mg/dL",
    minNormal: 50,
    maxNormal: 100,
    criticalLow: 30,
    criticalHigh: 250,
    category: "lipid profile",
    aliases: ["LDL", "LDL-C", "Low Density Lipoprotein"]
  },
  {
    testName: "HDL Cholesterol",
    unit: "mg/dL",
    minNormal: 40,
    maxNormal: 60,
    criticalLow: 20,
    criticalHigh: 120,
    category: "lipid profile",
    aliases: ["HDL", "HDL-C", "High Density Lipoprotein"]
  },
  {
    testName: "Triglycerides",
    unit: "mg/dL",
    minNormal: 50,
    maxNormal: 150,
    criticalLow: 30,
    criticalHigh: 500,
    category: "lipid profile",
    aliases: ["Triglycerides", "TG", "TRIG"]
  },
  {
    testName: "TSH",
    unit: "mIU/L",
    minNormal: 0.4,
    maxNormal: 4.0,
    criticalLow: 0.1,
    criticalHigh: 15.0,
    category: "thyroid",
    aliases: ["Thyroid Stimulating Hormone", "TSH", "Serum TSH"]
  },
  {
    testName: "Hemoglobin",
    unit: "g/dL",
    minNormal: 12.0,
    maxNormal: 17.5,
    criticalLow: 7.0,
    criticalHigh: 22.0,
    category: "blood count",
    aliases: ["Hb", "Hemoglobin", "Hgb"]
  },
  {
    testName: "Vitamin D",
    unit: "ng/mL",
    minNormal: 30,
    maxNormal: 100,
    criticalLow: 10,
    criticalHigh: 150,
    category: "vitamins",
    aliases: ["Vitamin D", "25-Hydroxy Vitamin D", "Vit D", "Vitamin D3", "Vitamin D Total-25 Hydroxy"]
  },
  {
    testName: "Vitamin B12",
    unit: "pg/mL",
    minNormal: 200,
    maxNormal: 900,
    criticalLow: 100,
    criticalHigh: 1500,
    category: "vitamins",
    aliases: ["Vitamin B12", "Vit B12", "Cyanocobalamin", "Vitamin B12 Cyanocobalamin"]
  },
  {
    testName: "RDW-CV",
    unit: "%",
    minNormal: 11.5,
    maxNormal: 14.5,
    criticalLow: 9.0,
    criticalHigh: 18.0,
    category: "blood count",
    aliases: ["RDW-CV", "RDW", "Red Cell Distribution Width"]
  },
  {
    testName: "MPV",
    unit: "fL",
    minNormal: 7.5,
    maxNormal: 11.5,
    criticalLow: 5.0,
    criticalHigh: 15.0,
    category: "blood count",
    aliases: ["MPV", "Mean Platelet Volume"]
  },
  {
    testName: "Absolute Lymphocyte Count",
    unit: "10^3/uL",
    minNormal: 1.0,
    maxNormal: 3.0,
    criticalLow: 0.5,
    criticalHigh: 5.0,
    category: "blood count",
    aliases: ["ALC", "Absolute Lymphocytes", "Absolute Lymphocyte Count", "Lymphocytes - Absolute"]
  },
  {
    testName: "Creatinine",
    unit: "mg/dL",
    minNormal: 0.5,
    maxNormal: 1.2,
    criticalLow: 0.2,
    criticalHigh: 3.5,
    category: "kidney panel",
    aliases: ["Creatinine", "Creat", "Serum Creatinine"]
  },
  {
    testName: "Total Bilirubin",
    unit: "mg/dL",
    minNormal: 0.1,
    maxNormal: 1.2,
    criticalLow: 0.05,
    criticalHigh: 3.0,
    category: "liver panel",
    aliases: ["Bilirubin - Total", "Bilirubin Total", "Total Bilirubin", "TBIL"]
  },
  {
    testName: "Direct Bilirubin",
    unit: "mg/dL",
    minNormal: 0.0,
    maxNormal: 0.3,
    criticalLow: 0.0,
    criticalHigh: 1.5,
    category: "liver panel",
    aliases: ["Bilirubin - Direct", "Bilirubin -DIRECT", "Bilirubin Direct", "Direct Bilirubin", "DBIL"]
  },
  {
    testName: "Indirect Bilirubin",
    unit: "mg/dL",
    minNormal: 0.2,
    maxNormal: 0.8,
    criticalLow: 0.05,
    criticalHigh: 2.0,
    category: "liver panel",
    aliases: ["Bilirubin (Indirect)", "Indirect Bilirubin", "IBIL"]
  }
];

const seedRanges = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vitalplan';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected. Seeding reference ranges database...');

    // Clear existing
    await ReferenceRange.deleteMany({});
    
    // Insert new
    await ReferenceRange.insertMany(sampleRanges);
    console.log('Reference ranges seeded successfully!');

    mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding reference ranges failed:', error);
    process.exit(1);
  }
};

seedRanges();
