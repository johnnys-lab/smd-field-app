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

function closeAdminPanel() {
  document.getElementById('admin-modal').classList.remove('open');
}

function loadAdminUsers() {
  const list = document.getElementById('admin-user-list');
  if (!db) { list.innerHTML = '<div style="color:var(--muted);font-size:12px">Firebase not connected</div>'; return; }
  db.ref('users').once('value').then(snap => {
    const users = snap.val() || {};
    const keys = Object.keys(users);
    if (!keys.length) { list.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:16px">No users registered yet</div>'; return; }
    list.innerHTML = keys.map(uid => {
      const u = users[uid];
      const roleClass = ROLE_CLASSES[u.role] || 'role-pending';
      return `<div class="admin-user-row">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">
          ${u.role==='admin'?'👑':u.role==='engineer'?'🔧':'👁'}
        </div>
        <div class="admin-user-info">
          <div class="admin-user-name">${u.name||'—'} <span style="color:var(--accent2);font-size:11px">${u.nick?'('+u.nick+')':''}</span></div>
          <div class="admin-user-id">${uid}</div>
        </div>
        <select class="admin-role-select" onchange="adminSetRole('${uid}',this.value)">
          <option value="admin"   ${u.role==='admin'   ?'selected':''}>Admin</option>
          <option value="engineer"${u.role==='engineer'?'selected':''}>Engineer</option>
          <option value="viewer"  ${u.role==='viewer'  ?'selected':''}>Viewer</option>
          <option value="pending" ${u.role==='pending' ?'selected':''}>Pending</option>
        </select>
        <button onclick="adminRemoveUser('${uid}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;padding:0 4px" title="Remove">×</button>
      </div>`;
    }).join('');
  });
}

function adminSetRole(uid, role) {
  if (!canAdmin() || !db) return;
  db.ref('users/' + uid + '/role').set(role).then(() => {
    // if changing own role, update currentUser
    if (uid === currentUser.lineUserId) {
      currentUser.role = role;
      applyRoleUI();
    }
  });
}

function adminRemoveUser(uid) {
  if (!canAdmin()) return;
  if (!confirm('Remove this user?')) return;
  if (db) db.ref('users/' + uid).remove().then(() => loadAdminUsers());
}

function adminAddUser() {
  if (!canAdmin()) return;
  const uid  = document.getElementById('admin-new-uid').value.trim();
  const name = document.getElementById('admin-new-name').value.trim();
  const nick = document.getElementById('admin-new-nick').value.trim();
  const role = document.getElementById('admin-new-role').value;
  if (!uid || !name) return alert('LINE User ID and Name are required');
  if (!db) return alert('Firebase not connected');
  db.ref('users/' + uid).set({ name, nick, role, lineUserId: uid, addedAt: new Date().toISOString() })
    .then(() => {
      document.getElementById('admin-new-uid').value = '';
      document.getElementById('admin-new-name').value = '';
      document.getElementById('admin-new-nick').value = '';
      loadAdminUsers();
    });
}


load();