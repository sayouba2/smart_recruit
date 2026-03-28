import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:8005/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'candidate' }) // RH are created in DB by default, public registration is Candidate only
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Registration failed");
      }
      
      navigate('/login');
    } catch(err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box animate-fade">
        <h2>Inscription Candidat</h2>
        {error && <div style={{color: 'red', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Nom Complet" required value={name} onChange={e => setName(e.target.value)} />
          <input type="email" placeholder="Adresse Email" required value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Mot de passe" required value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="btn w-full mt-1" disabled={loading}>S'inscrire</button>
        </form>
        <p className="text-center mt-2" style={{color: 'var(--text-light)'}}>
          Déjà un compte ? <Link to="/login" style={{color: 'var(--marrakech-orange)'}}>Connectez-vous</Link>
        </p>
      </div>
    </div>
  );
}
