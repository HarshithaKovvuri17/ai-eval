const { generateQuestions } = require('../services/geminiService');
const Course   = require('../models/Course');
const User     = require('../models/User');
const Attempt  = require('../models/Attempt');
const Progress = require('../models/Progress');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalStudents, totalCourses, totalAttempts, passAgg, recent] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Course.countDocuments({ isActive: true }),
      Attempt.countDocuments({ status: 'evaluated' }),
      Attempt.aggregate([{ $group:{ _id:null, total:{$sum:1}, passed:{$sum:{$cond:['$passed',1,0]}} } }]),
      Attempt.find({ status:'evaluated' }).sort({ createdAt:-1 }).limit(8)
        .populate('user','name email avatar').populate('course','title'),
    ]);
    const passRate = (passAgg && passAgg[0] && passAgg[0].total > 0) 
      ? Math.round((passAgg[0].passed / passAgg[0].total) * 100) 
      : 0;

    res.json({
      stats: { 
        totalStudents, 
        totalCourses, 
        totalAttempts,
        passRate 
      },
      recentAttempts: recent || [],
    });
  } catch (err) { 
    res.status(500).json({ message: err.message || 'Error fetching stats' }); 
  }
};

// GET /api/admin/courses
exports.getAdminCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ courses });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/admin/courses/:id
exports.getAdminCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json({ course });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/admin/courses
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, difficulty, duration, questions } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: 'Title and description are required.' });

    // Validate & normalise each question
    const normQ = (q, i) => ({
      questionText:   q.questionText,
      questionType:   q.questionType || 'single',
      options:        (q.options || []).map(o => ({ id: o.id, text: o.text })),
      correctOptions: Array.isArray(q.correctOptions) ? q.correctOptions : [q.correctOptions],
      level:          Number(q.level),
      marks:          q.marks || 10,
      order:          i,
      explanation:    q.explanation || '',
    });

    const course = await Course.create({
      title, description, category, difficulty, duration,
      questions: (questions || []).map(normQ),
      createdBy: req.user._id,
    });
    res.status(201).json({ message: 'Course created successfully.', course });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/admin/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    // Normalise questions if included
    if (req.body.questions) {
      req.body.questions = req.body.questions.map((q, i) => ({
        ...q,
        questionType:   q.questionType || 'single',
        options:        (q.options || []).map(o => ({ id: o.id, text: o.text })),
        correctOptions: Array.isArray(q.correctOptions) ? q.correctOptions : [q.correctOptions],
        level:          Number(q.level),
        order:          i,
      }));
    }
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json({ message: 'Course updated.', course });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/admin/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Course deactivated.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/admin/courses/:id/questions
exports.addQuestion = async (req, res) => {
  try {
    const { questionText, questionType, options, correctOptions, level, marks, explanation } = req.body;
    if (!questionText || !correctOptions || !level)
      return res.status(400).json({ message: 'questionText, correctOptions, level required.' });

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    course.questions.push({
      questionText,
      questionType: questionType || 'single',
      options: (options || []).map(o => ({ id: o.id, text: o.text })),
      correctOptions: Array.isArray(correctOptions) ? correctOptions : [correctOptions],
      level: Number(level),
      marks: marks || 10,
      explanation: explanation || '',
    });
    await course.save();
    res.json({ message: 'Question added.', course });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/admin/courses/:courseId/questions/:questionId
exports.updateQuestion = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const q = course.questions.id(req.params.questionId);
    if (!q) return res.status(404).json({ message: 'Question not found.' });

    if (req.body.correctOptions && !Array.isArray(req.body.correctOptions))
      req.body.correctOptions = [req.body.correctOptions];

    Object.assign(q, req.body);
    await course.save();
    res.json({ message: 'Question updated.', course });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/admin/courses/:courseId/questions/:questionId
exports.deleteQuestion = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    course.questions = course.questions.filter(q => q._id.toString() !== req.params.questionId);
    await course.save();
    res.json({ message: 'Question deleted.', course });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/admin/generate-questions
exports.generateQuestions = async (req, res) => {
  try {
    const { title, description, category, difficulty, round1Count, round2Count } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: 'title and description are required.' });

    const questions = await generateQuestions({
      title,
      description,
      category:    category    || 'General',
      difficulty:  difficulty  || 'Intermediate',
      round1Count: Number(round1Count) || 5,
      round2Count: Number(round2Count) || 5,
    });

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
