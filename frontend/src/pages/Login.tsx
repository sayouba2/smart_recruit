import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8005/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erreur de connexion');
      
      // Decode JWT safely to grab role and name or assume endpoints return user details
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      
      login(data.access_token, payload.role, payload.name || "Utilisateur");
      
      if (payload.role === 'rh') navigate('/rh');
      else navigate('/candidate');

    } catch(err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box animate-fade">
        <h2>Connexion</h2>
        {error && <div style={{color: 'red', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Adresse Email" required value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Mot de passe" required value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="btn w-full mt-1">Se connecter</button>
        </form>
        <p className="text-center mt-2" style={{color: 'var(--text-light)'}}>
          Nouveau candidat ? <Link to="/register" style={{color: 'var(--marrakech-orange)'}}>Inscrivez-vous</Link>
        </p>
      </div>
    </div>
  );
}
