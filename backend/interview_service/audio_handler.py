import os
import base64
import httpx
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

AUDIO_STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "shared_audios"))
os.makedirs(AUDIO_STORAGE_DIR, exist_ok=True)

# In-memory store for conversation histories (session_id -> list of message dicts)
ACTIVE_SESSIONS = {}

SYSTEM_PROMPT = """
Tu es un recruteur professionnel expérimenté chargé de conduire un entretien structuré pour un poste spécifique.

CONTEXTE FOURNI PAR LE SYSTÈME :

Tu reçois les informations suivantes :
- Le poste pour lequel le candidat postule
- La description du poste et les compétences requises
- Les informations extraites du CV du candidat
- Les réponses du formulaire de candidature

Tu dois utiliser ces informations pour conduire un entretien pertinent et personnalisé.

OBJECTIF :

Évaluer le candidat sur les dimensions suivantes :

1. Cohérence du parcours professionnel
2. Compétences techniques ou métier
3. Expérience réelle sur des projets
4. Soft skills (communication, collaboration, gestion du stress)
5. Capacité de résolution de problèmes
6. Motivation pour le poste
7. Adéquation avec les exigences du poste

RÈGLES STRICTES :

- Tu poses uniquement des questions.
- Tu ne juges jamais les réponses pendant l’entretien.
- Tu ne donnes aucun feedback intermédiaire.
- Même si une réponse est incorrecte, incohérente ou faible, tu continues l’entretien normalement.
- Tu poses les questions une par une.
- Tu attends la réponse du candidat avant de continuer.
- Tu gardes toujours un ton professionnel, neutre et objectif.
- Tu ne fais aucune analyse avant la fin complète de l’entretien.

PERSONNALISATION DES QUESTIONS :

Tu dois adapter tes questions en fonction :

- des compétences mentionnées dans le CV
- de l'expérience professionnelle du candidat
- des exigences du poste

Si un candidat mentionne une expérience importante ou une entreprise connue, demande des détails précis sur les projets réalisés, les responsabilités et les technologies utilisées.

STRUCTURE OBLIGATOIRE DE L’ENTRETIEN :

1) Introduction

- Demander au candidat de se présenter brièvement.
- Vérifier certains éléments mentionnés dans son CV (expérience, rôle, technologies).

2) Expérience professionnelle

Explorer le parcours du candidat :

- projets importants réalisés
- responsabilités
- technologies utilisées
- défis rencontrés

Demander des exemples concrets.

3) Compétences techniques ou métier

Poser des questions spécifiques liées :

- aux compétences mentionnées dans le CV
- aux technologies ou outils requis pour le poste

Demander des explications techniques ou des exemples d'utilisation.

4) Soft Skills

Évaluer :

- travail en équipe
- communication
- gestion du stress
- organisation
- résolution de conflits

5) Motivation

Poser des questions sur :

- l'intérêt pour le poste
- les objectifs professionnels
- les attentes vis-à-vis de l'entreprise

6) Mises en situation (obligatoire)

Créer plusieurs scénarios réalistes liés au poste.

Ces scénarios doivent tester :

- la résolution de problèmes
- la prise de décision
- la gestion des imprévus
- les compétences techniques ou métier

Exemples de situations possibles :

- gestion d'un bug critique
- conflit dans une équipe
- délai de projet serré
- problème technique complexe
- apprentissage rapide d'une nouvelle technologie

Pour chaque situation :

- décrire clairement le contexte
- demander au candidat comment il réagirait
- ne faire aucun commentaire sur sa réponse
- passer ensuite à la question suivante

DÉTECTION D’INCOHÉRENCES :

Si une réponse semble incohérente avec le CV ou une réponse précédente, poser une question supplémentaire pour clarifier ou demander plus de détails.

Par exemple :

- demander des précisions sur un projet mentionné
- demander d'expliquer une technologie utilisée
- demander un exemple concret

RÈGLE ABSOLUE :

Tu dois toujours respecter la consigne spécifique qui te sera donnée à chaque tour par le système.
"""

