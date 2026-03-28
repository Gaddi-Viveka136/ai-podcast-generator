/* auth.js — shared auth helpers for login.html and signup.html */

const API = 'http://localhost:5000/api';

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.textContent = msg;
  box.style.display = 'block';
}

function setLoading(loading) {
  const btn = document.getElementById('submitBtn');
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : btn.dataset.label || btn.textContent;
}

// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = 'index.html';
}

async function handleLogin(email, password) {
  setLoading(true);
  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { showError(data.error || 'Login failed.'); return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    window.location.href = 'index.html';
  } catch {
    showError('Cannot reach server. Make sure the backend is running.');
  } finally {
    setLoading(false);
  }
}

async function handleSignup(name, email, password) {
  setLoading(true);
  try {
    const res  = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) { showError(data.error || 'Signup failed.'); return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    window.location.href = 'index.html';
  } catch {
    showError('Cannot reach server. Make sure the backend is running.');
  } finally {
    setLoading(false);
  }
}
