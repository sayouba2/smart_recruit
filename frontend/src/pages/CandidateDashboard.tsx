import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../App';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { X, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import InterviewRoom from '../components/InterviewRoom';

function ApplicationList() {
  const [apps, setApps] = useState<any[]>([]);
  const [messageModal, setMessageModal] = useState<{title: string, msg: string, status: string} | null>(null);
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchApps = () => {
    fetch('http://localhost:8002/my_applications', {
      headers: { 'Authorization': `Bearer ${auth.token}` }
    })
      .then(r => r.json())
      .then(d => setApps(d))
      .catch(e => console.error(e));
  };

  useEffect(() => { fetchApps(); }, []);

  const total = apps.length;
  const pending = apps.filter(a => a.status === 'pending').length;
  const accepted = apps.filter(a => a.status === 'accepted').length;
  const rejected = apps.filter(a => a.status === 'rejected').length;

  return (
    <div className="animate-fade">
      <div className="header">
        <h1>Mon Dashboard</h1>
        <p>Suivez l'état de vos candidatures et passez vos entretiens IA.</p>
      </div>

      <div className="grid" style={{ marginBottom: '3rem' }}>
        <div className="card kpi-card">
          <div className="kpi-value">{total}</div>
          <div className="kpi-label">TOTAL CANDIDATURES</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: '#eab308' }}>{pending}</div>
          <div className="kpi-label">EN COURS</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: '#22c55e' }}>{accepted}</div>
          <div className="kpi-label">ACCEPTÉES</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: '#ef4444' }}>{rejected}</div>
          <div className="kpi-label">REJETÉES</div>
        </div>
      </div>

      <div className="card">
        <h3>Historique des candidatures</h3>
        {apps.length === 0 ? <p style={{ color: 'var(--text-light)' }}>Vous n'avez soumis aucune candidature.</p> : (
          <table>
            <thead><tr><th>Offre</th><th>Date</th><th>Statut</th><th>Action / Info</th></tr></thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.job_title}</td>
                  <td style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${a.status}`}>
                      {a.status === 'pending' ? 'En cours' : a.status === 'accepted' ? 'Acceptée' : 'Rejetée'}
                    </span>
                  </td>
                  <td>
                    {a.status === 'pending' && a.interview_link && !a.interview_passed && (
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate(`/candidate/interview/${a.id}`)}>
                        Passer l'entretien Oral
                      </button>
                    )}
                    {a.status === 'pending' && !a.interview_link && <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Analyse CV en cours</span>}
                    {a.status === 'pending' && a.interview_link && a.interview_passed && <span style={{ fontSize: '0.85rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> Entretien Terminé</span>}
                    
                    {['accepted', 'rejected', 'saved'].includes(a.status) && a.rejection_reason && (
                      <button className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: a.status === 'accepted' ? '#22c55e' : (a.status === 'rejected' ? '#ef4444' : '#3b82f6'), display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                              onClick={() => setMessageModal({title: a.job_title, msg: a.rejection_reason, status: a.status})}>
                        <MessageSquare size={14} /> Lire le retour RH
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {messageModal && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100}}>
            <div className="card animate-fade" style={{width: '90%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden', padding: 0}}>
              <div className="flex-between" style={{padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      {messageModal.status === 'accepted' ? <CheckCircle color="#22c55e" /> : (messageModal.status === 'rejected' ? <XCircle color="#ef4444" /> : <Clock color="#3b82f6" />)}
                      <h3 style={{margin: 0}}>Message de l'équipe RH</h3>
                  </div>
                  <button onClick={() => setMessageModal(null)} className="btn btn-secondary" style={{padding: '0.3rem'}}><X size={18} /></button>
              </div>
              <div style={{padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: 0}}>
                  <h4 style={{marginTop: 0, color: '#64748b'}}>Poste : {messageModal.title}</h4>
                  <div style={{background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', padding: '1rem', marginTop: '1rem', lineHeight: '1.5'}}>
                      {messageModal.msg}
                  </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

function ApplyJob() {
  const { auth } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { job_id: number, job_title: string } | null;
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!state) return <div className="card">Requête invalide.</div>;

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    
    // Simulate AI parsing progress
    const interval = setInterval(() => {
      setProgress(p => (p < 90 ? p + (Math.random() * 8 + 2) : 90));
    }, 600);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('job_offer_id', String(state.job_id));
    
    try {
      const res = await fetch('http://localhost:8002/apply', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` },
        body: fd
      });
      clearInterval(interval);
      if (!res.ok) {
        alert("Erreur d'envoi");
        setLoading(false);
      } else {
        setProgress(100);
        setTimeout(() => navigate('/candidate'), 1000);
      }
    } catch (e) {
      clearInterval(interval);
      alert("Erreur de connexion serveur");
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade">
      <h3>Candidater pour: {state.job_title}</h3>
      <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Veuillez joindre votre CV au format PDF.</p>
      
      {!loading ? (
        <>
          <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button className="btn mt-1" onClick={handleUpload} disabled={!file}>
            Envoyer ma candidature
          </button>
        </>
      ) : (
        <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1rem', background: 'rgba(234, 88, 12, 0.05)', borderRadius: '12px', border: '1px solid rgba(234, 88, 12, 0.1)' }}>
          <div style={{ fontWeight: 600, color: 'var(--marrakech-orange)', marginBottom: '0.8rem', fontSize: '1.1rem' }}>
            {progress >= 100 ? "Analyse terminée avec succès !" : "Analyse IA de votre CV en cours..."}
          </div>
          <div style={{ height: '12px', width: '100%', background: '#ffedd5', borderRadius: '6px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ 
              height: '100%', 
              width: `${Math.min(progress, 100)}%`, 
              background: 'linear-gradient(90deg, #ea580c, #fb923c)', 
              transition: 'width 0.5s ease-out',
              borderRadius: '6px'
            }} />
          </div>
          <p style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem'}}>
            {progress >= 100 ? "Redirection automatique..." : "Veuillez patienter pendant que nos algorithmes évaluent vos compétences."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CandidateDashboard() {
  return (
    <Routes>
      <Route path="/" element={<ApplicationList />} />
      <Route path="/apply" element={<ApplyJob />} />
      <Route path="/interview/:application_id" element={<InterviewRoom />} />
    </Routes>
  );
}
