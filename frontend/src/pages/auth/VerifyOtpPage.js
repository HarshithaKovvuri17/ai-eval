import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Hexagon, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';

const OTP_LENGTH   = 6;
const RESEND_WAIT  = 60; // seconds

export default function VerifyOtpPage() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const { state }    = useLocation();
  const email        = state?.email || '';

  const [digits,    setDigits]    = useState(Array(OTP_LENGTH).fill(''));
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_WAIT);
  const [shake,     setShake]     = useState(false);
  const [success,   setSuccess]   = useState(false);

  const inputRefs = useRef([]);


  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);


  useEffect(() => {
    if (!email) { toast.error('Session expired. Please register again.'); navigate('/register'); }
  }, [email, navigate]);

  
  const otp = digits.join('');
  const prevOtpRef = useRef('');
  useEffect(() => {
    if (otp.length === OTP_LENGTH && otp !== prevOtpRef.current && !loading) {
      prevOtpRef.current = otp;
      handleVerify(otp);
    }
  
  }, [otp]);

  const focusNext = i => { if (inputRefs.current[i + 1]) inputRefs.current[i + 1].focus(); };
  const focusPrev = i => { if (inputRefs.current[i - 1]) inputRefs.current[i - 1].focus(); };

  const handleKey = (e, i) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) {
        const d = [...digits]; d[i] = ''; setDigits(d);
      } else { focusPrev(i); }
      return;
    }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); focusPrev(i); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); focusNext(i); return; }
  };

  const handleChange = (e, i) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;

    
    if (val.length >= OTP_LENGTH) {
      const arr = val.slice(0, OTP_LENGTH).split('');
      setDigits(arr);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }

    const d = [...digits];
    d[i] = val[val.length - 1]; 
    setDigits(d);
    if (i < OTP_LENGTH - 1) focusNext(i);
  };

  const handlePaste = e => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    const arr = text.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);
    setDigits(arr);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleVerify = useCallback(async (code) => {
    if (!code || code.length < OTP_LENGTH) return;
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp({ email, otp: code });
      setSuccess(true);
      toast.success('Email verified! Welcome to NeuralCert 🎉');
      login(data);
      setTimeout(() => navigate(data.user.role === 'admin' ? '/admin' : '/courses'), 1200);
    } catch (err) {
      triggerShake();
      const msg = err.response?.data?.message || 'Invalid OTP';
      toast.error(msg);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  }, [email, login, navigate]);

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await authAPI.resendOtp({ email });
      toast.success('New OTP sent! Check your inbox.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setCountdown(RESEND_WAIT);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally { setResending(false); }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      {/* Background orbs */}
      <div style={{ position:'absolute', top:'-15%', left:'50%', transform:'translateX(-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, #6c63ff12 0%, transparent 65%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, #4ade8010 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:460, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <Hexagon size={34} color="var(--accent)" fill="#6c63ff22" strokeWidth={1.5}/>
            <span style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800 }}>
              Neural<span style={{ color:'var(--accent)' }}>Cert</span>
            </span>
          </div>
        </div>

        <div className="card" style={{ padding:'40px 36px', position:'relative', overflow:'hidden' }}>
          {/* Top accent strip */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, var(--accent), var(--accent-5))' }}/>

          {/* Icon */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{
              width:72, height:72, borderRadius:'50%', margin:'0 auto 16px',
              background: success ? '#4ade8022' : '#6c63ff22',
              border:`2px solid ${success ? '#4ade8044' : '#6c63ff44'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.4s',
            }}>
              <ShieldCheck size={32} color={success ? 'var(--accent-2)' : 'var(--accent)'}/>
            </div>
            <h2 style={{ fontSize:22, fontWeight:800, fontFamily:'var(--font-display)', marginBottom:8 }}>
              Verify your email
            </h2>
            <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.6 }}>
              We sent a 6-digit code to<br/>
              <strong style={{ color:'var(--text-primary)' }}>{maskedEmail}</strong>
            </p>
          </div>

          {/* OTP input grid */}
          <div style={{
            display:'flex', gap:10, justifyContent:'center', marginBottom:28,
            animation: shake ? 'shake 0.5s ease' : 'none',
          }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={d}
                onChange={e => handleChange(e, i)}
                onKeyDown={e => handleKey(e, i)}
                onPaste={handlePaste}
                onFocus={e => e.target.select()}
                disabled={loading || success}
                style={{
                  width:52, height:64, textAlign:'center', fontSize:26, fontWeight:800,
                  fontFamily:'var(--font-display)', color: d ? 'var(--accent)' : 'var(--text-muted)',
                  background: d ? '#6c63ff11' : 'var(--bg-surface)',
                  border:`2px solid ${d ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius:'var(--radius)', outline:'none', cursor:'text',
                  transition:'all 0.2s', caretColor:'var(--accent)',
                  boxShadow: d ? '0 0 12px #6c63ff33' : 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px #6c63ff1a'; }}
                onBlur={e => { if (!d) { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; } }}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:28 }}>
            {Array(OTP_LENGTH).fill(0).map((_, i) => (
              <div key={i} style={{ width:8, height:8, borderRadius:'50%', transition:'all 0.2s',
                background: i < digits.filter(Boolean).length ? 'var(--accent)' : 'var(--border)',
                transform: i < digits.filter(Boolean).length ? 'scale(1.2)' : 'scale(1)',
              }}/>
            ))}
          </div>

          {/* Verify button (also auto-submits) */}
          <button
            onClick={() => handleVerify(otp)}
            disabled={otp.length < OTP_LENGTH || loading || success}
            className="btn btn-primary btn-lg"
            style={{ width:'100%', marginBottom:20 }}>
            {loading ? (
              <><div className="spinner" style={{ width:20, height:20, borderWidth:2 }}/> Verifying…</>
            ) : success ? (
              '✓ Verified!'
            ) : (
              <><ShieldCheck size={17}/> Verify Email</>
            )}
          </button>

          {/* Resend */}
          <div style={{ textAlign:'center', marginBottom:12 }}>
            <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Didn't receive the code? </span>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              style={{ background:'none', border:'none', cursor: countdown > 0 ? 'default' : 'pointer',
                color: countdown > 0 ? 'var(--text-muted)' : 'var(--accent)',
                fontSize:13, fontWeight:600, padding:0, display:'inline-flex', alignItems:'center', gap:4,
              }}>
              {resending
                ? <><div className="spinner" style={{ width:13, height:13, borderWidth:2 }}/> Sending…</>
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : <><RefreshCw size={13}/> Resend OTP</>}
            </button>
          </div>

          {/* Back */}
          <div style={{ textAlign:'center' }}>
            <button onClick={() => navigate('/register')}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13, display:'inline-flex', alignItems:'center', gap:5 }}>
              <ArrowLeft size={13}/> Back to Register
            </button>
          </div>
        </div>

        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:12, marginTop:16 }}>
          Code expires in 10 minutes · Max 5 attempts
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-10px); }
          40%       { transform: translateX(10px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
