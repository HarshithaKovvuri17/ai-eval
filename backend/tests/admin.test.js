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
    });
  });

  describe('PUT /api/admin/courses/:id', () => {
    it('should update an existing course', async () => {
      Course.findByIdAndUpdate.mockResolvedValue(mockCourse);
      const res = await request(app)
        .put(`/api/admin/courses/${mockCourse._id}`)
        .send({ title: 'Updated Title' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('updated');
    });
  });

  describe('POST /api/admin/courses/:id/questions', () => {
    it('should add a question to a course', async () => {
      Course.findById.mockResolvedValue({
        ...mockCourse,
        questions: { push: jest.fn() },
        save: jest.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .post(`/api/admin/courses/${mockCourse._id}/questions`)
        .send({
          questionText: 'New Q',
          correctOptions: ['A'],
          level: 1
        });
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return student list', async () => {
      User.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockUser])
      });
      const res = await request(app).get('/api/admin/users');
      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toHaveLength(1);
    });
  });
});
