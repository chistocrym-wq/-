(() => {
  'use strict';
  if (window.__ottoCacheResetV13) return;
  window.__ottoCacheResetV13 = true;

  const MIGRATION_KEY = 'ottoStartRuntimeMigrationV13';
  const RELOAD_KEY = 'ottoStartRuntimeReloadV13';
  const EXPECTED_CACHE_PREFIX = 'otto-start-offline-v12-2';

  async function clearLegacyCaches() {
    if (!('caches' in window)) return;
    try {
      const names = await caches.keys();
      await Promise.all(names
        .filter((name) => name.startsWith('otto-start-offline-') && !name.startsWith(EXPECTED_CACHE_PREFIX))
        .map((name) => caches.delete(name)));
    } catch (error) {
      window.OttoClientLogV12?.send?.('cache-migration-error', { message: error?.message || String(error) }, 5000);
    }
  }

  async function refreshWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        try {
          if (sessionStorage.getItem(RELOAD_KEY) === '1') return;
          sessionStorage.setItem(RELOAD_KEY, '1');
          location.reload();
        } catch {
          location.reload();
        }
      });

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      await registration.update();
    } catch (error) {
      window.OttoClientLogV12?.send?.('service-worker-migration-error', { message: error?.message || String(error) }, 5000);
    }
  }

  (async () => {
    try {
      const already = localStorage.getItem(MIGRATION_KEY) === '1';
      await clearLegacyCaches();
      await refreshWorker();
      if (!already) localStorage.setItem(MIGRATION_KEY, '1');
    } catch {}
  })();
})();
