const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const bg     = '#0a0f1e';
const accent = '#6c63ff';

const wrap = body => `
<div style="background:${bg};font-family:'Segoe UI',sans-serif;padding:48px 32px;max-width:600px;margin:0 auto;border-radius:16px;border:1px solid #1e2d4a;">
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:28px;font-weight:900;color:${accent};letter-spacing:-1px;">⬡ NeuralCert</span>
  </div>
  ${body}
  <hr style="border-color:#1e2d4a;margin:32px 0;">
  <p style="color:#4a5568;font-size:12px;text-align:center;">© ${new Date().getFullYear()} NeuralCert AI Evaluation System</p>
</div>`;

const linkBtn = (href, label) =>
  `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="background:${accent};color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">${label}</a>
  </div>`;

// ── OTP box: large digit tiles ─────────────────────────────────────────────
const otpBox = otp =>
  `<div style="text-align:center;margin:28px 0;">
    <div style="display:inline-flex;gap:10px;">
      ${otp.split('').map(d =>
        `<span style="display:inline-block;width:48px;height:60px;line-height:60px;text-align:center;font-size:28px;font-weight:900;color:#fff;background:#1e2d4a;border:2px solid ${accent};border-radius:10px;">${d}</span>`
      ).join('')}
    </div>
  </div>`;

// ── Send OTP for email verification ───────────────────────────────────────
exports.sendOtpEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from:    `"NeuralCert" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `${otp} – Your NeuralCert Verification Code`,
    html: wrap(`
      <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 12px;">Verify your email, ${name} 👋</h2>
      <p style="color:#94a3b8;line-height:1.7;">Enter the 6-digit code below to complete your registration. This code expires in <strong style="color:#e2e8f0;">10 minutes</strong>.</p>
      ${otpBox(otp)}
      <p style="color:#64748b;font-size:13px;text-align:center;">Do not share this code with anyone. If you didn't create a NeuralCert account, ignore this email.</p>
    `),
  });
};

// ── Send OTP for password reset ────────────────────────────────────────────
exports.sendResetPasswordEmail = async (email, name, resetUrl) => {
  await transporter.sendMail({
    from:    `"NeuralCert" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Reset Your Password – NeuralCert',
    html: wrap(`
      <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 12px;">Hello, ${name} 👋</h2>
      <p style="color:#94a3b8;line-height:1.7;">We received a request to reset your password. Click the button below – this link is valid for <strong style="color:#e2e8f0;">1 hour</strong>.</p>
      ${linkBtn(resetUrl, 'Reset My Password')}
      <p style="color:#64748b;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
    `),
  });
};

// ── Welcome email (after verified) ────────────────────────────────────────
exports.sendWelcomeEmail = async (email, name) => {
  await transporter.sendMail({
    from:    `"NeuralCert" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Welcome to NeuralCert! 🎉',
    html: wrap(`
      <h2 style="color:#e2e8f0;font-size:22px;margin:0 0 12px;">Welcome, ${name}! 🎉</h2>
      <p style="color:#94a3b8;line-height:1.7;">Your email has been verified. You have successfully joined <strong style="color:#6c63ff;">NeuralCert</strong> – the AI-powered evaluation platform. Start exploring courses and earn your certificates!</p>
    `),
  });
};
