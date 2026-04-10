const request = require('supertest');
const app = require('../server');
const Course = require('../models/Course');
const User = require('../models/User');
const Attempt = require('../models/Attempt');
const { mockCourse, mockUser } = require('./helpers/testData');

jest.mock('../models/Course');
jest.mock('../models/User');
jest.mock('../models/Attempt');
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  },
  adminOnly: (req, res, next) => next()
}));

describe('Admin API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/stats', () => {
    it('should return system stats', async () => {
      User.countDocuments.mockResolvedValue(10);
      Course.countDocuments.mockResolvedValue(5);
      Attempt.countDocuments.mockResolvedValue(100);
      Attempt.aggregate.mockResolvedValue([{ total: 100, passed: 80 }]);
      Attempt.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });

      const res = await request(app).get('/api/admin/stats');

      expect(res.statusCode).toEqual(200);
      expect(res.body.stats.totalStudents).toBe(10);
      expect(res.body.stats.passRate).toBe(80);
    });
  });

  describe('POST /api/admin/courses', () => {
    it('should create a new course', async () => {
      Course.create.mockResolvedValue(mockCourse);

      const res = await request(app)
        .post('/api/admin/courses')
        .send({
          title: 'New Course',
          description: 'Desc',
          questions: []
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toContain('successfully');
    });
  });
});
