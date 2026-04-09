const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId:     { type: mongoose.Schema.Types.ObjectId },
  questionText:   String,
  questionType:   { type: String, enum: ['single','multiple'], default: 'single' },
  selectedOptions: [String],    // what user chose: ['A'] or ['A','C']
  correctOptions:  [String],    // ground truth
  isCorrect:       { type: Boolean, default: false },
  isPartial:       { type: Boolean, default: false },
  score:           { type: Number, default: 0 }, // 0-100 per question
  explanation:     String,
});

const attemptSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  level:         { type: Number, enum: [1,2], required: true },
  attemptNumber: { type: Number, default: 1 },
  answers:       [answerSchema],
  totalScore:    { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  passed:        { type: Boolean, default: false },
  status:        { type: String, enum: ['in-progress','evaluated'], default: 'in-progress' },
  startedAt:     { type: Date, default: Date.now },
  submittedAt:   Date,
  evaluatedAt:   Date,
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
