import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, BookOpen, Users, LogOut, Menu, Hexagon, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin',         icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/courses', icon: BookOpen,        label: 'Courses'                },
  { to: '/admin/users',   icon: Users,           label: 'Students'               },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const Sidebar = () => (
    <aside style={{ width:240, background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'28px 24px 20px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Hexagon size={28} color="var(--accent)" fill="#6c63ff33" />
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800 }}>Neural<span style={{ color:'var(--accent)' }}>Cert</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--accent-3)', fontWeight:600 }}>
              <ShieldCheck size={11} /> ADMIN PORTAL
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--accent-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#000' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{user?.name}</div>
          <div style={{ fontSize:12, color:'var(--accent-3)' }}>Administrator</div>
        </div>
      </div>

      <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:4 }}>
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} onClick={() => setOpen(false)} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
            borderRadius:'var(--radius)', textDecoration:'none', fontSize:14, fontWeight:500,
            background: isActive ? '#f59e0b22' : 'transparent',
            color: isActive ? 'var(--accent-3)' : 'var(--text-secondary)',
            border: isActive ? '1px solid #f59e0b33' : '1px solid transparent',
            transition:'all 0.2s',
          })}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding:'16px 12px', borderTop:'1px solid var(--border)' }}>
        <button onClick={handleLogout} className="btn btn-outline" style={{ width:'100%', justifyContent:'flex-start', gap:10, color:'var(--accent-4)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <div style={{ height:'100vh', position:'sticky', top:0 }}>
        <Sidebar />
      </div>
      <main style={{ flex:1, overflowY:'auto', position:'relative', zIndex:1 }}>
        <Outlet />
      </main>
    </div>
  );
}
