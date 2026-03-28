const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const Groq     = require('groq-sdk');
const gtts     = require('gtts');
const auth     = require('../middleware/auth');
const History  = require('../models/History');
const router   = express.Router();

// ── Groq client ────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Multer (memory storage) ────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ['.txt', '.pdf'].includes(ext)
      ? cb(null, true)
      : cb(new Error('Only TXT and PDF files are allowed.'));
  },
});

// Ensure audio directory exists
const AUDIO_DIR = path.join(__dirname, '..', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// ── POST /api/podcast/extract ──────────────────────
router.post('/extract', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    let text = '';
    if (ext === '.txt') {
      text = req.file.buffer.toString('utf-8');
    } else if (ext === '.pdf') {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
      if (!text.trim())
        return res.status(422).json({ error: 'PDF appears image-based. No text extracted.' });
    }
    res.json({ text: text.trim(), filename: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message || 'File extraction failed.' });
  }
});

// ── POST /api/podcast/summarize ────────────────────
// Uses Groq (free) — llama3-8b-8192 model
router.post('/summarize', auth, async (req, res) => {
  const { text, duration = 2 } = req.body;
  if (!text || text.trim().length < 50)
    return res.status(400).json({ error: 'Text is too short to summarize.' });

  const targetWords = Math.round(duration * 150);

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a podcast script writer. Summarize the given text into a clear, engaging podcast script.
Rules:
- Extract only the most important points
- Write in natural spoken language  
- Target approximately ${targetWords} words (for a ${duration}-minute podcast)
- Do NOT include headers, bullet points, or markdown
- Output plain flowing sentences only`,
        },
        {
          role: 'user',
          content: `Summarize this into a ${duration}-minute podcast script:\n\n${text.slice(0, 12000)}`,
        },
      ],
      temperature: 0.6,
      max_tokens: Math.min(1024, targetWords * 2),
    });

    const summary = completion.choices[0].message.content.trim();
    res.json({ summary });
  } catch (err) {
    const msg = err?.error?.message || err.message || 'Groq API error.';
    res.status(500).json({ error: msg });
  }
});

// ── POST /api/podcast/generate ─────────────────────
router.post('/generate', auth, async (req, res) => {
  const { summary, originalText, title = 'Untitled Podcast', voiceMode = 'normal' } = req.body;
  if (!summary) return res.status(400).json({ error: 'Summary is required.' });

  const filename = `podcast_${uuidv4()}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);

  try {
    await new Promise((resolve, reject) => {
      const tts = new gtts(summary, 'en');
      tts.save(filepath, err => (err ? reject(err) : resolve()));
    });

    const wordCount = (originalText || summary).split(/\s+/).filter(Boolean).length;
    const history = await History.create({
      user: req.user.id,
      title,
      originalText: originalText || summary,
      summary,
      audioFile: filename,
      voiceMode,
      wordCount,
    });

    res.json({ audioUrl: `/audio/${filename}`, historyId: history._id, filename });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Audio generation failed.' });
  }
});

// ── POST /api/podcast/qa ───────────────────────────
// Uses Groq (free)
router.post('/qa', auth, async (req, res) => {
  const { summary, question } = req.body;
  if (!summary || !question)
    return res.status(400).json({ error: 'Summary and question are required.' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: "Answer the user's question based ONLY on the provided podcast summary. Keep answers concise. If the answer isn't in the summary, say so.",
        },
        {
          role: 'user',
          content: `Podcast Summary:\n${summary}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 300,
    });

    const answer = completion.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    const msg = err?.error?.message || err.message || 'Groq API error.';
    res.status(500).json({ error: msg });
  }
});

module.exports = router;
