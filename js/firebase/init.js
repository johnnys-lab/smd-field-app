// ════════════════════════════════
// firebase/init.js — Initialize Firebase db & storage
// Must load AFTER config.js
// ════════════════════════════════

let jobs = [], currentFilter = 'all', openCards = {}, openTabs = {}, openNotes = {};
let db = null, storage = null, auth = null;

if (firebaseConfig.apiKey !== 'YOUR_API_KEY') {
  try {
    firebase.initializeApp(firebaseConfig);
    db      = firebase.database();
    storage = firebase.storage();
    auth    = firebase.auth();

    // Sign in anonymously so auth != null → Firebase Rules pass
    auth.signInAnonymously()
      .then(() => console.log('[Firebase] Anonymous auth OK'))
      .catch(e => console.warn('[Firebase] Anonymous auth failed:', e));

  } catch(e) { console.warn('[Firebase] Init error:', e); }
}
