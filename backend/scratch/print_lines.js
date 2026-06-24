const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '..', '..', 'AS69624500085341033_RLS.pdf');

const printLines = async () => {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;
    const lines = text.split('\n');
    
    console.log('Printing lines 420 to 480:');
    for (let i = 420; i <= 480; i++) {
      if (lines[i] !== undefined) {
        console.log(`${i}: ${lines[i]}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

printLines();
