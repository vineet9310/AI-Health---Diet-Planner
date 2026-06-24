const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const mongoose = require('mongoose');

const ReferenceRange = require('../models/ReferenceRange');

const pdfPath = path.join(__dirname, '..', '..', 'AS69624500085341033_RLS.pdf');

const testParser = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/vitalplan');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    console.log('Testing new extraction algorithm...');
    const ranges = await ReferenceRange.find({});
    const extracted = [];

    for (const ref of ranges) {
      const terms = [ref.testName, ...(ref.aliases || [])];
      
      // We look line by line to find the test name
      let foundLineIndex = -1;
      let matchedTerm = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Find if any alias matches this line
        const match = terms.some(term => {
          const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
          
          if (regex.test(line)) {
            // 1. Skip if line contains 'ratio' (ratios are calculated indices, not raw biomarkers)
            if (line.toLowerCase().includes('ratio')) {
              return false;
            }
            // 2. HDL matching NON-HDL
            if (term.toLowerCase() === 'hdl' && line.toLowerCase().includes('non-hdl')) {
              return false;
            }
            // 3. Cholesterol matching HDL/LDL or Ratio
            if (term.toLowerCase() === 'cholesterol' && (
              line.toLowerCase().includes('hdl') || 
              line.toLowerCase().includes('ldl')
            )) {
              return false;
            }
            // 4. Triglycerides matching TRIG/HDL ratio
            if (term.toLowerCase() === 'trig') {
              return false; // wait, trig alias TG / TRIG can be safely matched on TRIGLYCERIDES
            }
            
            matchedTerm = term;
            return true;
          }
          return false;
        });

        if (match) {
          foundLineIndex = i;
          break;
        }
      }

      if (foundLineIndex !== -1) {
        console.log(`Found test [${ref.testName}] (matched: "${matchedTerm}") on line ${foundLineIndex}: "${lines[foundLineIndex]}"`);
        
        let value = null;
        let extractionMethod = '';

        // Method 1: Check same line for a number following the matched term
        const sameLineRegex = new RegExp(`(?:${matchedTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})\\s*[:\\-]?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
        const sameLineMatch = lines[foundLineIndex].match(sameLineRegex);
        if (sameLineMatch) {
          value = parseFloat(sameLineMatch[1]);
          extractionMethod = 'same line';
        }

        // Method 2: Check line -1 or line -2 above for numbers (clinical report table order inverted)
        if (value === null) {
          for (let offset = 1; offset <= 3; offset++) {
            const prevLineIndex = foundLineIndex - offset;
            if (prevLineIndex >= 0) {
              const prevLine = lines[prevLineIndex];
              // Extract the LAST number from the line
              const numbers = prevLine.match(/\d+(?:\.\d+)?/g);
              if (numbers && numbers.length > 0) {
                value = parseFloat(numbers[numbers.length - 1]);
                extractionMethod = `line above (offset: ${offset})`;
                break;
              }
            }
          }
        }

        if (value !== null) {
          console.log(`-> Extracted value: ${value} (via: ${extractionMethod})`);
          extracted.push({ testName: ref.testName, value });
        } else {
          console.log('-> Unable to extract value.');
        }
        console.log('----------------');
      } else {
        console.log(`Test [${ref.testName}] NOT FOUND in document.`);
        console.log('----------------');
      }
    }

    mongoose.connection.close();
  } catch (error) {
    console.error(error);
  }
};

testParser();
