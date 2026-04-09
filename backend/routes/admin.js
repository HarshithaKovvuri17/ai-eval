const express = require('express');
const r = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getStats, getUsers,
  getAdminCourses, getAdminCourse, createCourse, updateCourse, deleteCourse,
  addQuestion, updateQuestion, deleteQuestion,
  generateQuestions,
} = require('../controllers/adminController');

r.use(protect, adminOnly);

r.get ('/stats',                                    getStats);
r.get ('/users',                                    getUsers);
r.get ('/courses',                                  getAdminCourses);
r.post('/courses',                                  createCourse);
r.get ('/courses/:id',                              getAdminCourse);
r.put ('/courses/:id',                              updateCourse);
r.delete('/courses/:id',                            deleteCourse);
r.post('/courses/:id/questions',                    addQuestion);
r.put ('/courses/:courseId/questions/:questionId',  updateQuestion);
r.delete('/courses/:courseId/questions/:questionId',deleteQuestion);

r.post('/generate-questions',                       generateQuestions);
r.get ('/ai-status', (req, res) => {
  const configured = !!(process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 20);
  res.json({ configured, message: configured ? 'AI ready' : 'GOOGLE_API_KEY not set in backend/.env' });
});

module.exports = r;
