const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  id:   { type: String, required: true },   // 'A', 'B', 'C', 'D'
  text: { type: String, required: true },
});

const questionSchema = new mongoose.Schema({
  questionText:   { type: String, required: true },
  questionType:   { type: String, enum: ['single', 'multiple'], default: 'single' },
  options:        { type: [optionSchema], default: [] },
  correctOptions: { type: [String], required: true }, // ['A'] or ['A','C']
  level:          { type: Number, enum: [1,2], required: true },
  marks:          { type: Number, default: 10 },
  order:          { type: Number, default: 0 },
  explanation:    { type: String, default: '' }, // shown after answer revealed
});

const courseSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  thumbnail:   { type: String, default: '' },
  category:    { type: String, default: 'General' },
  difficulty:  { type: String, enum: ['Beginner','Intermediate','Advanced'], default: 'Intermediate' },
  duration:    { type: String, default: '60 mins' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions:   [questionSchema],
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
