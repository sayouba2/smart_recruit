import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import {
  X, Users, MessageSquareText, CheckCircle, Clock, XCircle,
  ChevronLeft, Award, Plus, Briefcase, Search,
  ChevronRight, AlertCircle, FileText,
} from 'lucide-react';

/* ── Animated counter ─────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    prev.current = target;
    const from = count;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setCount(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return count;
}

/* ── KPI stat card ────────────────────────────── */
function StatCard({ value, label, icon, color = 'var(--orange)', suffix = '' }: {
  value: number; label: string; icon: React.ReactNode; color?: string; suffix?: string;
}) {
  const n = useCountUp(value);
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.4rem 1.6rem' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(icon as React.ReactElement, { size: 22, color })}
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{n}{suffix}</div>
        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Score circle (SVG gauge) ─────────────────── */
function ScoreCircle({ score }: { score: number | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 150); return () => clearTimeout(t); }, []);
  if (score === null) return (
    <div style={{ width: 72, height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>N/A</span>
    </div>
  );
  const r = 26;
  const circ = 2 * Math.PI * r;
  const c = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={c} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={visible ? circ - (score / 100) * circ : circ}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '.9rem', fontWeight: 900, color: c, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '.55rem', color: 'var(--text-muted)' }}>%</span>
      </div>
    </div>
  );
}

