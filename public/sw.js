const VERSION = 'otto-start-offline-v13';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const CORE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/style-v2.css?v=2',
  '/premium-v3.css?v=3',
  '/layout-fix-v3.css?v=3',
  '/learning-fixes-v4.css?v=4',
  '/request-timeout-v7.js?v=8',
  '/pronunciation-v5.js?v=6',
  '/offline-v5.js?v=5',
  '/learning-fixes-v4-guard.js?v=6',
  '/learning-fixes-v4.js?v=4',
  '/speech-preload-queue-v7.js?v=7',
  '/course-data-v8.js?v=8',
  '/app-v2.js?v=2',
  '/enhancements-v2.js?v=2',
  '/course-v8.js?v=8',
  '/stability-v8.js?v=8',
  '/otto-icon-192.webp',
  '/otto/otto-guide.webp',
  '/otto/otto-home.webp',
  '/otto/otto-horen.webp',
  '/otto/otto-lesen.webp',
  '/otto/otto-scenes.webp'
];

async function warmCore() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.allSettled(CORE.map(async (url) => {
    try {
      const request = new Request(url, { cache: 'reload' });
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
    } catch (_) {}
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(warmCore().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('otto-start-offline-') && ![SHELL_CACHE, RUNTIME_CACHE].includes(name))
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response && response.ok) {
      await cache.put('/index.html', response.clone());
      return response;
    }
    throw new Error('navigation failed');
  } catch (_) {
    clearTimeout(timer);
    return (await cache.match('/index.html')) || (await caches.match('/')) || new Response(
      '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Otto Start</title><body style="font-family:system-ui;padding:24px"><h1>Otto Start</h1><p>Сейчас нет интернета, а офлайн-копия ещё не успела сохраниться. Откройте приложение один раз при наличии сети — после этого уроки будут доступны офлайн.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function cacheFirstWithRefresh(request) {
  const cached = await caches.match(request);
  const cache = await caches.open(RUNTIME_CACHE);
  if (cached) {
    fetch(request).then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return cached || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const isStatic = /\.(?:js|css|webp|png|jpg|jpeg|svg|ico|webmanifest|json|woff2?)$/i.test(url.pathname);
  if (isStatic || CORE.some((entry) => new URL(entry, self.location.origin).pathname === url.pathname)) {
    event.respondWith(cacheFirstWithRefresh(request));
  }
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'WARM_CORE') event.waitUntil(warmCore());
});
