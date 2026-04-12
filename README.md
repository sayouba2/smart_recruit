# Smart Recruit

**Smart Recruit** est une plateforme de recrutement intelligente basée sur l'IA, conçue pour automatiser et optimiser l'ensemble du processus d'embauche — de la publication d'offres à l'évaluation des candidats via des entretiens audio analysés par l'IA.

---

## Fonctionnalités

- **Gestion des offres d'emploi** — Les recruteurs publient des offres avec des critères prioritaires (éliminatoires et confidentiels).
- **Dépôt et analyse de CV** — Les candidats soumettent leur CV (PDF). Le système extrait automatiquement les compétences et calcule un score de compatibilité avec l'offre.
- **Entretien IA en temps réel** — Un entretien audio interactif via WebSocket : l'IA pose des questions vocales générées dynamiquement selon le poste, le candidat répond à la voix.
- **Analyse et scoring** — Transcription automatique des réponses (OpenAI Whisper), évaluation par GPT-3.5, vérification des critères prioritaires et calcul d'un score final.
- **Dashboard RH** — Suivi des candidatures, accès aux transcriptions, rapports détaillés et décisions (accepter / refuser / sauvegarder).
- **Dashboard candidat** — Suivi du statut de ses candidatures et accès à la salle d'entretien.
- **Authentification JWT** — Deux rôles : `candidate` et `rh`, avec accès sécurisés par token.

---

## Architecture

Le projet suit une architecture **microservices** entièrement containerisée avec Docker.

```
smart_recruit/
├── backend/
│   ├── api_gateway/        # Point d'entrée principal (port 8000)
│   ├── auth_service/       # Inscription, connexion, JWT (port 8005)
│   ├── job_service/        # CRUD des offres d'emploi (port 8001)
│   ├── cv_service/         # Upload CV, parsing, matching (port 8002)
│   ├── ai_analysis/        # Analyse IA post-entretien, scoring (port 8003)
│   ├── interview_service/  # Entretien audio WebSocket temps réel (port 8004)
│   └── shared/             # Modèles, DB, dépendances communes
├── frontend/               # React + TypeScript + Vite (port 5173)
└── docker-compose.yml
```

### Stack technique

| Couche          | Technologie                              |
|-----------------|------------------------------------------|
| Frontend        | React 19, TypeScript, Vite, React Router |
| Backend         | Python, FastAPI, SQLAlchemy              |
| Base de données | MySQL 8.0                                |
| IA              | OpenAI Whisper (transcription), GPT-3.5  |
| Auth            | JWT (PyJWT, bcrypt)                      |
| Infra           | Docker, Docker Compose                   |

---

## Prérequis

- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)
- Une clé API OpenAI (optionnelle — un mode test est disponible sans clé)

---

## Démarrage rapide

### 1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd smart_recruit
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
OPENAI_API_KEY=sk-...           # Clé OpenAI (laisser vide pour le mode test)
SECRET_KEY=votre_secret_jwt     # Clé secrète pour signer les JWT
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Lancer tous les services

```bash
docker-compose up --build
```

L'application sera disponible à :

| Service          | URL                         |
|------------------|-----------------------------|
| Frontend         | http://localhost:5173        |
| API Gateway      | http://localhost:8000        |
| Auth Service     | http://localhost:8005        |
| Job Service      | http://localhost:8001        |
| CV Service       | http://localhost:8002        |
| AI Analysis      | http://localhost:8003        |
| Interview WS     | http://localhost:8004        |

---

## Flux d'utilisation

### Côté Recruteur (RH)

1. Créer un compte avec le rôle `rh`
2. Publier une offre d'emploi avec une description et (optionnellement) un critère prioritaire confidentiel
3. Consulter les candidatures depuis le dashboard : score CV, score entretien, transcription, rapport IA
4. Prendre une décision : **Accepter**, **Refuser** ou **Sauvegarder**

### Côté Candidat

1. Créer un compte avec le rôle `candidate`
2. Parcourir les offres et postuler en déposant son CV (PDF)
3. Accéder à la salle d'entretien via le lien généré automatiquement
4. Répondre aux questions posées à l'oral par l'IA
5. Suivre le statut de sa candidature depuis le dashboard

---

## Mode test (sans clé OpenAI)

Si `OPENAI_API_KEY` n'est pas définie, le système fonctionne en mode dégradé :

- Les réponses audio du candidat sont remplacées par un texte de substitution
- Le scoring utilise des valeurs de fallback
- L'ensemble du flux reste testable sans frais API

---

## Documentation API

Chaque microservice expose une documentation Swagger interactive :

| Service     | URL                          |
|-------------|------------------------------|
| Auth        | http://localhost:8005/docs    |
| Jobs        | http://localhost:8001/docs    |
| CV          | http://localhost:8002/docs    |
| AI Analysis | http://localhost:8003/docs    |

---

## Développement local (sans Docker)

### Backend (par service)

```bash
cd backend/<nom_du_service>
pip install -r requirements.txt
uvicorn main:app --reload --port <port>
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Licence

Ce projet est distribué sous licence MIT.
