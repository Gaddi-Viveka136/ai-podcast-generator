/* api.js — all backend API calls */

// Uses deployed backend URL if set, otherwise localhost for development
const API_BASE = window.BACKEND_URL
  ? window.BACKEND_URL + '/api'
  : 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

// Guard: redirect to login if no token
(function guardAuth() {
  if (!getToken()) window.location.href = 'login.html';
})();

// ── Extract text from uploaded file ───────────────
async function apiExtractFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/podcast/extract`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'File extraction failed.');
  return data; // { text, filename }
}

// ── Summarize text via OpenAI ──────────────────────
async function apiSummarize(text, duration) {
  const res = await fetch(`${API_BASE}/podcast/summarize`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ text, duration }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Summarization failed.');
  return data; // { summary }
}

// ── Generate audio from summary ────────────────────
async function apiGenerate(summary, originalText, title, voiceMode) {
  const res = await fetch(`${API_BASE}/podcast/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ summary, originalText, title, voiceMode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Audio generation failed.');
  return data; // { audioUrl, historyId, filename }
}

// ── Q&A ────────────────────────────────────────────
async function apiQA(summary, question) {
  const res = await fetch(`${API_BASE}/podcast/qa`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ summary, question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Q&A failed.');
  return data; // { answer }
}

// ── History ────────────────────────────────────────
async function apiGetHistory() {
  const res = await fetch(`${API_BASE}/history`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load history.');
  return data;
}

async function apiDeleteHistory(id) {
  const res = await fetch(`${API_BASE}/history/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Delete failed.');
  return data;
}
