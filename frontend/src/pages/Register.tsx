import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Zap, MessageSquare, AlertCircle, ArrowRight, User, Mail, Lock } from 'lucide-react';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8005/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'candidate' }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Erreur d\'inscription');
      }
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* ── Left: Brand ── */}
      <div className="auth-brand">
        <div className="auth-brand-logo">Smart Recruit</div>
        <p className="auth-brand-tagline">Rejoignez des milliers de candidats</p>

        <div className="auth-brand-features">
          {[
            { icon: <Brain size={16} />, text: 'CV analysé par IA en quelques secondes' },
            { icon: <MessageSquare size={16} />, text: 'Entretiens oraux sans rendez-vous' },
            { icon: <Zap size={16} />, text: 'Suivi de candidatures en temps réel' },
          ].map((f, i) => (
            <div key={i} className="auth-feature-item">
              <span className="auth-feature-dot" />
              <span style={{ color: 'var(--orange)', flexShrink: 0 }}>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="auth-form-panel">
        <div className="auth-box">
          <h2>Inscription</h2>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.5rem',
              color: '#f87171', background: 'rgba(239,68,68,.1)',
              border: '1px solid rgba(239,68,68,.25)', borderRadius: '10px',
              padding: '.75rem 1rem', marginBottom: '1.2rem', fontSize: '.88rem',
              animation: 'fadeUp .3s ease both',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{
                position: 'absolute', left: '1rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
                pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Nom complet"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ paddingLeft: '2.7rem' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute', left: '1rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
                pointerEvents: 'none',
              }} />
              <input
                type="email"
                placeholder="Adresse email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '2.7rem' }}
              />
            </div>

            <div style={{ position: 'relative', marginBottom: 0 }}>
              <Lock size={16} style={{
                position: 'absolute', left: '1rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
                pointerEvents: 'none',
              }} />
              <input
                type="password"
                placeholder="Mot de passe"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '2.7rem' }}
              />
            </div>

            <button type="submit" className="btn w-full mt-1" disabled={loading}>
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin .7s linear infinite', display: 'inline-block',
                  }} />
                  Inscription…
                </>
              ) : (
                <>Créer mon compte <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '.88rem' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
