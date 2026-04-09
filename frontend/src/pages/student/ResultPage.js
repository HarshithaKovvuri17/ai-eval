import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Award, RotateCcw, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import axios from "axios";
// ── Per-question breakdown card ───────────────────────────────────────────────
function QuestionResult({ ans, index }) {
  const [open, setOpen] = React.useState(false);
  const color = ans.isCorrect ? 'var(--accent-2)' : ans.isPartial ? 'var(--accent-3)' : 'var(--accent-4)';
  const label = ans.isCorrect ? 'Correct' : ans.isPartial ? 'Partial' : 'Wrong';
  const pct   = ans.score;

  return (
    <div style={{ border: `1px solid ${color}33`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 10 }}>
      {/* Header */}
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        background: 'var(--bg-card)', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        {/* Status icon */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: `${color}22`, border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {ans.isCorrect
            ? <CheckCircle size={16} color="var(--accent-2)" />
            : ans.isPartial
              ? <span style={{ fontSize: 14, color: 'var(--accent-3)', fontWeight: 800 }}>½</span>
              : <XCircle size={16} color="var(--accent-4)" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Q{index + 1}. {ans.questionText}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
            <div style={{ height: 4, width: 90, background: 'var(--bg-surface)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 12, color, fontWeight: 700 }}>{pct}%</span>
            <span className="badge" style={{
              fontSize: 10, padding: '2px 8px',
              background: `${color}22`, color, border: `1px solid ${color}44`,
            }}>{label}</span>
          </div>
        </div>

        {open ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '16px 18px', background: 'var(--bg-surface)', borderTop: `1px solid ${color}22`, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Your selection */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Your Answer</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ans.selectedOptions?.length > 0 ? ans.selectedOptions.map(id => {
                const isRight = ans.correctOptions?.includes(id);
                return (
                  <span key={id} style={{
                    padding: '5px 14px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                    background: isRight ? '#4ade8022' : '#f43f5e22',
                    border: `1px solid ${isRight ? '#4ade8044' : '#f43f5e44'}`,
                    color: isRight ? 'var(--accent-2)' : 'var(--accent-4)',
                  }}>
                    {isRight ? '✓' : '✗'} {id}
                  </span>
                );
              }) : <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No answer selected</span>}
            </div>
          </div>

          {/* Correct answer */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Correct Answer</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ans.correctOptions?.map(id => (
                <span key={id} style={{
                  padding: '5px 14px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                  background: '#4ade8022', border: '1px solid #4ade8044', color: 'var(--accent-2)',
                }}>✓ {id}</span>
              ))}
            </div>
          </div>

          {/* Explanation */}
          {ans.explanation && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius)',
              background: '#6c63ff0d', border: '1px solid #6c63ff33',
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
            }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>💡 Explanation: </span>{ans.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main result page ──────────────────────────────────────────────────────────
export default function ResultPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  if (!state?.result) { navigate('/courses'); return null; }

  const { result, courseId, courseName, level } = state;
  const { percentage, passed, attemptsLeft, locked, nextAction, answers, certificate, threshold } = result;

  const correct  = answers?.filter(a => a.isCorrect).length  || 0;
  const partial  = answers?.filter(a => a.isPartial).length  || 0;
  const wrong    = answers?.filter(a => !a.isCorrect && !a.isPartial).length || 0;
  const total    = answers?.length || 0;

  const color = passed ? 'var(--accent-2)' : percentage >= threshold * 0.7 ? 'var(--accent-3)' : 'var(--accent-4)';
  const handleRestartCourse = async () => {
  try {
    const token = localStorage.getItem("token");

    await axios.post(
      `/api/courses/${courseId}/restart`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    navigate(`/test/${courseId}/level/1`);
  } catch (err) {
    console.error("Restart failed:", err);
  }
};
  return (
    <div style={{ padding: '32px 28px', maxWidth: 860, margin: '0 auto' }}>

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div className="card animate-fade-up" style={{
        padding: 36, marginBottom: 28, textAlign: 'center',
        background: passed
          ? 'linear-gradient(135deg, #052e16 0%, var(--bg-card) 60%)'
          : 'linear-gradient(135deg, #1c0a0a 0%, var(--bg-card) 60%)',
        border: `1px solid ${color}44`,
      }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>
          {passed ? '🎉' : percentage >= threshold * 0.8 ? '💪' : '📚'}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color, marginBottom: 8 }}>
          {passed ? 'Round Passed!' : 'Keep Practising'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
          {courseName} · Round {level} · Pass mark: {threshold}%
        </p>

        {/* Score ring */}
        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 28px' }}>
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r="56" fill="none" stroke="var(--border)" strokeWidth="10" />
            <circle cx="70" cy="70" r="56" fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 30, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{percentage}%</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap', marginBottom: 28 }}>
          {[
            [correct,  'Correct',  'var(--accent-2)'],
            [partial,  'Partial',  'var(--accent-3)'],
            [wrong,    'Wrong',    'var(--accent-4)'],
            [total,    'Total',    'var(--accent-5)'],
            [attemptsLeft, 'Retakes left', 'var(--accent)'],
          ].map(([val, label, c]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: c, fontFamily: 'var(--font-display)' }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {nextAction === 'proceed_level2' && (
            <button className="btn btn-success btn-lg" onClick={() => navigate(`/test/${courseId}/level/2`)}>
              <ArrowRight size={18} /> Start Round 2
            </button>
          )}
          {nextAction === 'certificate_issued' && certificate && (
            <button
              className="btn btn-success btn-lg"
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const certUrl = `/api/certificate/download/${certificate.id || certificate.certificateId}`;
                  const response = await fetch(certUrl, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (!response.ok) throw new Error('Download failed');
                  const blob = await response.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  // Open PDF in new tab
                  window.open(blobUrl, '_blank');
                  // Also auto-download
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = `NeuralCert-${certificate.certificateId || 'certificate'}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                } catch (err) {
                  console.error('Certificate download error:', err);
                  alert('Failed to download certificate. Please try from My Certificates page.');
                }
              }}
            >
              <Award size={18} /> View & Download Certificate
            </button>
          )}
          {nextAction === 'retry' && (
            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/test/${courseId}/level/${level}`)}>
              <RotateCcw size={18} /> Retake ({attemptsLeft} left)
            </button>
          )}
          {nextAction === 'all_attempts_used' && (
            <div style={{ fontSize: 14, color: 'var(--accent-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} /> All retakes used — restart the course.
            </div>
          )}
          <button className="btn btn-outline" onClick={handleRestartCourse}>
  Restart Course
</button>
        </div>
      </div>

      {/* ── Per-question breakdown ─────────────────────────────────────────── */}
      {answers?.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 16 }}>
            Question Breakdown
          </h2>
          {answers.map((ans, i) => <QuestionResult key={i} ans={ans} index={i} />)}
        </div>
      )}
    </div>
  );
}
