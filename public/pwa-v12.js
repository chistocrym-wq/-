(() => {
  'use strict';
  if (window.__ottoPwaV12) return;
  window.__ottoPwaV12 = true;

  const syncOnline = () => document.body.classList.toggle('is-offline', !navigator.onLine);
  syncOnline();
  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOnline);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        void registration.update();
      } catch (error) {
        window.OttoClientLogV12?.send?.('service-worker-error', { message: error?.message || String(error) }, 5000);
      }
    }, { once: true });
  }
})();
