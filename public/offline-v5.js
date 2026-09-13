(() => {
  'use strict';

  const AUDIO_DB = 'otto-start-audio-v1';
  const AUDIO_STORE = 'clips';
  const SUPPORT_QUEUE = 'ottoStartSupportQueueV1';
  const MODE_KEY = 'ottoStartSpeechModeV4';
  let installPrompt = null;
  let wasOffline = !navigator.onLine;

  const AUDIO_PACK = [
    'Hallo','Danke','Tschüss','Ja','Nein','Schule','Schuh','schön','Schrank','mein','Reise','Biene','mich','Zeit','Liebe','sieben','vier','Leute','Sport','sprechen','Stadt','stehen','Jahr','spät','fünf','Häuser','Bäume','Miete','Mitte','Ofen','offen','Berlin',
    'Familie','Mutter','Vater','Sohn','eins','zwei','drei','zehn','zwanzig','Montag','Freitag','heute','morgen','Uhr','Wasser','Kaffee','Tee','Brot','Apfel','Milch','Euro','kosten','kostet','bitte','möchte','Haus','Zimmer','Straße','Bahnhof','Bus','Ticket','Arbeit','Arzt','Termin','Name','Adresse','Geburtsdatum','wo','wann','wie','was','gut','klein','groß','warm','kalt',
    'Ich heiße Anna.','Wie heißen Sie?','Wie heißt du?','Ich komme aus Russland.','Ich komme aus Deutschland.','Ich komme aus Kasachstan.','Ich möchte Wasser.','Ein Kaffee, bitte.','Was kostet das?','Wo ist der Bahnhof?','Wann ist der Termin?','Bis morgen!','eins, zwei, drei'
  ];

  function injectStyles() {
    if (document.getElementById('otto-offline-v5-style')) return;
    const style = document.createElement('style');
    style.id = 'otto-offline-v5-style';
    style.textContent = `
      #otto-offline-badge{position:fixed;z-index:9998;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);padding:8px 13px;border-radius:999px;background:#173f43;color:#fff;font:700 13px/1 system-ui;box-shadow:0 8px 28px #0002;display:none;align-items:center;gap:7px}
      #otto-offline-badge.show{display:flex}#otto-offline-badge i{width:8px;height:8px;border-radius:50%;background:#ffd166;display:block}
      .otto-offline-overlay{position:fixed;inset:0;z-index:10020;background:#0f3036a8;backdrop-filter:blur(7px);display:flex;align-items:flex-end;justify-content:center;padding:14px}
      .otto-offline-panel{width:min(560px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:24px 24px 18px 18px;padding:22px;box-shadow:0 28px 80px #06262b55;color:#17383c;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .otto-offline-panel h2{margin:0 0 5px;font-size:24px}.otto-offline-panel>p{margin:0 0 16px;color:#567075;line-height:1.45}
      .otto-offline-status{display:grid;gap:8px;margin:14px 0}.otto-offline-row{display:flex;justify-content:space-between;gap:16px;align-items:center;background:#f2f8f8;border-radius:14px;padding:11px 13px}.otto-offline-row b{font-size:14px}.otto-offline-ok{color:#087f72;font-weight:800}.otto-offline-warn{color:#9a6500;font-weight:800}
      .otto-offline-panel select,.otto-offline-panel button{font:inherit}.otto-offline-panel select{width:100%;padding:11px;border:1px solid #cbdcdd;border-radius:12px;background:white;margin:4px 0 10px}
      .otto-offline-actions{display:grid;gap:9px}.otto-offline-actions button{border:0;border-radius:13px;padding:12px 14px;font-weight:800;cursor:pointer;background:#e7f2f2;color:#17474b}.otto-offline-actions button.primary{background:#158c8a;color:white}.otto-offline-actions button:disabled{opacity:.55;cursor:wait}
      .otto-offline-progress{height:9px;background:#e5eeee;border-radius:999px;overflow:hidden;margin:10px 0 4px;display:none}.otto-offline-progress.show{display:block}.otto-offline-progress>span{display:block;height:100%;width:0;background:#159792;transition:width .2s}
      .otto-offline-progress-text{font-size:12px;color:#627a7e;min-height:18px}.otto-offline-note{margin-top:14px;padding:12px;border-radius:13px;background:#fff7df;color:#6f5711;font-size:13px;line-height:1.45}
      .otto-offline-card span{font-size:24px}.otto-offline-card small{display:block;color:inherit;opacity:.68;margin-top:3px}
      .otto-offline-toast{position:fixed;z-index:10050;left:50%;bottom:max(86px,calc(env(safe-area-inset-bottom) + 72px));transform:translate(-50%,18px);opacity:0;pointer-events:none;max-width:min(92vw,520px);background:#173f43;color:white;border-radius:14px;padding:11px 14px;font:700 13px/1.35 system-ui;box-shadow:0 12px 36px #0003;transition:.2s}.otto-offline-toast.show{opacity:1;transform:translate(-50%,0)}
    `;
    document.head.appendChild(style);
  }

  function toast(text, ms = 2600) {
    let el = document.querySelector('.otto-offline-toast');
    if (!el) { el = document.createElement('div'); el.className = 'otto-offline-toast'; document.body.appendChild(el); }
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(el._ottoTimer);
    el._ottoTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  function ensureBadge() {
    let badge = document.getElementById('otto-offline-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'otto-offline-badge';
      badge.innerHTML = '<i></i><span>Офлайн-режим</span>';
      document.body.appendChild(badge);
    }
    badge.classList.toggle('show', !navigator.onLine);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const ready = await navigator.serviceWorker.ready;
      (ready.active || registration.active || registration.waiting)?.postMessage({ type: 'WARM_CORE' });
    } catch (err) {
      console.warn('Otto Start offline worker:', err);
    }
  }

  async function requestPersistentStorage() {
    try {
      if (!navigator.storage?.persist || !navigator.storage?.persisted) return;
      if (!(await navigator.storage.persisted())) await navigator.storage.persist();
    } catch (_) {}
  }

  function openAudioDb() {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) return resolve(null);
      try {
        const request = indexedDB.open(AUDIO_DB, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch (_) { resolve(null); }
    });
  }

  async function audioHas(key) {
    const db = await openAudioDb();
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const req = db.transaction(AUDIO_STORE, 'readonly').objectStore(AUDIO_STORE).getKey(key);
        req.onsuccess = () => resolve(req.result !== undefined);
        req.onerror = () => resolve(false);
      } catch (_) { resolve(false); }
    });
  }

  async function audioCount() {
    const db = await openAudioDb();
    if (!db) return 0;
    return new Promise((resolve) => {
      try {
        const req = db.transaction(AUDIO_STORE, 'readonly').objectStore(AUDIO_STORE).count();
        req.onsuccess = () => resolve(Number(req.result || 0));
        req.onerror = () => resolve(0);
      } catch (_) { resolve(0); }
    });
  }

  function preferredMode() {
    try { return localStorage.getItem(MODE_KEY) === 'normal' ? 'normal' : 'slow'; } catch (_) { return 'slow'; }
  }

  function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  async function downloadAudioPack(mode, panel) {
    if (!navigator.onLine) { toast('Для загрузки офлайн-пакета сначала нужен интернет.'); return; }
    const preload = window.OttoStartSpeech?.preload;
    if (typeof preload !== 'function') { toast('Озвучка ещё загружается. Попробуйте через несколько секунд.'); return; }

    const button = panel.querySelector('[data-offline-download]');
    const progress = panel.querySelector('.otto-offline-progress');
    const bar = progress.querySelector('span');
    const label = panel.querySelector('.otto-offline-progress-text');
    button.disabled = true;
    progress.classList.add('show');

    let done = 0;
    let downloaded = 0;
    let failed = 0;
    for (const text of AUDIO_PACK) {
      const key = `${mode}:${text}`;
      const already = await audioHas(key);
      if (!already) {
        if (!navigator.onLine) { failed += AUDIO_PACK.length - done; break; }
        try {
          await preload(text, mode);
          if (await audioHas(key)) downloaded++;
          else failed++;
        } catch (_) { failed++; }
        await sleep(1750);
      }
      done++;
      const pct = Math.round((done / AUDIO_PACK.length) * 100);
      bar.style.width = `${pct}%`;
      label.textContent = `Подготовка аудио: ${done} из ${AUDIO_PACK.length}`;
    }

    const count = await audioCount();
    const countEl = panel.querySelector('[data-offline-audio-count]');
    if (countEl) countEl.textContent = `${count} сохранено`;
    button.disabled = false;
    label.textContent = failed ? `Готово частично: новых ${downloaded}, не удалось ${failed}. Можно повторить позже.` : `Готово. Новых аудио сохранено: ${downloaded}.`;
    if (!failed) toast('Офлайн-аудиопакет готов.');
  }

  async function staticCacheReady() {
    try { return (await caches.keys()).some((name) => name.startsWith('otto-start-offline-v5-shell')); } catch (_) { return false; }
  }

  async function openOfflinePanel() {
    if (document.querySelector('.otto-offline-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'otto-offline-overlay';
    overlay.innerHTML = `<section class="otto-offline-panel" role="dialog" aria-modal="true" aria-label="Офлайн-режим">
      <h2>Офлайн-режим Otto Start</h2>
      <p>После первого открытия уроки, интерфейс, картинки, словарь и прогресс могут работать без интернета. Аудио можно дополнительно сохранить на устройство.</p>
      <div class="otto-offline-status">
        <div class="otto-offline-row"><b>Уроки и интерфейс</b><span data-offline-shell>Проверяю…</span></div>
        <div class="otto-offline-row"><b>Сохранённое аудио</b><span data-offline-audio-count>Проверяю…</span></div>
        <div class="otto-offline-row"><b>Прогресс</b><span class="otto-offline-ok">хранится на устройстве</span></div>
      </div>
      <label><b>Какой темп аудио сохранить:</b></label>
      <select data-offline-mode><option value="slow">🐢 Медленнее — рекомендуется новичку</option><option value="normal">🔊 Нормальная скорость</option></select>
      <div class="otto-offline-actions">
        <button class="primary" type="button" data-offline-download>Скачать основной аудиопакет</button>
        <button type="button" data-offline-install hidden>Установить Otto Start на устройство</button>
        <button type="button" data-offline-close>Закрыть</button>
      </div>
      <div class="otto-offline-progress"><span></span></div><div class="otto-offline-progress-text"></div>
      <div class="otto-offline-note"><b>Что всё равно требует интернет:</b> новая автоматическая проверка произношения, отправка обращения в поддержку и аудио, которое ещё ни разу не было сохранено. Сообщение в поддержку, написанное офлайн, Otto поставит в очередь и отправит после восстановления связи.</div>
    </section>`;
    document.body.appendChild(overlay);
    const panel = overlay.querySelector('.otto-offline-panel');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    panel.querySelector('[data-offline-close]').addEventListener('click', () => overlay.remove());
    const select = panel.querySelector('[data-offline-mode]'); select.value = preferredMode();
    panel.querySelector('[data-offline-download]').addEventListener('click', () => downloadAudioPack(select.value, panel));
    const installButton = panel.querySelector('[data-offline-install]');
    if (installPrompt) {
      installButton.hidden = false;
      installButton.addEventListener('click', async () => {
        try { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; installButton.hidden = true; } catch (_) {}
      });
    }
    const shell = await staticCacheReady();
    panel.querySelector('[data-offline-shell]').innerHTML = shell ? '<span class="otto-offline-ok">сохранены</span>' : '<span class="otto-offline-warn">сохраняются…</span>';
    panel.querySelector('[data-offline-audio-count]').textContent = `${await audioCount()} сохранено`;
  }

  function enhanceMoreMenu() {
    const grid = document.querySelector('#app .menu-grid');
    if (!grid || grid.querySelector('[data-otto-offline-pack]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-card otto-offline-card';
    button.dataset.ottoOfflinePack = '1';
    button.innerHTML = '<span>⇩</span><b>Офлайн-режим</b><small>Скачать уроки и аудио на устройство</small>';
    button.addEventListener('click', openOfflinePanel);
    grid.appendChild(button);
  }

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(SUPPORT_QUEUE) || '[]'); } catch (_) { return []; }
  }
  function writeQueue(queue) {
    try { localStorage.setItem(SUPPORT_QUEUE, JSON.stringify(queue)); } catch (_) {}
  }
  function lessonNumber() {
    try { return Number(JSON.parse(localStorage.getItem('ottoStartLearningPathV2') || '{}').currentLesson || 1); } catch (_) { return 1; }
  }

  async function flushSupportQueue() {
    if (!navigator.onLine) return;
    const queue = readQueue();
    if (!queue.length) return;
    const left = [];
    let sent = 0;
    for (const item of queue) {
      try {
        const response = await fetch('/api/otto-start-support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
        if (!response.ok) throw new Error('send failed');
        sent++;
      } catch (_) { left.push(item); }
    }
    writeQueue(left);
    if (sent) toast(`Отправлено обращений из офлайн-очереди: ${sent}`);
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest?.('.otto-support-form');
    if (!form || navigator.onLine) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const fd = new FormData(form);
    const queue = readQueue();
    queue.push({
      category: String(fd.get('category') || 'Другое'),
      message: String(fd.get('message') || ''),
      lesson: lessonNumber(),
      page: location.href.split('?')[0],
      device: navigator.userAgent,
      queuedAt: new Date().toISOString()
    });
    writeQueue(queue);
    form.reset();
    const result = form.parentElement?.querySelector('[data-support-result]');
    if (result) result.innerHTML = '<div class="otto-support-result">Интернета нет. Сообщение сохранено и будет отправлено автоматически после восстановления связи.</div>';
    toast('Сообщение сохранено в офлайн-очередь.');
  }, true);

  document.addEventListener('click', (event) => {
    if (navigator.onLine) return;
    const mic = event.target.closest?.('[data-otto-pronounce],[data-pronounce],[data-mini-speak]');
    if (!mic) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toast('Автоматической проверке произношения нужен интернет. Озвучка и уроки продолжают работать офлайн.', 3900);
  }, true);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
  });

  window.addEventListener('offline', () => {
    wasOffline = true;
    ensureBadge();
    toast('Интернет отключён. Otto Start продолжает работать в офлайн-режиме.', 3500);
  });
  window.addEventListener('online', () => {
    ensureBadge();
    if (wasOffline) toast('Интернет снова доступен.');
    wasOffline = false;
    flushSupportQueue();
    navigator.serviceWorker?.ready?.then((r) => r.active?.postMessage({ type: 'WARM_CORE' })).catch(() => {});
  });

  injectStyles();
  ensureBadge();
  registerServiceWorker();
  flushSupportQueue();
  const observer = new MutationObserver(enhanceMoreMenu);
  const app = document.getElementById('app');
  if (app) observer.observe(app, { childList: true, subtree: true });
  enhanceMoreMenu();
  window.addEventListener('pointerdown', requestPersistentStorage, { once: true, passive: true });
})();
