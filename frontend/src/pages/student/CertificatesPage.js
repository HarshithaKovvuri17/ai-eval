import React, { useEffect, useState } from 'react';
import { certAPI } from '../../services/api';
import { Award, Download, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CertificatesPage() {
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    certAPI.my().then(r => setCerts(r.data.certificates)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><div className="spinner"/></div>;

  return (
    <div style={{ padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', marginBottom:6 }}>My Certificates</h1>
        <p style={{ color:'var(--text-secondary)' }}>Your AI-verified achievement certificates.</p>
      </div>

      {certs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'100px 24px', color:'var(--text-muted)' }}>
          <Award size={64} style={{ margin:'0 auto 20px', opacity:0.2 }}/>
          <h3 style={{ fontSize:18, marginBottom:10, color:'var(--text-secondary)' }}>No certificates yet</h3>
          <p style={{ fontSize:14, marginBottom:24 }}>Complete both rounds of a course to earn your certificate.</p>
          <button className="btn btn-primary" onClick={() => navigate('/courses')}>
            <BookOpen size={16}/> Explore Courses
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:24 }}>
          {certs.map(cert => (
            <div key={cert._id} className="card animate-fade-up" style={{
              padding:28, background:'linear-gradient(135deg,#052e16 0%,var(--bg-card) 100%)',
              border:'1px solid #4ade8033', position:'relative', overflow:'hidden',
            }}>
              {/* Decorative corner */}
              <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'#4ade8011', border:'1px solid #4ade8022' }}/>

              <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:20 }}>
                <div style={{ width:48, height:48, borderRadius:'var(--radius)', background:'#4ade8022', border:'1px solid #4ade8044', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Award size={24} color="var(--accent-2)"/>
                </div>
                <div>
                  <div className="badge badge-green" style={{ marginBottom:6, fontSize:10 }}>AI VERIFIED ✓</div>
                  <h3 style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-display)', lineHeight:1.3 }}>{cert.course?.title}</h3>
                </div>
              </div>

              <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                {[
                  [`Round 1: ${cert.level1Score}%`, cert.level1Score>=50 ? 'var(--accent-2)' : 'var(--accent-4)'],
                  [`Round 2: ${cert.level2Score}%`, cert.level2Score>=70 ? 'var(--accent-2)' : 'var(--accent-4)'],
                ].map(([label, color]) => (
                  <span key={label} style={{ fontSize:12, color, fontWeight:600, background:`${color}15`, padding:'3px 10px', borderRadius:100, border:`1px solid ${color}33` }}>
                    {label}
                  </span>
                ))}
              </div>

              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
                <div>Issued: {new Date(cert.issueDate).toLocaleDateString('en-US',{ year:'numeric', month:'long', day:'numeric' })}</div>
                <div style={{ marginTop:2 }}>Certificate ID: <span style={{ color:'var(--text-secondary)', fontFamily:'monospace' }}>#{cert.certificateId}</span></div>
              </div>

              <button
                className="btn btn-success"
                style={{ width:'100%' }}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const certUrl = `/api/certificate/download/${cert.certificateId}`;
                    const response = await fetch(certUrl, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Download failed');
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `NeuralCert-${cert.certificateId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                  } catch (err) {
                    console.error('Certificate download error:', err);
                    alert('Failed to download certificate. Please try again.');
                  }
                }}
              >
                <Download size={15}/> Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
