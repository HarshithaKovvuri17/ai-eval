const request = require('supertest');
const app = require('../server');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { mockCourse, mockUser, mockProgress } = require('./helpers/testData');

jest.mock('../models/Course');
jest.mock('../models/Progress');
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  },
  generateTokens: () => ({ accessToken: 'at', refreshToken: 'rt' })
}));

describe('Course API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/courses', () => {
    it('should return all active courses', async () => {
      Course.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockCourse])
      });

      const res = await request(app).get('/api/courses');

      expect(res.statusCode).toEqual(200);
      expect(res.body.courses).toHaveLength(1);
      expect(res.body.courses[0].title).toBe(mockCourse.title);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should return course details with progress', async () => {
      Course.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCourse)
      });
      Progress.findOne.mockResolvedValue(mockProgress);

      const res = await request(app).get(`/api/courses/${mockCourse._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.course.title).toBe(mockCourse.title);
      expect(res.body).toHaveProperty('progress');
    });

    it('should return 404 for non-existent course', async () => {
      Course.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app).get('/api/courses/nonexistentid');
      expect(res.statusCode).toEqual(404);
    });
  });
});
