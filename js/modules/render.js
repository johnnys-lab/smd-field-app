// ════════════════════════════════
// modules/render.js
// ════════════════════════════════
function render() {
  updateStats();
  const list=document.getElementById('job-list');
  const q=document.getElementById('search-input').value.toLowerCase();
  let filtered=jobs;
  
  if(currentFilter==='pending'||currentFilter==='ongoing'||currentFilter==='done') filtered=jobs.filter(j=>j.status===currentFilter);
  else if(currentFilter.startsWith('phase-')) filtered=jobs.filter(j=>j.phase===currentFilter.replace('phase-',''));
    
  if(q) filtered=filtered.filter(j=>
    j.title.toLowerCase().includes(q)||j.type.toLowerCase().includes(q)||
    (j.engineers||[]).some(e=>e.name.toLowerCase().includes(q)||e.nick.toLowerCase().includes(q)));
    
  if(!filtered.length){list.innerHTML='<div class="empty">No jobs found</div>';return;}
  list.innerHTML=filtered.map(j=>renderCard(j)).join('');
}

function renderCard(j) {
  const ph=j.phase||'pre', pct=overallPct(j);
  const sentDWR=(j.dwrs||[]).filter(d=>d.sent).length;
  const tab=openTabs[j.id]||'pre', isOpen=!!openCards[j.id];
  const dl=postDeadline(j);

  const phaseClass=(seg)=>{ const order={pre:0,on:1,post:2}; if(seg===ph) return 'active'; if(order[seg]<order[ph]) return 'past'; return ''; };
  const pBar=(p,label)=>{
    const r=docProg(j,p==='on'?'on':p); const c=r.pct>=100?'var(--green)':r.pct>50?'var(--accent)':'var(--yellow)';
    return `<span style="font-size:9px;color:${c};font-family:'IBM Plex Mono',monospace">${label} ${r.done}/${r.total}</span>`;
  };

  const deadlineBanner=dl!==null?`<div class="deadline-banner ${dl<0?'urgent':dl<=2?'warn':'ok'}">
    ${dl<0?T('dlOverdue')+Math.abs(dl)+' '+T('days'):dl===0?T('dlToday'):T('dlLeft')+dl+T('dlLeftSuffix')}</div>`:'';

  // Show last updated info
  const lastUpdateHTML = j.lastUpdatedAt ? `<div class="update-log">${T('lastUpdated')} ${j.lastUpdatedAt} ${T('by')} <span style="color:var(--text)">${j.lastUpdatedBy}</span></div>` : '';

  return `
<div class="job-card ${j.status}" id="card-${j.id}">
  <div class="card-header" onclick="toggleCard('${j.id}')">
    <div class="job-top">
      <div class="job-title">${j.title}</div>
      <span class="badge ${j.status}">${getStatusLabel(j.status)}</span>
      <span class="compact-status">${getStatusLabel(j.status)}</span>
    </div>
    <div class="job-meta">
      <span>📅 ${j.date}</span><span>🔧 ${j.type}</span>
    </div>
    <div style="margin-bottom:6px">${(j.engineers||[]).map(e=>`<span class="eng-tag">${e.name} <span class="nickname">(${e.nick})</span></span>`).join('')}</div>
    <div class="phase-bar">
      <div class="phase-seg phase-pre ${phaseClass('pre')}">${T('tabPre')}</div>
      <div class="phase-seg phase-on ${phaseClass('on')}">On-site</div>
      <div class="phase-seg phase-post ${phaseClass('post')}">${T('tabPost')}</div>
    </div>
    <div class="compact-progress-wrap"><div class="prog-bar-fill" style="width:${pct}%;background:${pct>=100?'var(--green)':pct>50?'var(--accent)':'var(--yellow)'}"></div></div>
  </div>
  <div class="doc-progress">
    <span style="font-size:9px;color:var(--muted);white-space:nowrap">Docs ${pct}%</span>
    <div class="prog-bar-wrap"><div class="prog-bar-fill" style="width:${pct}%;background:${pct>=100?'var(--green)':pct>50?'var(--accent)':'var(--yellow)'}"></div></div>
    <div style="display:flex;gap:8px">${pBar('pre','Pre')} ${pBar('on','On')} ${pBar('post','Post')}</div>
  </div>

  <div class="card-body ${isOpen?'open':''}" id="body-${j.id}">
    <div class="tab-bar">
      <button class="tab-btn ${tab==='pre'?'active':''}"  onclick="setTab('${j.id}','pre');event.stopPropagation()">${T('tabPre')}</button>
      <button class="tab-btn ${tab==='on'?'active':''}"   onclick="setTab('${j.id}','on');event.stopPropagation()">On-site${(()=>{const n=(j.photos||[]).filter(p=>p.phase==='on').length;return n?` <span style="background:var(--accent);color:#fff;border-radius:8px;font-size:9px;padding:1px 5px;font-family:'IBM Plex Mono',monospace;">${n}</span>`:''})()}</button>
      <button class="tab-btn ${tab==='post'?'active':''}" onclick="setTab('${j.id}','post');event.stopPropagation()">${T('tabPost')}</button>
      <button class="tab-btn ${tab==='issue'?'active':''}" onclick="setTab('${j.id}','issue');event.stopPropagation()">${T('tabIssue')}${(()=>{const n=(j.issues||[]).filter(x=>x.status!=='resolved').length;return n?` <span style="background:var(--red);color:#fff;border-radius:8px;font-size:9px;padding:1px 5px;font-family:'IBM Plex Mono',monospace;">${n}</span>`:''})()}</button>
      <button class="tab-btn ${tab==='manage'?'active':''}" onclick="setTab('${j.id}','manage');event.stopPropagation()">⚙</button>
    </div>

    <div class="tab-pane ${tab==='pre'?'active':''}" id="tp-${j.id}-pre">
      <div style="margin-bottom:10px">
        <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">${T('movePhase')}</div>
        <div class="action-row">
          <button class="action-btn btn-pre" style="${ph==='pre'?'outline:2px solid var(--purple);':''}" onclick="setPhase('${j.id}','pre')">${T('btnPre')}</button>
          <button class="action-btn btn-on" style="${ph==='on'?'outline:2px solid var(--accent);':''}" onclick="setPhase('${j.id}','on')">On-site</button>
          <button class="action-btn btn-post" style="${ph==='post'?'outline:2px solid var(--green);':''}" onclick="setPhase('${j.id}','post')">${T('btnPost')}</button>
        </div>
      </div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px;display:flex;justify-content:space-between">
        ${T('clPre')} <span style="font-family:'IBM Plex Mono',monospace;color:${docProg(j,'pre').pct>=100?'var(--green)':'var(--yellow)'}">${docProg(j,'pre').done}/${docProg(j,'pre').total}</span>
      </div>
      ${renderCL(j,'pre',DOCS.pre)}
    </div>

    <div class="tab-pane ${tab==='on'?'active':''}" id="tp-${j.id}-on">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px;display:flex;justify-content:space-between">
        ${T('clOn')} (${j.type}) <span style="font-family:'IBM Plex Mono',monospace;color:${docProg(j,'on').pct>=100?'var(--green)':'var(--yellow)'}">${docProg(j,'on').done}/${docProg(j,'on').total}</span>
      </div>
      ${renderCL(j,'on',getOnDocs(j.type))}
      <div class="divider"></div>
      <div class="dwr-header">
        <span class="dwr-title">DWR (${sentDWR}/${(j.dwrs||[]).length}  days)</span>
        <button class="btn-add-dwr" onclick="addDWR('${j.id}')">${T('addDwr')}</button>
      </div>
      ${renderDWRs(j)}
      <div class="divider"></div>
      ${renderPhotos(j,'on')}
    </div>

    <div class="tab-pane ${tab==='post'?'active':''}" id="tp-${j.id}-post">
      ${deadlineBanner}
      <div style="font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">${T('completionLabel')}</div>
      <input type="date" value="${j.completionDate||''}" onchange="setCompletionDate('${j.id}',this.value)"
        style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--text);padding:7px 10px;font-family:inherit;font-size:12px;outline:none;margin-bottom:12px">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px;display:flex;justify-content:space-between">
        ${T('clPost')} <span style="font-family:'IBM Plex Mono',monospace;color:${docProg(j,'post').pct>=100?'var(--green)':'var(--yellow)'}">${docProg(j,'post').done}/${docProg(j,'post').total}</span>
      </div>
      ${renderCL(j,'post',DOCS.post)}
    </div>

    <div class="tab-pane ${tab==='issue'?'active':''}" id="tp-${j.id}-issue">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">${T('issueLabel')}</div>
      ${renderCL(j,'issue',DOCS.issue)}
      <div class="divider"></div>
      ${renderIssues(j)}
      <div class="divider"></div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">${T('delayLabel')}</div>
      <div class="toggle-row ${j.delayed?'r':''}" onclick="toggleDelayed('${j.id}')">
        <div class="t-check">${j.delayed?'!':''}</div>
        <div><div class="t-label">${j.delayed?T('delayed'):T('logDelay')}</div><div class="t-sub">${j.delayed?T('isDelayed'):T('onTrack')}</div></div>
      </div>
      <div class="delay-detail ${j.delayed?'open':''}" id="dd-${j.id}">
        <div class="delay-row-inp">
          <div class="delay-f"><label>Planned Date</label><input type="date" value="${j.plannedDate||''}" onchange="setDelay('${j.id}','plannedDate',this.value)"></div>
          <div class="delay-f"><label>Actual Date</label><input type="date" value="${j.actualDate||''}" onchange="setDelay('${j.id}','actualDate',this.value)"></div>
        </div>
        ${j.plannedDate&&j.actualDate?`<div style="font-size:11px;color:var(--red);font-weight:700;font-family:'IBM Plex Mono',monospace;margin-bottom:6px">${T('delayedDays')} ${calcDelayDays(j.plannedDate,j.actualDate)} ${T('days')}</div>`:''}
        <input type="text" value="${j.delayReason||''}" placeholder="${T('delayReason')}" onblur="setDelay('${j.id}','delayReason',this.value)"
          style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:6px 8px;font-size:11px;font-family:inherit;outline:none">
      </div>
      <div class="divider"></div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">${T('noteLabel')}</div>
      <div class="note-area ${openNotes[j.id]?'open':''}">
        <textarea id="note-${j.id}" onblur="saveNote('${j.id}')" placeholder="${T('notePH')}">${j.note||''}</textarea>
      </div>
      ${j.note&&!openNotes[j.id]?`<div style="font-size:11px;color:#c9a46a;padding:6px 8px;background:rgba(240,168,61,.07);border-radius:6px;margin-bottom:6px">📝 ${j.note}</div>`:''}
      <button class="action-btn btn-note" onclick="toggleNote('${j.id}')">📝 ${openNotes[j.id]?T('hideNote'):T('addNote')}</button>
    </div>

    <div class="tab-pane ${tab==='manage'?'active':''}" id="tp-${j.id}-manage">
      <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">${T('statusLabel')}</div>
      <div class="action-row">
        <button class="action-btn btn-on" onclick="setStatus('${j.id}','ongoing')">${T('btnStart')}</button>
        <button class="action-btn btn-post" onclick="setStatus('${j.id}','done')">${T('btnComplete')}</button>
        <button class="action-btn btn-muted" onclick="setStatus('${j.id}','pending')">${T('btnReset')}</button>
      </div>
      <div class="divider"></div>
      <button class="action-btn btn-del" onclick="deleteJob('${j.id}')">${T('btnDelete')}</button>
    </div>
    
    ${lastUpdateHTML}
  </div>
</div>`;
}

