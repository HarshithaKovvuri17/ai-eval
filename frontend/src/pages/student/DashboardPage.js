import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { testAPI, certAPI } from '../../services/api';
import { Award, BookOpen, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [history, setHistory]  = useState([]);
  const [certs,   setCerts]    = useState([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hRes, cRes] = await Promise.all([testAPI.history(), certAPI.my()]);
        setHistory(hRes.data.attempts);
        setCerts(cRes.data.certificates);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const passed  = history.filter(a => a.passed).length;
  const failed  = history.filter(a => !a.passed).length;
  const avgScore = history.length
    ? Math.round(history.reduce((s,a)=>s+a.percentage,0)/history.length)
    : 0;

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><div className="spinner"/></div>;

  return (
    <div style={{ padding:'32px 28px', maxWidth:1100, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', marginBottom:6 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color:'var(--text-secondary)' }}>Here's your learning progress at a glance.</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:32 }}>
        {[
          { label:'Total Attempts', value:history.length, icon:BookOpen, color:'var(--accent)' },
          { label:'Passed',         value:passed,         icon:CheckCircle, color:'var(--accent-2)' },
          { label:'Failed',         value:failed,         icon:XCircle,    color:'var(--accent-4)' },
          { label:'Avg Score',      value:`${avgScore}%`, icon:TrendingUp,  color:'var(--accent-5)' },
          { label:'Certificates',   value:certs.length,   icon:Award,       color:'var(--accent-3)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding:20, display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ width:44, height:44, borderRadius:'var(--radius)', background:`${color}22`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={20} color={color}/>
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:800, fontFamily:'var(--font-display)', color }}>{value}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        {/* Recent attempts */}
        <div className="card" style={{ padding:24 }}>
          <h2 style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-display)', marginBottom:18 }}>Recent Attempts</h2>
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)' }}>
              <BookOpen size={32} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
              <p style={{ fontSize:13 }}>No attempts yet. Start a course!</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {history.slice(0,8).map(a => (
                <div key={a._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: a.passed ? 'var(--accent-2)' : 'var(--accent-4)', flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.course?.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>Round {a.level} · Attempt #{a.attemptNumber}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color: a.passed ? 'var(--accent-2)' : 'var(--accent-4)' }}>{a.percentage}%</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{a.passed ? 'PASS' : 'FAIL'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificates */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h2 style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-display)' }}>My Certificates</h2>
            {certs.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/certificates')}>View All</button>
            )}
          </div>
          {certs.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)' }}>
              <Award size={32} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
              <p style={{ fontSize:13 }}>Pass both rounds to earn a certificate!</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {certs.slice(0,5).map(c => (
                <div key={c._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#4ade8008', borderRadius:'var(--radius)', border:'1px solid #4ade8022' }}>
                  <Award size={20} color="var(--accent-2)"/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.course?.title}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                      {new Date(c.issueDate).toLocaleDateString()} · #{c.certificateId}
                    </div>
                  </div>
                  <button onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const certUrl = `/api/certificate/download/${c.certificateId}`;
                      const response = await fetch(certUrl, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (!response.ok) throw new Error('Download failed');
                      const blob = await response.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      window.open(blobUrl, '_blank');
                      const a = document.createElement('a');
                      a.href = blobUrl;
                      a.download = `NeuralCert-${c.certificateId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                    } catch (err) {
                      console.error('Certificate download error:', err);
                      alert('Failed to download certificate. Please try again.');
                    }
                  }} className="btn btn-success btn-sm">
                    PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
