import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../App';

export default function RHDashboard() {
  const { auth } = useContext(AuthContext);
  const [jobs, setJobs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  
  // Job Creation Form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [domain, setDomain] = useState('');
  const [priority, setPriority] = useState('');

  const fetchJobs = () => {
    fetch('http://localhost:8001/rh_jobs', {
      headers: { 'Authorization': `Bearer ${auth.token}` }
    }).then(r => r.json()).then(setJobs).catch(e => console.error(e));
  };

  const fetchApps = () => {
    fetch('http://localhost:8002/rh_applications', {
      headers: { 'Authorization': `Bearer ${auth.token}` }
    }).then(r => r.json()).then(setApps).catch(e => console.error(e));
  };

  useEffect(() => {
    fetchJobs();
    fetchApps();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8001/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, domain, priority_criteria: priority })
      });
      setTitle(''); setDesc(''); setDomain(''); setPriority('');
      fetchJobs();
    } catch(e) {
      alert("Erreur de création d'offre");
    }
  };

  const handleDecision = async (app_id: number, decision: string, comment: string = "") => {
    try {
      await fetch(`http://localhost:8002/${app_id}/decision`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment })
      });
      fetchApps();
    } catch(e) {
      alert("Erreur");
    }
  };

  const totalJobs = jobs.length;
  const totalApps = apps.length;
  const acceptedApps = apps.filter(a => a.status === 'accepted').length;
  const rejectedApps = apps.filter(a => a.status === 'rejected').length;

  return (
    <div className="animate-fade">
      <div className="header">
        <h1>Dashboard RH</h1>
        <p>Gérez vos offres et évaluez vos candidats avec l'analyse IA.</p>
      </div>

      <div className="grid">
         <div className="card kpi-card">
          <div className="kpi-value">{totalJobs}</div>
          <div className="kpi-label">OFFRES ACTIVES</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{color: '#3b82f6'}}>{totalApps}</div>
          <div className="kpi-label">CANDIDATS TOTAL</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{color: '#22c55e'}}>{acceptedApps}</div>
          <div className="kpi-label">CANDIDATS ACCEPTÉS</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{color: '#ef4444'}}>{rejectedApps}</div>
          <div className="kpi-label">CANDIDATS REJETÉS</div>
        </div>
      </div>

      <div className="grid mt-2">
        <div className="card">
          <h3>Créer une offre d'emploi</h3>
          <form onSubmit={handleCreateJob}>
            <input placeholder="Titre de l'offre" required value={title} onChange={e => setTitle(e.target.value)} />
            <input placeholder="Domaine (ex: IT, Finance)" required value={domain} onChange={e => setDomain(e.target.value)} />
            <textarea placeholder="Description longue requise..." rows={4} required value={desc} onChange={e => setDesc(e.target.value)}></textarea>
            
            <label style={{display: 'block', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem'}}>Critère Prioritaire (Invisible au candidat)</label>
            <input placeholder="Ex: Doit absolument avoir 5 ans d'xp en Django" required value={priority} onChange={e => setPriority(e.target.value)} 
                   style={{border: '1px solid #fca5a5', background: '#fef2f2'}} />
            <button className="btn w-full mt-1" type="submit">Publier l'offre</button>
          </form>
        </div>

        <div className="card">
          <h3>Vos Offres et Candidatures</h3>
          <div style={{maxHeight: '400px', overflowY: 'auto'}}>
            {apps.length === 0 ? <p style={{color: 'var(--text-light)'}}>Aucune candidature reçue.</p> : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {apps.map(app => (
                  <div key={app.id} style={{padding: '1rem', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', background: 'rgba(255,255,255,0.5)'}}>
                     <div className="flex-between">
                       <strong style={{fontSize: '1.1rem'}}>{app.candidate_name}</strong>
                       <span className={`badge badge-${app.status}`}>
                        {app.status === 'pending' ? 'En cours' : app.status === 'accepted' ? 'Accepté' : 'Rejeté'}
                       </span>
                     </div>
                     <p style={{margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--text-light)'}}>{app.candidate_email} — Poste: {app.job_title}</p>
                     
                     <div style={{marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.85rem'}}>
                       <span>Score CV: <b>{app.cv_score}%</b></span>
                       <span>Score Entretien IA: <b>{app.interview_score ?? 'En attente'}</b></span>
                     </div>

                     <div style={{marginTop: '0.5rem'}}>
                        {app.parsed_skills?.map((s: string, i: number) => <span key={i} style={{marginRight: '0.5rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#475569'}}>{s}</span>)}
                     </div>

                     {app.status === 'pending' && app.interview_score !== null && (
                       <div className="flex-between mt-1">
                         <span style={{fontSize: '0.8rem', fontStyle: 'italic', flex: 1, color: '#64748b'}}>Avis IA: Peut être accepté.</span>
                         <div style={{display:'flex', gap: '0.5rem'}}>
                           <button className="btn" style={{background: '#22c55e', padding: '0.4rem 1rem', fontSize: '0.8rem'}}
                                   onClick={() => handleDecision(app.id, 'accepted', 'Félicitations')}>Accepter</button>
                           <button className="btn" style={{background: '#ef4444', padding: '0.4rem 1rem', fontSize: '0.8rem'}}
                                   onClick={() => handleDecision(app.id, 'rejected', "Profil non retenu après analyse RH")}>Rejeter</button>
                         </div>
                       </div>
                     )}

                     {app.status === 'rejected' && (
                       <p style={{fontSize: '0.8rem', color: '#ef4444', marginTop: '0.5rem'}}>{app.rejection_reason}</p>
                     )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
