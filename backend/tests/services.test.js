const geminiService = require('../services/geminiService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

jest.mock('@google/generative-ai');

describe('Gemini Service Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateAnswer', () => {
    it('should evaluation based on AI response', async () => {
      // Mocking the AI chain for evaluation
      const mockResult = {
        response: {
          text: () => JSON.stringify({ score: 85, feedback: 'Good job' })
        }
      };
      
      GoogleGenerativeAI.prototype.getGenerativeModel = jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue(mockResult)
      });

      process.env.GOOGLE_API_KEY = 'test-key';
      const result = await geminiService.evaluateAnswer('Q', 'A', 'U');
      
      expect(result.score).toBe(85);
      expect(result.feedback).toBe('Good job');
    });

    it('should use fallback if AI fails', async () => {
      GoogleGenerativeAI.prototype.getGenerativeModel = jest.fn().mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('AI Busy'))
      });

      const result = await geminiService.evaluateAnswer('What is AI?', 'Artificial Intelligence', 'AI is smart');
      expect(result).toHaveProperty('score');
      expect(result.feedback).toBeDefined();
    });
  });

  describe('generateQuestions', () => {
    it('should parse complex MCQ formats', async () => {
      const mockQuestions = [{
        questionText: 'Test?',
        questionType: 'single',
        options: [{id: 'A', text: 'Op1'}],
        correctOptions: ['A'],
        level: 1,
        marks: 10,
        explanation: 'Exp'
      }];

      const mockResult = {
        response: {
          text: () => '```json\n' + JSON.stringify(mockQuestions) + '\n```'
        }
      };

      GoogleGenerativeAI.prototype.getGenerativeModel = jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue(mockResult)
      });

      const questions = await geminiService.generateQuestions({ title: 'T', description: 'D' });
      expect(questions).toHaveLength(1);
      expect(questions[0].questionText).toBe('Test?');
    });
  });

  describe('Health Check', () => {
    it('should return true if AI is active', async () => {
      const mockResult = { response: { text: () => 'ok' } };
      GoogleGenerativeAI.prototype.getGenerativeModel = jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue(mockResult)
      });

      const status = await geminiService.checkGeminiHealth();
      expect(status).toBe(true);
    });
  });
});
