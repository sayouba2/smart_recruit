import React, { useState, useRef } from 'react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('job');

  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobResult, setJobResult] = useState<any>(null);
  const [loadingJob, setLoadingJob] = useState(false);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvResult, setCvResult] = useState<any>(null);
  const [loadingCv, setLoadingCv] = useState(false);

  // Interview state
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingMicRef = useRef(false);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSessionId = useRef<string>("");
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);

  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const ws = useRef<WebSocket | null>(null);
  
  const [interviewResult, setInterviewResult] = useState<any>(null);

  const startInterview = () => {
    try {
      const jobParam = encodeURIComponent(jobTitle || 'Développeur Python Senior');
      ws.current = new WebSocket(`ws://localhost:8003/ws?job=${jobParam}`);
      ws.current.onopen = () => {
        setIsRecording(true);
        setMessages([{ sender: 'System', text: 'Connected! Waiting for AI to ask the first question...' }]);
      };
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.session_id) currentSessionId.current = data.session_id;
        
        setMessages(prev => [...prev, { sender: 'AI', text: data.ai_text }]);

        const playAudio = async () => {
            if (data.ai_audio_b64) {
                 const audio = new Audio("data:audio/mp3;base64," + data.ai_audio_b64);
                 audio.onended = () => { if (!data.is_finished) startRecordingVAD(); };
                 await audio.play().catch((e) => {
                     console.error("Audio playback error:", e);
                     if (!data.is_finished) startRecordingVAD();
                 });
            } else {
                 const utterance = new SpeechSynthesisUtterance(data.ai_text);
                 utterance.lang = "fr-FR";
                 utterance.onend = () => { if (!data.is_finished) startRecordingVAD(); };
                 window.speechSynthesis.speak(utterance);
            }
        };
        playAudio();
      };
      ws.current.onclose = () => setIsRecording(false);
    } catch(e) { console.error(e); }
  };

  const startRecordingVAD = async () => {
    if (isRecordingMicRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 512;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSilence = () => {
        if (!isRecordingMicRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;

        if (average > 10) { // Speaking
           if (silenceTimeoutRef.current) {
               clearTimeout(silenceTimeoutRef.current);
               silenceTimeoutRef.current = null;
           }
        } else { // Silent
           if (!silenceTimeoutRef.current && isRecordingMicRef.current) {
               silenceTimeoutRef.current = setTimeout(() => {
                   if (isRecordingMicRef.current) stopVADAndSend();
               }, 2500); // 2.5s silence triggers send
           }
        }
        if (isRecordingMicRef.current) requestAnimationFrame(checkSilence);
      };

      mediaRecorder.ondataavailable = (e) => {
         if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      isRecordingMicRef.current = true;
      setIsRecordingMic(true);
      checkSilence();

    } catch (err) {
      alert("Microphone required to speak to AI.");
    }
  };

  const stopVADAndSend = () => {
    if (!isRecordingMicRef.current || !mediaRecorderRef.current) return;
    isRecordingMicRef.current = false;
    setIsRecordingMic(false);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        setMessages(prev => [...prev, { sender: 'Candidate', text: '[Audio answer sent automatically via Silence Detection]' }]);
        ws.current.send(audioBlob);
      }
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    };
    mediaRecorderRef.current.stop();
  };

  const endInterview = async () => {
    if (ws.current) ws.current.close();
    setIsRecording(false);
    if (isRecordingMicRef.current) {
         isRecordingMicRef.current = false;
         setIsRecordingMic(false);
         mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    }

    if (currentSessionId.current) {
        setIsGeneratingAnalysis(true);
        try {
            setMessages(prev => [...prev, { sender: 'System', text: 'Analysing entire session with GPT and Whisper, please wait...' }]);
            const res = await fetch('http://localhost:8004/analyze_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: currentSessionId.current })
            });
            const data = await res.json();
            setInterviewResult(data);
            setActiveTab('score');
        } catch (e) {
            console.error(e);
            alert("Analysis backend not running (port 8004) or failed.");
        }
        setIsGeneratingAnalysis(false);
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
            <div className="header"><h1>Create Job Offering</h1></div>
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
            <div className="header"><h1>Candidate CV Portal</h1></div>
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
            <div className="header"><h1>Interactive AI Interview</h1><p>Hands-free audio using Web Audio API silence detection.</p></div>
            <div className="grid">
              <div className="card">
                <h3>Voice Agent Status</h3>
                <p style={{ color: isRecording ? '#10b981' : '#94a3b8', fontWeight: 'bold', marginTop: '1rem' }}>
                  {isRecording ? '● Online' : '○ Offline'}
                </p>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  {!isRecording ? (
                    <button className="btn" onClick={startInterview}>Connect to Call</button>
                  ) : (
                    <button className="btn" style={{ background: '#ef4444' }} onClick={endInterview} disabled={isGeneratingAnalysis}>
                        {isGeneratingAnalysis ? "Analysing... please wait" : "End Call (Trigger Post-Analysis)"}
                    </button>
                  )}
                </div>
                {isRecording && (
                    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}>
                        <h4 style={{color: isRecordingMic ? '#34d399' : '#94a3b8'}}>
                            {isRecordingMic ? '🎤 L\'IA vous écoute (Parlez...)' : 'L\'IA est en train de parler...'}
                        </h4>
                        {isRecordingMic && <p style={{fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem'}}>L'enregistrement s'arrêtera automatiquement dès que vous ferez un blanc de 2,5 secondes.</p>}
                    </div>
                )}
              </div>
              <div className="card">
                <h3>Event log</h3>
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
             <div className="header"><h1>Candidate Evaluation (Final)</h1></div>
             <div className="grid">
               <div className="card">
                 <h3>Final Interview Score</h3>
                 <h1 style={{ fontSize: '3rem', color: '#34d399', margin: '1rem 0' }}>
                    {interviewResult ? interviewResult.final_interview_score : 0}/100
                 </h1>
                 {interviewResult?.evaluation && Object.entries(interviewResult.evaluation).map(([k, v]) => (
                     <p key={k}><b>{k}</b>: {String(v)}</p>
                 ))}
               </div>
               <div className="card" style={{gridColumn: 'span 2'}}>
                 <h3>Full Transcript</h3>
                 <pre style={{whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding:'1rem', borderRadius: '8px', marginTop: '1rem', maxHeight: '400px', overflowY: 'auto'}}>
                     {interviewResult ? interviewResult.transcript : "No data"}
                 </pre>
               </div>
             </div>
           </div>
         )}
      </main>
    </div>
  );
}
export default App;
