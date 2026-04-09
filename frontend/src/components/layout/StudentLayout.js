import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, LayoutDashboard, Award, LogOut, Menu, X, Hexagon } from 'lucide-react';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/courses',      icon: BookOpen,       label: 'Courses'      },
  { to: '/dashboard',    icon: LayoutDashboard, label: 'My Progress'  },
  { to: '/certificates', icon: Award,           label: 'Certificates' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const Sidebar = ({ mobile }) => (
    <aside style={{
      width: mobile ? '100%' : 240, background: 'var(--bg-card)',
      borderRight: mobile ? 'none' : '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Brand */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Hexagon size={28} color="var(--accent)" fill="#6c63ff33" />
          <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--text-primary)' }}>
            Neural<span style={{ color:'var(--accent)' }}>Cert</span>
          </span>
        </div>
      </div>

      {/* User */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, overflow:'hidden' }}>
          {user?.avatar ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : user?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Student</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:4 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
            borderRadius:'var(--radius)', textDecoration:'none', fontSize:14, fontWeight:500,
            background: isActive ? 'var(--accent)' : 'transparent',
            color: isActive ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.2s',
          })}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding:'16px 12px', borderTop:'1px solid var(--border)' }}>
        <button onClick={handleLogout} className="btn btn-outline" style={{ width:'100%', justifyContent:'flex-start', gap:10, color:'var(--accent-4)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Desktop sidebar */}
      <div style={{ display:'none', height:'100vh', position:'sticky', top:0 }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex' }}>
          <div style={{ position:'absolute', inset:0, background:'#00000088' }} onClick={() => setOpen(false)} />
          <div style={{ position:'relative', zIndex:1, width:260, height:'100%' }}>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Mobile header */}
        <header style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-card)' }}>
          <button onClick={() => setOpen(true)} style={{ background:'none', border:'none', color:'var(--text-primary)', cursor:'pointer', padding:4 }}>
            <Menu size={22} />
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Hexagon size={22} color="var(--accent)" fill="#6c63ff33" />
            <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:800 }}>
              Neural<span style={{ color:'var(--accent)' }}>Cert</span>
            </span>
          </div>
        </header>

        <main style={{ flex:1, overflowY:'auto', position:'relative', zIndex:1 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  );
}
