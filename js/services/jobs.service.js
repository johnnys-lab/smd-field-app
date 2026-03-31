// ════════════════════════════════
// services/jobs.service.js
// ════════════════════════════════
function enrichTeamFromFirebase() {
  // Pull lineUserId into TEAM list so canEditJob can match by lineUserId
  if (!db) return;
  db.ref('users').once('value').then(snap => {
    const users = snap.val() || {};
    Object.values(users).forEach(u => {
      const member = TEAM.find(t =>
        (u.nick && t.nick && t.nick.toLowerCase() === u.nick.toLowerCase()) ||
        (u.name && t.name && t.name.toLowerCase() === u.name.toLowerCase())
      );
      if (member && u.lineUserId) member.lineUserId = u.lineUserId;
    });
  }).catch(() => {});
}

function load() {
  enrichTeamFromFirebase();
  if (db) {
    db.ref(DB_PATH).on('value', snap => {
      const data = snap.val() || {};
      jobs = [];
      Object.keys(data).forEach(id => {
        if (data[id].title||data[id].meta) {
          const d=data[id], base=d.meta||{title:d.title,type:d.type||'',date:d.date||'',engineers:d.engineers||[],tentative:false};
          jobs.push(mergeState(base,id,d));
        }
      });
      jobs.sort((a,b)=>String(b.id).localeCompare(String(a.id),undefined,{numeric:true}));
      render();
    });
  }
}

// Save job with last-updated tracking
function saveJob(j) {
  const now = new Date();
  const timeString = now.toLocaleDateString('en-GB', { year:'2-digit', month:'short', day:'numeric' }) + ' ' + now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  j.lastUpdatedBy = currentUser.nick || currentUser.name;
  j.lastUpdatedAt = timeString;

  const p={status:j.status,phase:j.phase,note:j.note,report:j.report,dwrs:j.dwrs,
    delayed:j.delayed,delayReason:j.delayReason,plannedDate:j.plannedDate,actualDate:j.actualDate,
    checks:j.checks,completionDate:j.completionDate,endDate:j.endDate||'', lastUpdatedBy:j.lastUpdatedBy, lastUpdatedAt:j.lastUpdatedAt,
    meta:{title:j.title,type:j.type,date:j.date,engineers:j.engineers,tentative:j.tentative||false}};
    
  if(db) db.ref(DB_PATH+'/'+j.id).set(p);
}

function deleteJob(id) { if(!canAdmin()) return; if(!confirm(T('confirmDelete'))) return; if(db) db.ref(DB_PATH+'/'+id).remove(); }
function calcDelayDays(p,a) { if(!p||!a) return 0; const pd=new Date(p),ad=new Date(a); return isNaN(pd)||isNaN(ad)?0:Math.max(0,Math.round((ad-pd)/86400000)); }
function docProg(j, phase) {
  const list = phase==='on' ? getOnDocs(j.type) : (DOCS[phase]||[]);
  if (!list.length) return {pct:100,done:0,total:0};
  const ch=(j.checks&&j.checks[phase])||{}; const done=list.filter(d=>ch[d.key]).length;
  return {pct:Math.round(done/list.length*100),done,total:list.length};
}
function overallPct(j) { let done=0,total=0; ['pre','on','post'].forEach(p=>{ const r=docProg(j,p); done+=r.done; total+=r.total; }); return total?Math.round(done/total*100):0; }
function postDeadline(j) {
  if(!j.completionDate) return null;
  const cd=new Date(j.completionDate), dl=new Date(cd); dl.setDate(dl.getDate()+4);
  const today=new Date(); today.setHours(0,0,0,0); return Math.round((dl-today)/86400000);
}

function toggleCompact() {
  isCompact = !isCompact;
  document.body.classList.toggle('is-compact', isCompact);
  document.getElementById('compact-btn').classList.toggle('active', isCompact);
}