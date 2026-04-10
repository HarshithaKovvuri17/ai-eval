const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const { mockUser } = require('./helpers/testData');

jest.mock('../models/User');
jest.mock('../services/emailService', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

// Mock middleware/auth specifically
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    const { mockUser } = require('./helpers/testData');
    req.user = mockUser;
    next();
  },
  adminOnly: (req, res, next) => next(),
  generateTokens: () => ({ accessToken: 'at', refreshToken: 'rt' })
}));

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and send OTP', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });
      User.create.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('OTP sent');
      expect(User.create).toHaveBeenCalled();
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', password: 'password123' });
      
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login verified user', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          isVerified: true,
          comparePassword: jest.fn().mockResolvedValue(true),
          save: jest.fn().mockResolvedValue(true)
        })
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject unverified login', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          isVerified: false
        })
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain('verify your email');
    });
  });
});
