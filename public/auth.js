/* ── RTGS PGL — Shared Auth Module ── */
/* Loaded by index.html, season3.html, and analytics.html */

const DEFAULT_SESSION = { username:'guest', role:'fan', team:null, display:'Player / Fan' };

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('rtgs_session')) || DEFAULT_SESSION; }
  catch(e) { return DEFAULT_SESSION; }
}

function openLoginOverlay() {
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.getElementById('loginUser').focus();
}

function closeLoginOverlay() {
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('loginError').textContent = '';
}

async function doLogin() {
  const u   = document.getElementById('loginUser').value.trim().toLowerCase();
  const p   = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    });

    if (!res.ok) {
      err.textContent = 'Invalid username or password.';
      document.getElementById('loginPass').value = '';
      return;
    }

    const data = await res.json();
    err.textContent = '';
    sessionStorage.setItem('rtgs_session', JSON.stringify({
      token:    data.token,
      username: data.username,
      role:     data.role,
      team:     data.team,
      display:  data.display,
      exp:      data.exp,
    }));
    trackEvent('login', { persona: data.role, username: data.username });
    window.location.reload();
  } catch(e) {
    err.textContent = 'Login failed. Please try again.';
    document.getElementById('loginPass').value = '';
    logError('doLogin', e);
  }
}

function trackEvent(eventName, extra) {
  try {
    const session = getSession();
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({
        event: eventName,
        page: window.location.pathname,
        persona: session.role,
        username: session.username,
      }, extra))
    }).catch(() => {});
  } catch(e) {}
}

function logError(context, error) {
  try {
    const session = getSession();
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        context: String(context).slice(0, 64),
        message: String(error?.message || error).slice(0, 256),
        stack: String(error?.stack || '').slice(0, 512),
        username: session.username,
        page: window.location.pathname,
        ts: new Date().toISOString(),
        ua: navigator.userAgent.slice(0, 128),
      })
    }).catch(() => {});
  } catch(e) {}
}

window.addEventListener('error', e => logError('global', e.error));
window.addEventListener('unhandledrejection', e => logError('global', e.reason));
