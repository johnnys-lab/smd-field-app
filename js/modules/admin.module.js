// ════════════════════════════════
// modules/admin.module.js
// ════════════════════════════════
function exportToCSV(){
  let csv='\uFEFF';
  csv+='Job Title,Type,Status,Phase,Date,Engineers,DWR Sent,Pre Docs%,On Docs%,Post Docs%,Delay,Delay Days,Reason,Note\n';
  jobs.forEach(j=>{
    const engs=(j.engineers||[]).map(e=>e.name+'('+e.nick+')').join('; ');
    const dlDays = postDeadline(j);
    const delayStatus = (dlDays!==null && dlDays<0) || j.delayed ? 'Yes' : 'No';
    
    csv+='"'+j.title+'","'+j.type+'","'+statusLabel[j.status]+'","'+(j.phase||'pre')+'","'+j.date+'","'+engs+'",'+
         (j.dwrs||[]).filter(d=>d.sent).length+','+
         docProg(j,'pre').pct+'%,'+docProg(j,'on').pct+'%,'+docProg(j,'post').pct+'%,'+
         '"'+delayStatus+'",'+calcDelayDays(j.plannedDate,j.actualDate)+','+
         '"'+(j.delayReason||'')+'","'+(j.note||'').replace(/\n/g,' ')+'"\n';
  });
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download='SMD_Jobs_'+new Date().toISOString().slice(0,10)+'.csv';
  link.click();
}

function initEngPicker() {
  selectedEngs = new Set();
  const picker = document.getElementById('eng-picker');
  if (!picker) return;
  picker.innerHTML = TEAM.map((e,i) => `
    <div id="ep-${i}" onclick="toggleEng(${i})"
      style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);cursor:pointer;transition:all .15s;user-select:none">
      <div id="epc-${i}" style="width:16px;height:16px;border-radius:4px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;transition:all .15s"></div>
      <div>
        <div style="font-size:12px;font-weight:600">${e.name}</div>
        <div style="font-size:10px;color:var(--accent2)">(${e.nick})</div>
      </div>
    </div>`).join('');
  updateEngLabel();
}

function toggleEng(i) {
  if (selectedEngs.has(i)) selectedEngs.delete(i); else selectedEngs.add(i);
  TEAM.forEach((_,idx) => {
    const card = document.getElementById('ep-'+idx); const check = document.getElementById('epc-'+idx);
    if (!card || !check) return;
    if (selectedEngs.has(idx)) {
      card.style.borderColor = 'var(--accent)'; card.style.background = 'rgba(61,142,240,0.12)';
      check.style.background = 'var(--accent)'; check.style.borderColor = 'var(--accent)'; check.textContent = '✓'; check.style.color = '#fff';
    } else {
      card.style.borderColor = 'var(--border)'; card.style.background = 'var(--surface2)';
      check.style.background = ''; check.style.borderColor = 'var(--border)'; check.textContent = '';
    }
  });
  updateEngLabel();
}

function updateEngLabel() {
  const el = document.getElementById('eng-selected-label');
  if (!el) return;
  if (selectedEngs.size === 0) { el.textContent = T('fEngNone'); return; }
  el.textContent = [...selectedEngs].map(i => TEAM[i].nick).join(', ');
}

function openModal(){ if(!canEdit()) return; document.getElementById('modal-overlay').classList.add('open'); document.getElementById('f-title').value=''; document.getElementById('f-date').value=''; document.getElementById('f-enddate').value=''; initEngPicker(); }
function closeModal(){ document.getElementById('modal-overlay').classList.remove('open'); }
function closeModalOutside(e){ if(e.target.id==='modal-overlay') closeModal(); }

function submitJob(){
  if(!canEdit()) return;
  const title=document.getElementById('f-title').value.trim();
  if(!title) return alert(T('alertTitle'));
  if(selectedEngs.size===0) return alert(T('alertEng'));
  const engs = [...selectedEngs].map(i => TEAM[i]);
  const nj=blankState({id:'j'+Date.now(),title,type:document.getElementById('f-type').value,date:document.getElementById('f-date').value||'—',endDate:document.getElementById('f-enddate').value||'',engineers:engs,tentative:false});
  jobs.push(nj); saveJob(nj); closeModal(); render();
}

// ════════════════════════════════
// i18n — Language Strings
// ════════════════════════════════

function openAdminPanel() {
  if (!canAdmin()) return;
  document.getElementById('admin-modal').classList.add('open');
  loadAdminUsers();
}