/* ── Score bar ─────────────────────────────────── */
function ScoreBar({ score, color = 'var(--orange)' }: { score: number; color?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(score), 200); return () => clearTimeout(t); }, [score]);
  return (
    <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 3, transition: 'width .9s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

/* ── Chat bubble renderer ─────────────────────── */
function renderTranscript(text: string) {
  if (!text || text.includes("n'a pas été sauvegardée")) {
    return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{text}</div>;
  }
  const regex = /(IA:|Candidat:)([\s\S]*?)(?=(IA:|Candidat:|$))/g;
  const items: { sender: string; text: string }[] = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    items.push({ sender: m[1].replace(':', ''), text: m[2].trim() });
  }
  if (!items.length) return <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '.85rem' }}>{text}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
      {items.map((msg, i) => {
        const isIA = msg.sender === 'IA';
        return (
          <div key={i} style={{
            alignSelf: isIA ? 'flex-start' : 'flex-end',
            maxWidth: '82%',
            background: isIA ? 'rgba(255,255,255,.05)' : 'rgba(249,115,22,.1)',
            border: isIA ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(249,115,22,.2)',
            padding: '.7rem .95rem',
            borderRadius: 14,
            borderBottomLeftRadius: isIA ? 0 : 14,
            borderBottomRightRadius: isIA ? 14 : 0,
          }}>
            <div style={{ fontSize: '.65rem', fontWeight: 700, color: isIA ? 'var(--text-muted)' : 'var(--orange)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {isIA ? 'IA Recruteur' : 'Candidat'}
            </div>
            <div style={{ fontSize: '.88rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{msg.text}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Candidate ranking card ───────────────────── */
function CandidateCard({ app, idx, onDecision, onTranscript, onReport }: {
  app: any; idx: number;
  onDecision: (id: number, type: string, app: any) => void;
  onTranscript: (t: string) => void;
  onReport: (r: any) => void;
}) {
  const initials = (app.candidate_name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const totalScore = app.interview_score !== null && app.interview_score !== undefined
    ? Math.round((app.cv_score + app.interview_score) / 2)
    : null;
  const isTop = idx === 0;
  const isPending = app.status === 'pending';
  const hasInterview = app.interview_score !== null && app.interview_score !== undefined;
  const reco = app.hr_report?.recommandation_finale || '';
  const isReco = reco && !reco.toLowerCase().includes('non');

  return (
    <div style={{
      background: 'var(--surface)',
      backdropFilter: 'blur(20px)',
      border: isTop ? '1px solid rgba(249,115,22,.3)' : '1px solid var(--glass-border)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: '1rem',
      boxShadow: isTop ? '0 0 30px rgba(249,115,22,.1), 0 4px 24px rgba(0,0,0,.4)' : '0 4px 20px rgba(0,0,0,.3)',
      animation: `fadeUp .4s ${idx * .06}s cubic-bezier(.4,0,.2,1) both`,
    }}>
      {/* Accent bar top for #1 */}
      {isTop && (
        <div style={{ height: 2, background: 'linear-gradient(90deg, var(--orange), var(--gold), var(--orange))', backgroundSize: '200%', animation: 'gradientShift 4s ease infinite' }} />
      )}

      <div style={{ padding: '1.4rem 1.6rem', display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
        {/* Rank + Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
          <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>{isTop ? '🏆' : <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</span>}</div>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: isTop ? 'linear-gradient(135deg,var(--orange),var(--gold))' : 'rgba(249,115,22,.12)',
            border: isTop ? 'none' : '1px solid rgba(249,115,22,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '.95rem',
            color: isTop ? '#fff' : 'var(--orange)',
          }}>{initials}</div>
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem', marginBottom: '.6rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{app.candidate_name}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{app.candidate_email}</div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {reco && (
                <span style={{
                  padding: '.22rem .65rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 700,
                  background: isReco ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)',
                  color: isReco ? '#34d399' : '#f87171',
                  border: `1px solid ${isReco ? 'rgba(52,211,153,.25)' : 'rgba(248,113,113,.25)'}`,
                }}>
                  {isReco ? '✓ Recommandé' : '✗ Non recommandé'}
                </span>
              )}
              <span className={`badge badge-${app.status}`}>
                {app.status === 'pending' ? 'En attente' : app.status === 'accepted' ? 'Accepté' : app.status === 'saved' ? 'Mis de côté' : 'Rejeté'}
              </span>
            </div>
          </div>

          {/* Skills */}
          {app.parsed_skills?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.75rem' }}>
              {app.parsed_skills.slice(0, 6).map((s: string, i: number) => (
                <span key={i} style={{ background: 'rgba(249,115,22,.07)', border: '1px solid rgba(249,115,22,.14)', color: 'var(--orange-light)', padding: '.15rem .55rem', borderRadius: 6, fontSize: '.7rem', fontWeight: 500 }}>{s}</span>
              ))}
              {app.parsed_skills.length > 6 && <span style={{ color: 'var(--text-muted)', fontSize: '.7rem', alignSelf: 'center' }}>+{app.parsed_skills.length - 6}</span>}
            </div>
          )}

          {/* Summary */}
          {(app.hr_report?.synthese || app.ai_comments) ? (
            <p style={{ margin: '0 0 .75rem', fontSize: '.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {(app.hr_report?.synthese || app.ai_comments || '').slice(0, 180)}{(app.hr_report?.synthese || app.ai_comments || '').length > 180 ? '…' : ''}
            </p>
          ) : !hasInterview ? (
            <p style={{ margin: '0 0 .75rem', fontSize: '.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Entretien oral non encore passé</p>
          ) : null}

          {/* Score bars (horizontal) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span style={{ fontSize: '.68rem', color: 'var(--text-muted)', width: 40, flexShrink: 0 }}>CV</span>
              <ScoreBar score={app.cv_score} color="var(--orange)" />
              <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--orange)', width: 34, textAlign: 'right', flexShrink: 0 }}>{app.cv_score}%</span>
            </div>
            {hasInterview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span style={{ fontSize: '.68rem', color: 'var(--text-muted)', width: 40, flexShrink: 0 }}>Oral</span>
                <ScoreBar score={app.interview_score} color="var(--gold)" />
                <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--gold)', width: 34, textAlign: 'right', flexShrink: 0 }}>{app.interview_score}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Score circle + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.8rem', flexShrink: 0 }}>
          <ScoreCircle score={totalScore} />

          {/* Action buttons */}
          {hasInterview && isPending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', width: 120 }}>
              <button className="btn" style={{ padding: '.4rem .5rem', fontSize: '.75rem', background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 2px 10px rgba(16,185,129,.3)' }}
                onClick={() => onDecision(app.id, 'accepted', app)}>
                <CheckCircle size={12} /> Accepter
              </button>
              <button className="btn" style={{ padding: '.4rem .5rem', fontSize: '.75rem', background: 'rgba(96,165,250,.85)', boxShadow: '0 2px 10px rgba(96,165,250,.25)' }}
                onClick={() => onDecision(app.id, 'saved', app)}>
                Mettre de côté
              </button>
              <button className="btn" style={{ padding: '.4rem .5rem', fontSize: '.75rem', background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 2px 10px rgba(239,68,68,.25)' }}
                onClick={() => onDecision(app.id, 'rejected', app)}>
                <XCircle size={12} /> Rejeter
              </button>
            </div>
          )}

          {/* Secondary actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', width: 120 }}>
            {hasInterview && (
              <button className="btn btn-secondary" style={{ padding: '.35rem .5rem', fontSize: '.72rem' }}
                onClick={() => onTranscript(app.transcript || "La transcription n'a pas été sauvegardée pour cette session.")}>
                <MessageSquareText size={12} /> Transcript
              </button>
            )}
            {app.hr_report && (
              <button className="btn btn-secondary" style={{ padding: '.35rem .5rem', fontSize: '.72rem', borderColor: 'rgba(245,158,11,.35)', color: 'var(--gold)' }}
                onClick={() => onReport(app.hr_report)}>
                <Award size={12} /> Rapport IA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────── */
export default function RHDashboard() {
  const { auth } = useContext(AuthContext);
  const [jobs, setJobs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{ type: string; appId: number } | null>(null);
  const [decisionText, setDecisionText] = useState('');
  const [transcriptModal, setTranscriptModal] = useState<string | null>(null);
  const [hrReportModal, setHrReportModal] = useState<any | null>(null);
  const [bulkModal, setBulkModal] = useState<{ type: string; startRank: number; endRank: number } | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Job form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [domain, setDomain] = useState('');
  const [priority, setPriority] = useState('');

  const fetchJobs = () => fetch('http://localhost:8001/rh_jobs', { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(setJobs).catch(console.error);
  const fetchApps = () => fetch('http://localhost:8002/rh_applications', { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(setApps).catch(console.error);

  useEffect(() => { fetchJobs(); fetchApps(); }, [auth.token]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8001/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, domain, priority_criteria: priority }),
      });
      setTitle(''); setDesc(''); setDomain(''); setPriority('');
      setShowCreateJob(false);
      fetchJobs();
    } catch { alert("Erreur de création d'offre"); }
  };

  const openDecisionModal = (appId: number, type: string, app: any) => {
    const msgs: Record<string, string> = {
      accepted: `Bonjour ${app.candidate_name},\n\nSuite à votre excellent entretien IA, j'ai le plaisir de vous annoncer que votre profil est retenu pour le poste de ${app.job_title}.\n\nVous trouverez ci-joint les détails pour les prochaines étapes.`,
      saved:    `Bonjour ${app.candidate_name},\n\nMerci de l'intérêt porté à ${app.job_title}. Bien que votre profil soit intéressant, nous le conservons pour de futures opportunités mieux alignées.`,
      rejected: `Bonjour ${app.candidate_name},\n\nMalgré un parcours intéressant, votre profil ne correspond pas exactement à nos attentes actuelles pour le poste de ${app.job_title}. Bonne continuation.`,
    };
    setDecisionText(msgs[type] || '');
    setDecisionModal({ type, appId });
  };

  const submitDecision = async () => {
    if (!decisionModal) return;
    try {
      await fetch(`http://localhost:8002/${decisionModal.appId}/decision`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decisionModal.type, comment: decisionText }),
      });
      setDecisionModal(null);
      fetchApps();
    } catch { alert('Erreur'); }
  };

  const submitBulkDecision = async () => {
    if (!bulkModal || !selectedJob) return;
    const sorted = apps.filter(a => a.job_title === selectedJob.title)
      .sort((a, b) => (b.cv_score + (b.interview_score || 0)) - (a.cv_score + (a.interview_score || 0)));
    const subset = sorted.slice(bulkModal.startRank - 1, bulkModal.endRank);
    if (!subset.length) { alert('Aucun candidat dans ces rangs.'); return; }
    try {
      await Promise.all(subset.map(app =>
        fetch(`http://localhost:8002/${app.id}/decision`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: bulkModal.type, comment: bulkText }),
        })
      ));
      setBulkModal(null);
      fetchApps();
    } catch { alert('Erreur lors du traitement par lot.'); }
  };

  // KPIs
  const totalJobs   = jobs.length;
  const totalApps   = apps.length;
  const accepted    = apps.filter(a => a.status === 'accepted').length;
  const awaitReview = apps.filter(a => a.status === 'pending' && a.interview_score !== null).length;
  const rate        = totalApps > 0 ? Math.round((accepted / totalApps) * 100) : 0;

  /* ────────────── JOB DETAIL VIEW ────────────── */
  if (selectedJob) {
    const jobApps = apps.filter(a => a.job_title === selectedJob.title)
      .sort((a, b) => (b.cv_score + (b.interview_score || 0)) - (a.cv_score + (a.interview_score || 0)));

    return (
      <div className="animate-fade">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedJob(null)} className="btn btn-secondary" style={{ padding: '.55rem .8rem', flexShrink: 0 }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, background: 'linear-gradient(135deg,#fff 30%,var(--orange-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {selectedJob.title}
            </h1>
            <p style={{ margin: '.2rem 0 0', color: 'var(--text-muted)', fontSize: '.85rem' }}>
              {jobApps.length} candidat{jobApps.length !== 1 ? 's' : ''} · Classement par score IA
            </p>
          </div>
          <button className="btn btn-secondary" style={{ flexShrink: 0 }}
            onClick={() => { setBulkModal({ type: 'rejected', startRank: 1, endRank: jobApps.length }); setBulkText('Bonjour,\n\nMalgré la qualité de votre profil, nous ne donnons pas suite. Bonne continuation.'); }}>
            <Users size={16} /> Traitement par lot
          </button>
        </div>

        {/* Empty */}
        {jobApps.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <div style={{ color: 'var(--text-muted)' }}>Aucune candidature pour cette offre.</div>
          </div>
        )}

        {/* Candidate cards */}
        {jobApps.map((app, idx) => (
          <CandidateCard key={app.id} app={app} idx={idx}
            onDecision={openDecisionModal}
            onTranscript={setTranscriptModal}
            onReport={setHrReportModal}
          />
        ))}

        {/* ── Transcript modal ── */}
        {transcriptModal && (
          <div className="modal-overlay" onClick={() => setTranscriptModal(null)}>
            <div className="card modal-content" onClick={e => e.stopPropagation()}
              style={{ width: '90%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <MessageSquareText size={18} color="var(--orange)" />
                  <span style={{ fontWeight: 700 }}>Transcription de l'entretien</span>
                </div>
                <button onClick={() => setTranscriptModal(null)} className="btn btn-secondary" style={{ padding: '.3rem .5rem' }}><X size={16} /></button>
              </div>
              <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1, minHeight: 0 }}>
                {renderTranscript(transcriptModal)}
              </div>
            </div>
          </div>
        )}

        {/* ── HR Report modal ── */}
        {hrReportModal && (
          <div className="modal-overlay" onClick={() => setHrReportModal(null)}>
            <div className="card modal-content" onClick={e => e.stopPropagation()}
              style={{ width: '90%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <Award size={18} color="var(--gold)" />
                  <span style={{ fontWeight: 700 }}>Rapport d'évaluation IA</span>
                </div>
                <button onClick={() => setHrReportModal(null)} className="btn btn-secondary" style={{ padding: '.3rem .5rem' }}><X size={16} /></button>
              </div>
              <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{hrReportModal.nom_candidat}</h3>
                  <div style={{
                    padding: '.35rem .9rem', borderRadius: 8, fontWeight: 700, fontSize: '.95rem',
                    background: (hrReportModal.recommandation_finale || '').toLowerCase().includes('non') ? 'rgba(239,68,68,.15)' : 'rgba(16,185,129,.15)',
                    color: (hrReportModal.recommandation_finale || '').toLowerCase().includes('non') ? '#f87171' : '#34d399',
                    border: `1px solid ${(hrReportModal.recommandation_finale || '').toLowerCase().includes('non') ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}`,
                  }}>
                    {hrReportModal.recommandation_finale}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '.6rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 auto', padding: '.8rem 1.2rem', borderRadius: 10, background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.15)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--orange)' }}>{hrReportModal.score_global}</div>
                    <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score global</div>
                  </div>
                  {[
                    { label: 'Langue', data: hrReportModal.niveau_langue },
                    { label: 'Politesse', data: hrReportModal.politesse },
                    { label: 'Réponses', data: hrReportModal.qualite_reponse },
                  ].map(({ label, data }, i) => data && (
                    <div key={i} style={{ flex: 1, minWidth: 120, padding: '.8rem', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '.2rem' }}>{label}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)' }}>{data.note}%</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)', marginTop: '.2rem' }}>{data.commentaire}</div>
                    </div>
                  ))}
                </div>

                <p style={{ margin: '0 0 1.2rem', fontSize: '.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{hrReportModal.synthese}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <div style={{ padding: '1rem', borderRadius: 10, background: 'rgba(52,211,153,.07)', border: '1px solid rgba(52,211,153,.15)' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#34d399', marginBottom: '.6rem', textTransform: 'uppercase' }}>Points forts</div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '.82rem', color: '#6ee7b7', lineHeight: 1.7 }}>
                      {hrReportModal.points_forts?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 10, background: 'rgba(248,113,113,.07)', border: '1px solid rgba(248,113,113,.15)' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#f87171', marginBottom: '.6rem', textTransform: 'uppercase' }}>Points faibles</div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '.82rem', color: '#fca5a5', lineHeight: 1.7 }}>
                      {hrReportModal.points_faibles?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Decision modal ── */}
        {decisionModal && (
          <div className="modal-overlay" onClick={() => setDecisionModal(null)}>
            <div className="card modal-content" onClick={e => e.stopPropagation()}
              style={{ width: '90%', maxWidth: 520, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 700 }}>Rédiger la décision</span>
                <button onClick={() => setDecisionModal(null)} className="btn btn-secondary" style={{ padding: '.3rem .5rem' }}><X size={16} /></button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ margin: '0 0 .9rem', fontSize: '.84rem', color: 'var(--text-muted)' }}>Ce message sera visible par le candidat dans son espace personnel.</p>
                <textarea value={decisionText} onChange={e => setDecisionText(e.target.value)}
                  style={{ height: 180, resize: 'none', marginBottom: '1rem', lineHeight: 1.6 }} />
                <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setDecisionModal(null)} className="btn btn-secondary">Annuler</button>
                  <button onClick={submitDecision} className="btn" style={{
                    background: decisionModal.type === 'accepted' ? 'linear-gradient(135deg,#10b981,#059669)'
                      : decisionModal.type === 'rejected' ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                      : 'rgba(96,165,250,.9)',
                  }}>
                    Confirmer & Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Bulk modal ── */}
        {bulkModal && (
          <div className="modal-overlay" onClick={() => setBulkModal(null)}>
            <div className="card modal-content" onClick={e => e.stopPropagation()}
              style={{ width: '90%', maxWidth: 520, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <Users size={18} color="var(--orange)" />
                  <span style={{ fontWeight: 700 }}>Traitement par lot</span>
                </div>
                <button onClick={() => setBulkModal(null)} className="btn btn-secondary" style={{ padding: '.3rem .5rem' }}><X size={16} /></button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ margin: '0 0 1rem', fontSize: '.84rem', color: 'var(--text-muted)' }}>Définissez la plage de rangs et l'action à appliquer.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '.3rem' }}>Du rang</label>
                    <input type="number" min="1" value={bulkModal.startRank}
                      onChange={e => setBulkModal({ ...bulkModal, startRank: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '.3rem' }}>Au rang</label>
                    <input type="number" min="1" value={bulkModal.endRank}
                      onChange={e => setBulkModal({ ...bulkModal, endRank: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '.3rem' }}>Action</label>
                  <select value={bulkModal.type} onChange={e => setBulkModal({ ...bulkModal, type: e.target.value })}>
                    <option value="accepted">Accepter</option>
                    <option value="saved">Mettre de côté</option>
                    <option value="rejected">Rejeter</option>
                  </select>
                </div>
                <label style={{ fontSize: '.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '.3rem' }}>
                  Message envoyé aux {Math.max(0, bulkModal.endRank - bulkModal.startRank + 1)} candidat(s)
                </label>
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} style={{ height: 120, resize: 'none', marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setBulkModal(null)} className="btn btn-secondary">Annuler</button>
                  <button onClick={submitBulkDecision} className="btn">
                    Appliquer à {Math.max(0, bulkModal.endRank - bulkModal.startRank + 1)} candidat(s)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ────────────── MAIN OVERVIEW ────────────── */
  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, background: 'linear-gradient(135deg,#fff 40%,var(--orange-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Tableau de bord RH
          </h1>
          <p style={{ margin: '.3rem 0 0', color: 'var(--text-secondary)', fontSize: '.9rem' }}>
            Gérez vos offres et suivez vos candidatures en temps réel.
          </p>
        </div>
        <button className="btn" onClick={() => setShowCreateJob(true)} style={{ flexShrink: 0 }}>
          <Plus size={16} /> Créer une offre
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <StatCard value={totalJobs}   label="Offres actives"   icon={<Briefcase />}   color="var(--orange)" />
        <StatCard value={totalApps}   label="Candidats reçus"  icon={<Users />}       color="#60a5fa" />
        <StatCard value={accepted}    label="Talents recrutés" icon={<CheckCircle />} color="#34d399" />
        <StatCard value={awaitReview} label="En attente revue" icon={<Clock />}       color="#fbbf24" />
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 380 }}>
        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input placeholder="Rechercher une offre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '2.7rem', marginBottom: 0 }} />
      </div>

      {/* Jobs grid */}
      {filteredJobs.length === 0 && !searchTerm && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Briefcase size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '.5rem' }}>Aucune offre active</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', marginBottom: '1.5rem' }}>Créez votre première offre pour commencer à recruter.</p>
          <button className="btn" onClick={() => setShowCreateJob(true)}><Plus size={16} /> Créer une offre</button>
        </div>
      )}

      <div className="grid">
        {filteredJobs.map((job, i) => {
          const jobApps = apps.filter(a => a.job_title === job.title);
          const pending  = jobApps.filter(a => a.status === 'pending').length;
          const acc      = jobApps.filter(a => a.status === 'accepted').length;
          const rej      = jobApps.filter(a => a.status === 'rejected').length;
          const processed = acc + rej;
          const total    = jobApps.length;

          return (
            <div key={job.id} className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, overflow: 'hidden', animation: `fadeUp .4s ${i * .06}s cubic-bezier(.4,0,.2,1) both` }}
              onClick={() => setSelectedJob(job)}>
              {/* Card accent line */}
              <div style={{ height: 3, background: 'linear-gradient(90deg,var(--orange),var(--gold))' }} />

              <div style={{ padding: '1.2rem 1.4rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.6rem' }}>
                  <span style={{ background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.18)', color: 'var(--orange-light)', padding: '.2rem .65rem', borderRadius: 6, fontSize: '.72rem', fontWeight: 600 }}>
                    {job.domain}
                  </span>
                  <Users size={16} color="var(--text-muted)" />
                </div>
                <h3 style={{ margin: '0 0 .4rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: 'none', paddingBottom: 0 }}>{job.title}</h3>
                <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {job.description}
                </p>
              </div>

              {/* Progress bar */}
              {total > 0 && (
                <div style={{ padding: '0 1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                    <span>Traitement</span><span>{processed}/{total}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${total > 0 ? (processed / total) * 100 : 0}%`, background: 'linear-gradient(90deg,var(--orange),var(--gold))', borderRadius: 2, transition: 'width .8s ease' }} />
                  </div>
                </div>
              )}

              {/* Footer stats */}
              <div style={{ padding: '.9rem 1.4rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.2rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#60a5fa' }}>{total}</div>
                    <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>{pending}</div>
                    <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>En cours</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>{acc}</div>
                    <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acceptés</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--text-muted)', fontSize: '.82rem', fontWeight: 500 }}>
                  Voir <ChevronRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create job modal ── */}
      {showCreateJob && (
        <div className="modal-overlay" onClick={() => setShowCreateJob(false)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()}
            style={{ width: '90%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <Plus size={18} color="var(--orange)" />
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Créer une nouvelle offre</span>
              </div>
              <button onClick={() => setShowCreateJob(false)} className="btn btn-secondary" style={{ padding: '.3rem .5rem' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <form onSubmit={handleCreateJob}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '.75rem' }}>
                  <input placeholder="Titre de l'offre" required value={title} onChange={e => setTitle(e.target.value)} />
                  <input placeholder="Domaine (ex: IT)" required value={domain} onChange={e => setDomain(e.target.value)} />
                </div>
                <textarea placeholder="Description longue, contexte, missions..." rows={5} required value={desc} onChange={e => setDesc(e.target.value)} style={{ marginTop: 0 }} />
                <div style={{ padding: '1rem', borderRadius: 10, background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.18)', marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                    <AlertCircle size={15} color="var(--orange)" />
                    <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--orange)' }}>Critère prioritaire (invisible au candidat)</span>
                  </div>
                  <p style={{ margin: '0 0 .6rem', fontSize: '.78rem', color: 'var(--text-muted)' }}>L'IA vérifiera automatiquement ce point lors de l'entretien oral.</p>
                  <input placeholder="Ex : Doit avoir déployé en production sur AWS" required value={priority} onChange={e => setPriority(e.target.value)} style={{ marginBottom: 0 }} />
                </div>
                <button className="btn w-full" type="submit" style={{ padding: '.9rem', fontSize: '1rem' }}>
                  <FileText size={16} /> Publier l'offre
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
