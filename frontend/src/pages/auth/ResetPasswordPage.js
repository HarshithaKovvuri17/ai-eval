import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Hexagon, Eye, EyeOff, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await authAPI.resetPassword(token, { password: form.password });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed – link may have expired');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <Hexagon size={32} color="var(--accent)" fill="#6c63ff22"/>
            <span style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800 }}>
              Neural<span style={{ color:'var(--accent)' }}>Cert</span>
            </span>
          </div>
        </div>

        <div className="card" style={{ padding:36 }}>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Set New Password</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:28 }}>
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="form-input" placeholder="Min. 6 characters" required style={{ paddingRight:44 }}/>
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                className="form-input" placeholder="Repeat password" required/>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width:'100%' }}>
              {loading
                ? <div className="spinner" style={{ width:20, height:20, borderWidth:2 }}/>
                : <><KeyRound size={16}/> Reset Password</>}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:20 }}>
            <Link to="/login" style={{ fontSize:13, color:'var(--text-muted)' }}>← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
