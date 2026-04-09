/**
 * AI Service — Powered by Google Gemini.
 */
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const GEMINI_MODEL = 'gemini-flash-latest';


/* ── Retry utility ───────────────────────────────────────────────────────── */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geminiChat(messages, temperature = 0.7, max_tokens = 4096, jsonMode = false) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set in your .env file. Please get one from https://aistudio.google.com/');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  // Gemini handles long prompts well, so we combine the messages
  const prompt = messages.map(m => m.content).join("\n\n");
  
  const config = { 
    temperature, 
    maxOutputTokens: max_tokens 
  };
  
  if (jsonMode) {
    config.responseMimeType = "application/json";
    if (typeof jsonMode === 'object') {
      config.responseSchema = jsonMode;
    }
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: config,
      });
      return result.response.text();
    } catch (err) {
      attempts++;
      const isRetryable = err.message.includes('503') || err.message.includes('429') || err.message.includes('Service Unavailable') || err.message.includes('high demand');
      
      if (isRetryable && attempts < maxAttempts) {
        const backoff = Math.pow(2, attempts) * 1000;
        console.warn(`⚠️ Gemini Busy (Attempt ${attempts}/${maxAttempts}). Retrying in ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
      
      console.error('❌ Gemini Error:', err.message);
      throw new Error(`AI Service currently busy or unavailable. Please try again in a few seconds.`);
    }
  }
}


/** Robust JSON extraction */
function parseAiJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // 1. First, try cleaning markdown blocks
    let cleaned = text.replace(/^```(json)?/gi, '').replace(/```$/g, '').trim();
    try { return JSON.parse(cleaned); } catch (e2) {}

    // 2. Try to extract array block
    const startIdx = cleaned.indexOf('[');
    let endIdx = cleaned.lastIndexOf(']');
    
    if (startIdx !== -1) {
      if (endIdx === -1) {
        // AI cut off mid-generation, attempt to close common structures
        cleaned = cleaned + '"]}'; // Try to close whatever string/object we're in
        endIdx = cleaned.length;
        cleaned = cleaned.substring(startIdx) + ']'; // append array brace
      } else {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
      }
      
      try { return JSON.parse(cleaned); } catch (e3) {
        // Last resort: strip trailing commas that break standard JSON.parse
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
        try { return JSON.parse(cleaned); } catch (e4) { throw new Error(`Could not parse JSON. Original snippet: ${text.substring(0, 100)}...`); }
      }
    }
    
    throw e;
  }
}




/* ── Evaluate student answer ─────────────────────────────────────────────── */
exports.evaluateAnswer = async (question, correctAnswer, userAnswer) => {
  if (!userAnswer || userAnswer.trim() === '')
    return { score: 0, feedback: 'No answer provided. Please attempt every question.' };

  const prompt = `You are a strict but fair academic evaluator.
Question: ${question}
Model Answer: ${correctAnswer}
Student Answer: ${userAnswer}

Score 0-100. Rubric: 90-100 fully correct, 70-89 mostly correct, 50-69 partial, 25-49 major gaps, 0-24 wrong.
Respond ONLY with valid JSON, no markdown:
{"score": <integer 0-100>, "feedback": "<1-2 sentence feedback>"}`;

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      score: { type: SchemaType.INTEGER, description: "Score from 0 to 100" },
      feedback: { type: SchemaType.STRING, description: "1-2 sentence feedback" }
    },
    required: ["score", "feedback"]
  };

  try {
    const raw    = await geminiChat([{ role: 'user', content: prompt }], 0.1, 500, schema);
    const parsed = parseAiJson(raw);
    return {
      score:    Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
      feedback: String(parsed.feedback || 'Evaluated.').slice(0, 400),
    };
  } catch (err) {
    console.error('❌ AI evaluation error:', err.message);
    return fallback(correctAnswer, userAnswer);
  }
};

/* ── Fallback keyword scorer ─────────────────────────────────────────────── */
function fallback(correctAnswer, userAnswer) {
  const stop   = new Set(['the','a','an','is','are','was','were','it','in','of','to','and','or','for','on','at','by','with','this','that','be']);
  const tokens = s => s.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
  const cor    = tokens(correctAnswer);
  const usr    = tokens(userAnswer);
  if (!cor.length) return { score: 50, feedback: 'Answer accepted.' };
  const score  = Math.round(Math.min(1, (usr.filter(w => cor.includes(w)).length / cor.length) * 1.35) * 100);
  return {
    score,
    feedback: score >= 75 ? 'Great answer – key concepts well covered.' :
              score >= 50 ? 'Partial answer. Review for completeness.' :
              score >= 25 ? 'Several key points are missing. Study the topic carefully.' :
                            'Answer does not address the question. Please review the material.',
  };
}

/* ── Health check ────────────────────────────────────────────────────────── */
exports.checkGeminiHealth = async () => {
  try {
    const reply = await geminiChat([{ role: 'user', content: 'Reply with the single word: ok' }], 0, 5);
    return reply.toLowerCase().includes('ok');
  } catch { return false; }
};

/* ── Generate MCQ questions ──────────────────────────────────────────────── */
exports.generateQuestions = async ({ title, description, category, difficulty, round1Count = 5, round2Count = 5 }) => {
  const total  = round1Count + round2Count;

  const prompt = `You are an expert MCQ question designer for online certification exams.

Generate exactly ${total} multiple-choice questions for:
- Title: ${title}
- Description: ${description}
- Category: ${category}
- Difficulty: ${difficulty}

Rules:
- First ${round1Count} questions → Round 1 (level 1): foundational/easy.
- Last ${round2Count} questions → Round 2 (level 2): analytical/harder.
- Each question: exactly 4 options (A, B, C, D), exactly 1 correct answer, questionType "single".
- Include a 1-sentence explanation for the correct answer.

Respond ONLY with a JSON array, no markdown, no extra text:
[{"questionText":"...","questionType":"single","options":[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],"correctOptions":["A"],"level":1,"marks":10,"explanation":"..."}]`;

  const schema = {
    type: SchemaType.ARRAY,
    description: "List of multiple choice questions",
    items: {
      type: SchemaType.OBJECT,
      properties: {
        questionText: { type: SchemaType.STRING },
        questionType: { type: SchemaType.STRING },
        options: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              text: { type: SchemaType.STRING }
            },
            required: ["id", "text"]
          }
        },
        correctOptions: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        },
        level: { type: SchemaType.INTEGER },
        marks: { type: SchemaType.INTEGER },
        explanation: { type: SchemaType.STRING }
      },
      required: ["questionText", "questionType", "options", "correctOptions", "level", "marks", "explanation"]
    }
  };

  const raw    = await geminiChat([{ role: 'user', content: prompt }], 0.7, 8192, schema);

  let parsed;
  try { parsed = parseAiJson(raw); }
  catch (err) { throw new Error('AI syntax error: ' + err.message + '\nRaw AI output:\n' + raw); }

  if (!Array.isArray(parsed)) throw new Error('AI did not return a question array.');

  return parsed.map((q, i) => ({
    questionText:   String(q.questionText || '').trim(),
    questionType:   'single',
    options:        (q.options || []).map(o => ({ id: String(o.id), text: String(o.text) })),
    correctOptions: Array.isArray(q.correctOptions) ? q.correctOptions : [q.correctOptions],
    level:          i < round1Count ? 1 : 2,
    marks:          Number(q.marks) || 10,
    explanation:    String(q.explanation || '').trim(),
    order:          i,
  }));
};
