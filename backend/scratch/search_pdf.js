const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '..', '..', 'AS69624500085341033_RLS.pdf');

const findBiomarkersInPdf = async () => {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    console.log('Searching for markers...');
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (
        line.toLowerCase().includes('cholesterol') ||
        line.toLowerCase().includes('triglycerides') ||
        line.toLowerCase().includes('glucose') ||
        line.toLowerCase().includes('hdl') ||
        line.toLowerCase().includes('ldl') ||
        line.toLowerCase().includes('tsh')
      ) {
        console.log(`Line ${index}: ${line}`);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
};

findBiomarkersInPdf();
