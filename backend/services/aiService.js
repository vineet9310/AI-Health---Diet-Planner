const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

/**
 * Utility to extract and parse JSON from markdown code blocks or reasoning tags.
 * Particularly resilient to DeepSeek-R1 <think>...</think> blocks and extra text.
 */
function parseAndValidateJSON(text, type) {
  if (!text) {
    throw new Error('AI returned an empty response.');
  }

  // 1. Strip deepseek thinking tags
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // 2. Strip markdown json code block wraps
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }

  // Try direct parse
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // If direct parse fails, try locating boundary brackets
    if (type === 'biomarker') {
      const startIndex = cleaned.indexOf('[');
      const endIndex = cleaned.lastIndexOf(']');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        try {
          parsed = JSON.parse(cleaned.substring(startIndex, endIndex + 1));
        } catch (innerErr) {
          throw new Error(`Failed to parse array JSON even with boundary extraction: ${innerErr.message}`);
        }
      } else {
        throw new Error('Failed to parse biomarker array: brackets [ ] not found.');
      }
    } else {
      const startIndex = cleaned.indexOf('{');
      const endIndex = cleaned.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        try {
          parsed = JSON.parse(cleaned.substring(startIndex, endIndex + 1));
        } catch (innerErr) {
          throw new Error(`Failed to parse object JSON even with boundary extraction: ${innerErr.message}`);
        }
      } else {
        throw new Error('Failed to parse clinical object: curly braces { } not found.');
      }
    }
  }

  // Validate Schema
  if (type === 'biomarker') {
    if (!Array.isArray(parsed)) {
      throw new Error('Biomarker output must be a JSON array.');
    }
    // Validate fields for at least one item if array is not empty
    if (parsed.length > 0) {
      const item = parsed[0];
      if (!item.testName) {
        throw new Error('Biomarker item missing required field: testName');
      }
    }
  } else if (type === 'clinical') {
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Clinical reasoning output must be a JSON object.');
    }
    if (!parsed.patientExplanation || !parsed.clinicalReasoning) {
      throw new Error('Clinical reasoning missing primary layers: patientExplanation or clinicalReasoning.');
    }
    
    // Normalize properties
    const pe = parsed.patientExplanation;
    const cr = parsed.clinicalReasoning;
    
    if (typeof pe.mainProblem !== 'string') pe.mainProblem = String(pe.mainProblem || '');
    if (!Array.isArray(pe.symptoms)) pe.symptoms = [];
    if (!Array.isArray(pe.possibleCauses)) pe.possibleCauses = [];
    if (!Array.isArray(pe.nextSteps)) pe.nextSteps = [];

    // Normalize symptoms objects
    pe.symptoms = pe.symptoms.map(s => {
      if (typeof s === 'string') {
        return {
          symptom: s,
          reason: "Associated with abnormal biomarkers.",
          supportedBy: [],
          likelihood: "Possible (50-70%)"
        };
      }
      return {
        symptom: String(s.symptom || s.name || ''),
        reason: String(s.reason || s.explanation || ''),
        supportedBy: Array.isArray(s.supportedBy) ? s.supportedBy : [],
        likelihood: String(s.likelihood || s.probability || '')
      };
    });

    // Normalize possibleCauses objects
    pe.possibleCauses = pe.possibleCauses.map(c => {
      if (typeof c === 'string') {
        return {
          cause: c,
          explanation: "Identified in diagnostic analysis.",
          likelihood: "Possible"
        };
      }
      return {
        cause: String(c.cause || c.name || ''),
        explanation: String(c.explanation || c.reason || ''),
        likelihood: String(c.likelihood || c.probability || '')
      };
    });

    // Normalize nextSteps objects
    pe.nextSteps = pe.nextSteps.map(ns => {
      if (typeof ns === 'string') {
        return {
          step: ns,
          reason: "Recommended clinical follow-up.",
          priority: "Medium"
        };
      }
      return {
        step: String(ns.step || ns.action || ''),
        reason: String(ns.reason || ns.explanation || ''),
        priority: String(ns.priority || '')
      };
    });

    if (!Array.isArray(cr.differentialDiagnosis)) cr.differentialDiagnosis = [];
    if (!Array.isArray(cr.likelihoods)) cr.likelihoods = [];
    if (!Array.isArray(cr.recommendations)) cr.recommendations = [];
    if (!Array.isArray(cr.nextTests)) cr.nextTests = [];
    if (!Array.isArray(cr.redFlags)) cr.redFlags = [];
  } else if (type === 'plan') {
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Plan output must be a JSON object.');
    }
    if (!parsed.meals || !parsed.workout) {
      throw new Error('Plan missing primary sections: meals or workout.');
    }
  }

  return parsed;
}

/**
 * AI PROVIDER HANDLERS
 */

async function callGemini(prompt, type) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  return parseAndValidateJSON(text, type);
}

async function callGroq(prompt, type) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set.');
  }
  const groq = new Groq({ apiKey });
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });
  const text = response.choices[0].message.content.trim();
  return parseAndValidateJSON(text, type);
}

async function callOpenRouter(prompt, type) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set.');
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-r1',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('OpenRouter response contains no choices.');
  }
  const text = data.choices[0].message.content.trim();
  return parseAndValidateJSON(text, type);
}

async function callOllama(prompt, type) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-r1:8b',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (!data.message || !data.message.content) {
    throw new Error('Ollama response contains no content.');
  }
  const text = data.message.content.trim();
  return parseAndValidateJSON(text, type);
}

/**
 * Multi-Provider AI Call Failover Logic
 */
async function callAI(prompt, type) {
  const providers = [
    {
      name: 'Gemini',
      handler: callGemini
    },
    {
      name: 'Groq',
      handler: callGroq
    },
    {
      name: 'OpenRouter',
      handler: callOpenRouter
    },
    {
      name: 'Ollama',
      handler: callOllama
    }
  ];

  for (const provider of providers) {
    try {
      console.log(`[AI Engine] Attempting analysis with provider: ${provider.name}...`);
      const result = await provider.handler(prompt, type);
      if (result) {
        return {
          providerName: provider.name,
          data: result
        };
      }
    } catch (err) {
      console.warn(`[AI Engine] ${provider.name} failed:`, err.message);
      // Log the exact failover flow
      console.log(`[AI Engine] Failover transition: ${provider.name} failed -> Attempting next provider...`);
    }
  }

  throw new Error('All AI providers unavailable');
}

module.exports = {
  callAI
};
