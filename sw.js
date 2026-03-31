// ════════════════════════════════
// sw.js — Service Worker (PWA Offline Support)
// SMD BKK Job Tracker — v3
// ════════════════════════════════

const CACHE_NAME = 'smd-tracker-v3';
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
];

// ── Install: cache static assets ──────────────
self.addEventListener('install', event => {
  console.log('[SW v3] Installing...');
  // skipWaiting → immediately replace old SW
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Cache addAll partial fail:', err);
      });
    })
  );
});

// ── Activate: delete ALL old caches, claim clients ──
self.addEventListener('activate', event => {
  console.log('[SW v3] Activating — clearing old caches...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => {
      // claim all open clients immediately (no page reload needed)
      return self.clients.claim();
    })
  );
});

// ── Fetch: Network first for JS/CSS, Cache fallback ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and Firebase/LINE requests
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('firebaseio.com')) return;
  if (url.hostname.includes('firebasestorage.googleapis.com')) return;
  if (url.hostname.includes('line-scdn.net')) return;
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('gstatic.com')) return;

  // For same-origin JS/CSS: Network first → cache fallback
  if (url.hostname === self.location.hostname) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
    );
  }
});
