require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Trust proxy for rate limiter (satisfies SonarQube)
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb for DoS protection
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/courses',     require('./routes/courses'));
app.use('/api/test',        require('./routes/test'));
app.use('/api/certificate', require('./routes/certificate'));

// Health check – also verifies Gemini connectivity
app.get('/api/health', async (_, res) => {
  try {
    const { checkGeminiHealth } = require('./services/geminiService');
    const geminiOk = await checkGeminiHealth().catch(() => false);
    res.json({ status: 'ok', timestamp: new Date(), ai: geminiOk ? 'gemini-connected' : 'gemini-error' });
  } catch {
    res.json({ status: 'ok', timestamp: new Date(), ai: 'unknown' });
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── Database + Server ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_eval_system')
    .then(() => {
      console.log('✅ MongoDB connected');
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🤖 AI Engine: Google Gemini (gemini-flash-latest)`);
      });
    })
    .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });
}

module.exports = app;
