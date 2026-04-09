const Course      = require('../models/Course');
const Attempt     = require('../models/Attempt');
const Progress    = require('../models/Progress');
const Certificate = require('../models/Certificate');
const { generateCertificate } = require('../services/certificateService');

const MAX_ATTEMPTS = 3;
const L1_PASS_PCT  = 50;
const L2_PASS_PCT  = 70;

// ── MCQ scoring engine ────────────────────────────────────────────────────────
function scoreAnswer(question, selectedOptions) {
  const correct  = new Set(question.correctOptions);
  const selected = new Set(selectedOptions || []);

  if (question.questionType === 'single') {
    // Single: full marks or zero
    const isCorrect = selected.size === 1 && correct.has([...selected][0]);
    return { score: isCorrect ? 100 : 0, isCorrect, isPartial: false };
  }

  // Multiple: partial credit — Jaccard-style
  const intersection = [...selected].filter(o => correct.has(o)).length;
  const union        = new Set([...correct, ...selected]).size;
  const wrong        = [...selected].filter(o => !correct.has(o)).length;

  if (wrong > 0) {
    // Penalise wrong selections: subtract proportionally
    const penalty = wrong / correct.size;
    const raw     = Math.max(0, (intersection / correct.size) - penalty);
    const score   = Math.round(raw * 100);
    return { score, isCorrect: false, isPartial: score > 0 };
  }

  const score     = Math.round((intersection / correct.size) * 100);
  const isCorrect = score === 100;
  return { score, isCorrect, isPartial: !isCorrect && score > 0 };
}

// POST /api/test/submit
exports.submitTest = async (req, res) => {
  try {
    const { courseId, level, answers } = req.body;
    if (!courseId || !level || !Array.isArray(answers) || !answers.length)
      return res.status(400).json({ message: 'courseId, level, and answers[] are required.' });

    const lvl    = parseInt(level);
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    let progress = await Progress.findOne({ user: req.user._id, course: courseId });
    if (!progress) progress = await Progress.create({ user: req.user._id, course: courseId });

    if (lvl === 2 && !progress.level1.passed)
      return res.status(403).json({ message: 'Complete Round 1 first.' });

    const lvlKey  = lvl === 1 ? 'level1' : 'level2';
    const lvlData = progress[lvlKey];

    if (lvlData.locked)
      return res.status(403).json({ message: `Round ${lvl} is locked – all retakes used.` });

    if (lvlData.attempts >= MAX_ATTEMPTS) {
      progress[lvlKey].locked = true;
      await progress.save();
      return res.status(403).json({ message: 'Maximum retakes reached.' });
    }

    // ── Score each answer (instant, no AI needed for MCQ) ────────────────────
    const courseQs = course.questions.filter(q => q.level === lvl);

    const evaluated = answers.map(({ questionId, selectedOptions }) => {
      const q = courseQs.find(cq => cq._id.toString() === questionId);
      if (!q) return null;

      const { score, isCorrect, isPartial } = scoreAnswer(q, selectedOptions);

      return {
        questionId:      q._id,
        questionText:    q.questionText,
        questionType:    q.questionType,
        selectedOptions: selectedOptions || [],
        correctOptions:  q.correctOptions,
        explanation:     q.explanation || '',
        score,
        isCorrect,
        isPartial,
      };
    }).filter(Boolean);

    const totalScore = evaluated.reduce((s, a) => s + a.score, 0);
    const percentage = Math.round(totalScore / Math.max(evaluated.length, 1));
    const threshold  = lvl === 1 ? L1_PASS_PCT : L2_PASS_PCT;
    const passed     = percentage >= threshold;

    // ── Update progress ───────────────────────────────────────────────────────
    progress[lvlKey].attempts += 1;
    if (percentage > progress[lvlKey].bestScore) progress[lvlKey].bestScore = percentage;

    if (passed) {
      progress[lvlKey].passed = true;
      if (lvl === 1) progress.currentLevel = 2;
    } else if (progress[lvlKey].attempts >= MAX_ATTEMPTS) {
      progress[lvlKey].locked = true;
    }
    await progress.save();

    // ── Save attempt ──────────────────────────────────────────────────────────
    await Attempt.create({
      user: req.user._id, course: courseId, level: lvl,
      attemptNumber: progress[lvlKey].attempts,
      answers: evaluated, totalScore, percentage, passed,
      status: 'evaluated', submittedAt: new Date(), evaluatedAt: new Date(),
    });

    // ── Certificate ───────────────────────────────────────────────────────────
    let certificate = null;
    if (lvl === 2 && passed && !progress.certificateIssued) {
      try {
        const certData = await generateCertificate({
          userName: req.user.name, courseName: course.title,
          level1Score: progress.level1.bestScore, level2Score: percentage,
          issueDate: new Date(),
        });
        certificate = await Certificate.create({
          user: req.user._id, course: courseId,
          certificateId: certData.certId, pdfPath: certData.fileName,
          level1Score: progress.level1.bestScore, level2Score: percentage,
        });
        progress.certificateIssued = true;
        progress.certificate       = certificate._id;
        await progress.save();
      } catch (cerr) {
        console.error('Certificate generation error:', cerr.message);
      }
    }

    let nextAction;
    if (passed)                       nextAction = lvl === 1 ? 'proceed_level2' : 'certificate_issued';
    else if (progress[lvlKey].locked) nextAction = 'all_attempts_used';
    else                              nextAction = 'retry';

    res.json({
      success: true,
      result: {
        percentage, passed, level: lvl, threshold,
        attemptsUsed: progress[lvlKey].attempts,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - progress[lvlKey].attempts),
        locked:       progress[lvlKey].locked,
        answers:      evaluated,
        nextAction,
        certificate: certificate
          ? { id: certificate.certificateId, downloadUrl: `/certificates/${certificate.pdfPath}` }
          : null,
      },
    });
  } catch (err) {
    console.error('submitTest error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/test/progress/:courseId
exports.getProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({ user: req.user._id, course: req.params.courseId })
      .populate('certificate');
    res.json({ progress: progress || null });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/test/history
exports.getHistory = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.user._id, status: 'evaluated' })
      .populate('course', 'title thumbnail category')
      .sort({ createdAt: -1 }).limit(30);
    res.json({ attempts });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/test/restart/:courseId
exports.restartCourse = async (req, res) => {
  try {
    const progress = await Progress.findOne({ user: req.user._id, course: req.params.courseId });
    if (!progress) return res.status(404).json({ message: 'No progress found.' });

    if (!progress.level1.locked && !progress.level2.locked && !progress.certificateIssued)
      return res.status(400).json({ message: 'You still have attempts remaining.' });

    progress.currentLevel      = 1;
    progress.level1            = { passed: false, attempts: 0, bestScore: 0, locked: false };
    progress.level2            = { passed: false, attempts: 0, bestScore: 0, locked: false };
    progress.certificateIssued = false;
    progress.certificate       = undefined;
    await progress.save();
    res.json({ message: 'Progress reset. You can start from Round 1 again.', progress });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
