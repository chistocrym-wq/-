(() => {
  'use strict';
  if (window.__ottoSwKillV14) return;
  window.__ottoSwKillV14 = true;

  const MARK = 'ottoStartSwKilledV14';

  async function clearCaches() {
    if (!('caches' in window)) return;
    try {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('otto-start-offline-')).map((name) => caches.delete(name)));
    } catch (error) {
      window.OttoClientLogV12?.send?.('cache-clear-error', { message: error?.message || String(error) }, 5000);
    }
  }

  async function unregisterWorkers() {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const hadController = Boolean(navigator.serviceWorker.controller);
      await Promise.all(regs.map((reg) => reg.unregister()));
      return hadController;
    } catch (error) {
      window.OttoClientLogV12?.send?.('sw-unregister-error', { message: error?.message || String(error) }, 5000);
      return false;
    }
  }

  (async () => {
    const hadController = await unregisterWorkers();
    await clearCaches();
    try {
      if (hadController && sessionStorage.getItem(MARK) !== '1') {
        sessionStorage.setItem(MARK, '1');
        location.reload();
      }
    } catch {}
  })();
})();
