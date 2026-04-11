import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  X, MessageSquare, CheckCircle, XCircle, Clock,
  Mic, FileText, Upload, ArrowRight, Briefcase,
  Award, AlertCircle, ChevronRight,
} from 'lucide-react';
import InterviewRoom from '../components/InterviewRoom';

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
function StatCard({ value, label, icon, color = 'var(--orange)' }: {
  value: number; label: string; icon: React.ReactNode; color?: string;
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
        <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{n}</div>
        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Pipeline progress tracker ─────────────────── */
function Pipeline({ app }: { app: any }) {
  const stageIndex =
    ['accepted', 'rejected', 'saved'].includes(app.status) ? 3
    : app.interview_passed ? 2
    : app.cv_score ? 1
    : 0;

  const stages = ['Soumis', 'Analyse CV', 'Entretien IA', 'Décision'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, width: '100%', marginTop: '.6rem' }}>
      {stages.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem', flex: '0 0 auto' }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: i <= stageIndex ? 'linear-gradient(135deg,var(--orange),var(--gold))' : 'rgba(255,255,255,.06)',
              border: i <= stageIndex ? 'none' : '1px solid rgba(255,255,255,.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: i <= stageIndex ? '0 0 8px rgba(249,115,22,.5)' : 'none',
              transition: 'all .3s ease',
            }}>
              {i <= stageIndex && <span style={{ fontSize: '.55rem', color: '#fff' }}>✓</span>}
            </div>
            <span style={{
              fontSize: '.6rem', whiteSpace: 'nowrap',
              color: i <= stageIndex ? 'var(--text-secondary)' : 'var(--text-muted)',
            }}>{label}</span>
          </div>
          {i < stages.length - 1 && (
            <div style={{
              flex: 1, height: 1, margin: '9px 4px 0',
              background: i < stageIndex ? 'var(--orange)' : 'rgba(255,255,255,.07)',
              transition: 'background .3s ease',
              minWidth: 12,
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Application card ─────────────────────────── */
function ApplicationCard({ app, onAction, onReadMessage }: {
  app: any;
  onAction: (id: number) => void;
  onReadMessage: (a: any) => void;
}) {
  const statusColor = app.status === 'accepted' ? '#34d399' : app.status === 'rejected' ? '#f87171' : app.status === 'saved' ? '#60a5fa' : 'var(--orange)';
  const statusLabel = app.status === 'accepted' ? 'Acceptée' : app.status === 'rejected' ? 'Rejetée' : app.status === 'saved' ? 'Mise de côté' : 'En cours';
  const navigate = useNavigate();

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${statusColor}` }}>
      {/* Header */}
      <div style={{ padding: '1.2rem 1.4rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(249,115,22,.1)',
            border: '1px solid rgba(249,115,22,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Briefcase size={18} color="var(--orange)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{app.job_title}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Déposée le {new Date(app.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
        <span style={{
          padding: '.25rem .7rem', borderRadius: 20, fontSize: '.72rem', fontWeight: 700,
          background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30`,
          whiteSpace: 'nowrap',
        }}>{statusLabel}</span>
      </div>

      {/* Pipeline */}
      <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid var(--glass-border)' }}>
        <Pipeline app={app} />
      </div>

      {/* Actions */}
      <div style={{ padding: '.9rem 1.4rem', display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
        {app.status === 'pending' && !app.interview_link && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: 'var(--text-muted)' }}>
            <Clock size={14} /> Analyse IA du CV en cours…
          </div>
        )}
        {app.status === 'pending' && app.interview_link && !app.interview_passed && (
          <button className="btn" style={{ padding: '.5rem 1.1rem', fontSize: '.85rem' }}
            onClick={() => navigate(`/candidate/interview/${app.id}`)}>
            <Mic size={14} /> Passer l'entretien oral
          </button>
        )}
        {app.status === 'pending' && app.interview_link && app.interview_passed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: '#34d399' }}>
            <CheckCircle size={14} /> Entretien terminé · En attente de décision
          </div>
        )}
        {['accepted', 'rejected', 'saved'].includes(app.status) && app.rejection_reason && (
          <button className="btn btn-secondary" style={{ padding: '.5rem 1.1rem', fontSize: '.85rem' }}
            onClick={() => onReadMessage(app)}>
            <MessageSquare size={14} /> Lire le message RH
          </button>
        )}
        {['accepted', 'rejected', 'saved'].includes(app.status) && !app.rejection_reason && (
          <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>Décision transmise.</div>
        )}
      </div>
    </div>
  );
}

