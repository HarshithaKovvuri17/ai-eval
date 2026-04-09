import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Users, BookOpen, BarChart2, TrendingUp, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.stats().then(r => {
      setStats(r.data.stats);
      setRecent(r.data.recentAttempts);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><div className="spinner"/></div>;

  return (
    <div style={{ padding:'32px 28px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', marginBottom:6 }}>Admin Dashboard</h1>
          <p style={{ color:'var(--text-secondary)' }}>Platform overview and recent activity.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/courses/new')}>
          <Plus size={16}/> New Course
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20, marginBottom:32 }}>
        {[
          { label:'Total Students', value:stats?.totalStudents||0, icon:Users,      color:'var(--accent)'   },
          { label:'Active Courses', value:stats?.totalCourses||0,  icon:BookOpen,   color:'var(--accent-5)' },
          { label:'Total Attempts', value:stats?.totalAttempts||0, icon:BarChart2,  color:'var(--accent-3)' },
          { label:'Pass Rate',      value:`${stats?.passRate||0}%`,icon:TrendingUp, color:'var(--accent-2)' },
        ].map(({ label, value, icon:Icon, color }) => (
          <div key={label} className="card" style={{ padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', color }}>{value}</div>
              <div style={{ width:40, height:40, borderRadius:'var(--radius)', background:`${color}22`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={18} color={color}/>
              </div>
            </div>
            <div style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        {/* Recent attempts */}
        <div className="card" style={{ padding:24 }}>
          <h2 style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-display)', marginBottom:18, color:'var(--accent-3)' }}>Recent Attempts</h2>
          {recent.length === 0 ? (
            <p style={{ color:'var(--text-muted)', fontSize:13 }}>No attempts yet.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {recent.map(a => (
                <div key={a._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent)22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--accent)', flexShrink:0 }}>
                    {a.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.user?.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.course?.title} · Round {a.level}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color: a.passed ? 'var(--accent-2)' : 'var(--accent-4)' }}>{a.percentage}%</div>
                    {a.passed ? <CheckCircle size={12} color="var(--accent-2)"/> : <XCircle size={12} color="var(--accent-4)"/>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card" style={{ padding:24 }}>
          <h2 style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-display)', marginBottom:18, color:'var(--accent-3)' }}>Quick Actions</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Create New Course',   sub:'Add questions for both rounds', action:()=>navigate('/admin/courses/new'),   color:'var(--accent)'   },
              { label:'Manage All Courses',  sub:'Edit, delete or deactivate',    action:()=>navigate('/admin/courses'),       color:'var(--accent-5)' },
              { label:'View All Students',   sub:'Browse registered students',    action:()=>navigate('/admin/users'),         color:'var(--accent-3)' },
            ].map(({ label, sub, action, color }) => (
              <button key={label} onClick={action}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'var(--bg-surface)', border:`1px solid var(--border)`, borderRadius:'var(--radius)', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ width:8, height:36, borderRadius:4, background:color, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
