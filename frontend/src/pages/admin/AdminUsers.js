import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Users, Search, Mail, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.users().then(r => setUsers(r.data.users)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><div className="spinner"/></div>;

  return (
    <div style={{ padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', marginBottom:6 }}>Students</h1>
        <p style={{ color:'var(--text-secondary)' }}>{users.length} registered student{users.length!==1?'s':''}</p>
      </div>

      <div style={{ position:'relative', maxWidth:360, marginBottom:24 }}>
        <Search size={15} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          className="form-input" placeholder="Search by name or email…" style={{ paddingLeft:40 }}/>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--text-muted)' }}>
          <Users size={48} style={{ margin:'0 auto 16px', opacity:0.3 }}/>
          <p>{search ? 'No users match your search.' : 'No students registered yet.'}</p>
        </div>
      ) : (
        <div className="card" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border)' }}>
                {['Student','Email','Joined','Auth'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u._id} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--accent)22', border:'1px solid var(--accent)33', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'var(--accent)', overflow:'hidden', flexShrink:0 }}>
                        {u.avatar ? <img src={u.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : u.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize:14, fontWeight:600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)' }}>
                      <Mail size={13}/> {u.email}
                    </div>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
                      <Calendar size={13}/> {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span className={u.googleId ? 'badge badge-blue' : 'badge badge-purple'} style={{ fontSize:10 }}>
                      {u.googleId ? '🔵 Google' : '🔑 Email'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