/* ── Main application list ────────────────────── */
function ApplicationList() {
  const [apps, setApps] = useState<any[]>([]);
  const [messageModal, setMessageModal] = useState<{ title: string; msg: string; status: string } | null>(null);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchApps = () => {
    fetch('http://localhost:8002/my_applications', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json()).then(setApps).catch(console.error);
  };
  useEffect(() => { fetchApps(); }, []);

  const total    = apps.length;
  const pending  = apps.filter(a => a.status === 'pending').length;
  const accepted = apps.filter(a => a.status === 'accepted').length;
  const rejected = apps.filter(a => a.status === 'rejected').length;

  return (
    <div className="animate-fade">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, background: 'linear-gradient(135deg,#fff 40%,var(--orange-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Mes candidatures
          </h1>
          <p style={{ margin: '.3rem 0 0', color: 'var(--text-secondary)', fontSize: '.9rem' }}>
            Suivez chaque étape de votre parcours de recrutement.
          </p>
        </div>
        <button className="btn" onClick={() => navigate('/')}>
          <Briefcase size={16} /> Nouvelle candidature
        </button>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard value={total}    label="Total"      icon={<Award />} color="var(--orange)" />
        <StatCard value={pending}  label="En cours"   icon={<Clock />}      color="#fbbf24" />
        <StatCard value={accepted} label="Acceptées"  icon={<CheckCircle />} color="#34d399" />
        <StatCard value={rejected} label="Rejetées"   icon={<XCircle />}    color="#f87171" />
      </div>

      {/* ── Empty state ── */}
      {apps.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
            <Briefcase size={28} color="var(--orange)" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '.5rem' }}>
            Aucune candidature pour l'instant
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
            Explorez les offres et déposez votre premier CV.
          </p>
          <button className="btn" onClick={() => navigate('/')}>
            Voir les offres <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── Cards ── */}
      {apps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {apps.map(a => (
            <ApplicationCard key={a.id} app={a}
              onAction={(id) => navigate(`/candidate/interview/${id}`)}
              onReadMessage={(app) => setMessageModal({ title: app.job_title, msg: app.rejection_reason, status: app.status })}
            />
          ))}
        </div>
      )}

      {/* ── Message modal ── */}
      {messageModal && (
        <div className="modal-overlay" onClick={() => setMessageModal(null)}>
          <div className="card modal-content" onClick={e => e.stopPropagation()}
            style={{ width: '90%', maxWidth: 500, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                {messageModal.status === 'accepted' ? <CheckCircle color="#34d399" size={20} />
                  : messageModal.status === 'rejected' ? <XCircle color="#f87171" size={20} />
                  : <Clock color="#60a5fa" size={20} />}
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Message de l'équipe RH</span>
              </div>
              <button onClick={() => setMessageModal(null)} className="btn btn-secondary" style={{ padding: '.3rem .5rem' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>
                Poste : <strong style={{ color: 'var(--orange)' }}>{messageModal.title}</strong>
              </p>
              <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 10, border: '1px solid var(--glass-border)', whiteSpace: 'pre-wrap', padding: '1rem', lineHeight: 1.65, fontSize: '.9rem', color: 'var(--text-secondary)' }}>
                {messageModal.msg}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Apply job page ───────────────────────────── */
function ApplyJob() {
  const { auth } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { job_id: number; job_title: string } | null;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  if (!state) return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <AlertCircle size={40} color="var(--orange)" style={{ margin: '0 auto 1rem' }} />
      <p style={{ color: 'var(--text-muted)' }}>Requête invalide. <button className="btn btn-secondary" onClick={() => navigate('/')}>Retour</button></p>
    </div>
  );

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => p < 88 ? p + Math.random() * 9 + 2 : 88), 550);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('job_offer_id', String(state.job_id));
    try {
      const res = await fetch('http://localhost:8002/apply', {
        method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }, body: fd,
      });
      clearInterval(interval);
      if (!res.ok) { alert("Erreur d'envoi"); setLoading(false); return; }
      setProgress(100);
      setDone(true);
      setTimeout(() => navigate('/candidate'), 1800);
    } catch {
      clearInterval(interval);
      alert('Erreur de connexion serveur');
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Back */}
      <button className="btn btn-secondary" style={{ marginBottom: '1.5rem', padding: '.5rem .9rem', fontSize: '.85rem' }} onClick={() => navigate('/')}>
        ← Retour aux offres
      </button>

      <div className="card">
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={20} color="var(--orange)" />
          </div>
          <div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Candidature pour</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{state.job_title}</div>
          </div>
        </div>

        {!loading ? (
          <>
            {/* Drop zone */}
            <div ref={dropRef}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => document.getElementById('cv-file-input')?.click()}
              style={{
                border: `2px dashed ${file ? 'var(--orange)' : 'rgba(255,255,255,.1)'}`,
                borderRadius: 14,
                padding: '2.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? 'rgba(249,115,22,.05)' : 'rgba(255,255,255,.02)',
                transition: 'all .25s ease',
                marginBottom: '1.5rem',
              }}>
              <Upload size={36} color={file ? 'var(--orange)' : 'var(--text-muted)'} style={{ margin: '0 auto .8rem' }} />
              {file ? (
                <>
                  <div style={{ fontWeight: 700, color: 'var(--orange)', marginBottom: '.3rem' }}>{file.name}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB · Cliquez pour changer</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '.3rem' }}>Glissez votre CV ici</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>ou cliquez pour sélectionner un fichier PDF</div>
                </>
              )}
              <input id="cv-file-input" type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>

            <button className="btn w-full" onClick={handleUpload} disabled={!file}
              style={{ padding: '.9rem', fontSize: '1rem' }}>
              <FileText size={18} /> Envoyer ma candidature
            </button>
          </>
        ) : (
          /* Upload / Analysis progress */
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 1.2rem', position: 'relative' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="5" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--orange)" strokeWidth="5"
                  strokeDasharray={163} strokeDashoffset={163 - (progress / 100) * 163}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset .5s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.95rem', color: 'var(--orange)' }}>
                {Math.round(progress)}%
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: done ? '#34d399' : 'var(--text-primary)', marginBottom: '.5rem' }}>
              {done ? '✓ Analyse terminée !' : 'Analyse IA en cours…'}
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
              {done ? 'Redirection automatique…' : 'Nos algorithmes évaluent vos compétences.'}
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2, margin: '1.2rem 0 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,var(--orange),var(--gold))', borderRadius: 2, transition: 'width .5s ease' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  return (
    <Routes>
      <Route path="/"                          element={<ApplicationList />} />
      <Route path="/apply"                     element={<ApplyJob />} />
      <Route path="/interview/:application_id" element={<InterviewRoom />} />
    </Routes>
  );
}
