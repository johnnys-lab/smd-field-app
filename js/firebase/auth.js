// ════════════════════════════════
// firebase/auth.js — Auth & Role System
// ════════════════════════════════
// ════════════════════════════════
// Role System
// ════════════════════════════════
let currentUser = { lineUserId: null, name: 'Guest', nick: '', role: 'viewer' };

const ROLE_LABELS = { admin: '👑 Admin', engineer: '🔧 Engineer', viewer: '👁 Viewer', pending: '⏳ Pending' };
const ROLE_CLASSES = { admin: 'role-admin', engineer: 'role-engineer', viewer: 'role-viewer', pending: 'role-pending' };

function canEdit()  { return currentUser.role === 'admin' || currentUser.role === 'engineer'; }
function canAdmin() { return currentUser.role === 'admin'; }
function isMyJob(j) {
  const u = currentUser;
  return (j.engineers||[]).some(e => {
    // match by name (case-insensitive)
    if (u.name && e.name && e.name.toLowerCase() === u.name.toLowerCase()) return true;
    // match by nick (case-insensitive, skip empty)
    if (u.nick && e.nick && e.nick.toLowerCase() === u.nick.toLowerCase()) return true;
    // match by lineUserId stored on engineer record
    if (u.lineUserId && e.lineUserId && e.lineUserId === u.lineUserId) return true;
    return false;
  });
}
function canEditJob(j) {
  if (!canEdit()) return false;
  if (currentUser.role === 'admin') return true;
  // engineer: can edit own jobs OR jobs with no engineers assigned yet
  const engList = j.engineers || [];
  if (engList.length === 0) return true;
  return isMyJob(j);
}

function applyRoleUI() {
  const role = currentUser.role;
  // role badge
  const badge = document.getElementById('role-badge');
  if (badge) {
    badge.textContent = ROLE_LABELS[role] || role;
    badge.className = 'role-badge ' + (ROLE_CLASSES[role] || '');
    badge.style.display = 'inline-block';
  }
  // viewer mode
  if (role === 'viewer' || role === 'pending') {
    document.body.classList.add('viewer-mode');
  } else {
    document.body.classList.remove('viewer-mode');
  }
  // admin button
  const adminBtn = document.getElementById('admin-btn');
  if (adminBtn) adminBtn.style.display = canAdmin() ? 'inline-flex' : 'none';
  // fab (add job)
  const fab = document.querySelector('.fab');
  if (fab) fab.style.display = canEdit() ? 'flex' : 'none';
}

function setCurrentUser(profile, dbUser) {
  currentUser = {
    lineUserId: profile.userId,
    name:  dbUser ? dbUser.name  : profile.displayName,
    nick:  dbUser ? dbUser.nick  : '',
    role:  dbUser ? dbUser.role  : 'pending',
  };
  document.getElementById('user-name').textContent = currentUser.nick || currentUser.name;
  applyRoleUI();
}