function renderCL(j, phase, list) {
  const ch=(j.checks&&j.checks[phase])||{};
  return list.map(d=>`
    <div class="cl-item ${ch[d.key]?'checked':''}" onclick="toggleCheck('${j.id}','${phase}','${d.key}')">
      <div class="cl-check">${ch[d.key]?'✓':''}</div>
      <div><div class="cl-name">${d.name}</div>${d.code&&d.code!=='—'?`<div class="cl-code ${d.t}">${d.code}</div>`:''}</div>
    </div>`).join('');
}

function isDWRLate(d) {
  if (!d.sent || !d.sentAt || !d.date) return false;
  // deadline = next day after work date at 12:00 local time
  const deadline = new Date(d.date + 'T12:00:00');
  deadline.setDate(deadline.getDate() + 1);
  return new Date(d.sentAt) > deadline;
}

function renderDWRs(j) {
  return (j.dwrs||[]).map(d=>{
    const late = isDWRLate(d);
    const rowClass = d.sent ? (late ? 'late-row' : 'sent-row') : '';
    const checkIcon = d.sent ? (late ? '⚠' : '✓') : '';
    let statusText = d.sent ? (late ? '⚠ Late' : T('dwrSent')) : T('dwrPending');
    let sentTimeHtml = '';
    if (d.sent && d.sentAt) {
      const t = new Date(d.sentAt);
      const hh = String(t.getHours()).padStart(2,'0');
      const mm = String(t.getMinutes()).padStart(2,'0');
      sentTimeHtml = `<span class="dwr-sent-time">${hh}:${mm}</span>`;
    }
    return `
    <div class="dwr-row ${rowClass}">
      <div class="dwr-check" onclick="toggleDWR('${j.id}',${d.uid})">${checkIcon}</div>
      <input type="date" class="dwr-date-input" value="${d.date||''}" onblur="updateDWRDate('${j.id}',${d.uid},this.value)">
      ${sentTimeHtml}
      <span class="dwr-status-label">${statusText}</span>
      <button class="btn-del-dwr" onclick="deleteDWR('${j.id}',${d.uid})">×</button>
    </div>`;
  }).join('');
}

