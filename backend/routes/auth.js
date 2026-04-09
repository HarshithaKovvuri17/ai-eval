const express     = require('express');
const r           = express.Router();
const { protect } = require('../middleware/auth');
const {
  register, verifyOtp, resendOtp,
  login, googleAuth,
  forgotPassword, resetPassword,
  getMe, refreshToken, logout,
} = require('../controllers/authController');

r.post('/register',              register);
r.post('/verify-otp',            verifyOtp);
r.post('/resend-otp',            resendOtp);
r.post('/login',                 login);
r.post('/google',                googleAuth);
r.post('/forgot-password',       forgotPassword);
r.post('/reset-password/:token', resetPassword);
r.post('/refresh',               refreshToken);
r.get ('/me',     protect,       getMe);
r.post('/logout', protect,       logout);

module.exports = r;
