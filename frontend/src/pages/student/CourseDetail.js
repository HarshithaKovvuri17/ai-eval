import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, testAPI } from '../../services/api';
import { BookOpen, CheckCircle, Lock, Play, RotateCcw, Award, AlertTriangle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX = 3;

function RoundCard({ round, label, passThreshold, data, onStart, onRetake, locked, prerequisiteMissing }) {
  const attempts = data?.attempts || 0;
  const passed   = data?.passed   || false;
  const best     = data?.bestScore || 0;
  const left     = MAX - attempts;

  return (
    <div style={{
      border: `1px solid ${passed ? '#4ade8044' : locked ? '#f43f5e33' : 'var(--border)'}`,
      borderRadius:'var(--radius-lg)', padding:24, background:'var(--bg-card)',
      display:'flex', flexDirection:'column', gap:16,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            background: passed ? '#4ade8022' : locked ? '#f43f5e22' : '#6c63ff22',
            border:`1px solid ${passed ? '#4ade8044' : locked ? '#f43f5e44' : '#6c63ff44'}`,
          }}>
            {passed ? <CheckCircle size={18} color="var(--accent-2)"/>
              : locked ? <Lock size={18} color="var(--accent-4)"/>
              : <span style={{ fontWeight:700, color:'var(--accent)', fontSize:14 }}>{round}</span>}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>{label}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>Pass threshold: {passThreshold}%</div>
          </div>
        </div>

        {passed && <span className="badge badge-green">✓ Passed</span>}
        {locked && <span className="badge badge-red">Locked</span>}
        {!passed && !locked && attempts > 0 && <span className="badge badge-amber">{left} retake{left!==1?'s':''} left</span>}
      </div>

      {attempts > 0 && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>
            <span>Best Score</span><span style={{ color:'var(--text-primary)', fontWeight:600 }}>{best}%</span>
          </div>
          <div style={{ height:6, background:'var(--bg-surface)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${best}%`, background: best>=passThreshold ? 'var(--accent-2)' : 'var(--accent)', borderRadius:3, transition:'width 0.6s ease' }}/>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            {Array.from({length:MAX}).map((_,i) => (
              <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i<attempts ? (passed?'var(--accent-2)':'var(--accent-4)') : 'var(--border)' }}/>
            ))}
            <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:4 }}>{attempts}/{MAX} attempt{attempts!==1?'s':''}</span>
          </div>
        </div>
      )}

      <div>
        {prerequisiteMissing ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-muted)', padding:'10px 14px', background:'var(--bg-surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
            <Lock size={14}/> Complete Round 1 first
          </div>
        ) : locked ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--accent-4)' }}>
            <AlertTriangle size={14}/> All retakes used — restart the course to try again.
          </div>
        ) : passed ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--accent-2)' }}>
            <CheckCircle size={14}/> Round completed successfully!
          </div>
        ) : attempts === 0 ? (
          <button className="btn btn-primary" onClick={onStart} style={{ width:'100%' }}>
            <Play size={15}/> Start Round {round}
          </button>
        ) : (
          <button className="btn btn-outline" onClick={onRetake} style={{ width:'100%' }}>
            <RotateCcw size={15}/> Retake Round {round} ({left} left)
          </button>
        )}
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [course,   setCourse]   = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await courseAPI.getOne(id);
        setCourse(data.course);
        setProgress(data.progress);
      } catch (err) {
        toast.error('Failed to load course');
        navigate('/courses');
      } finally { setLoading(false); }
    })();
  }, [id, navigate]);

  const startTest  = lvl => navigate(`/test/${id}/level/${lvl}`);
  const retakeTest = lvl => navigate(`/test/${id}/level/${lvl}`);

  const handleRestart = async () => {
    if (!window.confirm('Restart the course? All progress will be reset.')) return;
    try {
      await testAPI.restart(id);
      const { data } = await courseAPI.getOne(id);
      setProgress(data.progress);
      toast.success('Course restarted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restart failed');
    }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><div className="spinner"/></div>;
  if (!course) return null;

  const l1 = progress?.level1;
  const l2 = progress?.level2;
  const bothLocked = l1?.locked && !l2?.passed;
  const certified  = progress?.certificateIssued;

  return (
    <div style={{ padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>
      {/* Back */}
      <button onClick={() => navigate('/courses')} className="btn btn-outline btn-sm" style={{ marginBottom:24 }}>
        ← Back to Courses
      </button>

      {/* Hero */}
      <div className="card" style={{ padding:32, marginBottom:28, background:'linear-gradient(135deg, var(--bg-card) 0%, #0d1228 100%)', borderColor:'var(--accent)44' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap' }}>
          <div style={{ width:60, height:60, borderRadius:'var(--radius-lg)', background:'#6c63ff22', border:'1px solid #6c63ff44', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <BookOpen size={28} color="var(--accent)"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
              <span className="badge badge-purple">{course.category}</span>
              <span className="badge badge-amber">{course.difficulty}</span>
              <span className="badge" style={{ background:'#38bdf822', color:'#7dd3fc', border:'1px solid #38bdf844' }}>{course.duration}</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, fontFamily:'var(--font-display)', marginBottom:8 }}>{course.title}</h1>
            <p style={{ color:'var(--text-secondary)', lineHeight:1.7 }}>{course.description}</p>
          </div>
        </div>
      </div>

      {/* Certificate banner */}
      {certified && (
        <div style={{ padding:20, borderRadius:'var(--radius-lg)', background:'#4ade8010', border:'1px solid #4ade8044', marginBottom:28, display:'flex', alignItems:'center', gap:16 }}>
          <Award size={32} color="var(--accent-2)"/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:'var(--accent-2)', marginBottom:4 }}>🎉 Certificate Earned!</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>You have successfully completed this course.</div>
          </div>
          <button className="btn btn-success btn-sm" onClick={() => navigate('/certificates')}>
            <Award size={14}/> View Certificate
          </button>
        </div>
      )}

      {/* Rounds */}
      <h2 style={{ fontSize:18, fontWeight:700, marginBottom:16, fontFamily:'var(--font-display)' }}>Evaluation Rounds</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginBottom:28 }}>
        <RoundCard
          round={1} label="Round 1" passThreshold={50}
          data={l1} locked={l1?.locked}
          prerequisiteMissing={false}
          onStart={() => startTest(1)} onRetake={() => retakeTest(1)}
        />
        <RoundCard
          round={2} label="Round 2" passThreshold={70}
          data={l2} locked={l2?.locked}
          prerequisiteMissing={!l1?.passed}
          onStart={() => startTest(2)} onRetake={() => retakeTest(2)}
        />
      </div>

      {/* How it works */}
      <div className="card" style={{ padding:24 }}>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>How It Works</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            ['1', 'Answer all questions in Round 1. Score ≥ 50% to advance.', 'var(--accent)'],
            ['2', 'Score ≥ 70% in Round 2 to earn your AI-verified certificate.', 'var(--accent-5)'],
            ['↺', 'You have 3 retake attempts per round. Use them wisely!', 'var(--accent-3)'],
            ['✗', 'Fail all retakes? Restart the entire course and try again.', 'var(--accent-4)'],
          ].map(([icon, text, color]) => (
            <div key={icon} style={{ display:'flex', alignItems:'flex-start', gap:12, fontSize:13, color:'var(--text-secondary)' }}>
              <span style={{ width:24, height:24, borderRadius:'50%', background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color, flexShrink:0 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {bothLocked && !certified && (
          <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--border)' }}>
            <p style={{ fontSize:13, color:'var(--accent-4)', marginBottom:12 }}>
              <AlertTriangle size={14} style={{ display:'inline', marginRight:6 }}/>
              You've used all retakes for Round 1. Restart the course to try again.
            </p>
            <button className="btn btn-danger btn-sm" onClick={handleRestart}>
              <RotateCcw size={14}/> Restart Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
