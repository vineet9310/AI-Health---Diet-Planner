const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '..', '..', 'AS69624500085341033_RLS.pdf');

const checkPdf = async () => {
  try {
    console.log(`Reading PDF file from: ${pdfPath}`);
    const dataBuffer = fs.readFileSync(pdfPath);
    console.log('File size:', dataBuffer.length, 'bytes');
    
    console.log('Parsing PDF...');
    const data = await pdf(dataBuffer);
    console.log('--- Extracted Text ---');
    console.log(data.text);
    console.log('----------------------');
    console.log('Text length:', data.text.length, 'characters');
  } catch (error) {
    console.error('Error parsing PDF:', error);
  }
};

checkPdf();
