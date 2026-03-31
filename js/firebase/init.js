// ════════════════════════════════
// firebase/init.js — Initialize Firebase db & storage
// Must load AFTER config.js
// ════════════════════════════════

let jobs = [], currentFilter = 'all', openCards = {}, openTabs = {}, openNotes = {};
let db = null, storage = null;

if (firebaseConfig.apiKey !== 'YOUR_API_KEY') {
  try {
    firebase.initializeApp(firebaseConfig);
    db      = firebase.database();
    storage = firebase.storage();
  } catch(e) { console.warn('[Firebase] Init error:', e); }
}
