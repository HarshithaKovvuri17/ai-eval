const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:                 { type: String, required: true, trim: true },
  email:                { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:             { type: String, minlength: 6, select: false },
  role:                 { type: String, enum: ['student','admin'], default: 'student' },
  googleId:             { type: String, sparse: true },
  avatar:               { type: String, default: '' },

  // ── Email verification via OTP ────────────────────────────────────────────
  isVerified:           { type: Boolean, default: false },
  otpCode:              { type: String,  select: false },   // hashed 6-digit OTP
  otpExpires:           { type: Date,    select: false },
  otpAttempts:          { type: Number,  default: 0, select: false }, // wrong-guess counter
  otpResendCount:       { type: Number,  default: 0 },               // resend rate-limit

  // ── Password reset ────────────────────────────────────────────────────────
  resetPasswordToken:   String,
  resetPasswordExpires: Date,

  // ── Sessions ──────────────────────────────────────────────────────────────
  refreshToken:         String,
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};

userSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.password; delete o.refreshToken;
  delete o.resetPasswordToken; delete o.resetPasswordExpires;
  delete o.otpCode; delete o.otpExpires; delete o.otpAttempts;
  return o;
};

module.exports = mongoose.model('User', userSchema);
