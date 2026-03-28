/* app.js — main dashboard logic */
'use strict';

// ── State ──────────────────────────────────────────
const appState = {
  rawText:   '',
  summary:   '',
  sentences: [],
  voiceMode: 'normal',
  audioUrl:  null,
};

// ── DOM helpers ────────────────────────────────────
const $ = id => document.getElementById(id);
const show = id => $(id).style.display = 'block';
const hide = id => $(id).style.display = 'none';
const showFlex = id => $(id).style.display = 'flex';

// ── User info ──────────────────────────────────────
const user = JSON.parse(localStorage.getItem('user') || '{}');
$('navUser').textContent = user.name ? `👤 ${user.name}` : '';

$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// ── Sidebar toggle ─────────────────────────────────
$('historyToggle').addEventListener('click', () => {
  const sidebar = $('sidebar');
  sidebar.classList.toggle('hidden');
  if (!sidebar.classList.contains('hidden')) loadHistory();
});

// ── Drag & Drop ────────────────────────────────────
const dropZone = $('dropZone');

dropZone.addEventListener('click', e => {
  if (!e.target.closest('label')) $('fileInput').click();
});
dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', e => {
  if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over');
});
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFileUpload(e.dataTransfer.files[0]);
});

$('fileInput').addEventListener('change', () => handleFileUpload($('fileInput').files[0]));

async function handleFileUpload(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['txt','pdf'].includes(ext)) {
    setDropError('Only TXT and PDF files are supported.');
    return;
  }
  $('fileName').textContent = file.name;
  dropZone.classList.remove('error-state');
  dropZone.classList.add('success');
  show('extractLoader');

  try {
    const data = await apiExtractFile(file);
    $('inputText').value = data.text;
    appState.rawText = data.text;
    updateWordCount();
  } catch (err) {
    setDropError(err.message);
  } finally {
    hide('extractLoader');
  }
}

function setDropError(msg) {
  dropZone.classList.remove('success', 'drag-over');
  dropZone.classList.add('error-state');
  $('fileName').textContent = '⚠ ' + msg;
}

$('inputText').addEventListener('input', () => {
  appState.rawText = $('inputText').value;
  updateWordCount();
});

function updateWordCount() {
  const n = appState.rawText.trim().split(/\s+/).filter(Boolean).length;
  $('wordCount').textContent = n ? `${n.toLocaleString()} words` : '';
}

// ── Voice Mode ─────────────────────────────────────
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    appState.voiceMode = btn.dataset.mode;
  });
});

// ── Summarize ──────────────────────────────────────
$('summarizeBtn').addEventListener('click', runSummarize);

async function runSummarize() {
  const text = $('inputText').value.trim();
  if (!text || text.length < 50) { alert('Please enter at least a few sentences of text.'); return; }

  const duration = parseFloat($('durationInput').value) || 2;

  show('summaryCard');
  show('summaryLoader');
  $('summaryOutput').textContent = '';
  $('summarizeBtn').disabled = true;

  try {
    const data = await apiSummarize(text, duration);
    appState.summary   = data.summary;
    appState.sentences = splitIntoSentences(data.summary);

    // Render with per-sentence spans
    $('summaryOutput').innerHTML = appState.sentences
      .map((s, i) => `<span class="s-span" data-idx="${i}">${escHtml(s)} </span>`)
      .join('');

    const origWords = text.split(/\s+/).filter(Boolean).length;
    const sumWords  = data.summary.split(/\s+/).filter(Boolean).length;
    const ratio     = Math.round((sumWords / origWords) * 100);
    $('summaryMeta').textContent    = `${appState.sentences.length} sentences · ${sumWords} words`;
    $('estimatedDur').textContent   = `Est. ~${Math.ceil(sumWords / 150)} min read`;

    buildSentenceTrack(appState.sentences);
    setSentences(appState.sentences);

    show('voiceCard');
    showFlex('generateWrap');
    show('subtitleCard');
    show('qaCard');
    $('summaryCard').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    $('summaryOutput').textContent = '⚠ ' + err.message;
  } finally {
    hide('summaryLoader');
    $('summarizeBtn').disabled = false;
  }
}

function splitIntoSentences(text) {
  return text
    .replace(/\s+/g, ' ').trim()
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

function buildSentenceTrack(sentences) {
  $('sentenceTrack').innerHTML = sentences
    .map((s, i) =>
      `<div class="track-item" data-idx="${i}">${i + 1}. ${escHtml(s.length > 90 ? s.slice(0,90)+'…' : s)}</div>`
    ).join('');
}

// ── Generate Podcast ───────────────────────────────
$('generateBtn').addEventListener('click', async () => {
  if (!appState.summary) { alert('Please summarize first.'); return; }

  show('playerCard');
  show('generateLoader');
  $('generateBtn').disabled = true;
  $('playerCard').scrollIntoView({ behavior: 'smooth' });

  try {
    const title = $('podcastTitle').value.trim() || 'My Podcast';
    const data  = await apiGenerate(
      appState.summary,
      appState.rawText,
      title,
      appState.voiceMode
    );
    appState.audioUrl = data.audioUrl;
    loadAudio(data.audioUrl);
    loadHistory(); // refresh sidebar
  } catch (err) {
    alert('Audio generation failed: ' + err.message);
  } finally {
    hide('generateLoader');
    $('generateBtn').disabled = false;
  }
});

// ── Q&A ────────────────────────────────────────────
$('qaBtn').addEventListener('click', handleQA);
$('qaInput').addEventListener('keydown', e => { if (e.key === 'Enter') handleQA(); });

async function handleQA() {
  const q = $('qaInput').value.trim();
  if (!q) return;
  if (!appState.summary) { alert('Please summarize first.'); return; }

  show('qaLoader');
  $('qaBtn').disabled = true;

  try {
    const data = await apiQA(appState.summary, q);
    $('qaAnswer').textContent   = `💡 ${data.answer}`;
    $('qaAnswer').style.display = 'block';

    const item = document.createElement('div');
    item.className = 'qa-item';
    item.innerHTML = `<div class="q">Q: ${escHtml(q)}</div><div class="a">A: ${escHtml(data.answer)}</div>`;
    $('qaHistory').prepend(item);
    $('qaInput').value = '';
  } catch (err) {
    $('qaAnswer').textContent   = '⚠ ' + err.message;
    $('qaAnswer').style.display = 'block';
  } finally {
    hide('qaLoader');
    $('qaBtn').disabled = false;
  }
}

// ── History Sidebar ────────────────────────────────
async function loadHistory() {
  const list = $('historyList');
  list.innerHTML = '<p class="muted-sm">Loading…</p>';
  try {
    const items = await apiGetHistory();
    if (!items.length) { list.innerHTML = '<p class="muted-sm">No history yet.</p>'; return; }
    list.innerHTML = items.map(item => `
      <div class="history-item" data-id="${item._id}">
        <button class="h-del" data-id="${item._id}" title="Delete">✕</button>
        <div class="h-title">${escHtml(item.title)}</div>
        <div class="h-meta">${new Date(item.createdAt).toLocaleDateString()} · ${item.wordCount} words</div>
      </div>
    `).join('');

    // Delete buttons
    list.querySelectorAll('.h-del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this podcast?')) return;
        try {
          await apiDeleteHistory(btn.dataset.id);
          loadHistory();
        } catch (err) { alert(err.message); }
      });
    });
  } catch (err) {
    list.innerHTML = `<p class="muted-sm">⚠ ${err.message}</p>`;
  }
}

// ── Utility ────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
