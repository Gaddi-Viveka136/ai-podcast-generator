# AI Interactive Podcast Generator — Full Stack

Node.js + Express + MongoDB + OpenAI + HTML/CSS/JS

---

## Project Structure

```
podcast-app/
├── backend/
│   ├── config/
│   │   └── db.js              MongoDB connection
│   ├── middleware/
│   │   └── auth.js            JWT auth middleware
│   ├── models/
│   │   ├── User.js            User schema
│   │   └── History.js         Podcast history schema
│   ├── routes/
│   │   ├── auth.js            Signup / Login / Me
│   │   ├── podcast.js         Extract / Summarize / Generate / Q&A
│   │   └── history.js         CRUD for user history
│   ├── audio/                 Generated MP3 files (auto-created)
│   ├── server.js              Express entry point
│   ├── package.json
│   └── .env.example           Copy to .env and fill in values
│
└── frontend/
    ├── css/
    │   ├── auth.css           Login / Signup styles
    │   └── app.css            Dashboard styles
    ├── js/
    │   ├── auth.js            Login / Signup logic
    │   ├── api.js             All backend API calls
    │   ├── player.js          HTML5 audio player + subtitle sync
    │   └── app.js             Main dashboard logic
    ├── login.html
    ├── signup.html
    └── index.html             Main dashboard
```

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key

---

## Setup & Run

### 1. Backend

```bash
cd podcast-app/backend

# Install dependencies
npm install

# Create .env from example
cp .env.example .env
# Edit .env and fill in:
#   MONGO_URI=mongodb://localhost:27017/podcast_app
#   JWT_SECRET=any_long_random_string
#   OPENAI_API_KEY=sk-...

# Start (development with auto-reload)
npm run dev

# Start (production)
npm start
```

Backend runs on: http://localhost:5000

### 2. Frontend

No build step needed. Open `frontend/login.html` directly in Chrome/Edge:

```bash
# Windows
start podcast-app/frontend/login.html

# Or serve with a local server (recommended)
npx serve podcast-app/frontend
# Then open http://localhost:3000
```

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/signup | No | Register new user |
| POST | /api/auth/login | No | Login, returns JWT |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/podcast/extract | Yes | Extract text from TXT/PDF |
| POST | /api/podcast/summarize | Yes | Summarize via OpenAI |
| POST | /api/podcast/generate | Yes | Generate MP3 + save history |
| POST | /api/podcast/qa | Yes | Q&A via OpenAI |
| GET | /api/history | Yes | Get user's podcast history |
| DELETE | /api/history/:id | Yes | Delete history item |

---

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Server port (default 5000) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret key for JWT signing |
| OPENAI_API_KEY | Your OpenAI API key |

---

## Notes

- Audio files are generated using gTTS (Google Text-to-Speech) and saved as MP3 in `backend/audio/`
- OpenAI GPT-3.5-turbo is used for summarization and Q&A
- JWT tokens expire after 7 days
- File uploads are handled in memory (no temp files on disk for uploads)
- PDF extraction uses `pdf-parse` — works on text-based PDFs only
