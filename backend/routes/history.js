const express = require('express');
const fs      = require('fs');
const path    = require('path');
const auth    = require('../middleware/auth');
const History = require('../models/History');
const router  = express.Router();

// ── GET /api/history ───────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const items = await History.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-originalText') // keep response light
      .limit(20);
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Could not fetch history.' });
  }
});

// ── GET /api/history/:id ───────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await History.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ error: 'Not found.' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Could not fetch history item.' });
  }
});

// ── DELETE /api/history/:id ────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await History.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ error: 'Not found.' });

    // Remove audio file if it exists
    if (item.audioFile) {
      const fp = path.join(__dirname, '..', 'audio', item.audioFile);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    await item.deleteOne();
    res.json({ message: 'Deleted.' });
  } catch {
    res.status(500).json({ error: 'Could not delete history item.' });
  }
});

module.exports = router;
