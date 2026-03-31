// ════════════════════════════════
// modules/issues.module.js
// ════════════════════════════════
// ════════════════════════════════
// ISSUES MODULE
// ════════════════════════════════
const ISS_PRI  = ['critical','high','medium','low'];
const ISS_STAT = ['open','in-progress','resolved'];
let addIssueOpen = {};

function priLabel(p) { return {critical:'🔴 Critical',high:'🟠 High',medium:'🟡 Medium',low:'🟢 Low'}[p]||p; }
function statLabel(s) { return {'open':'⚡ Open','in-progress':'🔄 In Progress','resolved':'✅ Resolved'}[s]||s; }

function renderIssues(j) {
  const issues = j.issues || [];
  const openCount = issues.filter(x=>x.status!=='resolved').length;
  const isOpen = addIssueOpen[j.id];
  const canE = canEditJob(j);

  const addFormHtml = canE ? `
  <div class="add-issue-form ${isOpen?'open':''}" id="aif-${j.id}">
    <div style="font-size:10px;font-weight:700;color:var(--accent);margin-bottom:8px">➕ ${currentLang==='th'?'เพิ่ม Issue ใหม่':'New Issue'}</div>
    <input id="iss-title-${j.id}" placeholder="${currentLang==='th'?'หัวข้อ Issue...':'Issue title...'}" style="margin-bottom:8px">
    <textarea id="iss-desc-${j.id}" placeholder="${currentLang==='th'?'รายละเอียด (ถ้ามี)':'Description (optional)'}" style="margin-bottom:8px"></textarea>
    <div class="iss-form-row">
      <select id="iss-pri-${j.id}" style="flex:1">
        ${ISS_PRI.map(p=>`<option value="${p}">${priLabel(p)}</option>`).join('')}
      </select>
    </div>
    <div class="iss-form-btns" style="margin-top:8px">
      <button class="action-btn btn-on" style="flex:1" onclick="submitIssue('${j.id}')">${currentLang==='th'?'บันทึก':'Save'}</button>
      <button class="action-btn btn-muted" onclick="closeAddIssue('${j.id}')">${currentLang==='th'?'ยกเลิก':'Cancel'}</button>
    </div>
  </div>` : '';

  const listHtml = issues.length === 0
    ? `<div style="font-size:11px;color:var(--muted);padding:6px 0">${currentLang==='th'?'ยังไม่มี issue':'No issues logged'}</div>`
    : issues.map((iss,idx) => {
        const resolveNote = iss.resolveNote ? `<div class="iss-resolve-note">✅ ${iss.resolveNote}</div>` : '';
        const descHtml = iss.desc ? `<div class="iss-desc">${iss.desc}</div>` : '';
        const actionBtns = canE ? `
          <div class="issue-actions">
            ${iss.status==='open'     ? `<button class="iss-btn" onclick="setIssueStatus('${j.id}',${idx},'in-progress')">→ ${currentLang==='th'?'กำลังแก้':'In Progress'}</button>` : ''}
            ${iss.status!=='resolved' ? `<button class="iss-btn resolve" onclick="resolveIssue('${j.id}',${idx})">✅ ${currentLang==='th'?'แก้แล้ว':'Resolve'}</button>` : ''}
            ${iss.status==='resolved' ? `<button class="iss-btn" onclick="setIssueStatus('${j.id}',${idx},'open')">↩ ${currentLang==='th'?'เปิดใหม่':'Reopen'}</button>` : ''}
            <button class="iss-btn" onclick="cycleIssuePri('${j.id}',${idx})">🏷 ${priLabel(iss.priority)}</button>
            <button class="iss-btn del" onclick="deleteIssue('${j.id}',${idx})">🗑</button>
          </div>` : '';
        return `
        <div class="issue-item pri-${iss.priority} ${iss.status==='resolved'?'resolved':''}">
          <div class="issue-top">
            <div class="issue-title">${iss.title}</div>
            <div class="issue-badges">
              <span class="pri-badge ${iss.priority}">${priLabel(iss.priority)}</span>
              <span class="iss-status-badge ${iss.status}">${statLabel(iss.status)}</span>
            </div>
          </div>
          ${descHtml}${resolveNote}${actionBtns}
        </div>`;
      }).join('');

  return `
  <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px;display:flex;align-items:center;justify-content:space-between">
    <span>${currentLang==='th'?'Issues':'Issues'} ${openCount>0?`<span style="background:var(--red);color:#fff;border-radius:8px;font-size:9px;padding:1px 6px;font-family:'IBM Plex Mono',monospace;margin-left:4px">${openCount}</span>`:''}</span>
    ${canE?`<button class="iss-btn" onclick="openAddIssue('${j.id}')">➕ ${currentLang==='th'?'เพิ่ม':'Add'}</button>`:''}
  </div>
  ${addFormHtml}
  <div class="issue-list">${listHtml}</div>`;
}