function toggleCard(id){ if(!isCompact){ openCards[id]=!openCards[id]; render(); } }
function setTab(id,tab){ openTabs[id]=tab; openCards[id]=true; render(); }
function setPhase(id,p){ const j=jobs.find(x=>x.id===id); if(j&&canEditJob(j)){j.phase=p;saveJob(j);render();} }
function setStatus(id,s){ const j=jobs.find(x=>x.id===id); if(j&&canEditJob(j)){j.status=s;saveJob(j);render();} }

function toggleCheck(id,phase,key){
  const j=jobs.find(x=>x.id===id); if(!j) return;
  if(!canEditJob(j)) return;
  if(!j.checks) j.checks={pre:{},on:{},post:{},issue:{}};
  if(!j.checks[phase]) j.checks[phase]={};
  j.checks[phase][key]=!j.checks[phase][key];
  saveJob(j); 
  
  if(phase === 'on') {
     const prog = docProg(j, 'on');
     if(prog.done === prog.total && j.checks[phase][key]) {
        setTimeout(() => {
           if(confirm(T('phasePrompt'))) {
               setPhase(id, 'post');
           }
        }, 300);
     }
  }
  render();
}

function addDWR(id){
  const j=jobs.find(x=>x.id===id); if(!j) return;
  if(!canEditJob(j)) return;
  j.dwrs=j.dwrs||[]; 
  
  let nextDate = new Date();
  if(j.dwrs.length > 0) {
     const dates = j.dwrs.map(d => new Date(d.date)).filter(d => !isNaN(d));
     if(dates.length > 0) {
         const maxDate = new Date(Math.max.apply(null, dates));
         maxDate.setDate(maxDate.getDate() + 1);
         nextDate = maxDate;
     }
  } else if(j.date && !j.date.includes('Tentative')) { nextDate = new Date(j.date); }
  
  j.dwrs.push({uid:Date.now(),date:nextDate.toISOString().split('T')[0],sent:false});
  saveJob(j); render();
}

function toggleDWR(id,uid){
  const j=jobs.find(x=>x.id===id); const d=(j.dwrs||[]).find(x=>x.uid===uid);
  if(!d) return;
  if(!canEditJob(j)) return;
  d.sent=!d.sent;
  if(d.sent) { d.sentAt=new Date().toISOString(); }
  else { d.sentAt=''; }
  saveJob(j); render();
}
function deleteDWR(id,uid){ const j=jobs.find(x=>x.id===id); if(!j) return; j.dwrs=(j.dwrs||[]).filter(x=>x.uid!==uid); saveJob(j);render(); }
function updateDWRDate(id,uid,val){ const j=jobs.find(x=>x.id===id); const d=(j&&j.dwrs||[]).find(x=>x.uid===uid); if(d){d.date=val;saveJob(j);} }