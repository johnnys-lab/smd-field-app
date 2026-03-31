// ════════════════════════════════
// config.js — Firebase, LANG, TEAM, DOCS
// ════════════════════════════════

const firebaseConfig = {
  apiKey:"AIzaSyDJ7zx7eGyo3922VAM3WrNUIWYWp0JlqsM",
  authDomain:"job-tracker-2026.firebaseapp.com",
  databaseURL:"https://job-tracker-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:"job-tracker-2026",storageBucket:"job-tracker-2026.firebasestorage.app",
  messagingSenderId:"382119643567",appId:"1:382119643567:web:f5d8b3c1ac61efa4b2875a"
};
const DB_PATH = 'jobs_mar26_v2';
const LIFF_ID = '2009342488-tOiCe4vR';


// ════════════════════════════════
// Telegram Notification Config
// ════════════════════════════════
const TG_BOT_TOKEN = '8643336165:AAH8iIYPim76amYKKvmHn-EH7vaJGq7Qv4A';
const TG_CHAT_ID   = '-5156371757';
let currentLang = 'en';
function T(k) { return (LANG[currentLang]||LANG['en'])[k] || k; }

const TEAM = [
  {name:'Kraiyut',   nick:'Poy'}, {name:'Alongkorn', nick:'Ken'},
  {name:'Nuttawout', nick:'Ben'}, {name:'Khanathip', nick:'Earth'},
  {name:'Krit',      nick:'New'}, {name:'Matus',     nick:'Pond'},
  {name:'Johnny',    nick:'Joni'}
];

let selectedEngs = new Set();
let isCompact = false;

const DOCS = {
  pre:[
    {key:'borrower',    name:"Borrower's form",               code:'TCBKK-F-ADM-002',     t:'bkk'},
    {key:'neweng',      name:'New engineer equipment checklist',code:'TCTPE-630-4-120.35A',t:'iso'},
    {key:'preonsite',   name:'Pre-onsite checklist form',     code:'TCTPE-630-4-120.08C',  t:'iso'},
    {key:'confine',     name:'Confined space certificate',    code:'—',                    t:'na'},
    {key:'medical',     name:'Medical certificate',           code:'—',                    t:'na'},
    {key:'idcard',      name:'Copy of ID card',               code:'—',                    t:'na'},
  ],
  on_common:[
    {key:'dwr',         name:'Daily work record form',        code:'TCBKK-F-SMD-003',      t:'bkk'},
  ],
  on_types:{
    'ESP Inspection':[
      {key:'insp_sheet',name:'Inspection check sheet',        code:'N/A',                  t:'na'},
      {key:'jha_insp',  name:'JHA inspection',                code:'TCBKK-F-SMD-011',      t:'bkk'},
      {key:'part_dim',  name:'Part dimension record',         code:'—',                    t:'na'},
    ],
    'Maintenance':[
      {key:'dtr',       name:'Daily time record form',        code:'TCBKK-F-SMD-002',      t:'bkk'},
      {key:'mob_cl',    name:'Contractor mobilization checklist',code:'TCBKK-CL-SMD-002',  t:'bkk'},
      {key:'safety_g',  name:'Safety guidance report (Turnkey)',code:'TCTPE-630-4-120.07C',t:'iso'},
      {key:'jha_maint', name:'JHA maintenance',               code:'TCBKK-F-SMD-012',      t:'bkk'},
      {key:'demob',     name:'Demobilization checklist',      code:'TCBKK-CL-SMD-003',     t:'bkk'},
      {key:'gant',      name:'Gant chart',                   code:'—',                    t:'na'},
    ],
    default:[
      {key:'dtr',       name:'Daily time record form',        code:'TCBKK-F-SMD-002',      t:'bkk'},
    ],
  },
  post:[
    {key:'upload',      name:'Upload DWR/photos/checksheet to server + email coordinator',code:'—',t:'na'},
    {key:'draft_rpt',   name:'1st draft Final Report (within 4 days)',code:'TCBKK-RP-SMD-001 / -002',t:'bkk'},
    {key:'contractor_r',name:'Contractor rating form',        code:'TCTPE-530-4-150.09B',  t:'iso'},
  ],
  issue:[
    {key:'handover',    name:'Work Handover Form',            code:'TCBKK-F-SMD-005',      t:'bkk'},
    {key:'incident',    name:'Incident Report Form',          code:'TCBKK-F-SMD-010',      t:'bkk'},
  ],
};

function getOnDocs(type) { return [...DOCS.on_common, ...(DOCS.on_types[type] || DOCS.on_types['default'])]; }

