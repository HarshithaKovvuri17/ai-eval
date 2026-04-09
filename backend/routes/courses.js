const express = require('express');
const r = express.Router();
const { protect } = require('../middleware/auth');
const { getAllCourses, getCourse, getQuestionsByLevel,restartCourse } = require('../controllers/courseController');

r.get('/',                             getAllCourses);
r.get('/:id',          protect,        getCourse);
r.get('/:id/questions/:level', protect, getQuestionsByLevel);
r.post('/:id/restart', protect, restartCourse);
module.exports = r;