// ────────────────────────────────
// Telegram Notification
// ────────────────────────────────
function sendTelegram(message) {
  if (!TG_BOT_TOKEN || TG_BOT_TOKEN === 'YOUR_BOT_TOKEN') return;
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return;
  fetch('https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  }).catch(() => {}); // silent fail — don't block app
}

function notifyLogin(user, isNewUser) {
  const now = new Date();
  const timeStr = now.toLocaleString('en-GB', {
    day:'2-digit', month:'short', year:'2-digit',
    hour:'2-digit', minute:'2-digit'
  });
  const roleEmoji = { admin:'👑', engineer:'🔧', viewer:'👁', pending:'⏳' };
  const emoji = roleEmoji[user.role] || '👤';

  let msg;
  if (isNewUser) {
    msg = '🆕 <b>New User Registered</b>\n' +
          '👤 ' + (user.name || 'Unknown') + '\n' +
          '🕐 ' + timeStr + '\n' +
          '⚠️ Role: Pending — please approve in app';
  } else {
    msg = emoji + ' <b>' + (user.nick || user.name) + '</b> logged in\n' +
          '🏷 Role: ' + (user.role || 'unknown') + '\n' +
          '🕐 ' + timeStr;
  }
  sendTelegram(msg);
}

function checkUserRole(profile) {
  // Wait for db to be ready (max 5s) before fetching role
  if (!db) {
    let waited = 0;
    const poll = setInterval(() => {
      waited += 200;
      if (db) {
        clearInterval(poll);
        checkUserRole(profile);
      } else if (waited >= 5000) {
        clearInterval(poll);
        console.warn('[Auth] db not ready after 5s — falling back to viewer');
        setCurrentUser(profile, null);
        showApp();
      }
    }, 200);
    return;
  }
  db.ref('users/' + profile.userId).once('value').then(snap => {
    const dbUser = snap.val();
    const isNewUser = !dbUser || !dbUser.role;
    setCurrentUser(profile, dbUser);
    if (isNewUser && !dbUser) {
      // First time only — do NOT overwrite if user exists but role is missing
      db.ref('users/' + profile.userId).set({
        name: profile.displayName,
        nick: '',
        role: 'pending',
        lineUserId: profile.userId,
        addedAt: new Date().toISOString()
      });
      notifyLogin({ name: profile.displayName, nick: '', role: 'pending' }, true);
    } else {
      notifyLogin(dbUser || {name: profile.displayName, role: 'viewer'}, false);
    }
    showApp();
  }).catch(() => {
    setCurrentUser(profile, null);
    showApp();
  });
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  load();
}

function doLineLogin() {
  if (typeof liff !== 'undefined') {
    liff.login();
  } else {
    // Dev fallback: bypass login
    const devProfile = { userId: 'dev-browser', displayName: 'Dev Browser' };
    setCurrentUser(devProfile, { name:'Dev Browser', nick:'Dev', role:'admin' });
    showApp();
  }
}

// Init: try LIFF
if (typeof liff !== 'undefined' && LIFF_ID !== 'YOUR_LIFF_ID') {
  liff.init({ liffId: LIFF_ID })
    .then(() => {
      if (liff.isLoggedIn()) {
        liff.getProfile().then(profile => checkUserRole(profile));
      } else {
        // Not logged in — show login screen
        // (login screen is already visible by default)
      }
    })
    .catch(() => {
      // LIFF failed (e.g. browser) — show login screen with fallback
      const loginNote = document.querySelector('.login-note');
      if (loginNote) loginNote.textContent = 'Opening in browser — tap Login to continue as Dev mode';
    });
} else {
  // No LIFF SDK — dev mode auto-login as admin
  const devProfile = { userId: 'dev-browser', displayName: 'Dev Browser' };
  setCurrentUser(devProfile, { name:'Dev Browser', nick:'Dev', role:'admin' });
  showApp();
}

const statusLabel={}; function getStatusLabel(s){ return {pending:T('statusPending'),ongoing:T('statusOngoing'),done:T('statusDone')}[s]||s; }
// ════════════════════════════════
// Refresh Role (manual re-fetch)
// ════════════════════════════════
function refreshRole() {
  if (!db || !currentUser.lineUserId) {
    alert('No Firebase connection or user session');
    return;
  }
  const btn = document.getElementById('refresh-role-btn');
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

  db.ref('users/' + currentUser.lineUserId).once('value').then(snap => {
    const dbUser = snap.val();
    if (dbUser && dbUser.role) {
      currentUser.role = dbUser.role;
      currentUser.nick = dbUser.nick || currentUser.nick;
      applyRoleUI();
      document.getElementById('user-name').textContent = currentUser.nick || currentUser.name;
      console.log('[Auth] Role refreshed:', dbUser.role);
    }
    if (btn) { btn.textContent = '🔄'; btn.disabled = false; }
    // Reload jobs with new permissions
    render();
  }).catch(e => {
    console.error('[Auth] Refresh role failed:', e);
    if (btn) { btn.textContent = '🔄'; btn.disabled = false; }
  });
}
