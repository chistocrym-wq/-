(() => {
  'use strict';
  if (window.__ottoClientLogV10) return;
  window.__ottoClientLogV10 = true;

  const ENDPOINT = '/api/otto-start-client-log';
  const session = (() => {
    try {
      const key = 'ottoStartClientSessionV10';
      let value = sessionStorage.getItem(key);
      if (!value) {
        value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(key, value);
      }
      return value;
    } catch {
      return `anon-${Date.now().toString(36)}`;
    }
  })();

  let lastSent = new Map();
  function screen() {
    return (
      document.querySelector('#otto-v8-layer .v8-head b')?.textContent ||
      document.querySelector('#app .topbar b')?.textContent ||
      document.querySelector('#app h1')?.textContent ||
      document.title ||
      ''
    ).slice(0, 300);
  }
  function safeTarget(el) {
    if (!el) return '';
    const text = String(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100);
    const attrs = ['data-go','data-v8-open-course','data-v8-practice','data-v8-answer','data-v8-quiz-next','data-v8-finish-session','data-v8-topic','data-account-open','data-v9-open-milestone','data-v9-open-final']
      .map(name => el.getAttribute?.(name) ? `${name}=${el.getAttribute(name)}` : '')
      .filter(Boolean)
      .join(' ');
    return `${el.tagName || ''} ${attrs} ${text}`.trim().slice(0, 500);
  }
  function send(kind, payload = {}, throttleMs = 0) {
    try {
      const now = Date.now();
      const signature = `${kind}:${payload.message || ''}:${payload.target || ''}`;
      const prev = lastSent.get(signature) || 0;
      if (throttleMs && now - prev < throttleMs) return;
      lastSent.set(signature, now);
      const body = JSON.stringify({
        kind,
        message: String(payload.message || ''),
        stack: String(payload.stack || ''),
        target: String(payload.target || ''),
        details: payload.details || null,
        screen: screen(),
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
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    send('unhandledrejection', {
      message: reason?.message || String(reason || 'promise rejection'),
      stack: reason?.stack || '',
    });
  });

  const trackedSelector = [
    '[data-go]','[data-onboard]','[data-start-lesson]','[data-v8-open-course]',
    '[data-v8-practice]','[data-v8-answer]','[data-v8-quiz-next]','[data-v8-finish-session]',
    '[data-v8-topic]','[data-account-open]','[data-v9-open-milestone]','[data-v9-open-final]'
  ].join(',');

  function signature() {
    let course = '';
    let legacy = '';
    try { course = localStorage.getItem('ottoStartCourseV8') || ''; } catch {}
    try { legacy = localStorage.getItem('ottoStartLearningPathV2') || ''; } catch {}
    const layer = document.getElementById('otto-v8-layer');
    return `${document.getElementById('app')?.textContent?.slice(0, 140) || ''}|${layer?.textContent?.slice(0, 100) || ''}|${course.slice(-180)}|${legacy.slice(-120)}`;
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest?.(trackedSelector);
    if (!target || target.disabled) return;
    const before = signature();
    const description = safeTarget(target);
    setTimeout(() => {
      if (document.hidden) return;
      const after = signature();
      if (before === after && document.contains(target) && !target.disabled) {
        send('stuck-click', { message: 'No visible UI/state change after click', target: description }, 4000);
      }
    }, 1800);
  }, true);

  let lastTick = performance.now();
  setInterval(() => {
    const now = performance.now();
    const drift = now - lastTick - 1000;
    lastTick = now;
    if (drift > 1800) {
      send('event-loop-stall', { message: `Main thread stalled about ${Math.round(drift)} ms`, details: { driftMs: Math.round(drift) } }, 8000);
    }
  }, 1000);

  let mutations = 0;
  let mutationWindow = Date.now();
  let observer;
  try {
    observer = new MutationObserver((records) => {
      for (const record of records) mutations += record.addedNodes.length + record.removedNodes.length;
      const now = Date.now();
      if (now - mutationWindow >= 1000) {
        if (mutations > 700) {
          send('dom-storm', { message: `High DOM mutation rate: ${mutations}/s`, details: { mutations } }, 10000);
        }
        mutations = 0;
        mutationWindow = now;
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch {}

  window.addEventListener('load', () => {
    send('page-ready', { message: 'Otto Start client logger v10 ready' }, 60000);
  }, { once: true });

  window.OttoClientLogV10 = { send, session, observer };
})();
