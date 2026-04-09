const express = require('express');
const r = express.Router();
const { protect } = require('../middleware/auth');
const { submitTest, getProgress, getHistory, restartCourse } = require('../controllers/testController');

r.use(protect);
r.post('/submit',             submitTest);
r.get ('/progress/:courseId', getProgress);
r.get ('/history',            getHistory);
r.post('/restart/:courseId',  restartCourse);

module.exports = r;
