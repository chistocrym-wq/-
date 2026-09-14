(() => {
  'use strict';
  if (window.__ottoClientLogV12) return;
  window.__ottoClientLogV12 = true;

  const ENDPOINT = '/api/otto-start-client-log';
  const session = (() => {
    try {
      const key = 'ottoStartClientSessionV12';
      let value = sessionStorage.getItem(key);
      if (!value) {
        value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem(key, value);
      }
      return value;
    } catch {
      return `anon-${Date.now().toString(36)}`;
    }
  })();

  const sent = new Map();
  let lastInteractionAt = Date.now();
  let activeAction = '';

  ['pointerdown', 'touchstart', 'keydown'].forEach((name) => {
    window.addEventListener(name, () => { lastInteractionAt = Date.now(); }, { passive: true, capture: true });
  });

  function currentScreen() {
    return String(document.querySelector('[data-v12-screen]')?.getAttribute('data-v12-screen') || document.querySelector('h1')?.textContent || document.title || '').slice(0, 180);
  }

  function send(kind, payload = {}, throttleMs = 0) {
    try {
      const now = Date.now();
      const sig = `${kind}:${payload.message || ''}:${payload.target || ''}`;
      const previous = sent.get(sig) || 0;
      if (throttleMs && now - previous < throttleMs) return;
      sent.set(sig, now);
      const body = JSON.stringify({
        kind: String(kind || '').slice(0, 80),
        message: String(payload.message || '').slice(0, 1200),
        stack: String(payload.stack || '').slice(0, 3000),
        target: String(payload.target || '').slice(0, 500),
        details: payload.details && typeof payload.details === 'object' ? payload.details : null,
        screen: currentScreen(),
        href: location.href,
        userAgent: navigator.userAgent,
        session,
      });
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  window.addEventListener('error', (event) => {
    send('error', {
      message: event.message || event.error?.message || 'window error',
      stack: event.error?.stack || '',
      target: activeAction,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    send('unhandledrejection', {
      message: reason?.message || String(reason || 'promise rejection'),
      stack: reason?.stack || '',
      target: activeAction,
    });
  });

  let lastTick = performance.now();
  setInterval(() => {
    const now = performance.now();
    const drift = now - lastTick - 1000;
    lastTick = now;
    const recentlyActive = Date.now() - lastInteractionAt < 15000;
    if (document.hidden) return;
    if (document.visibilityState !== 'visible' || !document.hasFocus() || !recentlyActive) return;
    if (drift > 1500) {
      send('event-loop-stall', {
        message: `Active main thread stalled about ${Math.round(drift)} ms`,
        target: activeAction,
        details: { driftMs: Math.round(drift) },
      }, 5000);
    }
  }, 1000);

  function targetDescription(el) {
    if (!el) return '';
    const action = el.getAttribute?.('data-action') || '';
    const text = String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    return `${el.tagName || ''} action=${action} ${text}`.trim();
  }

  document.addEventListener('click', (event) => {
    const el = event.target.closest?.('[data-action]');
    if (!el || el.disabled) return;
    lastInteractionAt = Date.now();
    const target = targetDescription(el);
    activeAction = target;
    const before = window.OttoStartV12?.signature?.() || '';
    const started = performance.now();
    setTimeout(() => {
      const elapsedMs = Math.round(performance.now() - started);
      const after = window.OttoStartV12?.signature?.() || '';
      const action = el.getAttribute('data-action') || '';
      if (document.visibilityState === 'visible' && document.hasFocus() && before && after && before === after && !['audio','pronounce'].includes(action)) {
        send('stuck-click', {
          message: 'Action produced no state/view change',
          target,
          details: { elapsedMs },
        }, 2000);
      }
      if (activeAction === target) activeAction = '';
    }, 1200);
  }, true);

  window.addEventListener('load', () => send('page-ready', { message: 'Otto Start client logger v12.2 ready' }, 60000), { once: true });

  window.OttoClientLogV12 = { send, session };
})();
