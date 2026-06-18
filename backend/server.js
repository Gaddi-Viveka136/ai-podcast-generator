require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const connectDB  = require('./config/db');

const authRoutes    = require('./routes/auth');
const podcastRoutes = require('./routes/podcast');
const historyRoutes = require('./routes/history');

const app = express();

// ── Connect DB ──────────────────────────────────────
connectDB();

// ── Middleware ──────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve generated audio files statically
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// ── Routes ──────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Start ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
// trust Render's proxy
app.set('trust proxy', 1);
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
