// ════════════════════════════════
// firebase/init.js — Initialize Firebase
// ════════════════════════════════
// ════════════════════════════════
// Telegram Notification Config
// ════════════════════════════════
const TG_BOT_TOKEN = '8643336165:AAH8iIYPim76amYKKvmHn-EH7vaJGq7Qv4A';
const TG_CHAT_ID   = '-5156371757';
let currentLang = 'en';
function T(k) { return (LANG[currentLang]||LANG['en'])[k] || k; }

let jobs=[], currentFilter='all', openCards={}, openTabs={}, openNotes={}, db=null, storage=null;

if (firebaseConfig.apiKey !== 'YOUR_API_KEY') {
  try { firebase.initializeApp(firebaseConfig); db=firebase.database(); storage=firebase.storage(); } catch(e){}
}