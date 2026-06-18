/* auth.js — shared auth helpers for login.html and signup.html */

const API = (window.BACKEND_URL || 'http://localhost:5000') + '/api';

function showError(msg) {
  const box = document.getElementById('errorBox');
  const msgEl = document.getElementById('errorMsg');
  if (msgEl) msgEl.textContent = msg;
  else box.textContent = msg;
  box.style.display = 'block';
}

function hideError() {
  const box = document.getElementById('errorBox');
  box.style.display = 'none';
}

function setLoading(loading, originalText) {
  const btn = document.getElementById('submitBtn');
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : originalText;
}

// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

async function handleLogin(email, password) {
  hideError();
  if (!email || !password) { showError('Please fill in all fields.'); return false; }

  setLoading(true, 'Sign In');
  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) { showError(data.error || 'Login failed.'); return false; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    window.location.href = 'index.html';
    return true;
  } catch {
    showError('Cannot reach server. The backend may be starting up — wait 30 seconds and try again.');
    return false;
  } finally {
    setLoading(false, 'Sign In');
  }
}

async function handleSignup(name, email, password) {
  hideError();
  if (!name || !name.trim()) { showError('Please enter your full name.'); return; }
  if (!email || !email.trim()) { showError('Please enter your email.'); return; }
  if (!password || password.length < 6) { showError('Password must be at least 6 characters.'); return; }

  setLoading(true, 'Create Account');
  try {
    const res  = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) { showError(data.error || 'Signup failed.'); return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    window.location.href = 'index.html';
  } catch {
    showError('Cannot reach server. The backend may be starting up — wait 30 seconds and try again.');
  } finally {
    setLoading(false, 'Create Account');
  }
}
