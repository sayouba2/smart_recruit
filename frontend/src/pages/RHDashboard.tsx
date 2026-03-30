import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../App';
import { Search, Plus, X, Users, MessageSquareText, CheckCircle, Clock, XCircle, ChevronLeft, Award } from 'lucide-react';

export default function RHDashboard() {
  const { auth } = useContext(AuthContext);
  const [jobs, setJobs] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  
  // UI States
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{type: 'accepted' | 'rejected' | 'saved', appId: number} | null>(null);
  const [decisionText, setDecisionText] = useState("");
  const [transcriptModal, setTranscriptModal] = useState<string | null>(null);
  const [hrReportModal, setHrReportModal] = useState<any | null>(null);
  const [bulkModal, setBulkModal] = useState<{type: 'accepted' | 'rejected' | 'saved', startRank: number, endRank: number} | null>(null);
  const [bulkText, setBulkText] = useState("");

  // Job Creation Form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [domain, setDomain] = useState('');
  const [priority, setPriority] = useState('');

  const renderTranscript = (text: string) => {
      if (!text || text.includes("n'a pas été sauvegardée")) {
          return <div style={{padding: '1rem', color: '#64748b', fontStyle: 'italic'}}>{text}</div>;
      }
      const msgRegex = /(IA:|Candidat:)([\s\S]*?)(?=(IA:|Candidat:|$))/g;
      const items = [];
      let match;
      while ((match = msgRegex.exec(text)) !== null) {
          items.push({ sender: match[1].replace(':', ''), text: match[2].trim() });
      }
      if (items.length === 0) return <div style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace'}}>{text}</div>;

      return (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem'}}>
              {items.map((msg, i) => {
                  const isIA = msg.sender === 'IA';
                  return (
                      <div key={i} style={{
                          alignSelf: isIA ? 'flex-start' : 'flex-end',
                          background: isIA ? '#ffffff' : '#dcf8c6',
                          border: isIA ? '1px solid #e2e8f0' : '1px solid #c3e6b1',
                          padding: '0.8rem 1rem',
                          borderRadius: '16px',
                          borderBottomLeftRadius: isIA ? '0' : '16px',
                          borderBottomRightRadius: !isIA ? '0' : '16px',
                          maxWidth: '85%',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                          <div style={{fontSize: '0.7rem', fontWeight: 600, color: isIA ? '#64748b' : '#3f6212', marginBottom: '0.3rem', textTransform: 'uppercase'}}>
                              {isIA ? 'IA Recruteur' : 'Candidat'}
                          </div>
                          <div style={{fontSize: '0.95rem', color: '#1e293b', whiteSpace: 'pre-wrap'}}>
                              {msg.text}
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

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
  }, [auth.token]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8001/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, domain, priority_criteria: priority })
      });
      setTitle(''); setDesc(''); setDomain(''); setPriority('');
      setShowCreateJob(false);
      fetchJobs();
    } catch(e) {
      alert("Erreur de création d'offre");
    }
  };

  const openDecisionModal = (appId: number, type: 'accepted' | 'rejected' | 'saved', app: any) => {
      let defaultText = "";
      if (type === 'accepted') defaultText = `Bonjour ${app.candidate_name},\n\nSuite à votre excellent entretien IA, j'ai le plaisir de vous annoncer que votre profil est retenu pour le poste de ${app.job_title}. \n\nVous trouverez ci-joint les détails pour les prochaines étapes.`;
      if (type === 'saved') defaultText = `Bonjour ${app.candidate_name},\n\nMerci de l'intérêt porté à ${app.job_title}. Bien que votre profil soit intéressant, nous le conservons précieusement pour de futures opportunités mieux alignées.`;
      if (type === 'rejected') defaultText = `Bonjour ${app.candidate_name},\n\nMalgré un parcours intéressant, votre profil ne correspond pas exactement à nos attentes actuelles pour le poste de ${app.job_title}. Bonne continuation.`;
      
      setDecisionText(defaultText);
      setDecisionModal({ type, appId });
  };

  const submitDecision = async () => {
    if (!decisionModal) return;
    try {
      await fetch(`http://localhost:8002/${decisionModal.appId}/decision`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decisionModal.type, comment: decisionText })
      });
      setDecisionModal(null);
      fetchApps();
    } catch(e) {
      alert("Erreur");
    }
  };

  const submitBulkDecision = async () => {
    if (!bulkModal || !selectedJob) return;
    const { startRank, endRank, type } = bulkModal;
    
    const jobAppsFiltered = apps.filter(a => a.job_title === selectedJob.title)
                        .sort((a,b) => ((b.cv_score+(b.interview_score||0)) - (a.cv_score+(a.interview_score||0))));
    
    const startIdx = Math.max(0, startRank - 1);
    const endIdx = Math.min(jobAppsFiltered.length, endRank);
    const subset = jobAppsFiltered.slice(startIdx, endIdx);
    
    if (subset.length === 0) {
        alert("Aucun candidat dans ces rangs.");
        return;
    }
    
    // Act on all selected regardless of status so RH can override
    try {
        await Promise.all(subset.map(app => 
            fetch(`http://localhost:8002/${app.id}/decision`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision: type, comment: bulkText })
            })
        ));
        setBulkModal(null);
        fetchApps();
    } catch(e) {
        alert("Erreur lors du traitement par lot.");
    }
  };


  // KPIs
  const totalJobs = jobs.length;
  const totalApps = apps.length;
  const acceptedApps = apps.filter(a => a.status === 'accepted').length;

  if (selectedJob) {
      const jobApps = apps.filter(a => a.job_title === selectedJob.title)
                          .sort((a,b) => ((b.cv_score+(b.interview_score||0)) - (a.cv_score+(a.interview_score||0))));
      
      return (
        <div className="animate-fade">
          <div className="header" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
             <button onClick={() => setSelectedJob(null)} className="btn btn-secondary" style={{padding: '0.4rem', borderRadius: '50%'}}>
                 <ChevronLeft />
             </button>
             <div>
                <h1 style={{margin: 0}}>Candidats : {selectedJob.title}</h1>
                <p style={{margin: '0.2rem 0 0 0'}}>Classement global basé sur l'IA et compétences extraites.</p>
             </div>
             <div style={{marginLeft: 'auto'}}>
                <button onClick={() => { setBulkModal({type: 'rejected', startRank: 1, endRank: jobApps.length}); setBulkText("Bonjour,\n\nMalgré la qualité de votre profil, nous ne donnons pas suite. Bonne continuation."); }} className="btn btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#334155', color: 'white'}}>
                    <CheckCircle size={16} /> Traitement par Lot (Rangs)
                </button>
             </div>
          </div>

          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
               <thead style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0'}}>
                  <tr>
                    <th style={{padding: '1rem', fontWeight: 600, color: '#475569'}}>Rang</th>
                    <th style={{padding: '1rem', fontWeight: 600, color: '#475569'}}>Candidat</th>
                    <th style={{padding: '1rem', fontWeight: 600, color: '#475569'}}>Profil & Compétences</th>
                    <th style={{padding: '1rem', fontWeight: 600, color: '#475569'}}>Score Cumulé</th>
                    <th style={{padding: '1rem', fontWeight: 600, color: '#475569'}}>Statut & Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {jobApps.length === 0 && <tr><td colSpan={5} style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>Aucune candidature pour cette offre.</td></tr>}
                  {jobApps.map((app, idx) => {
                      const totalScore = app.interview_score ? Math.round((app.cv_score + app.interview_score) / 2) : 'N/A';
                      return (
                        <tr key={app.id} style={{borderBottom: '1px solid #f1f5f9', background: app.status === 'accepted' ? '#f0fdf4' : (app.status === 'rejected' ? '#fef2f2' : (app.status === 'saved' ? '#f8fafc' : '#fff'))}}>
                            <td style={{padding: '1rem'}}>
                                {idx === 0 ? <Award color="#eab308" /> : `#${idx + 1}`}
                            </td>
                            <td style={{padding: '1rem'}}>
                                <div style={{fontWeight: 600, color: '#1e293b'}}>{app.candidate_name}</div>
                                <div style={{fontSize: '0.8rem', color: '#64748b'}}>{app.candidate_email}</div>
                            </td>
                            <td style={{padding: '1rem'}}>
                                <div style={{fontSize: '0.85rem', color: '#334155', maxWidth: '280px'}}>
                                    {app.hr_report ? (
                                        <>
                                            <strong>Synthèse:</strong> {app.hr_report.synthese?.length > 100 ? app.hr_report.synthese.substring(0, 100) + '...' : app.hr_report.synthese}<br/>
                                            <strong style={{color: (app.hr_report.recommandation_finale||'').includes('Non') ? '#ef4444' : '#16a34a'}}>Reco:</strong> {app.hr_report.recommandation_finale || 'N/A'}
                                        </>
                                    ) : (
                                        app.ai_comments ? app.ai_comments : <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Entretien non passé</span>
                                    )}
                                </div>
                                <div style={{marginTop: '0.4rem'}}>
                                    {app.parsed_skills?.slice(0, 3).map((s: string, i: number) => <span key={i} style={{marginRight: '0.3rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#475569'}}>{s}</span>)}
                                    {(app.parsed_skills?.length || 0) > 3 && <span style={{fontSize: '0.7rem', color: '#64748b'}}>+{app.parsed_skills.length - 3}</span>}
                                </div>
                            </td>
                            <td style={{padding: '1rem'}}>
                                <div style={{fontWeight: 700, fontSize: '1.1rem', color: totalScore !== 'N/A' && (totalScore as number) > 75 ? '#16a34a' : '#ea580c'}}>{totalScore}%</div>
                                <div style={{fontSize: '0.7rem', color: '#64748b'}}>CV: {app.cv_score}% | Oral: {app.interview_score ?? 'N/A'}%</div>
                            </td>
                            <td style={{padding: '1rem'}}>
                                <div style={{marginBottom: '0.5rem'}}>
                                    <span className={`badge badge-${app.status}`}>{app.status === 'pending' ? 'En attente' : app.status === 'saved' ? 'Mis de côté' : app.status === 'accepted' ? 'Accepté' : 'Rejeté'}</span>
                                </div>
                                {app.status === 'pending' && app.interview_score !== null && (
                                   <div style={{display: 'flex', gap: '0.3rem', flexWrap: 'wrap',  maxWidth: '200px', marginBottom: '0.5rem'}}>
                                      <button className="btn" style={{background: '#22c55e', padding: '0.3rem 0.5rem', fontSize: '0.75rem'}} onClick={() => openDecisionModal(app.id, 'accepted', app)}>Accepter</button>
                                      <button className="btn" style={{background: '#3b82f6', padding: '0.3rem 0.5rem', fontSize: '0.75rem'}} onClick={() => openDecisionModal(app.id, 'saved', app)}>Garder</button>
                                      <button className="btn" style={{background: '#ef4444', padding: '0.3rem 0.5rem', fontSize: '0.75rem'}} onClick={() => openDecisionModal(app.id, 'rejected', app)}>Rejeter</button>
                                   </div>
                                )}
                                {app.interview_score !== null && (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.3rem'}}>
                                        <button onClick={() => setTranscriptModal(app.transcript || "La transcription détaillée n'a pas été sauvegardée pour cette ancienne session.")} className="btn btn-secondary mt-1" style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#e2e8f0', color: '#334155'}}>
                                            <MessageSquareText size={14} /> Lire Transcript
                                        </button>
                                        {app.hr_report && (
                                            <button onClick={() => setHrReportModal(app.hr_report)} className="btn mt-1" style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f59e0b', color: 'white', border: 'none'}}>
                                                <Award size={14} /> Rapport RH Complet
                                            </button>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                      )
                  })}
               </tbody>
            </table>
          </div>

          {/* Transcript Popup */}
          {transcriptModal && (
            <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'}}>
                <div className="card animate-fade" style={{width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', margin: 'auto'}}>
                    <div className="flex-between" style={{padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0}}>
                        <h3 style={{margin: 0}}>Transcription de l'Entretien</h3>
                        <button onClick={() => setTranscriptModal(null)} className="btn btn-secondary" style={{padding: '0.3rem'}}><X size={18} /></button>
                    </div>
                    <div style={{overflowY: 'auto', background: '#f1f5f9', padding: '1.5rem', flex: 1, minHeight: 0}}>
                        {renderTranscript(transcriptModal)}
                    </div>
                </div>
            </div>
          )}

          {/* HR Report Popup */}
          {hrReportModal && (
            <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'}}>
                <div className="card animate-fade" style={{width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', margin: 'auto'}}>
                    <div className="flex-between" style={{padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0}}>
                        <h3 style={{margin: 0}}>Rapport d'Évaluation RH</h3>
                        <button onClick={() => setHrReportModal(null)} className="btn btn-secondary" style={{padding: '0.3rem'}}><X size={18} /></button>
                    </div>
                    <div style={{overflowY: 'auto', background: '#fff', padding: '1.5rem', flex: 1, minHeight: 0}}>
                        <h4 style={{marginTop: 0, color: '#1e293b'}}>Candidat: {hrReportModal.nom_candidat}</h4>
                        
                        <div style={{background: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                            <h5 style={{margin: '0 0 0.5rem 0', color: '#475569'}}>Recommandation Finale</h5>
                            <div style={{fontWeight: 700, fontSize: '1.1rem', color: (hrReportModal.recommandation_finale||'').includes('Non') ? '#ef4444' : '#16a34a'}}>
                                {hrReportModal.recommandation_finale}
                            </div>
                        </div>

                        <h5 style={{color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem'}}>Score Global : <span style={{color: '#ea580c'}}>{hrReportModal.score_global}/100</span></h5>
                        <p style={{fontSize: '0.9rem', color: '#334155', lineHeight: 1.6}}>{hrReportModal.synthese}</p>

                        <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                            <div style={{flex: 1, background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
                                <h5 style={{margin: '0 0 0.5rem 0', color: '#166534'}}>Points Forts</h5>
                                <ul style={{margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#15803d'}}>
                                    {hrReportModal.points_forts?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                            <div style={{flex: 1, background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca'}}>
                                <h5 style={{margin: '0 0 0.5rem 0', color: '#991b1b'}}>Points Faibles</h5>
                                <ul style={{margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#b91c1c'}}>
                                    {hrReportModal.points_faibles?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        </div>

                        <h5 style={{color: '#475569', marginTop: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem'}}>Évaluations Détaillées</h5>
                        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                            <tbody>
                                <tr style={{borderBottom: '1px solid #f1f5f9'}}>
                                    <td style={{padding: '0.5rem', fontWeight: 600}}>Niveau de langue</td>
                                    <td style={{padding: '0.5rem', color: '#ea580c', fontWeight: 700}}>{hrReportModal.niveau_langue?.note}/100</td>
                                    <td style={{padding: '0.5rem', color: '#64748b'}}>{hrReportModal.niveau_langue?.commentaire}</td>
                                </tr>
                                <tr style={{borderBottom: '1px solid #f1f5f9'}}>
                                    <td style={{padding: '0.5rem', fontWeight: 600}}>Politesse & Présentation</td>
                                    <td style={{padding: '0.5rem', color: '#ea580c', fontWeight: 700}}>{hrReportModal.politesse?.note}/100</td>
                                    <td style={{padding: '0.5rem', color: '#64748b'}}>{hrReportModal.politesse?.commentaire}</td>
                                </tr>
                                <tr style={{borderBottom: '1px solid #f1f5f9'}}>
                                    <td style={{padding: '0.5rem', fontWeight: 600}}>Qualité des réponses</td>
                                    <td style={{padding: '0.5rem', color: '#ea580c', fontWeight: 700}}>{hrReportModal.qualite_reponse?.note}/100</td>
                                    <td style={{padding: '0.5rem', color: '#64748b'}}>{hrReportModal.qualite_reponse?.commentaire}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {/* Decision Popup */}
          {decisionModal && (
            <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'}}>
                <div className="card animate-fade" style={{width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', margin: 'auto'}}>
                    <div className="flex-between" style={{padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0}}>
                        <h3 style={{margin: 0}}>Rédaction de la décision</h3>
                        <button onClick={() => setDecisionModal(null)} className="btn btn-secondary" style={{padding: '0.3rem'}}><X size={18} /></button>
                    </div>
                    <div style={{padding: '1.5rem', overflowY: 'auto', flex: 1}}>
                        <p style={{fontSize: '0.85rem', color: '#64748b', marginTop: 0, marginBottom: '1rem'}}>Ce message sera visible par le candidat dans son espace.</p>
                    <textarea 
                        value={decisionText} 
                        onChange={(e) => setDecisionText(e.target.value)}
                        style={{width: '100%', height: '200px', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'none'}}
                    />
                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
                        <button onClick={() => setDecisionModal(null)} className="btn btn-secondary">Annuler</button>
                        <button onClick={submitDecision} className="btn" style={{background: decisionModal.type === 'accepted' ? '#22c55e' : (decisionModal.type === 'rejected' ? '#ef4444' : '#3b82f6')}}>
                            Confirmer & Envoyer
                        </button>
                    </div>
                   </div>
                </div>
            </div>
          )}

          {/* Bulk Decision Popup */}
          {bulkModal && (
            <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'}}>
                <div className="card animate-fade" style={{width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', margin: 'auto'}}>
                    <div className="flex-between" style={{padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0}}>
                        <h3 style={{margin: 0}}>Traitement par Lot</h3>
                        <button onClick={() => setBulkModal(null)} className="btn btn-secondary" style={{padding: '0.3rem'}}><X size={18} /></button>
                    </div>
                    <div style={{padding: '1.5rem', overflowY: 'auto', flex: 1}}>
                        <p style={{fontSize: '0.85rem', color: '#64748b', marginTop: 0}}>Définissez l'action, la plage de rangs et le message à envoyer.</p>
                    
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                        <div style={{flex: 1}}>
                            <label style={{fontSize: '0.85rem', fontWeight: 600}}>Du Rang :</label>
                            <input type="number" min="1" value={bulkModal.startRank} onChange={e => setBulkModal({...bulkModal, startRank: parseInt(e.target.value)||1})} style={{width: '100%', padding: '0.5rem'}} />
                        </div>
                        <div style={{flex: 1}}>
                            <label style={{fontSize: '0.85rem', fontWeight: 600}}>Au Rang :</label>
                            <input type="number" min="1" value={bulkModal.endRank} onChange={e => setBulkModal({...bulkModal, endRank: parseInt(e.target.value)||1})} style={{width: '100%', padding: '0.5rem'}} />
                        </div>
                    </div>
                    
                    <div style={{marginBottom: '1rem'}}>
                        <label style={{fontSize: '0.85rem', fontWeight: 600}}>Action à appliquer :</label>
                        <select value={bulkModal.type} onChange={e => setBulkModal({...bulkModal, type: e.target.value as any})} style={{width: '100%', padding: '0.5rem'}}>
                            <option value="accepted">Accepter</option>
                            <option value="saved">Garder (Mettre de côté)</option>
                            <option value="rejected">Rejeter</option>
                        </select>
                    </div>

                    <p style={{fontSize: '0.85rem', margin: '0 0 0.5rem 0', color: '#64748b'}}>Message unique qui sera envoyé à ces {Math.max(0, bulkModal.endRank - bulkModal.startRank + 1)} candidat(s) :</p>
                    <textarea 
                        value={bulkText} 
                        onChange={(e) => setBulkText(e.target.value)}
                        style={{width: '100%', height: '120px', padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'none'}}
                    />
                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem'}}>
                        <button onClick={() => setBulkModal(null)} className="btn btn-secondary">Annuler</button>
                        <button onClick={submitBulkDecision} className="btn" style={{background: '#334155', width: '100%'}}>
                            Appliquer à {bulkModal.endRank - bulkModal.startRank + 1} candidat(s)
                        </button>
                    </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      );
  }

  return (
    <div className="animate-fade">
      <div className="header flex-between">
        <div>
           <h1>Dashboard RH</h1>
           <p>Gérez vos offres et vos bassins de candidatures.</p>
        </div>
        <button onClick={() => setShowCreateJob(true)} className="btn" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Plus size={18} /> Créer une offre
        </button>
      </div>

      <div className="grid">
         <div className="card kpi-card">
          <div className="kpi-value">{totalJobs}</div>
          <div className="kpi-label">OFFRES ACTIVES</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{color: '#3b82f6'}}>{totalApps}</div>
          <div className="kpi-label">CANDIDATS REÇUS</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{color: '#22c55e'}}>{acceptedApps}</div>
          <div className="kpi-label">TALENTS RECRUTÉS</div>
        </div>
      </div>

      <h3 style={{marginTop: '3rem', marginBottom: '1.5rem', color: '#1e293b'}}>Vos Offres d'Emploi</h3>
      <div className="grid">
          {jobs.map(job => {
              const jobCandidates = apps.filter(a => a.job_title === job.title);
              const enCours = jobCandidates.filter(a => a.status === 'pending').length;
              return (
                 <div key={job.id} onClick={() => setSelectedJob(job)} className="card" style={{cursor: 'pointer', transition: 'transform 0.2s', borderTop: '4px solid var(--marrakech-orange)'}} 
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                     <div className="flex-between" style={{marginBottom: '0.5rem'}}>
                         <span style={{fontSize: '0.8rem', background: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '12px'}}>{job.domain}</span>
                         <Users size={18} color="#94a3b8" />
                     </div>
                     <h3 style={{margin: '0.5rem 0', color: '#1e293b'}}>{job.title}</h3>
                     <p style={{fontSize: '0.9rem', color: '#64748b', display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                         {job.description}
                     </p>
                     
                     <div style={{marginTop: '1.5rem', display: 'flex', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem'}}>
                         <div style={{flex: 1}}>
                             <div style={{fontSize: '1.2rem', fontWeight: 600, color: '#3b82f6'}}>{jobCandidates.length}</div>
                             <div style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>Candidats</div>
                         </div>
                         <div style={{flex: 1}}>
                             <div style={{fontSize: '1.2rem', fontWeight: 600, color: '#eab308'}}>{enCours}</div>
                             <div style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>En traitement</div>
                         </div>
                     </div>
                 </div>
              )
          })}
          {jobs.length === 0 && <p style={{color: '#94a3b8', gridColumn: '1 / -1'}}>Aucune offre d'emploi active. Créez-en une pour commencer.</p>}
      </div>

      {showCreateJob && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100}}>
            <div className="card animate-fade" style={{width: '90%', maxWidth: '600px'}}>
              <div className="flex-between" style={{marginBottom: '1rem'}}>
                  <h3 style={{margin: 0}}>Créer une nouvelle offre d'emploi</h3>
                  <button onClick={() => setShowCreateJob(false)} className="btn btn-secondary" style={{padding: '0.3rem'}}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateJob}>
                <div style={{display: 'flex', gap: '1rem'}}>
                    <input style={{flex: 2}} placeholder="Titre de l'offre" required value={title} onChange={e => setTitle(e.target.value)} />
                    <input style={{flex: 1}} placeholder="Domaine (ex: IT)" required value={domain} onChange={e => setDomain(e.target.value)} />
                </div>
                <textarea placeholder="Description longue et contexte..." rows={5} required value={desc} onChange={e => setDesc(e.target.value)} style={{marginTop: '1rem'}}></textarea>
                
                <div style={{marginTop: '1rem', padding: '1rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px'}}>
                    <label style={{display: 'block', fontSize: '0.85rem', color: '#ea580c', fontWeight: 600, marginBottom: '0.5rem'}}>Critère Prioritaire OBLIGATOIRE (Invisible au candidat)</label>
                    <p style={{fontSize: '0.8rem', color: '#fb923c', marginBottom: '0.5rem'}}>L'IA vérifiera automatiquement ce point pendant l'entretien oral.</p>
                    <input placeholder="Ex: Doit absolument avoir déjà déployé sur AWS" required value={priority} onChange={e => setPriority(e.target.value)} style={{margin: 0, background: '#fff'}} />
                </div>
                <button className="btn w-full mt-2" type="submit" style={{padding: '0.8rem', fontSize: '1rem'}}>Publier l'offre</button>
              </form>
            </div>
        </div>
      )}
    </div>
  );
}
