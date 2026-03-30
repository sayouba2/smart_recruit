import { useState, useRef, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Mic } from 'lucide-react';

export default function InterviewRoom() {
  const { auth } = useContext(AuthContext);
  const { application_id } = useParams();
  const navigate = useNavigate();

  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [volume, setVolume] = useState(0); // For pulsing mic visual
  
  const ws = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingMicRef = useRef(false);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSessionId = useRef<string>("");

  // Persistent Audio Streams
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const isInterviewActiveRef = useRef(false);

  // Initialize Mic once on human click
  const initGlobalMicrophone = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          
          source.connect(analyser);
          analyser.fftSize = 512;
          
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

          // Continuous visual volume monitor
          const updateVolume = () => {
              if (analyserRef.current && dataArrayRef.current && isInterviewActiveRef.current) {
                  analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                  let sum = 0;
                  for(let i=0; i<dataArrayRef.current.length; i++) sum += dataArrayRef.current[i];
                  setVolume(sum / dataArrayRef.current.length);
                  requestAnimationFrame(updateVolume);
              }
          };
          updateVolume();
          return true;
      } catch (e) {
          alert("Erreur: Impossible d'accéder au microphone.");
          return false;
      }
  };

  const startInterview = async () => {
    isInterviewActiveRef.current = true;
    const micReady = await initGlobalMicrophone();
    if (!micReady) return;

    try {
      ws.current = new WebSocket(`ws://localhost:8004/ws/${application_id}?token=${auth.token}`);
      
      ws.current.onopen = () => {
        setIsRecording(true);
        setMessages([{ sender: 'System', text: 'Connexion établie. L\'IA prépare la première question...' }]);
      };
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.session_id) currentSessionId.current = data.session_id;
        
        setMessages(prev => [...prev, { sender: 'IA Recruteur', text: data.ai_text }]);

        const playAudio = async () => {
            if (data.ai_audio_b64) {
                 const audio = new Audio("data:audio/mp3;base64," + data.ai_audio_b64);
                 audio.onended = () => { if (!data.is_finished) startRecordingVAD(); else endInterview(); };
                 await audio.play().catch((e) => {
                     console.error("Erreur de lecture:", e);
                     if (!data.is_finished) startRecordingVAD(); else endInterview();
                 });
            } else {
                 const utterance = new SpeechSynthesisUtterance(data.ai_text);
                 utterance.lang = "fr-FR";
                 utterance.onend = () => { if (!data.is_finished) startRecordingVAD(); else endInterview(); };
                 window.speechSynthesis.speak(utterance);
            }
        };
        playAudio();
      };
      
      ws.current.onclose = () => {
        // Only set recording to false if it wasn't a standard finish (the audio.onended will handle endInterview)
        if (!isInterviewActiveRef.current) setIsRecording(false);
      };
    } catch(e) { console.error(e); }
  };

  const startRecordingVAD = () => {
    if (isRecordingMicRef.current) return;
    if (!streamRef.current || !analyserRef.current || !dataArrayRef.current) return; // Ensure global mic is ready

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const checkSilence = () => {
        if (!isRecordingMicRef.current || !analyserRef.current || !dataArrayRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        let sum = 0;
        for(let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i];
        const average = sum / dataArrayRef.current.length;

        // VAD Logic
        if (average > 10) { 
           if (silenceTimeoutRef.current) {
               clearTimeout(silenceTimeoutRef.current);
               silenceTimeoutRef.current = null;
           }
        } else { 
           // If silent and no timeout exists, set one
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
      alert("Erreur d'enregistrement vocal.");
    }
  };

  const stopVADAndSend = () => {
    if (!isRecordingMicRef.current || !mediaRecorderRef.current) return;
    isRecordingMicRef.current = false;
    setIsRecordingMic(false);
    
    if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
    }

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        setMessages(prev => [...prev, { sender: 'Vous', text: '[Audio Envoyé - Analyse AI...]' }]);
        ws.current.send(audioBlob);
      }
      // CRITICAL OMISSION: We DO NOT stop the stream tracks here anymore.
      // This allows the microphone to remain active for the next AI turn.
    };
    mediaRecorderRef.current.stop();
  };

  const endInterview = async () => {
    isInterviewActiveRef.current = false; // Stop volume loop
    if (ws.current) ws.current.close();
    
    setIsRecording(false);
    if (isRecordingMicRef.current) {
         isRecordingMicRef.current = false;
         setIsRecordingMic(false);
         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
             mediaRecorderRef.current.stop();
         }
    }

    // Fully cleanup global streams
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    if (currentSessionId.current) {
        setIsGeneratingAnalysis(true);
        try {
            setMessages(prev => [...prev, { sender: 'System', text: 'Génération du rapport RH final en cours...' }]);
            await fetch('http://localhost:8003/analyze_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
                body: JSON.stringify({ session_id: currentSessionId.current, application_id: application_id })
            });
            alert('Entretien terminé avec succès.');
        } catch (e) {
            console.error(e);
            alert("Erreur de sauvegarde de l'entretien.");
        }
        setIsGeneratingAnalysis(false);
        navigate('/candidate');
    } else {
        navigate('/candidate');
    }
  };

  // Ensure cleanup on component unmount
  useEffect(() => {
     return () => {
         isInterviewActiveRef.current = false;
         if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
         if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
         if (ws.current) ws.current.close();
     };
  }, []);

  return (
    <div className="animate-fade">
      <div className="header">
        <h1>Entretien IA</h1>
        <p>Prenez votre temps pour répondre. L'IA analyse votre discours de bout en bout.</p>
      </div>

      <div className="grid">
         <div className="card">
            <h3>Contrôle Vocal et Connexion</h3>
            
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {!isRecording ? (
                <button className="btn" onClick={startInterview}>Rejoindre l'entretien</button>
              ) : (
                <button className="btn" style={{ background: '#ef4444' }} onClick={endInterview} disabled={isGeneratingAnalysis}>
                    {isGeneratingAnalysis ? "Analyse en cours..." : "Mettre fin à l'entretien"}
                </button>
              )}
            </div>
            
            {isRecording && (
                <div style={{ margin: '2.5rem auto 1rem', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px dashed rgba(234, 88, 12, 0.3)' }}>
                    {/* Visual Pulse Effect based on volume */}
                    <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            position: 'absolute',
                            width: '100%', height: '100%',
                            background: isRecordingMic ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                            borderRadius: '50%',
                            transform: `scale(${isRecordingMic ? 1 + (volume / 70) : 1})`,
                            transition: 'transform 0.05s ease-out'
                        }} />
                        <Mic size={40} color={isRecordingMic ? '#22c55e' : '#94a3b8'} style={{position: 'relative', zIndex: 2, transition: 'color 0.3s'}} />
                    </div>
                    
                    <h4 style={{color: isRecordingMic ? '#15803d' : '#64748b'}}>
                        {isRecordingMic ? '🎤 À vous de parler... (Je vous écoute !)' : 'L\'IA Recruteur a la parole...'}
                    </h4>
                    
                    {isRecordingMic && (
                       <p style={{fontSize: '0.85rem', color: '#166534', marginTop: '0.5rem', opacity: 0.8}}>
                           (L'envoi se fait automatiquement après 2,5s de silence)
                       </p>
                    )}
                </div>
            )}
         </div>

      </div>
    </div>
  );
}
