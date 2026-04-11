import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, LogIn, Zap, Brain, MessageSquare, ChevronRight, Briefcase } from 'lucide-react';
import { AuthContext } from '../App';

export default function Landing() {
  const [jobs, setJobs] = useState<any[]>([]);
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  useEffect(() => {
    fetch('http://localhost:8001/')
      .then(r => r.json())
      .then(d => setJobs(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-logo">Smart Recruit</div>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          {auth ? (
            <button className="btn" onClick={() => navigate(auth.role === 'rh' ? '/rh' : '/candidate')}>
              Mon Dashboard <ChevronRight size={16} />
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <LogIn size={16} /> Connexion
              </Link>
              <Link to="/register" className="btn" style={{ textDecoration: 'none' }}>
                <UserPlus size={16} /> S'inscrire
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Plateforme de recrutement IA
        </div>

        <h1 className="hero-title">
          <span className="hero-title-white">Trouvez votre voie.</span>
          <br />
          <span className="hero-title-gradient">Recrutement Augmenté.</span>
        </h1>

        <p className="hero-subtitle">
          Smart Recruit analyse vos CV, conduit des entretiens oraux IA et sélectionne
          les meilleurs talents. Simple, rapide, précis.
        </p>

        <div className="hero-cta">
          {auth ? (
            <button className="btn" style={{ fontSize: '1rem', padding: '.9rem 2rem' }}
              onClick={() => navigate(auth.role === 'rh' ? '/rh' : '/candidate')}>
              Accéder au Dashboard <ChevronRight size={18} />
            </button>
          ) : (
            <>
              <Link to="/register" className="btn" style={{ fontSize: '1rem', padding: '.9rem 2rem', textDecoration: 'none' }}>
                Commencer gratuitement <ChevronRight size={18} />
              </Link>
              <a href="#offres" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '.9rem 2rem', textDecoration: 'none' }}>
                Voir les offres
              </a>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="hero-stats">
          {[
            { value: 'IA', label: 'Analyse CV' },
            { value: '100%', label: 'Automatisé' },
            { value: '∞', label: 'Candidats' },
          ].map((s, i) => (
            <div key={i} className="hero-stat">
              <span className="hero-stat-value">{s.value}</span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          Pourquoi Smart Recruit ?
        </h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {[
            {
              icon: <Brain size={28} style={{ color: 'var(--orange)' }} />,
              title: 'Analyse IA du CV',
              desc: 'Notre IA extrait compétences, expériences et les compare aux critères du poste en quelques secondes.',
            },
            {
              icon: <MessageSquare size={28} style={{ color: 'var(--orange)' }} />,
              title: 'Entretien Oral IA',
              desc: 'Un entretien conversationnel guidé par l\'IA qui évalue le candidat en temps réel, sans intervention humaine.',
            },
            {
              icon: <Zap size={28} style={{ color: 'var(--orange)' }} />,
              title: 'Matching Intelligent',
              desc: 'Classement automatique des candidats avec score de compatibilité et rapport détaillé pour le recruteur.',
            },
          ].map((f, i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
              <div style={{
                width: 52, height: 52,
                borderRadius: 12,
                background: 'rgba(249,115,22,.1)',
                border: '1px solid rgba(249,115,22,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0, fontSize: '1.1rem' }}>{f.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '.92rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Job Listings ── */}
      <section id="offres" style={{ padding: '2rem 2rem 5rem', maxWidth: '1100px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.8rem' }}>
          <Briefcase size={22} style={{ color: 'var(--orange)' }} />
          <h2 className="section-title" style={{ margin: 0 }}>Offres récentes</h2>
          <span style={{
            marginLeft: 'auto', fontSize: '.8rem', color: 'var(--text-muted)',
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            padding: '.25rem .7rem', borderRadius: '6px'
          }}>
            {jobs.length} offre{jobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Aucune offre disponible pour le moment.
          </div>
        ) : (
          <div className="grid">
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                  <h3 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0, fontSize: '1.05rem' }}>{job.title}</h3>
                  <span className="job-domain-badge">{job.domain}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', marginBottom: '1.5rem', flex: 1, lineHeight: 1.55 }}>
                  {job.description?.substring(0, 120)}…
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                    {new Date(job.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button className="btn" style={{ padding: '.55rem 1.1rem', fontSize: '.85rem' }} onClick={() => {
                    if (!auth) navigate('/login');
                    else navigate('/candidate/apply', { state: { job_id: job.id, job_title: job.title } });
                  }}>
                    Candidater <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '1.8rem 3rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 1,
        background: 'rgba(7,7,15,.9)',
      }}>
        <span className="landing-logo" style={{ fontSize: '1rem' }}>Smart Recruit</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>© 2025 — Recrutement propulsé par l'IA</span>
      </footer>
    </div>
  );
}
