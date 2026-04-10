const request = require('supertest');
const app = require('../server');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Course = require('../models/Course');
const fs = require('fs');
const { mockUser, mockCourse } = require('./helpers/testData');

jest.mock('../models/Certificate');
jest.mock('../models/User');
jest.mock('../models/Course');
jest.mock('fs');
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  },
  adminOnly: (req, res, next) => next()
}));

describe('Certificate Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/certificate/my', () => {
    it('should return user certificates', async () => {
      Certificate.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ certificateId: 'CERT1' }])
      });

      const res = await request(app).get('/api/certificate/my');
      expect(res.statusCode).toEqual(200);
      expect(res.body.certificates).toHaveLength(1);
    });
  });

  describe('GET /api/certificate/download/:certId', () => {
    it('should trigger regeneration if file missing', async () => {
      const mockCert = { 
        certificateId: 'C1', 
        user: 'U1', 
        course: 'C1', 
        pdfPath: 'missing.pdf',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Certificate.findOne.mockResolvedValue(mockCert);
      fs.existsSync.mockReturnValue(false); // Simulate missing file
      User.findById.mockResolvedValue(mockUser);
      Course.findById.mockResolvedValue(mockCourse);
      
      // We don't need to mock the actual download, just the logic leading to it
      // Since it's res.download, we mock the generateCertificate service
      jest.mock('../services/certificateService', () => ({
        generateCertificate: jest.fn().mockResolvedValue({ fileName: 'new.pdf', filePath: '/tmp/new.pdf' })
      }));

      const res = await request(app).get('/api/certificate/download/C1');
      // If we mocked correctly, it will try to find user/course
      expect(User.findById).toHaveBeenCalled();
    });
  });
});
