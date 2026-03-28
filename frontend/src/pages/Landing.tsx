import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, LogIn } from 'lucide-react';
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
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <header style={{padding: '1.5rem 3rem', background: 'var(--sidebar-bg)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
        <div style={{fontSize: '1.5rem', fontWeight: 800, color: 'var(--marrakech-orange)'}}>SMART RECRUIT</div>
        <div style={{display: 'flex', gap: '1rem'}}>
          {auth ? (
            <button className="btn" onClick={() => navigate(auth.role === 'rh' ? '/rh' : '/candidate')}>Mon Dashboard</button>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary"><LogIn size={18} /> Connexion</Link>
              <Link to="/register" className="btn"><UserPlus size={18} /> Inscription</Link>
            </>
          )}
        </div>
      </header>

      <main style={{flex: 1, padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%'}}>
        <div className="text-center" style={{marginBottom: '4rem'}}>
          <h1 style={{fontSize: '3rem', fontWeight: 800, color: 'var(--text-dark)'}}>Trouvez votre voie.</h1>
          <p style={{fontSize: '1.2rem', color: 'var(--text-light)', marginTop: '1rem'}}>Découvrez les opportunités professionnelles qui correspondent à vos talents.</p>
        </div>

        <h2 style={{fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-dark)'}}>Offres d'emploi récentes</h2>
        
        {jobs.length === 0 ? (
          <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-light)'}}>Aucune offre disponible pour le moment.</div>
        ) : (
          <div className="grid">
            {jobs.map(job => (
              <div key={job.id} className="card animate-fade" style={{display: 'flex', flexDirection: 'column'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <h3>{job.title}</h3>
                  <span className="badge" style={{background: 'rgba(234, 88, 12, 0.1)', color: 'var(--marrakech-orange)'}}>{job.domain}</span>
                </div>
                <p style={{color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1}}>
                  {job.description?.substring(0, 120)}...
                </p>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto'}}>
                   <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>{new Date(job.created_at).toLocaleDateString()}</span>
                   <button className="btn" onClick={() => {
                     if (!auth) navigate('/login');
                     else navigate('/candidate/apply', { state: { job_id: job.id, job_title: job.title } });
                   }}>
                     Candidater
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
