const fs = require('fs');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const path = require('path');

/**
 * Extracts raw text from a medical report file (PDF or Image).
 * @param {string} filePath - Absolute path to the uploaded file.
 * @param {string} mimeType - The mime type of the file.
 * @returns {Promise<string>} - The extracted raw text.
 */
const extractTextFromFile = async (filePath, mimeType) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);

    if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
      console.log('Processing PDF file via pdf-parse...');
      const data = await pdfParse(fileBuffer);
      return data.text || '';
    } else if (
      mimeType.startsWith('image/') ||
      filePath.toLowerCase().endsWith('.png') ||
      filePath.toLowerCase().endsWith('.jpg') ||
      filePath.toLowerCase().endsWith('.jpeg') ||
      filePath.toLowerCase().endsWith('.webp')
    ) {
      console.log('Processing Image file via Tesseract.js...');
      const result = await Tesseract.recognize(filePath, 'eng');
      return result.data.text || '';
    } else {
      throw new Error(`Unsupported file format: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error in ocrService:', error);
    throw error;
  }
};

module.exports = { extractTextFromFile };
