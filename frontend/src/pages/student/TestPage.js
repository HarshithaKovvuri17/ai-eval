import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, testAPI } from '../../services/api';
import { ChevronLeft, ChevronRight, Send, AlertCircle, Clock, CheckSquare, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Single/Multiple choice option button ──────────────────────────────────────
function OptionButton({ opt, selected, isMultiple, onClick }) {
  const isSelected = selected.includes(opt.id);

  return (
    <button type="button" onClick={() => onClick(opt.id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        background: isSelected ? '#6c63ff18' : 'var(--bg-surface)',
        transition: 'all 0.18s', textAlign: 'left',
        boxShadow: isSelected ? '0 0 0 3px #6c63ff18' : 'none',
        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
      }}>

      {/* Radio / Checkbox indicator */}
      <div style={{
        width: 24, height: 24, borderRadius: isMultiple ? 6 : '50%', flexShrink: 0,
        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        background: isSelected ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
      }}>
        {isSelected && (
          isMultiple
            ? <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>
            : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
        )}
      </div>

      {/* Option label badge */}
      <span style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: isSelected ? 'var(--accent)' : '#6c63ff22',
        border: `1px solid ${isSelected ? 'var(--accent)' : '#6c63ff33'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: isSelected ? '#fff' : 'var(--accent)',
        transition: 'all 0.18s',
      }}>{opt.id}</span>

      {/* Option text */}
      <span style={{
        flex: 1, fontSize: 14, lineHeight: 1.6,
        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: isSelected ? 500 : 400,
      }}>{opt.text}</span>
    </button>
  );
}

// ── Main test page ─────────────────────────────────────────────────────────────
export default function TestPage() {
  const { courseId, level } = useParams();
  const navigate = useNavigate();
  const lvl      = parseInt(level);

  const [questions,   setQuestions]   = useState([]);
  const [answers,     setAnswers]     = useState({});  // { qId: ['A'] or ['A','C'] }
  const [current,     setCurrent]     = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [elapsed,     setElapsed]     = useState(0);
  const [courseName,  setCourseName]  = useState('');

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Load questions
  useEffect(() => {
    (async () => {
      try {
        const [qRes, cRes] = await Promise.all([
          courseAPI.getQuestions(courseId, lvl),
          courseAPI.getOne(courseId),
        ]);
        setQuestions(qRes.data.questions);
        setCourseName(cRes.data.course?.title || '');
        // Init answers
        const init = {};
        qRes.data.questions.forEach(q => { init[q._id] = []; });
        setAnswers(init);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load questions');
        navigate(`/courses/${courseId}`);
      } finally { setLoading(false); }
    })();
  }, [courseId, lvl, navigate]);

  const toggleOption = (qId, optId, isMultiple) => {
    setAnswers(prev => {
      const cur = prev[qId] || [];
      if (isMultiple) {
        return { ...prev, [qId]: cur.includes(optId) ? cur.filter(o => o !== optId) : [...cur, optId] };
      } else {
        return { ...prev, [qId]: cur[0] === optId ? [] : [optId] };
      }
    });
  };

  const isAnswered  = qId => (answers[qId] || []).length > 0;
  const answered    = questions.filter(q => isAnswered(q._id)).length;
  const total       = questions.length;
  const progressPct = total ? (answered / total) * 100 : 0;

  const handleSubmit = useCallback(async () => {
    const unanswered = questions.filter(q => !isAnswered(q._id)).length;
    if (unanswered > 0) {
      const ok = window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const payload = {
        courseId,
        level: lvl,
        answers: questions.map(q => ({
          questionId:      q._id,
          selectedOptions: answers[q._id] || [],
        })),
      };
      const { data } = await testAPI.submit(payload);
      navigate('/result', { state: { result: data.result, courseId, courseName, level: lvl } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
 
  }, [courseId, lvl, questions, answers, courseName, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading questions…</p>
    </div>
  );

  if (!questions.length) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
      <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
      <p>No questions available for this round.</p>
      <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate(`/courses/${courseId}`)}>Go Back</button>
    </div>
  );

  const q          = questions[current];
  const isMultiple = q.questionType === 'multiple';
  const qAnswered  = isAnswered(q._id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky top bar ────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            {courseName} ·{' '}
            <span style={{ color: lvl === 1 ? 'var(--accent)' : 'var(--accent-5)', fontWeight: 600 }}>
              Round {lvl}
            </span>
            {' '}· Pass {lvl === 1 ? '50' : '70'}%
          </div>
          <div style={{ height: 5, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${lvl === 1 ? 'var(--accent)' : 'var(--accent-5)'}, ${lvl === 1 ? 'var(--accent-5)' : 'var(--accent-2)'})`,
              transition: 'width 0.4s ease', borderRadius: 3,
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>
          <Clock size={14} /><span style={{ fontFamily: 'monospace' }}>{fmt(elapsed)}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>
          {answered}/{total} answered
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex' }}>

        {/* Question panel */}
        <div style={{ flex: 1, padding: '32px 28px', maxWidth: 780, margin: '0 auto', width: '100%' }}>

          {/* Counter + type badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              QUESTION {current + 1} <span style={{ color: 'var(--border)' }}>/ {total}</span>
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className={`badge ${isMultiple ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: 11 }}>
                {isMultiple ? '☑ Multiple choice' : '◉ Single choice'}
              </span>
              <span className={`badge ${qAnswered ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 11 }}>
                {qAnswered ? '✓ Answered' : '○ Not answered'}
              </span>
            </div>
          </div>

          {/* Question card */}
          <div className="card" style={{
            padding: 28, marginBottom: 24,
            borderColor: lvl === 1 ? '#6c63ff33' : '#38bdf833',
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
          }}>
            <p style={{ fontSize: 17, lineHeight: 1.85, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {q.questionText}
            </p>
            {isMultiple && (
              <p style={{ fontSize: 12, color: 'var(--accent-3)', marginTop: 12, fontWeight: 600 }}>
                ☑ Select all that apply
              </p>
            )}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {(q.options || []).map(opt => (
              <OptionButton key={opt.id} opt={opt}
                selected={answers[q._id] || []}
                isMultiple={isMultiple}
                onClick={optId => toggleOption(q._id, optId, isMultiple)}
              />
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-outline" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
              <ChevronLeft size={16} /> Previous
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              {current < total - 1 ? (
                <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn btn-success btn-lg" onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Submitting…</>
                    : <><Send size={16} /> Submit Test</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Question navigator sidebar ─────────────────────────────────── */}
        <div style={{
          width: 200, borderLeft: '1px solid var(--border)',
          background: 'var(--bg-card)', padding: 20,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Questions
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {questions.map((qItem, i) => {
              const done   = isAnswered(qItem._id);
              const active = i === current;
              return (
                <button key={qItem._id} onClick={() => setCurrent(i)} style={{
                  width: 36, height: 36, border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  background: active ? 'var(--accent)' : done ? '#4ade8033' : 'var(--bg-surface)',
                  color:      active ? '#fff'          : done ? 'var(--accent-2)' : 'var(--text-muted)',
                  outline:    active ? '2px solid var(--accent)' : 'none',
                  outlineOffset: 2,
                }}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            {[
              ['var(--accent)',  'Current'],
              ['#4ade8033',      'Answered'],
              ['var(--bg-surface)', 'Skipped'],
            ].map(([bg, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: '1px solid var(--border)' }} />
                {label}
              </div>
            ))}
          </div>

          {/* Submit shortcut */}
          <button className="btn btn-success btn-sm" onClick={handleSubmit} disabled={submitting} style={{ width: '100%' }}>
            {submitting ? '…' : <><Send size={13} /> Submit</>}
          </button>
        </div>
      </div>
    </div>
  );
}
