const express = require('express');
const jwt     = require('jsonwebtoken');
const passport = require('../config/passport');
const { body, validationResult } = require('express-validator');
const User    = require('../models/User');
const router  = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── POST /api/auth/signup ──────────────────────────
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const user  = await User.create({ name, email, password });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// ── POST /api/auth/login ───────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── GET /api/auth/google-status ───────────────────
// Lets frontend check if Google OAuth is configured
router.get('/google-status', (req, res) => {
  res.json({ enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) });
});

// ── GET /api/auth/google ───────────────────────────
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google OAuth not configured.' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// ── GET /api/auth/google/callback ─────────────────
router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login.html?error=google');
  }
  passport.authenticate('google', { session: false, failureRedirect: '/login.html?error=google' },
    (err, user) => {
      if (err || !user) return res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login.html?error=google');
      const token = signToken(user);
      const userData = { id: user._id, name: user.name, email: user.email };
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/index.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    }
  )(req, res, next);
});
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Could not fetch user.' });
  }
});

// ── POST /api/auth/reset-password ──────────────────
router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found with that email.' });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during password reset.' });
  }
});

module.exports = router;
