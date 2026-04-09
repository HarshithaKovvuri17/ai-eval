import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Plus, Edit2, Trash2, BookOpen, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await adminAPI.courses();
      setCourses(data.courses);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async id => {
    if (!window.confirm('Deactivate this course?')) return;
    try {
      await adminAPI.deleteCourse(id);
      toast.success('Course deactivated');
      load();
    } catch { toast.error('Failed to deactivate'); }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><div className="spinner"/></div>;

  return (
    <div style={{ padding:'32px 28px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', marginBottom:6 }}>Courses</h1>
          <p style={{ color:'var(--text-secondary)' }}>{courses.length} course{courses.length!==1?'s':''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/courses/new')}>
          <Plus size={16}/> New Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--text-muted)' }}>
          <BookOpen size={48} style={{ margin:'0 auto 16px', opacity:0.3 }}/>
          <p style={{ fontSize:15, marginBottom:20 }}>No courses yet. Create your first one!</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/courses/new')}>
            <Plus size={16}/> Create Course
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {courses.map(c => {
            const q1 = c.questions?.filter(q=>q.level===1).length || 0;
            const q2 = c.questions?.filter(q=>q.level===2).length || 0;
            return (
              <div key={c._id} className="card" style={{ padding:20, display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
                <div style={{ width:44, height:44, borderRadius:'var(--radius)', background:'#6c63ff22', border:'1px solid #6c63ff33', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <BookOpen size={20} color="var(--accent)"/>
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                    <h3 style={{ fontSize:15, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</h3>
                    {!c.isActive && <span className="badge badge-red" style={{ fontSize:10 }}>Inactive</span>}
                  </div>
                  <p style={{ fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:400 }}>{c.description}</p>
                  <div style={{ display:'flex', gap:16, marginTop:6, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{c.category}</span>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{c.difficulty}</span>
                    <span className="badge badge-purple" style={{ fontSize:10 }}>R1: {q1}Q</span>
                    <span className="badge badge-blue"   style={{ fontSize:10 }}>R2: {q2}Q</span>
                  </div>
                </div>

                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/courses/${c._id}/edit`)}>
                    <Edit2 size={13}/> Edit
                  </button>
                  <button className="btn btn-sm" onClick={() => handleDelete(c._id)}
                    style={{ background:'#f43f5e22', border:'1px solid #f43f5e44', color:'var(--accent-4)' }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
