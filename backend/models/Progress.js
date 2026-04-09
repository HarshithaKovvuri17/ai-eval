const mongoose = require('mongoose');

const levelInfoSchema = {
  passed:    { type: Boolean, default: false },
  attempts:  { type: Number,  default: 0 },
  bestScore: { type: Number,  default: 0 },
  locked:    { type: Boolean, default: false },
};

const progressSchema = new mongoose.Schema({
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:            { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  currentLevel:      { type: Number, default: 1 },
  level1:            { ...levelInfoSchema },
  level2:            { ...levelInfoSchema },
  certificateIssued: { type: Boolean, default: false },
  certificate:       { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
}, { timestamps: true });

progressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
