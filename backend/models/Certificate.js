const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificateId: { type: String, unique: true, required: true },
  pdfPath:       String,
  level1Score:   Number,
  level2Score:   Number,
  issueDate:     { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
