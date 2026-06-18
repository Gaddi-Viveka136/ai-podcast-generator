/* player.js — HTML5 Audio player controls + subtitle sync */

const audio = document.getElementById('audioEl');

const playerState = {
  sentences:      [],
  currentIdx:     -1,
};

function fmtTime(secs) {
  if (isNaN(secs)) return '00:00';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Wire up controls ───────────────────────────────
document.getElementById('playBtn').addEventListener('click', () => audio.play());
document.getElementById('pauseBtn').addEventListener('click', () => audio.pause());
document.getElementById('stopBtn').addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
});
document.getElementById('rewindBtn').addEventListener('click',  () => { audio.currentTime = Math.max(0, audio.currentTime - 5); });
document.getElementById('forwardBtn').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5); });

// ── Seek bar ───────────────────────────────────────
const seekBar = document.getElementById('seekBar');
seekBar.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration;
});

// ── Audio events ───────────────────────────────────
audio.addEventListener('loadedmetadata', () => {
  document.getElementById('totalTime').textContent = fmtTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  const cur = audio.currentTime;
  const dur = audio.duration || 0;
  document.getElementById('currentTime').textContent = fmtTime(cur);
  if (dur > 0) seekBar.value = (cur / dur) * 100;
  syncSubtitle(cur);
});

audio.addEventListener('play',  updatePlayerControls);
audio.addEventListener('pause', updatePlayerControls);
audio.addEventListener('ended', () => {
  updatePlayerControls();
  highlightSentence(-1);
});

function updatePlayerControls() {
  const playing = !audio.paused;
  document.getElementById('playBtn').disabled  =  playing;
  document.getElementById('pauseBtn').disabled = !playing;
  document.getElementById('stopBtn').disabled  =  audio.paused && audio.currentTime === 0;
}

// ── Subtitle sync ──────────────────────────────────
function syncSubtitle(currentSec) {
  if (!playerState.sentences.length || !audio.duration) return;
  const dur = audio.duration;
  const secPerSentence = dur / playerState.sentences.length;
  const idx = Math.min(
    playerState.sentences.length - 1,
    Math.floor(currentSec / secPerSentence)
  );
  if (idx !== playerState.currentIdx) {
    playerState.currentIdx = idx;
    highlightSentence(idx);
  }
}

function highlightSentence(idx) {
  document.querySelectorAll('.s-span').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.track-item').forEach(t => t.classList.remove('active'));

  const subtitleText = document.getElementById('subtitleText');
  if (idx < 0 || !playerState.sentences[idx]) {
    subtitleText.textContent = '—';
    return;
  }
  subtitleText.textContent = playerState.sentences[idx];

  const span = document.querySelector(`.s-span[data-idx="${idx}"]`);
  if (span) span.classList.add('active');

  const item = document.querySelector(`.track-item[data-idx="${idx}"]`);
  if (item) { item.classList.add('active'); item.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}

function setSentences(sentences) {
  playerState.sentences  = sentences;
  playerState.currentIdx = -1;
}

function loadAudio(url) {
  const base = window.BACKEND_URL || 'http://localhost:5000';
  audio.src = `${base}${url}`;
  audio.load();
  document.getElementById('downloadBtn').href = audio.src;
  updatePlayerControls();
}

// Init controls
updatePlayerControls();
