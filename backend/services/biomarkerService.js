const ReferenceRange = require('../models/ReferenceRange');

/**
 * Escapes special regex characters in a string.
 */
const escapeRegex = (str) => {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * Extracts biomarkers from raw text using database reference ranges.
 * @param {string} rawText - The text parsed from OCR.
 * @returns {Promise<object>} - Object with biomarkers array and hasCriticalFlag boolean.
 */
const extractBiomarkers = async (rawText) => {
  if (!rawText) {
    return { biomarkers: [], hasCriticalFlag: false };
  }

  // Load all reference ranges
  const ranges = await ReferenceRange.find({});
  const extractedBiomarkers = [];
  let hasCriticalFlag = false;

  for (const ref of ranges) {
    // Collect all aliases and the main test name
    const terms = [ref.testName, ...(ref.aliases || [])];
    const escapedTerms = terms.map(term => escapeRegex(term));
    const termPattern = escapedTerms.join('|');

    // Build regex to find term followed by colon, dash, spaces, and then a number
    // Example matched: "Fasting Blood Sugar: 120", "FBS - 95", "Glucose 140.5"
    const regex = new RegExp(`(?:${termPattern})\\s*[:\\-]?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
    const match = rawText.match(regex);

    if (match) {
      const value = parseFloat(match[1]);
      let status = 'normal';

      const min = ref.minNormal;
      const max = ref.maxNormal;
      const critLow = ref.criticalLow || (min / 2);
      const critHigh = ref.criticalHigh || (max * 2);

      // Check for critical states (either database explicit or 2x outside limits)
      if (value <= critLow || value >= critHigh) {
        status = 'critical';
        hasCriticalFlag = true;
      } else if (value < min) {
        status = 'low';
      } else if (value > max) {
        status = 'high';
      } else {
        // Check for borderline conditions (within 10% of boundaries)
        const borderlineLowLimit = min + (min * 0.1);
        const borderlineHighLimit = max - (max * 0.1);

        if (value <= borderlineLowLimit) {
          status = 'borderline_low';
        } else if (value >= borderlineHighLimit) {
          status = 'borderline_high';
        } else {
          status = 'normal';
        }
      }

      extractedBiomarkers.push({
        testName: ref.testName,
        value,
        unit: ref.unit,
        status
      });
    }
  }

  return {
    biomarkers: extractedBiomarkers,
    hasCriticalFlag
  };
};

module.exports = { extractBiomarkers };
