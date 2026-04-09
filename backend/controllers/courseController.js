const Course   = require('../models/Course');
const Progress = require('../models/Progress');

// GET /api/courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('-questions')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ courses });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/courses/:id
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('createdBy', 'name');
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    let progress = null;
    if (req.user) {
      progress = await Progress.findOne({ user: req.user._id, course: course._id });
    }

    // Strip correctOptions before sending to student
    const safe = course.toObject();
    safe.questions = safe.questions.map(q => ({
      _id: q._id, questionText: q.questionText, questionType: q.questionType,
      options: q.options, level: q.level, marks: q.marks, order: q.order,
      // no correctOptions, no explanation
    }));

    res.json({ course: safe, progress });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
// GET /api/courses/:id/questions/:round
exports.getQuestionsByLevel = async (req, res) => {
  try {
    const round = parseInt(req.params.level);

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const progress = await Progress.findOne({
      user: req.user._id,
      course: req.params.id,
    });

    // Round 2 access check
    if (round === 2 && (!progress || !progress.level1.passed)) {
      return res
        .status(403)
        .json({ message: "You must pass Round 1 before accessing Round 2." });
    }

    const roundProgress =
      round === 1 ? progress?.level1 : progress?.level2;

    if (roundProgress?.locked) {
      return res.status(403).json({
        message: `Round ${round} is locked – maximum retakes reached.`,
      });
    }

    // Student sub-level (1, 2, 3)
    const studentLevel = roundProgress?.currentLevel || 1;

    // Get all questions of selected round
    const allQuestions = course.questions
      .filter((q) => q.level === round)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!allQuestions.length) {
      return res
        .status(404)
        .json({ message: `No questions found for Round ${round}.` });
    }

    const total = allQuestions.length;

    const questions = allQuestions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      level: q.level,
      marks: q.marks,
    }));

    res.json({
      round,
      studentLevel,
      totalQuestions: total,
      fetchedQuestions: questions.length,
      questions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/courses/:id/restart
exports.restartCourse = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user._id,
      course: req.params.id,
    });

    if (!progress) {
      return res.status(404).json({
        message: "Progress not found for this course",
      });
    }

    progress.level1 = {
      passed: false,
      locked: false,
      currentLevel: 1,
      attempts: 0,
    };

    progress.level2 = {
      passed: false,
      locked: false,
      currentLevel: 1,
      attempts: 0,
    };

    progress.completed = false;
    progress.score = 0;

    await progress.save();

    res.json({
      message: "Course restarted successfully",
      progress,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};