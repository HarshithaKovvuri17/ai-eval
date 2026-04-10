const mongoose = require('mongoose');

const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Student',
  email: 'student@example.com',
  password: 'password123',
  role: 'student',
  isVerified: true,
  save: jest.fn().mockResolvedValue(true),
  comparePassword: jest.fn().mockResolvedValue(true),
};

const mockCourse = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Introduction to AI',
  description: 'A beginner course on AI',
  isActive: true,
  questions: [
    {
      _id: new mongoose.Types.ObjectId(),
      questionText: 'What is AI?',
      options: ['Art', 'Intelligence', 'None'],
      correctOptions: [1],
      level: 1,
      order: 1
    }
  ],
  createdBy: mockUser._id,
  toObject: function() { return JSON.parse(JSON.stringify(this)); }
};

const mockProgress = {
  user: mockUser._id,
  course: mockCourse._id,
  level1: { passed: true, currentLevel: 1 },
  save: jest.fn().mockResolvedValue(true)
};

module.exports = {
  mockUser,
  mockCourse,
  mockProgress
};
