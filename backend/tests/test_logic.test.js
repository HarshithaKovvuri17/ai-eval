const request = require('supertest');
const app = require('../server');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Attempt = require('../models/Attempt');
const { mockCourse, mockUser, mockProgress } = require('./helpers/testData');

jest.mock('../models/Course');
jest.mock('../models/Progress');
jest.mock('../models/Attempt');
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  },
  adminOnly: (req, res, next) => next()
}));
jest.mock('../services/certificateService', () => ({
  generateCertificate: jest.fn().mockResolvedValue({ certId: 'CERT123', fileName: 'cert.pdf' })
}));

describe('Test Submission API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/test/submit', () => {
    it('should evaluate answers and return score', async () => {
      Course.findById.mockResolvedValue(mockCourse);
      Progress.findOne.mockResolvedValue({
        ...mockProgress,
        level1: { attempts: 0, bestScore: 0, passed: false, locked: false },
        save: jest.fn().mockResolvedValue(true)
      });
      Attempt.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/test/submit')
        .send({
          courseId: mockCourse._id,
          level: 1,
          answers: [{ questionId: mockCourse.questions[0]._id, selectedOptions: ['A'] }]
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.result).toHaveProperty('percentage');
    });

    it('should lock account after max attempts', async () => {
      Course.findById.mockResolvedValue(mockCourse);
      Progress.findOne.mockResolvedValue({
        ...mockProgress,
        level1: { attempts: 2, passed: false, locked: false },
        save: jest.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .post('/api/test/submit')
        .send({
          courseId: mockCourse._id,
          level: 1,
          answers: [{ questionId: mockCourse.questions[0]._id, selectedOptions: ['B'] }]
        });
      
      expect(res.body.result.locked).toBe(true);
    });
  });

  describe('GET /api/test/progress/:courseId', () => {
    it('should return progress for a course', async () => {
      Progress.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProgress)
      });

      const res = await request(app).get(`/api/test/progress/${mockCourse._id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.progress).toBeDefined();
    });
  });

  describe('POST /api/test/restart/:courseId', () => {
    it('should restart course if locked', async () => {
      Progress.findOne.mockResolvedValue({
        ...mockProgress,
        level1: { locked: true },
        save: jest.fn().mockResolvedValue(true)
      });

      const res = await request(app).post(`/api/test/restart/${mockCourse._id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('reset');
    });
  });
});
