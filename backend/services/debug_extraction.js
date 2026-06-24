const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const mongoose = require('mongoose');

const ReferenceRange = require('../models/ReferenceRange');
const { extractBiomarkers } = require('./biomarkerService');

const pdfPath = path.join(__dirname, '..', '..', 'AS69624500085341033_RLS.pdf');

const debugExtraction = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/vitalplan');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    console.log('Running extraction debug...');
    const ranges = await ReferenceRange.find({});
    
    for (const ref of ranges) {
      const terms = [ref.testName, ...(ref.aliases || [])];
      // Escape
      const escapedTerms = terms.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
      const termPattern = escapedTerms.join('|');
      
      // Let's test the regex
      const regex = new RegExp(`(?:${termPattern})\\s*[:\\-]?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
      const match = text.match(regex);
      
      if (match) {
        console.log(`Marker: ${ref.testName}`);
        console.log(`Matched text segment around: "${text.substring(match.index - 30, match.index + 50).replace(/\n/g, ' ')}"`);
        console.log(`Matched value: ${match[1]}`);
        console.log('----------------');
      } else {
        console.log(`Marker: ${ref.testName} (NO MATCH)`);
      }
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error(error);
  }
};

debugExtraction();