function blankState(base) {
  return {...base, status:'pending', phase:'pre', note:'', report:false, dwrs:[],
    delayed:false, delayReason:'', plannedDate:'', actualDate:'', checks:{pre:{},on:{},post:{},issue:{}}, completionDate:'', lastUpdatedBy:'', lastUpdatedAt:'', issues:[], photos:[]};
}

function mergeState(base, id, s) {
  if (!s) return blankState({...base, id});
  return {...base, id,
    status:         s.status         || 'pending',
    phase:          s.phase          || 'pre',
    note:           s.note           || '',
    report:         s.report         || false,
    dwrs:           s.dwrs           || [],
    delayed:        s.delayed        || false,
    delayReason:    s.delayReason    || '',
    plannedDate:    s.plannedDate    || '',
    actualDate:     s.actualDate     || '',
    checks:         s.checks         || {pre:{},on:{},post:{},issue:{}},
    issues:         s.issues         || [],
    photos:         s.photos         || [],
    completionDate: s.completionDate || '',
    endDate:        s.endDate        || '',
    lastUpdatedBy:  s.lastUpdatedBy  || '',
    lastUpdatedAt:  s.lastUpdatedAt  || ''
  };
}

const LANG = {
  en: {
    greeting: 'Hello,',
    total: 'Total Jobs', completed: 'Completed', dwr: 'DWR Sent', draft: 'Draft ✓', delay: 'Delay',
    filterAll: 'All', filterActive: 'Active', filterDone: 'Completed',
    searchPlaceholder: '🔍 Search job, engineer, type...',
    modalTitle: '+ Add New Job',
    fTitle: 'Job Title *', fTitlePH: 'e.g. ABC Co. – ESP Inspection',
    fType: 'Service Type', fDate: 'Start Date', fEnd: 'End Date',
    fEng: 'Engineers (select multiple)', fEngNone: 'None selected',
    btnSave: '✓ Save Job',
    statusPending: 'Pending', statusOngoing: 'In Progress', statusDone: 'Completed',
    noJobs: 'No jobs found',
    tabPre: '📋 Pre', tabOn: '🔧 On-site', tabPost: '📝 Post', tabIssue: '⚠ Issue',
    movePhase: 'Move Phase',
    btnPre: '📋 Pre-onsite', btnOn: '🔧 On-site', btnPost: '📝 Post-job',
    clPre: 'Pre-onsite Checklist', clOn: 'On-site Checklist', clPost: 'Post-job Checklist',
    addDwr: '+ Add Day', dwrSent: 'Submitted', dwrPending: 'Not Sent',
    completionLabel: 'Actual Completion Date (4-day Final Report clock)',
    issueLabel: 'Issue / Problem Documents',
    delayLabel: 'Delay Tracker',
    delayed: 'Delayed', logDelay: 'Log Delay',
    isDelayed: 'Job is delayed', onTrack: 'On track',
    delayedDays: 'Delayed:', days: 'day(s)',
    delayReason: 'Reason for delay...',
    noteLabel: 'Note', addNote: '📝 Add Note', hideNote: '📝 Hide Note',
    notePH: 'Add notes...',
    statusLabel: 'Job Status',
    btnStart: '▶ Start Job', btnComplete: '✓ Complete', btnReset: '↺ Reset', btnDelete: '🗑 Delete Job',
    dlOverdue: '🚨 Final Report Overdue by ', dlToday: '⚠ Final Report Due Today', dlLeft: '✅ Final Report — ', dlLeftSuffix: ' day(s) remaining',
    lastUpdated: '🔄 Last updated:', by: 'by',
    confirmDelete: 'Delete this job?',
    phasePrompt: '🎉 On-site documents 100% complete!\nMove phase to "📝 Post-job" now?',
    alertTitle: 'Please enter a job title',
    alertEng: 'Please select at least one engineer',
    compact: '🗜️ Compact',
  },
  th: {
    greeting: 'สวัสดี,',
    total: 'งานทั้งหมด', completed: 'เสร็จสิ้น', dwr: 'DWR ส่งแล้ว', draft: 'Draft ✓', delay: 'Delay',
    filterAll: 'ทั้งหมด', filterActive: 'กำลังทำ', filterDone: 'เสร็จสิ้น',
    searchPlaceholder: '🔍 ค้นชื่องาน, วิศวกร, ประเภท...',
    modalTitle: '+ เพิ่มงานใหม่',
    fTitle: 'ชื่องาน *', fTitlePH: 'เช่น ABC Co. – ESP Inspection',
    fType: 'ประเภทงาน', fDate: 'วันที่เริ่มงาน', fEnd: 'วันที่จบงาน',
    fEng: 'วิศวกร (เลือกได้หลายคน)', fEngNone: 'ยังไม่ได้เลือก',
    btnSave: '✓ บันทึกงาน',
    statusPending: 'รอดำเนินการ', statusOngoing: 'กำลังดำเนินการ', statusDone: 'เสร็จสิ้น',
    noJobs: 'ไม่พบข้อมูล',
    tabPre: '📋 Pre', tabOn: '🔧 On-site', tabPost: '📝 Post', tabIssue: '⚠ Issue',
    movePhase: 'ย้าย Phase',
    btnPre: '📋 Pre-onsite', btnOn: '🔧 On-site', btnPost: '📝 Post-job',
    clPre: 'Checklist Pre-onsite', clOn: 'Checklist On-site', clPost: 'Checklist Post-job',
    addDwr: '+ เพิ่มวัน', dwrSent: 'ส่งแล้ว', dwrPending: 'ยังไม่ส่ง',
    completionLabel: 'วันที่งานเสร็จ (นับ 4 วัน Final Report)',
    issueLabel: 'เอกสาร Issue / Problem',
    delayLabel: 'Delay Tracker',
    delayed: 'มีดีเลย์', logDelay: 'บันทึก Delay',
    isDelayed: 'งานล่าช้า', onTrack: 'ปกติ',
    delayedDays: 'ล่าช้า:', days: 'วัน',
    delayReason: 'สาเหตุ...',
    noteLabel: 'Note', addNote: '📝 เพิ่มโน้ต', hideNote: '📝 ซ่อนโน้ต',
    notePH: 'บันทึกรายละเอียด...',
    statusLabel: 'สถานะงาน',
    btnStart: '▶ เริ่มงาน', btnComplete: '✓ เสร็จสิ้น', btnReset: '↺ รีเซ็ต', btnDelete: '🗑 ลบงานนี้',
    dlOverdue: '🚨 Final Report เกินกำหนด ', dlToday: '⚠ Final Report ครบกำหนดวันนี้', dlLeft: '✅ Final Report เหลือ ', dlLeftSuffix: ' วัน',
    lastUpdated: '🔄 ล่าสุด:', by: 'โดย',
    confirmDelete: 'ลบงานนี้?',
    phasePrompt: '🎉 เอกสาร On-site ครบ 100% แล้ว\nต้องการเปลี่ยน Phase เป็น "📝 Post-job" อัตโนมัติหรือไม่?',
    alertTitle: 'กรุณาใส่ชื่องาน',
    alertEng: 'กรุณาเลือกวิศวกรอย่างน้อย 1 คน',
    compact: '🗜️ Compact',
  }
};


