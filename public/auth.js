/* ── RTGS PGL — Shared Auth Module ── */
/* Loaded by index.html, season3.html, and analytics.html */

const USERS = [
  { username:'admin',     password:'rtgs@2026',  role:'admin',   team:null, display:'Admin' },
  { username:'captain.d', password:'dhurandhar', role:'captain', team:'D',  display:'Capt · Team Dhurandhar' },
  { username:'captain.r', password:'rushabh',    role:'captain', team:'R',  display:'Capt · Team Rushabh' },
];

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

function doLogin() {
  const u = document.getElementById('loginUser').value.trim().toLowerCase();
  const p = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  const match = USERS.find(x => x.username === u && x.password === p);
  if (!match) {
    err.textContent = 'Invalid username or password.';
    document.getElementById('loginPass').value = '';
    return;
  }
  err.textContent = '';
  sessionStorage.setItem('rtgs_session', JSON.stringify({
    username: match.username, role: match.role,
    team: match.team, display: match.display
  }));
  trackEvent('login', { persona: match.role, username: match.username });
  window.location.reload();
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
