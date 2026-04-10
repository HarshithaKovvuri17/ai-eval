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
  }
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
        level1: { attempts: 0, BestScore: 0, passed: false, locked: false },
        save: jest.fn().mockResolvedValue(true)
      });
      Attempt.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/test/submit')
        .send({
          courseId: mockCourse._id,
          level: 1,
          answers: [{ questionId: mockCourse.questions[0]._id, selectedOptions: [1] }]
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.result).toHaveProperty('percentage');
      expect(res.body.result).toHaveProperty('passed');
    });

    it('should reject submission if Round 1 is not passed for Round 2', async () => {
      Course.findById.mockResolvedValue(mockCourse);
      Progress.findOne.mockResolvedValue({
        ...mockProgress,
        level1: { passed: false }
      });

      const res = await request(app)
        .post('/api/test/submit')
        .send({
          courseId: mockCourse._id,
          level: 2,
          answers: [{ questionId: 'q1', selectedOptions: [1] }]
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain('Round 1');
    });
  });
});
