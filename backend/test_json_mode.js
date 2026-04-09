require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_MODEL = 'gemini-flash-latest';
const apiKey = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

async function testJsonGeneration() {
  const prompt = `You are an expert MCQ question designer.
Generate exactly 2 multiple-choice questions for:
- Title: Introduction to Python
- Description: Basic python programming concepts.

Respond ONLY with a JSON array, no markdown, no extra text:
[{"questionText":"...","options":[{"id":"A","text":"..."},{"id":"B","text":"..."}],"correctOptions":["A"]}]`;

  console.log('Sending prompt to Gemini...');
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      generationConfig: { 
        temperature: 0.7, 
        maxOutputTokens: 1000,
        responseMimeType: "application/json"
      },
    });
    
    const text = result.response.text();
    console.log('\n--- RAW RESPONSE ---\n');
    console.log(text);
    console.log('\n--------------------\n');
    
    try {
      const parsed = JSON.parse(text);
      console.log('✅ JSON successfully parsed.');
      console.log('Array length:', Array.isArray(parsed) ? parsed.length : 'Not an array');
    } catch (e) {
      console.error('❌ JSON parsing failed:', e.message);
    }
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

testJsonGeneration();
