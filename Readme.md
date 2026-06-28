# Zoom Clone

A full-stack video conferencing web application that replicates Zoom's design, user experience, and core meeting workflows.

## Live Demo

- **Frontend:** https://zoom-clone-xyz.vercel.app
- **Backend API:** https://zoom-clone-backend.onrender.com
- **API Docs:** https://zoom-clone-backend.onrender.com/docs

> Replace the above URLs with your actual deployed URLs.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLite + SQLAlchemy |
| Video | Jitsi Meet (WebRTC) |
| Transcription | Web Speech API (Chrome) |
| Deployment | Vercel (frontend), Render (backend) |

## Features

- **Dashboard** — Zoom-like homepage with upcoming and recent meetings
- **Instant Meeting** — Create a meeting instantly with a unique ID and shareable link
- **Join Meeting** — Join via Meeting ID or invite link with display name entry
- **Schedule Meeting** — Schedule future meetings with title, description, date/time, and duration
- **Video & Audio** — Real-time video conferencing via Jitsi Meet (no account needed)
- **Screen Sharing** — Share your screen during meetings
- **Live Transcription** — Real-time speech-to-text transcription saved to database
- **Participant Tracking** — Tracks who joined each meeting and when

## Database Schema
users
├── id (PK)
├── name
├── email
├── avatar_url
└── created_at
meetings
├── id (PK)
├── meeting_id (unique)
├── title
├── description
├── host_id (FK → users)
├── type (instant | scheduled)
├── status (waiting | active | ended)
├── start_time
├── duration
├── daily_room_name
├── invite_link
└── created_at
participants
├── id (PK)
├── meeting_id (FK → meetings)
├── display_name
├── joined_at
└── left_at
transcripts
├── id (PK)
├── meeting_id (FK → meetings)
├── speaker_name
├── text
└── timestamp

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Git

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API Docs at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

### Environment Variables

**frontend/.env.local**

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

## Assumptions

- No login required — a default user (John Doe) is seeded into the database on startup
- Video is powered by Jitsi Meet, which is free and requires no API key or account
- Transcription uses the browser's built-in Web Speech API — works best in Chrome
- SQLite is used for simplicity; the schema is designed to be easily migrated to PostgreSQL
- Invite links use the deployed frontend URL in production and localhost in development

## Project Structure
zoom-clone/

├── frontend/

│   └── app/

│       ├── page.tsx              # Dashboard

│       ├── schedule/page.tsx     # Schedule meeting

│       ├── join/[meetingId]/     # Join meeting

│       ├── meeting/[meetingId]/  # Meeting room

│       └── components/

│           └── Navbar.tsx

├── backend/

│   └── app/

│       ├── main.py

│       ├── models.py

│       ├── schemas.py

│       ├── database.py

│       ├── seed.py

│       └── routers/

│           ├── meetings.py

│           ├── participants.py

│           └── transcripts.py

└── README.md
