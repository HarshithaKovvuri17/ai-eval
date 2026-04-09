import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Hexagon, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <Hexagon size={32} color="var(--accent)" fill="#6c63ff22" />
            <span style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800 }}>Neural<span style={{ color:'var(--accent)' }}>Cert</span></span>
          </div>
        </div>

        <div className="card" style={{ padding:36 }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
              <h2 style={{ fontSize:20, marginBottom:12 }}>Check your email</h2>
              <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:24 }}>
                We sent a password reset link to <strong style={{ color:'var(--text-primary)' }}>{email}</strong>
              </p>
              <Link to="/login" className="btn btn-outline">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Reset Password</h2>
              <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:28 }}>
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    className="form-input" placeholder="you@example.com" required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width:'100%' }}>
                  {loading ? <div className="spinner" style={{ width:20, height:20, borderWidth:2 }}/> : <><Send size={16}/>Send Reset Link</>}
                </button>
              </form>
              <div style={{ textAlign:'center', marginTop:20 }}>
                <Link to="/login" style={{ fontSize:13, color:'var(--text-muted)' }}>← Back to login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
