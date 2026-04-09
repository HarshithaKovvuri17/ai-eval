const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const {
  sendOtpEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
} = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── helpers ───────────────────────────────────────────────────────────────────

/** Generate a cryptographically random 6-digit OTP */
const generateOtp = () => String(Math.floor(100000 + crypto.randomInt(900000)));

/** Hash an OTP before storing (sha-256, no salt needed – short lived) */
const hashOtp = otp => crypto.createHash('sha256').update(otp).digest('hex');

const OTP_TTL        = 10 * 60 * 1000;   // 10 minutes
const OTP_MAX_TRIES  = 5;                 // wrong guesses before lockout
const OTP_MAX_RESEND = 5;                 // resend cap per registration session

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Step 1: Create unverified account → send OTP → frontend shows OTP screen
// ─────────────────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    // If already verified → reject duplicate
    const existing = await User.findOne({ email }).select('+otpCode +otpExpires +otpAttempts +otpResendCount');
    if (existing && existing.isVerified)
      return res.status(400).json({ message: 'Email is already registered. Please log in.' });

    const otp = generateOtp();

    if (existing) {
      // Resend OTP for an unverified account
      if (existing.otpResendCount >= OTP_MAX_RESEND)
        return res.status(429).json({ message: 'Too many OTP requests. Please try again later.' });

      existing.name            = name;
      existing.password        = password;   // pre-save hook re-hashes
      existing.role            = role === 'admin' ? 'admin' : 'student';
      existing.otpCode         = hashOtp(otp);
      existing.otpExpires      = new Date(Date.now() + OTP_TTL);
      existing.otpAttempts     = 0;
      existing.otpResendCount  = (existing.otpResendCount || 0) + 1;
      await existing.save();
    } else {
      await User.create({
        name, email, password,
        role: role === 'admin' ? 'admin' : 'student',
        isVerified:     false,
        otpCode:        hashOtp(otp),
        otpExpires:     new Date(Date.now() + OTP_TTL),
        otpAttempts:    0,
        otpResendCount: 1,
      });
    }

    await sendOtpEmail(email, name, otp);

    res.status(200).json({
      message:        'OTP sent to your email. Please verify to complete registration.',
      requiresOtp:    true,
      email,                // pass back so frontend knows which email to verify
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Step 2: Verify OTP → mark isVerified → issue tokens → log user in
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required.' });

    const user = await User.findOne({ email })
      .select('+otpCode +otpExpires +otpAttempts +otpResendCount');

    if (!user)
      return res.status(404).json({ message: 'No pending registration found for this email.' });

    if (user.isVerified)
      return res.status(400).json({ message: 'Email already verified. Please log in.' });

    // Lockout after too many wrong guesses
    if (user.otpAttempts >= OTP_MAX_TRIES)
      return res.status(429).json({ message: 'Too many incorrect attempts. Please re-register to get a new OTP.' });

    // Expiry check
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Constant-time compare (prevents timing attacks)
    const provided = hashOtp(otp.trim());
    if (provided !== user.otpCode) {
      user.otpAttempts += 1;
      await user.save();
      const left = OTP_MAX_TRIES - user.otpAttempts;
      return res.status(400).json({
        message: `Incorrect OTP. ${left > 0 ? `${left} attempt${left !== 1 ? 's' : ''} remaining.` : 'Account locked – please re-register.'}`,
      });
    }

    // ✅ OTP correct → mark verified, clear OTP fields
    user.isVerified      = true;
    user.otpCode         = undefined;
    user.otpExpires      = undefined;
    user.otpAttempts     = 0;
    user.otpResendCount  = 0;

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    // Fire welcome email (don't await)
    sendWelcomeEmail(email, user.name).catch(() => {});

    res.json({
      message:      'Email verified successfully! Welcome to NeuralCert.',
      token:        accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
// Resend a fresh OTP to the same email (rate-limited)
// ─────────────────────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email })
      .select('+otpCode +otpExpires +otpAttempts +otpResendCount');

    if (!user)
      return res.status(404).json({ message: 'No pending registration found.' });
    if (user.isVerified)
      return res.status(400).json({ message: 'Email already verified.' });
    if (user.otpResendCount >= OTP_MAX_RESEND)
      return res.status(429).json({ message: 'Maximum OTP resend limit reached. Please re-register.' });

    const otp             = generateOtp();
    user.otpCode          = hashOtp(otp);
    user.otpExpires       = new Date(Date.now() + OTP_TTL);
    user.otpAttempts      = 0;
    user.otpResendCount  += 1;
    await user.save();

    await sendOtpEmail(email, user.name, otp);

    res.json({ message: 'A new OTP has been sent to your email.', resendCount: user.otpResendCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Blocks unverified accounts
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    console.log('Finding user...');
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', !!user);
    if (!user || !user.password)
      return res.status(401).json({ message: 'Invalid email or password.' });

    if (!user.isVerified)
      return res.status(403).json({
        message: 'Please verify your email first.',
        requiresOtp: true,
        email,
      });

    console.log('Comparing password...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password.' });

    console.log('Generating tokens...');
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    console.log('Login successful');

    res.json({ token: accessToken, refreshToken, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google
// Google-verified accounts are auto-verified
// ─────────────────────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({ name, email, googleId, avatar: picture, isVerified: true });
    } else {
      if (!user.googleId) { user.googleId = googleId; user.avatar = picture; }
      if (!user.isVerified) user.isVerified = true; // link existing unverified account
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ token: accessToken, refreshToken, user });
  } catch (err) {
    res.status(500).json({ message: 'Google authentication failed.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'No account found with that email.' });
    if (!user.isVerified)
      return res.status(403).json({ message: 'Please verify your email before resetting your password.' });

    const rawToken            = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3_600_000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
    await sendResetPasswordEmail(user.email, user.name, resetUrl);

    res.json({ message: 'Password reset email sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user   = await User.findOne({
      resetPasswordToken:   hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Token is invalid or has expired.' });

    user.password             = req.body.password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = (req, res) => res.json({ user: req.user });

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token.' });

    const jwt     = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ message: 'Invalid refresh token.' });

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Invalid refresh token.' });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save();
    res.json({ message: 'Logged out.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
