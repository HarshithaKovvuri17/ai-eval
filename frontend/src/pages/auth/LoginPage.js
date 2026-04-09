import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Hexagon, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ email:'', password:'', role:'student' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email: form.email, password: form.password });

      // Backend sends requiresOtp when account is not yet verified
      if (data.requiresOtp) {
        toast('Please verify your email first.', { icon:'📧' });
        navigate('/verify-otp', { state: { email: data.email } });
        return;
      }

      login(data);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/courses');
    } catch (err) {
      const d = err.response?.data;
      if (d?.requiresOtp) {
        toast('Please verify your email first.', { icon:'📧' });
        navigate('/verify-otp', { state: { email: d.email } });
        return;
      }
      toast.error(d?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleGoogle = async cred => {
    setLoading(true);
    try {
      const { data } = await authAPI.google({ credential: cred.credential });
      login(data);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-20%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, #6c63ff15 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, #4ade8010 0%, transparent 70%)', pointerEvents:'none' }}/>

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
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, var(--accent-5), var(--accent))' }}/>

          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Sign In</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:28 }}>
            New here? <Link to="/register">Create an account</Link>
          </p>

          {/* Role toggle */}
          <div style={{ display:'flex', background:'var(--bg-surface)', borderRadius:'var(--radius)', padding:4, marginBottom:24, border:'1px solid var(--border)' }}>
            {['student','admin'].map(r => (
              <button key={r} type="button" onClick={() => setForm(p=>({...p,role:r}))}
                style={{ flex:1, padding:'8px 0', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s',
                  background: form.role===r ? 'var(--accent)' : 'transparent',
                  color: form.role===r ? '#fff' : 'var(--text-secondary)',
                }}>
                {r==='student' ? '🎓 Student' : '🛡️ Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="email" type="email" value={form.email} onChange={change}
                className="form-input" placeholder="you@example.com" required autoComplete="email"/>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <input name="password" type={showPw ? 'text':'password'} value={form.password} onChange={change}
                  className="form-input" placeholder="••••••••" required style={{ paddingRight:44 }} autoComplete="current-password"/>
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <div style={{ textAlign:'right', marginTop:4 }}>
                <Link to="/forgot-password" style={{ fontSize:12, color:'var(--text-muted)' }}>Forgot password?</Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width:'100%' }}>
              {loading
                ? <div className="spinner" style={{ width:20, height:20, borderWidth:2 }}/>
                : <><LogIn size={16}/> Sign In</>}
            </button>
          </form>

          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
            <div className="divider" style={{ flex:1, margin:0 }}/>
            <span style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>or continue with</span>
            <div className="divider" style={{ flex:1, margin:0 }}/>
          </div>

          <div style={{ display:'flex', justifyContent:'center' }}>
            <GoogleLogin onSuccess={handleGoogle} onError={() => toast.error('Google login failed')}
              theme="filled_black" shape="rectangular" size="large" width="320"/>
          </div>
        </div>
      </div>
    </div>
  );
}
