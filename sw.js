// ════════════════════════════════
// sw.js — Service Worker (PWA Offline Support)
// SMD BKK Job Tracker
// ════════════════════════════════

const CACHE_NAME = 'smd-tracker-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/base.css',
  '/assets/css/layout.css',
  '/assets/css/components.css',
  '/js/config.js',
  '/js/firebase/init.js',
  '/js/firebase/auth.js',
  '/js/services/jobs.service.js',
  '/js/modules/render.js',
  '/js/modules/issues.module.js',
  '/js/services/photos.service.js',
  '/js/modules/dashboard.module.js',
  '/js/modules/admin.module.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap',
];

// ── Install: cache static assets ──────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => console.warn('[SW] Cache addAll partial fail:', err));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-first for static, Network-first for Firebase ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Firebase, LINE, and non-GET requests
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('firebaseio.com')) return;
  if (url.hostname.includes('firebasestorage.googleapis.com')) return;
  if (url.hostname.includes('line-scdn.net')) return;
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('firestore')) return;

  // For app shell and static assets → Cache First
  if (url.hostname === self.location.hostname ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdn.jsdelivr.net') ||
      url.hostname.includes('gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
    );
    return;
  }
});

// ── Background Sync (for offline job saves) ───
self.addEventListener('sync', event => {
  if (event.tag === 'sync-jobs') {
    console.log('[SW] Background sync: jobs');
  }
});