function toggleLang() {
  currentLang = currentLang === 'en' ? 'th' : 'en';
  const btn = document.getElementById('lang-btn');
  btn.textContent = currentLang === 'en' ? '🇬🇧 EN' : '🇹🇭 TH';
  applyLang();
  render();
}

function applyLang() {
  const L = LANG[currentLang];
  // greeting
  const greetEl = document.querySelector('header > div > div');
  if (greetEl) greetEl.childNodes[0].textContent = L.greeting + ' ';
  // stats labels
  const labels = document.querySelectorAll('.stat .label');
  const keys = ['total','completed','dwr','draft','delay'];
  labels.forEach((el,i) => { if(keys[i]) el.textContent = L[keys[i]]; });
  // filter buttons
  const fb = document.querySelectorAll('.filter-bar .filter-btn');
  if(fb[0]) fb[0].textContent = L.filterAll;
  if(fb[1]) fb[1].textContent = L.filterActive;
  if(fb[2]) fb[2].textContent = L.filterDone;
  // search
  const si = document.getElementById('search-input');
  if(si) si.placeholder = L.searchPlaceholder;
  // modal
  const mt = document.querySelector('.modal-title span');
  if(mt) mt.textContent = L.modalTitle;
  const flabels = document.querySelectorAll('.field label');
  const fieldKeys = ['fTitle','fType','fDate','fEnd','fEng'];
  // update modal field labels
  document.querySelectorAll('.modal .field label').forEach((el,i) => {
    if(fieldKeys[i]) el.textContent = L[fieldKeys[i]];
  });
  const titleInput = document.getElementById('f-title');
  if(titleInput) titleInput.placeholder = L.fTitlePH;
  const engLabel = document.getElementById('eng-selected-label');
  if(engLabel && (engLabel.textContent === 'None selected' || engLabel.textContent === 'ยังไม่ได้เลือก')) engLabel.textContent = L.fEngNone;
  const selectedSpan = document.querySelector('[style*="Selected:"], [style*="เลือกแล้ว"]');
  const btnSubmit = document.querySelector('.btn-submit');
  if(btnSubmit) btnSubmit.textContent = L.btnSave;
  // compact button
  const cb = document.getElementById('compact-btn');
  if(cb) cb.textContent = L.compact + ' View';
}


// ════════════════════════════════
// Admin Panel
// ════════════════════════════════