/**
 * JB INSTITUTE OF TECHNOLOGY - COLLEGE ERP PROGRESSIVE WEB APP (PWA)
 * Service Worker: Safe Static Asset Caching & Network Interception
 *
 * CRITICAL SECURITY RULES:
 * 1. Safe static assets ONLY (App shell, JS, CSS, fonts, college branding images).
 * 2. NEVER cache sensitive data (passwords, OTPs, JWT tokens, fees, payment info, personal info).
 * 3. Any request to /api/* is strictly NETWORK ONLY.
 */

const CACHE_NAME = 'jbit-erp-v1.0.0';

// Safe static core assets for the application shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/assets/college-logo.png',
  '/assets/campus-bg.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Installation: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[JBIT SW] Pre-caching static application shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[JBIT SW] Some static assets could not be pre-cached on install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation: Clean up old caches & take control of clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[JBIT SW] Removing outdated cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Handler: Intelligent routing with absolute security
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET requests (POST, PUT, DELETE, PATCH, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // 2. CRITICAL SECURITY RULE:
  // Strictly bypass and NEVER cache any /api/ requests, auth, fees, or sensitive endpoints!
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/auth') ||
    url.pathname.includes('/student') ||
    url.pathname.includes('/faculty') ||
    url.pathname.includes('/admin') ||
    url.pathname.includes('/fees') ||
    url.pathname.includes('/payment')
  ) {
    // Network-only with graceful offline fallback response for API
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Server unavailable. Please check your connection/server.',
            offline: true
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. For Navigation (HTML page requests): Network-first, falling back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 4. Safe Static Frontend Assets (JS, CSS, Images, Fonts, Icons)
  // Strategy: Stale-While-Revalidate or Cache-First for static assets
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.woff2'));

  const isGoogleFont =
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (isStaticAsset || isGoogleFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default passthrough for any other requests
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
