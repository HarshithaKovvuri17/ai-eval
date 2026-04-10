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
    });
  });

  describe('DELETE /api/admin/courses/:id', () => {
    it('should deactivate a course', async () => {
      Course.findByIdAndUpdate.mockResolvedValue({ ...mockCourse, isActive: false });
      const res = await request(app).delete(`/api/admin/courses/${mockCourse._id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('deactivated');
    });
  });

  describe('Question Management', () => {
    it('should add a question', async () => {
      const mockCourseWithPush = { 
        ...mockCourse, 
        questions: { push: jest.fn(), id: jest.fn() },
        save: jest.fn().mockResolvedValue(true)
      };
      Course.findById.mockResolvedValue(mockCourseWithPush);

      const res = await request(app)
        .post(`/api/admin/courses/${mockCourse._id}/questions`)
        .send({ questionText: 'Q1', correctOptions: ['A'], level: 1 });
      
      expect(res.statusCode).toEqual(200);
    });

    it('should delete a question', async () => {
      Course.findById.mockResolvedValue({ 
        ...mockCourse, 
        questions: [{ _id: 'q1' }],
        save: jest.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .delete(`/api/admin/courses/${mockCourse._id}/questions/q1`);
      
      expect(res.statusCode).toEqual(200);
    });
  });
});