async def generate_audio_elevenlabs(text: str) -> bytes:
    if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY == "dummy_key":
        return b""
    # Using 'Sarah' (EXAVITQu4vr4xnSDxMaL) or 'Alice' (Xb7hH8MSALEtkCGokwOa) for a highly natural, human voice
    voice_id = "EXAVITQu4vr4xnSDxMaL"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}
    }
    async with httpx.AsyncClient() as http_client:
        response = await http_client.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.content
        else:
            print(f"ElevenLabs error: {response.text}")
            return b""

async def process_audio_message(audio_bytes: bytes | None, session_id: str, turn_index: int, job_title: str = "Développeur") -> dict:
    # 1. Initialize logic
    if session_id not in ACTIVE_SESSIONS:
        ctx_prompt = SYSTEM_PROMPT.replace(
            "- Le poste pour lequel le candidat postule",
            f"- Le poste pour lequel le candidat postule : {job_title}"
        )
        ACTIVE_SESSIONS[session_id] = [
            {"role": "system", "content": ctx_prompt.strip()},
            {"role": "user", "content": f"(Système: Le candidat est connecté. Démarre l'entretien pour le poste de {job_title} avec une salutation courtoise et la première question d'introduction. Reste assez concis.)"}
        ]
        
    candidate_transcript = ""
    
    # 2. Receive and process candidate's audio from PREVIOUS turn
    if audio_bytes and turn_index > 0:
        candidate_audio_path = f"{AUDIO_STORAGE_DIR}/{session_id}_turn_{turn_index - 1}_candidate.webm"
        with open(candidate_audio_path, "wb") as f:
            f.write(audio_bytes)
            
        # Transcribe candidate audio to pass back context to GPT
        if client.api_key != "dummy_key":
            try:
                with open(candidate_audio_path, "rb") as f:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                        response_format="text"
                    )
                    candidate_transcript = transcription
                    
                ACTIVE_SESSIONS[session_id].append({
                    "role": "user",
                    "content": f"Le candidat a répondu: '{candidate_transcript}'. Passe à la question suivante de la structure selon tes règles strictes."
                })
            except Exception as e:
                print(f"Whisper Error: {e}")
                ACTIVE_SESSIONS[session_id].append({
                    "role": "user",
                    "content": "(Système) L'audio était inaudible ou une erreur est survenue, demande gentiment de répéter la réponse."
                })
        else:
            ACTIVE_SESSIONS[session_id].append({
                "role": "user",
                "content": "(Mode Test) Le candidat a donné une excellente réponse mock."
            })
            candidate_transcript = "[Mock Answer]"

    # 3. Generate IA Question via GPT-4
    next_q_text = "Je suis désolé, je ne peux pas générer de question sans clé API OpenAI."
    if client.api_key != "dummy_key":
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=ACTIVE_SESSIONS[session_id],
                temperature=0.7
            )
            next_q_text = response.choices[0].message.content.strip()
            # On ajoute la réponse de l'IA à l'historique
            ACTIVE_SESSIONS[session_id].append({"role": "assistant", "content": next_q_text})
        except Exception as e:
            print(f"GPT Error: {e}")
            next_q_text = "Houston, nous avons un problème de connexion avec l'IA."

    # Max 8 tours = 8 questions pour simuler l'entretien complet avant de terminer
    is_finished = turn_index >= 8
    if is_finished:
        next_q_text = "Merci pour toutes vos réponses, cela me donne un excellent aperçu de votre profil. L'entretien est à présent terminé. Je vous invite à cliquer sur 'End Call'."
        if session_id in ACTIVE_SESSIONS:
            del ACTIVE_SESSIONS[session_id]

    # Save the AI question for later analysis mapping
    q_path = f"{AUDIO_STORAGE_DIR}/{session_id}_turn_{turn_index}_ai.txt"
    with open(q_path, "w", encoding="utf-8") as f:
        f.write(next_q_text)

    # 4. Synthesize voice with ElevenLabs
    ai_audio_bytes = await generate_audio_elevenlabs(next_q_text)
    b64 = base64.b64encode(ai_audio_bytes).decode('utf-8') if ai_audio_bytes else ""
    
    return {
        "ai_text": next_q_text,
        "ai_audio_b64": b64,
        "session_id": session_id,
        "is_finished": is_finished,
        "candidate_text": candidate_transcript
    }
