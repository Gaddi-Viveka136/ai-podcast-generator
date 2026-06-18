# AI Interactive Podcast Generator

A full-stack web application that converts text or uploaded files into a summarized AI podcast with authentication, audio playback, and interactive Q&A.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express
- Database: MongoDB
- AI: Groq API (llama-3.3-70b-versatile) — free
- TTS: gTTS (Google Text-to-Speech)
- Auth: JWT

---

## How to Run

### Prerequisites
- Node.js 18+
- MongoDB installed locally
- Groq API key (free at https://console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/YourUsername/ai-podcast-generator.git
cd ai-podcast-generator
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Create environment file
```bash
cp .env.example .env
```
Fill in your `.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/podcast_app
JWT_SECRET=any_random_secret_string
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Start MongoDB
```bash
# Windows
mongod --dbpath C:\data\db
```

### 5. Start the backend
```bash
node server.js
```
Expected output:
```
Server running on http://localhost:5000
✅ MongoDB connected
```

### 6. Start the frontend (new terminal)
```bash
cd ..
serve frontend
```

### 7. Open in browser
```
http://localhost:3000
```

---

## Features

- Signup / Login with JWT authentication
- Upload TXT or PDF files with drag & drop
- AI summarization using Groq (free)
- Text-to-speech MP3 generation
- Audio player with seek bar, forward/rewind
- Sentence-by-sentence subtitle highlighting
- Interactive Q&A powered by AI
- Podcast history saved per user in MongoDB
- Download generated podcast script

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/signup | No | Register |
| POST | /api/auth/login | No | Login |
| POST | /api/podcast/extract | Yes | Extract TXT/PDF |
| POST | /api/podcast/summarize | Yes | AI summarize |
| POST | /api/podcast/generate | Yes | Generate MP3 |
| POST | /api/podcast/qa | Yes | AI Q&A |
| GET | /api/history | Yes | User history |
| DELETE | /api/history/:id | Yes | Delete history |

---

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Server port (default 5000) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret key for JWT tokens |
| GROQ_API_KEY | Free API key from console.groq.com |
