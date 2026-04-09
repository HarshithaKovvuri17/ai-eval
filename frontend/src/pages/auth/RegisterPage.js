import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Hexagon, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ name:'', email:'', password:'', role:'student' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      // Backend responds with requiresOtp:true → go to OTP screen
      if (data.requiresOtp) {
        toast.success('OTP sent to your email! Please verify.', { duration: 4000 });
        navigate('/verify-otp', { state: { email: data.email } });
      } else {
        // Shouldn't happen, but handle gracefully
        login(data);
        navigate(data.user.role === 'admin' ? '/admin' : '/courses');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGoogle = async cred => {
    setLoading(true);
    try {
      const { data } = await authAPI.google({ credential: cred.credential });
      login(data);
      toast.success('Signed in with Google!');
      navigate(data.user.role === 'admin' ? '/admin' : '/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-15%', right:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, #4ade8012 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, #6c63ff12 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Hexagon size={36} color="var(--accent)" fill="#6c63ff22" strokeWidth={1.5}/>
            <span style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800 }}>
              Neural<span style={{ color:'var(--accent)' }}>Cert</span>
            </span>
          </div>
          <p style={{ color:'var(--text-secondary)', fontSize:14 }}>AI-Powered Evaluation Platform</p>
        </div>

        <div className="card" style={{ padding:36, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, var(--accent), var(--accent-5))' }}/>

          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Create Account</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:28 }}>
            Already have one? <Link to="/login">Sign in</Link>
          </p>

          {/* Role toggle */}
          <div style={{ display:'flex', background:'var(--bg-surface)', borderRadius:'var(--radius)', padding:4, marginBottom:24, border:'1px solid var(--border)' }}>
            {['student','admin'].map(r => (
              <button key={r} onClick={() => setForm(p=>({...p,role:r}))} type="button"
                style={{ flex:1, padding:'8px 0', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s',
                  background: form.role===r ? (r==='admin' ? 'var(--accent-3)':'var(--accent)') : 'transparent',
                  color: form.role===r ? (r==='admin'?'#000':'#fff') : 'var(--text-secondary)',
                }}>
                {r==='student' ? '🎓 Student' : '🛡️ Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" value={form.name} onChange={change} className="form-input" placeholder="John Doe" required autoComplete="name"/>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={change} className="form-input" placeholder="you@example.com" required autoComplete="email"/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={change}
                  className="form-input" placeholder="Min. 6 characters" required style={{ paddingRight:44 }} autoComplete="new-password"/>
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width:'100%' }}>
              {loading
                ? <><div className="spinner" style={{ width:20, height:20, borderWidth:2 }}/> Sending OTP…</>
                : <><UserPlus size={16}/> Create Account</>}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', margin:'16px 0 0', lineHeight:1.6 }}>
            📧 A 6-digit verification code will be sent to your email.
          </p>

          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
            <div className="divider" style={{ flex:1, margin:0 }}/>
            <span style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>or sign up with</span>
            <div className="divider" style={{ flex:1, margin:0 }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error('Google sign-in failed')}
              theme="filled_black" shape="rectangular" size="large" width="320"/>Sign in with google
          </div>
        </div>
      </div>
    </div>
  );
}
