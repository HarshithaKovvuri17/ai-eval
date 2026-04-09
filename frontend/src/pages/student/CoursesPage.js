import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { BookOpen, Clock, BarChart2, Search, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFF_COLOR = { Beginner:'var(--accent-2)', Intermediate:'var(--accent-3)', Advanced:'var(--accent-4)' };

function CourseCard({ course, onClick }) {
  const [hov, setHov] = useState(false);
  const q1 = course.level1Count || 0;
  const q2 = course.level2Count || 0;

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1px solid ${hov ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)', padding:28, cursor:'pointer',
        transition:'all 0.25s', boxShadow: hov ? 'var(--shadow-glow)' : 'var(--shadow-card)',
        transform: hov ? 'translateY(-3px)' : 'none',
        display:'flex', flexDirection:'column', gap:16,
      }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ width:48, height:48, borderRadius:'var(--radius)', background:'#6c63ff22', border:'1px solid #6c63ff33', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <BookOpen size={22} color="var(--accent)"/>
        </div>
        <span className="badge" style={{ background: `${DIFF_COLOR[course.difficulty]}22`, color: DIFF_COLOR[course.difficulty], border:`1px solid ${DIFF_COLOR[course.difficulty]}44`, fontSize:11 }}>
          {course.difficulty}
        </span>
      </div>

      {/* Title & desc */}
      <div>
        <h3 style={{ fontSize:17, fontWeight:700, fontFamily:'var(--font-display)', marginBottom:6, color:'var(--text-primary)' }}>
          {course.title}
        </h3>
        <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {course.description}
        </p>
      </div>

      {/* Meta row */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)' }}>
          <Clock size={13}/> {course.duration}
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)' }}>
          <Layers size={13}/> {q1+q2} questions
        </span>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>
          {course.category}
        </span>
      </div>

      {/* Rounds pill */}
      <div style={{ display:'flex', gap:8 }}>
        <span className="badge badge-purple" style={{ fontSize:11 }}>Round 1 — {q1}Q · Pass 50%</span>
        <span className="badge badge-blue"   style={{ fontSize:11 }}>Round 2 — {q2}Q · Pass 70%</span>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await courseAPI.getAll();
        // Enrich with question counts
        const enriched = data.courses.map(c => ({
          ...c,
          level1Count: c.questions?.filter(q => q.level === 1).length || 0,
          level2Count: c.questions?.filter(q => q.level === 2).length || 0,
        }));
        setCourses(enriched);
      } catch {
        toast.error('Failed to load courses');
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div className="spinner"/>
    </div>
  );

  return (
    <div style={{ padding:'32px 28px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:32, fontWeight:800, fontFamily:'var(--font-display)', marginBottom:8 }}>
          Explore Courses
        </h1>
        <p style={{ color:'var(--text-secondary)' }}>
          Choose a course, pass both rounds, and earn your AI-verified certificate.
        </p>
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:400, marginBottom:32 }}>
        <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="form-input" placeholder="Search courses..."
          style={{ paddingLeft:42 }}/>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text-muted)' }}>
          <BarChart2 size={48} style={{ margin:'0 auto 16px', opacity:0.3 }}/>
          <p style={{ fontSize:16 }}>No courses found</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:24 }}>
          {filtered.map((c, i) => (
            <div key={c._id} style={{ animationDelay:`${i*60}ms` }} className="animate-fade-up">
              <CourseCard course={c} onClick={() => navigate(`/courses/${c._id}`)}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
