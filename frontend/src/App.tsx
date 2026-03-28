import React, { useState, useRef } from 'react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('job');

  // Job State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobResult, setJobResult] = useState<any>(null);
  const [loadingJob, setLoadingJob] = useState(false);

  // CV State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvResult, setCvResult] = useState<any>(null);
  const [loadingCv, setLoadingCv] = useState(false);

  // Interview State
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const startInterview = () => {
    try {
      ws.current = new WebSocket('ws://localhost:8003/ws');
      ws.current.onopen = () => {
        setIsRecording(true);
        setMessages(prev => [...prev, { sender: 'System', text: 'Connected! You can now start speaking.' }]);
      };
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.candidate_text) setMessages(prev => [...prev, { sender: 'Candidate (Transcribed)', text: data.candidate_text }]);
        setMessages(prev => [...prev, { sender: 'AI', text: data.ai_text }]);
        if (data.ai_audio_b64) {
             const audio = new Audio("data:audio/mp3;base64," + data.ai_audio_b64);
             audio.play().catch(e => console.error("Audio playback failed:", e));
        } else {
             const utterance = new SpeechSynthesisUtterance(data.ai_text);
             utterance.lang = "en-US";
             window.speechSynthesis.speak(utterance);
        }
      };
      ws.current.onclose = () => {
         setIsRecording(false);
         setMessages(prev => [...prev, { sender: 'System', text: 'Disconnected.' }]);
      }
    } catch(e) { console.error(e); }
  };

  const endInterview = () => {
    if (ws.current) ws.current.close();
    setIsRecording(false);
    setIsRecordingMic(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.start();
      setIsRecordingMic(true);
    } catch (err) {
      console.error(err);
      alert("Please allow microphone access to talk to the AI.");
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(audioBlob);
          setMessages(prev => [...prev, { sender: 'System', text: 'Processing your answer...' }]);
        }
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
    }
  };

  const handleJobSubmit = async () => {
    setLoadingJob(true);
    try {
      const res = await fetch('http://localhost:8001/jobs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: jobTitle, description: jobDesc })
      });
      const data = await res.json();
      setJobResult(data);
    } catch (e) {
      alert('Error connecting to Job Service.');
    }
    setLoadingJob(false);
  };

  const handleCvUpload = async () => {
    if (!cvFile) return;
    setLoadingCv(true);
    const formData = new FormData();
    formData.append('file', cvFile);
    try {
      const res = await fetch('http://localhost:8002/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setCvResult(data);
    } catch (e) {
      alert('Error connecting to CV Service.');
    }
    setLoadingCv(false);
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">Smart Recruit UI</div>
        <div className={`nav-item ${activeTab === 'job' ? 'active' : ''}`} onClick={() => setActiveTab('job')}>1. Job Posting</div>
        <div className={`nav-item ${activeTab === 'cv' ? 'active' : ''}`} onClick={() => setActiveTab('cv')}>2. CV Upload</div>
        <div className={`nav-item ${activeTab === 'interview' ? 'active' : ''}`} onClick={() => setActiveTab('interview')}>3. AI Interview</div>
        <div className={`nav-item ${activeTab === 'score' ? 'active' : ''}`} onClick={() => setActiveTab('score')}>4. Evaluation</div>
      </aside>
      <main className="main-content">
        {activeTab === 'job' && (
          <div className="animate-fade">
            <div className="header"><h1>Create Job Offering</h1><p>Publish a new job and let AI extract the key skills.</p></div>
            <div className="card">
              <h3>Job Details</h3>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} type="text" placeholder="Job Title" />
              <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={4} placeholder="Description..."></textarea>
              <button className="btn" onClick={handleJobSubmit} disabled={loadingJob}>{loadingJob ? 'Extracting...' : 'Extract Skills & Publish'}</button>
              {jobResult && (
                <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid #3b82f6'}}>
                  <h4 style={{color: '#60a5fa'}}>Successfully created: {jobResult.title}</h4>
                  <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem'}}>
                    {JSON.parse(jobResult.skills_required || '[]').map((skill: string, i: number) => (
                      <span key={i} style={{background: '#3b82f6', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem'}}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'cv' && (
          <div className="animate-fade">
            <div className="header"><h1>Candidate CV Portal</h1><p>Upload candidate documents to parse information seamlessly.</p></div>
            <div className="card">
              <h3>Upload Document</h3>
              <div style={{ padding: '2rem', border: '2px dashed rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '1rem', borderRadius: '8px' }}>
                <input type="file" accept=".pdf,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} style={{background: 'transparent', border: 'none'}} />
                <button className="btn btn-accent" onClick={handleCvUpload} disabled={!cvFile || loadingCv} style={{display: 'block', margin: '1rem auto 0'}}>
                  {loadingCv ? 'Parsing AI...' : 'Upload & View Extractions'}
                </button>
              </div>
              {cvResult && (
                <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid #10b981'}}>
                  <h4 style={{color: '#34d399'}}>Candidate Parsed: {cvResult.name || 'Unknown'}</h4>
                  <p>Experience: {cvResult.experience} years</p>
                  <p>Education: {cvResult.education}</p>
                  <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem'}}>
                    {JSON.parse(cvResult.skills || '[]').map((skill: string, i: number) => (
                      <span key={i} style={{background: '#10b981', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem'}}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'interview' && (
          <div className="animate-fade">
            <div className="header"><h1>Interactive AI Interview</h1><p>Real-time vocal interview powered by WebSockets, Whisper, and ElevenLabs.</p></div>
            <div className="grid">
              <div className="card">
                <h3>Voice Agent Status</h3>
                <p style={{ color: isRecording ? '#10b981' : '#94a3b8', fontWeight: 'bold', marginTop: '1rem' }}>
                  {isRecording ? '● Online & Listening' : '○ Offline'}
                </p>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  {!isRecording ? (
                    <button className="btn" onClick={startInterview}>Connect to Call</button>
                  ) : (
                    <button className="btn" style={{ background: '#ef4444' }} onClick={endInterview}>End Call</button>
                  )}
                </div>
                {isRecording && (
                    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}>
                        <h4>Your Turn</h4>
                        {!isRecordingMic ? (
                             <button className="btn btn-accent" onClick={startRecording} style={{width: '100%'}}>🎤 Start Speaking</button>
                        ) : (
                             <button className="btn" onClick={stopRecordingAndSend} style={{width: '100%', background: '#f59e0b'}}>⏹ Stop & Send Answer</button>
                        )}
                    </div>
                )}
              </div>
              <div className="card">
                <h3>Live Transcript log</h3>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', height: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {messages.length === 0 ? <p style={{color: '#64748b', fontStyle: 'italic'}}>No messages yet...</p> : null}
                  {messages.map((m, i) => (
                    <div key={i} style={{color: m.sender === 'System' ? '#cbd5e1' : m.sender === 'AI' ? '#60a5fa' : '#34d399'}}>
                      <strong>{m.sender}:</strong> {m.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'score' && (
           <div className="animate-fade">
             <div className="header"><h1>Candidate Evaluation (Mock)</h1></div>
             <div className="grid">
               <div className="card">
                 <h3>Final Score: John Doe</h3>
                 <h1 style={{ fontSize: '3rem', color: '#34d399', margin: '1rem 0' }}>82/100</h1>
                 <button className="btn" style={{ width: '100%' }}>View Full PDF Report</button>
               </div>
             </div>
           </div>
         )}
      </main>
    </div>
  );
}
export default App;
