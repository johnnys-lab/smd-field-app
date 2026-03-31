// ════════════════════════════════
// services/photos.service.js
// ════════════════════════════════
// ════════════════════════════════
// PHOTO UPLOAD MODULE
// ════════════════════════════════
let photoUploadContext = null; // {jobId, phase}
let lbPhotos = [], lbIdx = 0;

function renderPhotos(j, phase) {
  const photos = (j.photos || []).filter(p => p.phase === phase);
  const canE = canEditJob(j);
  const lang = currentLang;
  const label = lang==='th' ? 'รูปภาพ' : 'Photos';
  const uploadLabel = lang==='th' ? '📷 อัปโหลดรูป' : '📷 Upload Photos';

  const thumbs = photos.map((p, idx) => `
    <div class="photo-thumb" onclick="openLightbox('${j.id}','${phase}',${idx})">
      <img src="${p.url}" alt="${p.name||'photo'}" loading="lazy">
      <div class="photo-label">${p.name||''}</div>
      ${canE ? `<button class="del-photo" onclick="event.stopPropagation();deletePhoto('${j.id}','${phase}',${idx})">×</button>` : ''}
    </div>`).join('');

  const uploadBtn = canE ? `
    <button class="photo-upload-btn" id="upbtn-${j.id}-${phase}"
      onclick="triggerPhotoUpload('${j.id}','${phase}')">
      📷 ${uploadLabel}
    </button>
    <div class="photo-progress" id="upprog-${j.id}-${phase}"></div>` : '';

  return `
  <div class="photo-section">
    <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">
      📷 ${label} <span style="font-family:'IBM Plex Mono',monospace;color:var(--accent);margin-left:4px">${photos.length}</span>
    </div>
    ${photos.length > 0 ? `<div class="photo-grid">${thumbs}</div>` : ''}
    ${uploadBtn}
  </div>`;
}

function triggerPhotoUpload(jobId, phase) {
  photoUploadContext = { jobId, phase };
  const input = document.getElementById('photo-file-input');
  input.value = '';
  input.click();
}

async function handlePhotoFiles(event) {
  const files = Array.from(event.target.files);
  if (!files.length || !photoUploadContext) return;
  const { jobId, phase } = photoUploadContext;
  const j = jobs.find(x => x.id === jobId);
  if (!j) return;

  if (!storage) {
    alert(currentLang==='th' ? 'ไม่ได้เชื่อมต่อ Firebase Storage' : 'Firebase Storage not connected');
    return;
  }

  const btn = document.getElementById(`upbtn-${jobId}-${phase}`);
  const prog = document.getElementById(`upprog-${jobId}-${phase}`);
  if (btn) btn.disabled = true;

  if (!j.photos) j.photos = [];
  let uploaded = 0;

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
    const path = `smd-jobs/${jobId}/${phase}/${filename}`;
    const ref = storage.ref(path);

    try {
      if (prog) prog.textContent = currentLang==='th'
        ? `กำลังอัปโหลด ${uploaded+1}/${files.length}...`
        : `Uploading ${uploaded+1}/${files.length}...`;

      const snap = await ref.put(file);
      const url  = await snap.ref.getDownloadURL();
      j.photos.push({ url, name: file.name, phase, path, uploadedAt: new Date().toISOString(), uploadedBy: currentUser.name });
      uploaded++;
    } catch(e) {
      console.error('Upload error:', e);
      if (prog) prog.textContent = `Error: ${e.message}`;
    }
  }

  saveJob(j);
  if (btn) btn.disabled = false;
  if (prog) prog.textContent = currentLang==='th'
    ? `✅ อัปโหลด ${uploaded} รูปเรียบร้อย`
    : `✅ ${uploaded} photo(s) uploaded`;
  setTimeout(() => { if (prog) prog.textContent = ''; }, 3000);
  render();
}

async function deletePhoto(jobId, phase, idx) {
  const j = jobs.find(x => x.id === jobId); if (!j) return;
  const photos = (j.photos||[]).filter(p=>p.phase===phase);
  const photo = photos[idx]; if (!photo) return;
  if (!confirm(currentLang==='th' ? 'ลบรูปนี้?' : 'Delete this photo?')) return;

  // Delete from Storage if path available
  if (storage && photo.path) {
    try { await storage.ref(photo.path).delete(); } catch(e) { console.warn('Storage delete:', e); }
  }

  // Remove from job
  const globalIdx = (j.photos||[]).findIndex(p => p.url === photo.url && p.phase === phase);
  if (globalIdx >= 0) j.photos.splice(globalIdx, 1);
  saveJob(j);
  render();
}

// ── Lightbox ──────────────────────────────────
function openLightbox(jobId, phase, idx) {
  const j = jobs.find(x => x.id === jobId); if (!j) return;
  lbPhotos = (j.photos||[]).filter(p=>p.phase===phase);
  lbIdx = idx;
  showLbPhoto();
  document.getElementById('lightbox').classList.add('open');
}

function showLbPhoto() {
  const p = lbPhotos[lbIdx];
  if (!p) return;
  document.getElementById('lb-img').src = p.url;
  document.getElementById('lb-caption').textContent = `${p.name||''} — ${p.uploadedBy||''} ${p.uploadedAt?p.uploadedAt.slice(0,10):''}  (${lbIdx+1}/${lbPhotos.length})`;
}

function lbNav(dir) {
  lbIdx = (lbIdx + dir + lbPhotos.length) % lbPhotos.length;
  showLbPhoto();
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  lbPhotos = []; lbIdx = 0;
}

// Close lightbox with Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLightbox(); closeDashboard(); }
  if (e.key === 'ArrowLeft')  lbNav(-1);
  if (e.key === 'ArrowRight') lbNav(1);
});