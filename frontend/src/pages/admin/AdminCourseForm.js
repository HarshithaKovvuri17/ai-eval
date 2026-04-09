import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  Plus, Trash2, Save, ChevronDown, ChevronUp,
  BookOpen, HelpCircle, CheckSquare, Circle, X, Sparkles, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const OPTION_IDS = ['A', 'B', 'C', 'D', 'E'];

const emptyQuestion = () => ({
  _new: true,
  questionText:   '',
  questionType:   'single',        // 'single' | 'multiple'
  options:        [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ],
  correctOptions: [],
  level:          '1',
  marks:          10,
  explanation:    '',
});

// ── Single question card ───────────────────────────────────────────────────────
function QuestionCard({ q, index, onChange, onDelete, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const lvlColor = String(q.level) === '1' ? 'var(--accent)' : 'var(--accent-5)';

  const setField = (field, val) => onChange({ ...q, [field]: val });

  const updateOption = (id, text) =>
    setField('options', q.options.map(o => o.id === id ? { ...o, text } : o));

  const addOption = () => {
    const used = q.options.map(o => o.id);
    const next = OPTION_IDS.find(id => !used.includes(id));
    if (!next) return toast.error('Maximum 5 options allowed');
    setField('options', [...q.options, { id: next, text: '' }]);
  };

  const removeOption = (id) => {
    if (q.options.length <= 2) return toast.error('Minimum 2 options required');
    setField('options', q.options.filter(o => o.id !== id));
    // Also remove from correctOptions if it was selected
    setField('correctOptions', (q.correctOptions || []).filter(c => c !== id));
  };

  const toggleCorrect = (id) => {
    const cur = q.correctOptions || [];
    if (q.questionType === 'single') {
      setField('correctOptions', [id]);
    } else {
      setField('correctOptions', cur.includes(id) ? cur.filter(c => c !== id) : [...cur, id]);
    }
  };

  const switchType = (type) => {
    setField('questionType', type);
    // Reset to max 1 correct if switching to single
    if (type === 'single') {
      setField('correctOptions', q.correctOptions?.slice(0, 1) || []);
    }
  };

  const isValid = q.questionText?.trim()
    && q.options?.every(o => o.text.trim())
    && q.correctOptions?.length > 0;

  return (
    <div style={{
      border: `1px solid ${isValid ? lvlColor + '44' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        background: 'var(--bg-card)', cursor: 'pointer',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: `${lvlColor}22`, border: `1px solid ${lvlColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: lvlColor,
        }}>{index + 1}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {q.questionText || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>New question…</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: lvlColor, fontWeight: 600 }}>Round {q.level}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: 11, color: q.questionType === 'multiple' ? 'var(--accent-3)' : 'var(--text-muted)' }}>
              {q.questionType === 'multiple' ? '☑ Multiple choice' : '◉ Single choice'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {q.marks} marks</span>
            {!isValid && <span style={{ fontSize: 11, color: 'var(--accent-4)' }}>⚠ Incomplete</span>}
          </div>
        </div>

        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'none', border: 'none', color: 'var(--accent-4)', cursor: 'pointer', padding: 4 }}>
          <Trash2 size={14} />
        </button>
        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {open && (
        <div style={{ padding: 20, background: 'var(--bg-surface)', borderTop: `1px solid ${lvlColor}22`, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Row: round + type + marks */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '0 0 130px' }}>
              <label className="form-label">Round</label>
              <select value={q.level} onChange={e => setField('level', e.target.value)} className="form-input">
                <option value="1">Round 1 (≥50%)</option>
                <option value="2">Round 2 (≥70%)</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: '0 0 90px' }}>
              <label className="form-label">Marks</label>
              <input type="number" min={1} max={100} value={q.marks}
                onChange={e => setField('marks', parseInt(e.target.value) || 10)}
                className="form-input" />
            </div>

            {/* Question type toggle */}
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Question Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { type: 'single',   label: '◉ Single answer',   desc: 'One correct option' },
                  { type: 'multiple', label: '☑ Multiple answers', desc: 'One or more correct' },
                ].map(({ type, label, desc }) => (
                  <button key={type} type="button" onClick={() => switchType(type)} style={{
                    flex: 1, padding: '8px 12px', borderRadius: 'var(--radius)', cursor: 'pointer',
                    border: `1px solid ${q.questionType === type ? (type === 'multiple' ? 'var(--accent-3)' : 'var(--accent)') : 'var(--border)'}`,
                    background: q.questionType === type ? (type === 'multiple' ? '#f59e0b18' : '#6c63ff18') : 'var(--bg-card)',
                    textAlign: 'left', transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: q.questionType === type ? (type === 'multiple' ? 'var(--accent-3)' : 'var(--accent)') : 'var(--text-secondary)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question text */}
          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea value={q.questionText} onChange={e => setField('questionText', e.target.value)}
              className="form-textarea" placeholder="Type your question here…" rows={2} />
          </div>

          {/* Options */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Answer Options * &nbsp;
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
                  {q.questionType === 'single' ? 'Click the circle to mark correct answer' : 'Click checkboxes to mark all correct answers'}
                </span>
              </label>
              {q.options.length < 5 && (
                <button type="button" onClick={addOption} className="btn btn-outline btn-sm">
                  <Plus size={13} /> Add Option
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map(opt => {
                const isCorrect = (q.correctOptions || []).includes(opt.id);
                const color = isCorrect ? 'var(--accent-2)' : 'var(--border)';

                return (
                  <div key={opt.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: isCorrect ? '#4ade8010' : 'var(--bg-card)',
                    border: `1px solid ${isCorrect ? '#4ade8044' : 'var(--border)'}`,
                    transition: 'all 0.2s',
                  }}>
                    {/* Correct toggle */}
                    <button type="button" onClick={() => toggleCorrect(opt.id)} style={{
                      width: 28, height: 28, borderRadius: q.questionType === 'single' ? '50%' : 6,
                      border: `2px solid ${isCorrect ? 'var(--accent-2)' : 'var(--border)'}`,
                      background: isCorrect ? 'var(--accent-2)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', padding: 0,
                    }}>
                      {isCorrect && (
                        q.questionType === 'single'
                          ? <Circle size={10} fill="white" color="white" />
                          : <span style={{ color: '#052e16', fontWeight: 900, fontSize: 13 }}>✓</span>
                      )}
                    </button>

                    {/* Option ID badge */}
                    <span style={{
                      width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                      background: isCorrect ? '#4ade8022' : '#6c63ff22',
                      border: `1px solid ${isCorrect ? '#4ade8044' : '#6c63ff44'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: isCorrect ? 'var(--accent-2)' : 'var(--accent)',
                    }}>{opt.id}</span>

                    {/* Option text */}
                    <input value={opt.text} onChange={e => updateOption(opt.id, e.target.value)}
                      placeholder={`Option ${opt.id}…`}
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)',
                      }} />

                    {/* Remove option */}
                    {q.options.length > 2 && (
                      <button type="button" onClick={() => removeOption(opt.id)} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: 2,
                      }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {(q.correctOptions || []).length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--accent-3)', marginTop: 8 }}>
                ⚠ Please mark at least one correct answer.
              </p>
            )}
          </div>

          {/* Explanation (optional) */}
          <div className="form-group">
            <label className="form-label">
              Explanation <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: 12 }}>(shown to student after submission — optional)</span>
            </label>
            <textarea value={q.explanation || ''} onChange={e => setField('explanation', e.target.value)}
              className="form-textarea" placeholder="Explain why the correct answer is correct…" rows={2} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function AdminCourseForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm] = useState({
    title: '', description: '', category: 'General', difficulty: 'Intermediate', duration: '60 mins',
  });
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(isEdit);
  const [saving,    setSaving]    = useState(false);
  const [aiModal,   setAiModal]   = useState(false);
  const [aiConfig,  setAiConfig]  = useState({ round1Count: 5, round2Count: 5 });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotConfigured, setAiNotConfigured] = useState(false);

  const handleOpenAiModal = async () => {
    try {
      const res = await adminAPI.aiStatus();
      if (!res.data.configured) { setAiNotConfigured(true); return; }
    } catch (e) { /* if check fails, open modal anyway */ }
    setAiModal(true);
  };

  useEffect(() => {
    if (!isEdit) return;
    adminAPI.course(id)
      .then(r => {
        const c = r.data.course;
        setForm({ title: c.title, description: c.description, category: c.category, difficulty: c.difficulty, duration: c.duration });
        setQuestions(c.questions.map(q => ({ ...q, level: String(q.level) })));
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const addQuestion = () => setQuestions(p => [...p, emptyQuestion()]);
  const updateQ     = (i, val) => setQuestions(p => p.map((q, idx) => idx === i ? val : q));
  const deleteQ     = i => setQuestions(p => p.filter((_, idx) => idx !== i));

  const handleAIGenerate = async () => {
    if (!form.title.trim() || !form.description.trim())
      return toast.error('Please fill in title and description first.');
    setAiLoading(true);
    try {
      const res = await adminAPI.generateQuestions({
        title:       form.title,
        description: form.description,
        category:    form.category,
        difficulty:  form.difficulty,
        round1Count: aiConfig.round1Count,
        round2Count: aiConfig.round2Count,
      });
      const generated = res.data.questions.map(q => ({ ...q, _new: false, level: String(q.level) }));
      setQuestions(p => [...p, ...generated]);
      setAiModal(false);
      toast.success(`✨ ${generated.length} questions generated!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim())
      return toast.error('Title and description are required');

    const incomplete = questions.filter(q =>
      !q.questionText?.trim() || !q.options?.every(o => o.text.trim()) || !q.correctOptions?.length
    );
    if (incomplete.length) {
      const ok = window.confirm(`${incomplete.length} incomplete question(s) will be skipped. Continue?`);
      if (!ok) return;
    }

    const valid = questions.filter(q =>
      q.questionText?.trim() && q.options?.every(o => o.text.trim()) && q.correctOptions?.length
    );

    setSaving(true);
    try {
      const payload = {
        ...form,
        questions: valid.map((q, i) => ({
          questionText:   q.questionText.trim(),
          questionType:   q.questionType || 'single',
          options:        q.options.map(o => ({ id: o.id, text: o.text.trim() })),
          correctOptions: q.correctOptions,
          level:          parseInt(q.level),
          marks:          q.marks || 10,
          explanation:    q.explanation || '',
          order:          i,
        })),
      };

      if (isEdit) { await adminAPI.updateCourse(id, payload); toast.success('Course updated!'); }
      else        { await adminAPI.createCourse(payload);     toast.success('Course created!'); }
      navigate('/admin/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" /></div>;

  const q1 = questions.filter(q => String(q.level) === '1').length;
  const q2 = questions.filter(q => String(q.level) === '2').length;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 920, margin: '0 auto' }}>
      <button onClick={() => navigate('/admin/courses')} className="btn btn-outline btn-sm" style={{ marginBottom: 24 }}>← Back</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
            {isEdit ? 'Edit Course' : 'Create Course'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Round 1: {q1} question{q1 !== 1 ? 's' : ''} &nbsp;·&nbsp; Round 2: {q2} question{q2 !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving…</> : <><Save size={16} /> {isEdit ? 'Update' : 'Create'} Course</>}
        </button>
      </div>

      {/* Course details */}
      <div className="card" style={{ padding: 28, marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} color="var(--accent)" /> Course Details
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="form-input" placeholder="e.g. Introduction to React.js" />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="form-textarea" rows={3} placeholder="What does this course cover?" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="form-input" placeholder="e.g. JavaScript" />
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className="form-input">
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                className="form-input" placeholder="e.g. 45 mins" />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={18} color="var(--accent-5)" /> Questions
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={handleOpenAiModal}
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              <Sparkles size={14} /> Generate with AI
            </button>
            <button className="btn btn-outline btn-sm" onClick={addQuestion}><Plus size={14} /> Add Question</button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
            <HelpCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14, marginBottom: 16 }}>No questions yet. Add single or multiple-choice questions.</p>
            <button className="btn btn-primary btn-sm" onClick={addQuestion}><Plus size={14} /> Add First Question</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {questions.map((q, i) => (
              <QuestionCard key={i} q={q} index={i} defaultOpen={q._new}
                onChange={val => updateQ(i, val)} onDelete={() => deleteQ(i)} />
            ))}
            <button className="btn btn-outline" onClick={addQuestion} style={{ marginTop: 8 }}>
              <Plus size={15} /> Add Another Question
            </button>
          </div>
        )}
      </div>


      {/* ── AI Not Configured Modal ─────────────────────────────────────────────── */}
      {aiNotConfigured && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setAiNotConfigured(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            padding: 32, width: '100%', maxWidth: 500,
            border: '1px solid var(--accent-3)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: '#f59e0b22', border: '1px solid #f59e0b44',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>⚙️</div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>AI Setup Required</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>One-time setup · Free · No credit card needed</p>
              </div>
              <button onClick={() => setAiNotConfigured(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            {[
              { step: '1', content: <span>Go to <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 700 }}>aistudio.google.com</a> and sign up free</span> },
              { step: '2', content: <span>Click <b>Get API key</b> → <b>Create API Key</b> → copy it</span> },
              { step: '3', content: <span>Open <code style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4 }}>backend/.env</code> and set:<div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, color: 'var(--accent-2)', border: '1px solid var(--border)', userSelect: 'all' }}>GOOGLE_API_KEY=AIzaSy_paste_your_key_here</div></span> },
              { step: '4', content: <span>The backend will automatically restart and use Gemini. You're all set!</span> },
            ].map(({ step, content }) => (
              <div key={step} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, marginTop: 2 }}>{step}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', paddingTop: 4, flex: 1 }}>{content}</div>
              </div>
            ))}

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => { setAiNotConfigured(false); setAiModal(true); }}>
              ✅ I've added the key — Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── AI Generate Modal ─────────────────────────────────────────────────── */}
      {aiModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => !aiLoading && setAiModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            padding: 32, width: '100%', maxWidth: 480,
            border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg,#6c63ff22,#a78bfa22)',
                border: '1px solid #6c63ff44',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={20} color="var(--accent)" />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Generate Questions with AI
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Gemini will create MCQs based on your course details
                </p>
              </div>
              <button onClick={() => setAiModal(false)} style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', padding: 4,
              }}><X size={18} /></button>
            </div>

            {/* Course preview */}
            <div style={{
              background: 'var(--bg-surface)', borderRadius: 'var(--radius)',
              padding: '14px 16px', marginBottom: 24, border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Generating for</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{form.title || 'Untitled Course'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{form.category} · {form.difficulty}</p>
            </div>

            {/* Count controls */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
              {[
                { key: 'round1Count', label: 'Round 1 Questions', color: 'var(--accent)', hint: 'Foundational / easy' },
                { key: 'round2Count', label: 'Round 2 Questions', color: 'var(--accent-5)', hint: 'Analytical / harder' },
              ].map(({ key, label, color, hint }) => (
                <div key={key} style={{ flex: 1 }}>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 700,
                    color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{label}</label>
                  <input
                    type="number" min={1} max={20}
                    value={aiConfig[key]}
                    onChange={e => setAiConfig(p => ({ ...p, [key]: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) }))}
                    className="form-input"
                    style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>{hint}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
              {aiConfig.round1Count + aiConfig.round2Count} questions total · Will be appended to existing questions
            </p>

            {/* Generate button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: 8, fontSize: 15, padding: '12px 0',
                background: 'linear-gradient(135deg,var(--accent),#a78bfa)',
                border: 'none',
              }}
              onClick={handleAIGenerate}
              disabled={aiLoading}
            >
              {aiLoading
                ? <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : <><Sparkles size={17} /> Generate {aiConfig.round1Count + aiConfig.round2Count} Questions</>
              }
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving…</> : <><Save size={16} /> {isEdit ? 'Update' : 'Create'} Course</>}
        </button>
      </div>
    </div>
  );
}
