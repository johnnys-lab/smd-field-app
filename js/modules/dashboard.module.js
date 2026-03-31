// ════════════════════════════════
// modules/dashboard.module.js
// ════════════════════════════════
// ════════════════════════════════
// DASHBOARD
// ════════════════════════════════
function openDashboard() {
  renderDashboard();
  document.getElementById('dash-overlay').classList.add('open');
}
function closeDashboard() {
  document.getElementById('dash-overlay').classList.remove('open');
}

function renderDashboard() {
  const el = document.getElementById('dash-body');
  const lang = currentLang;
  const T2 = (en,th) => lang==='th'?th:en;

  // ── KPIs ───────────────────────────────────────
  const total   = jobs.length;
  const ongoing = jobs.filter(j=>j.status==='ongoing').length;
  const done    = jobs.filter(j=>j.status==='done').length;
  const pending = jobs.filter(j=>j.status==='pending').length;
  const totalOpenIssues = jobs.reduce((a,j)=>a+(j.issues||[]).filter(x=>x.status!=='resolved').length,0);
  const totalDWR  = jobs.reduce((a,j)=>a+(j.dwrs||[]).length,0);
  const sentDWR   = jobs.reduce((a,j)=>a+(j.dwrs||[]).filter(d=>d.sent).length,0);
  const delayJobs = jobs.filter(j=>j.delayed||(postDeadline(j)!==null&&postDeadline(j)<0)).length;

  // ── Job Rows ───────────────────────────────────
  const jobRows = [...jobs].sort((a,b)=>{
    const so={'ongoing':0,'pending':1,'done':2};
    return (so[a.status]??3)-(so[b.status]??3);
  }).map(j=>{
    const pct = overallPct(j);
    const openIss = (j.issues||[]).filter(x=>x.status!=='resolved').length;
    const dl = postDeadline(j);
    const dlHtml = dl!==null ? (dl<0
      ? `<span class="dash-chip" style="background:rgba(224,85,85,.15);color:var(--red)">${T2('Overdue','เลย')}</span>`
      : dl<=3
      ? `<span class="dash-chip" style="background:rgba(240,201,61,.15);color:var(--yellow)">${dl}d</span>`
      : '') : '';
    const issHtml = openIss>0
      ? `<span class="dash-chip" style="background:rgba(224,85,85,.12);color:var(--red)">⚠${openIss}</span>` : '';
    const delHtml = j.delayed
      ? `<span class="dash-chip" style="background:rgba(240,168,61,.12);color:var(--accent2)">⏱</span>` : '';
    const progColor = pct>=100?'var(--green)':pct>50?'var(--accent)':'var(--yellow)';
    const engNames = (j.engineers||[]).map(e=>e.nick||e.name).join(', ') || '—';
    return `
    <div class="dash-job-row ${j.status}">
      <div class="dash-job-name" title="${j.title}">${j.title}</div>
      <div style="font-size:9px;color:var(--muted);flex-shrink:0;max-width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${engNames}</div>
      <div class="dash-prog-wrap"><div class="dash-prog-fill" style="width:${pct}%;background:${progColor}"></div></div>
      <span style="font-size:9px;color:var(--muted);font-family:'IBM Plex Mono',monospace;flex-shrink:0">${pct}%</span>
      ${issHtml}${dlHtml}${delHtml}
    </div>`;
  }).join('') || `<div class="dash-empty">${T2('No jobs yet','ยังไม่มีงาน')}</div>`;

  // ── Issues Summary ─────────────────────────────
  const issueJobs = jobs.filter(j=>(j.issues||[]).length>0);
  const issueRows = issueJobs.map(j=>{
    const open = (j.issues||[]).filter(x=>x.status==='open').length;
    const inprog = (j.issues||[]).filter(x=>x.status==='in-progress').length;
    const res  = (j.issues||[]).filter(x=>x.status==='resolved').length;
    return `
    <div class="dash-issue-row">
      <div style="font-size:11px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${j.title}</div>
      <div style="display:flex;gap:5px">
        ${open>0    ?`<span class="dash-chip" style="background:rgba(224,85,85,.15);color:var(--red)">⚡${open}</span>`:''}
        ${inprog>0  ?`<span class="dash-chip" style="background:rgba(61,142,240,.15);color:var(--accent)">🔄${inprog}</span>`:''}
        ${res>0     ?`<span class="dash-chip" style="background:rgba(61,190,122,.15);color:var(--green)">✅${res}</span>`:''}
      </div>
    </div>`;
  }).join('') || `<div class="dash-empty">${T2('No issues logged','ยังไม่มี issue')}</div>`;

  // ── DWR per engineer ──────────────────────────
  const engMap = {};
  jobs.forEach(j=>{
    (j.engineers||[]).forEach(e=>{
      const key = e.nick||e.name;
      if(!engMap[key]) engMap[key]={total:0,sent:0,late:0};
      (j.dwrs||[]).forEach(d=>{
        if(d.engineers && !d.engineers.includes(key)) return;
        engMap[key].total++;
        if(d.sent) engMap[key].sent++;
        if(isDWRLate(d)) engMap[key].late++;
      });
    });
  });
  const dwrRows = Object.entries(engMap).map(([name,v])=>{
    const pct = v.total>0?Math.round(v.sent/v.total*100):0;
    const progColor = pct>=100?'var(--green)':pct>60?'var(--accent)':'var(--yellow)';
    return `
    <div class="dash-dwr-row">
      <div style="font-size:11px;font-weight:600;width:60px;flex-shrink:0">${name}</div>
      <div class="dash-prog-wrap" style="max-width:none;flex:1"><div class="dash-prog-fill" style="width:${pct}%;background:${progColor}"></div></div>
      <span style="font-size:10px;font-family:'IBM Plex Mono',monospace;color:var(--muted);flex-shrink:0">${v.sent}/${v.total}</span>
      ${v.late>0?`<span class="dash-chip" style="background:rgba(224,85,85,.15);color:var(--red)">⏰${v.late}</span>`:''}
    </div>`;
  }).join('') || `<div class="dash-empty">${T2('No DWR data','ยังไม่มีข้อมูล DWR')}</div>`;

  el.innerHTML = `
  <div class="dash-section">
    <div class="dash-kpi-grid">
      <div class="dash-kpi"><div class="kv" style="color:var(--text)">${total}</div><div class="kl">${T2('Total Jobs','งานทั้งหมด')}</div></div>
      <div class="dash-kpi"><div class="kv" style="color:var(--accent)">${ongoing}</div><div class="kl">${T2('Active','กำลังทำ')}</div></div>
      <div class="dash-kpi"><div class="kv" style="color:var(--green)">${done}</div><div class="kl">${T2('Done','เสร็จแล้ว')}</div></div>
      <div class="dash-kpi"><div class="kv" style="color:var(--red)">${delayJobs}</div><div class="kl">${T2('Delayed','ล่าช้า')}</div></div>
    </div>
    <div class="dash-kpi-grid">
      <div class="dash-kpi"><div class="kv" style="color:var(--yellow)">${totalOpenIssues}</div><div class="kl">${T2('Open Issues','Issue เปิด')}</div></div>
      <div class="dash-kpi"><div class="kv" style="color:var(--accent)">${sentDWR}</div><div class="kl">${T2('DWR Sent','DWR ส่งแล้ว')}</div></div>
      <div class="dash-kpi"><div class="kv" style="color:var(--muted)">${totalDWR}</div><div class="kl">${T2('DWR Total','DWR ทั้งหมด')}</div></div>
      <div class="dash-kpi"><div class="kv" style="color:var(--yellow)">${pending}</div><div class="kl">${T2('Pending','รอเริ่ม')}</div></div>
    </div>
  </div>

  <div class="dash-section">
    <div class="dash-section-title">📋 ${T2('All Jobs','งานทั้งหมด')}</div>
    ${jobRows}
  </div>

  <div class="dash-section">
    <div class="dash-section-title">⚠ ${T2('Issues by Job','Issues แยกตามงาน')}</div>
    ${issueRows}
  </div>

  <div class="dash-section">
    <div class="dash-section-title">📝 ${T2('DWR by Engineer','DWR แยกตาม Engineer')}</div>
    ${dwrRows}
  </div>`;
}