function openAddIssue(id)  { addIssueOpen[id]=true;  render(); setTimeout(()=>{ const el=document.getElementById('iss-title-'+id); if(el) el.focus(); },60); }
function closeAddIssue(id) { addIssueOpen[id]=false; render(); }

function submitIssue(id) {
  const j=jobs.find(x=>x.id===id); if(!j) return;
  const titleEl=document.getElementById('iss-title-'+id);
  const descEl=document.getElementById('iss-desc-'+id);
  const priEl=document.getElementById('iss-pri-'+id);
  const title=(titleEl?titleEl.value:'').trim();
  if(!title) return alert(currentLang==='th'?'กรุณาระบุหัวข้อ issue':'Please enter issue title');
  if(!j.issues) j.issues=[];
  j.issues.push({ title, desc:(descEl?descEl.value:'').trim(), priority:priEl?priEl.value:'medium', status:'open', createdAt:new Date().toISOString(), createdBy:currentUser.name });
  addIssueOpen[id]=false;
  saveJob(j); render();
}

function setIssueStatus(id,idx,status) {
  const j=jobs.find(x=>x.id===id); if(!j||!j.issues[idx]) return;
  j.issues[idx].status=status;
  saveJob(j); render();
}

function resolveIssue(id,idx) {
  const j=jobs.find(x=>x.id===id); if(!j||!j.issues[idx]) return;
  const note=prompt(currentLang==='th'?'หมายเหตุการแก้ไข (ไม่บังคับ):':'Resolution note (optional):','');
  if(note===null) return; // cancelled
  j.issues[idx].status='resolved';
  j.issues[idx].resolveNote=note.trim();
  j.issues[idx].resolvedAt=new Date().toISOString();
  j.issues[idx].resolvedBy=currentUser.name;
  saveJob(j); render();
}

function cycleIssuePri(id,idx) {
  const j=jobs.find(x=>x.id===id); if(!j||!j.issues[idx]) return;
  const cur=j.issues[idx].priority||'medium';
  const next=ISS_PRI[(ISS_PRI.indexOf(cur)+1)%ISS_PRI.length];
  j.issues[idx].priority=next;
  saveJob(j); render();
}

function deleteIssue(id,idx) {
  const j=jobs.find(x=>x.id===id); if(!j) return;
  if(!confirm(currentLang==='th'?'ลบ issue นี้?':'Delete this issue?')) return;
  j.issues.splice(idx,1);
  saveJob(j); render();
}

function toggleDelayed(id){
  const j=jobs.find(x=>x.id===id); if(!j) return;
  if(!canEditJob(j)) return;
  j.delayed=!j.delayed;
  if(!j.delayed){ j.delayReason=''; j.plannedDate=''; j.actualDate=''; }
  else {
    const today=new Date().toISOString().slice(0,10);
    if(!j.plannedDate) j.plannedDate=today;
    if(!j.actualDate)  j.actualDate=today;
  }
  saveJob(j); render();
}
function setDelay(id,field,val){ const j=jobs.find(x=>x.id===id); if(j){j[field]=val;saveJob(j);render();} }
function setCompletionDate(id,val){ const j=jobs.find(x=>x.id===id); if(j){j.completionDate=val;saveJob(j);render();} }
function toggleNote(id){ openNotes[id]=!openNotes[id];render(); }
function saveNote(id){ const j=jobs.find(x=>x.id===id); const el=document.getElementById('note-'+id); if(j&&el){j.note=el.value;saveJob(j);render();} }

function setFilter(f,btn){
  currentFilter=f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); render();
}

function updateStats(){
  document.getElementById('s-all').textContent    =jobs.length;
  document.getElementById('s-done').textContent   =jobs.filter(j=>j.status==='done').length;
  document.getElementById('s-dwr').textContent    =jobs.reduce((a,j)=>a+(j.dwrs||[]).filter(d=>d.sent).length,0);

  const openIssues = jobs.reduce((a,j)=>a+(j.issues||[]).filter(x=>x.status!=='resolved').length,0);
  document.getElementById('s-issues').textContent = openIssues;
  const issBox = document.getElementById('stat-issue-box');
  if(openIssues>0) issBox.classList.add('stat-delay'); else issBox.classList.remove('stat-delay');
  
  const delayCount = jobs.filter(j=>{ const dl = postDeadline(j); return (dl !== null && dl < 0) || j.delayed; }).length;
  document.getElementById('s-delayed').textContent = delayCount;
  
  const delayBox = document.getElementById('stat-delay-box');
  if(delayCount > 0) delayBox.classList.add('stat-delay'); else delayBox.classList.remove('stat-delay');
}