(() => {
  'use strict';
  if (window.__ottoSpeechV15) return;
  window.__ottoSpeechV15 = true;

  let activeAudio = null;
  let activeUrl = '';

  const log = (kind, payload = {}, throttle = 0) => {
    const api = window.OttoClientLogV14 || window.OttoClientLogV12;
    api?.send?.(kind, payload, throttle);
  };
  const toast = (message) => window.dispatchEvent(new CustomEvent('otto:v15-toast', { detail: { message: String(message || '') } }));
  const escapeHtml = (v = '') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function stop() {
    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.currentTime = 0; } catch {}
      activeAudio = null;
    }
    activeUrl = '';
  }

  function ttsUrl(text, options = {}) {
    const q = new URLSearchParams({
      text: String(text || '').trim(),
      mode: options.mode === 'slow' ? 'slow' : 'normal',
      kind: options.kind === 'letter' ? 'letter' : 'text',
      v: '5',
    });
    return `/api/otto-tts?${q.toString()}`;
  }

  async function play(text, options = {}) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const button = options.button || null;
    const silentFailure = Boolean(options.silentFailure);
    stop();

    let oldText = '';
    if (button) {
      oldText = button.textContent || '';
      button.disabled = true;
      button.textContent = '🔊 …';
    }

    // Important: create the media element and call play() synchronously from the click.
    // The browser may then fetch/decode the MP3 without losing the user's playback gesture.
    const url = ttsUrl(clean, options);
    const audio = new Audio(url);
    activeAudio = audio;
    activeUrl = url;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.volume = 1;
    log('audio-start-v15', { message: clean, target: url }, 300);

    let loaded = false;
    const started = Date.now();
    audio.addEventListener('playing', () => {
      loaded = true;
      log('audio-playing-v15', { message: clean, details: { delayMs: Date.now() - started } }, 300);
    }, { once: true });
    audio.addEventListener('error', () => {
      const code = audio.error?.code || 0;
      log('audio-media-error-v15', { message: clean, details: { code, networkState: audio.networkState, readyState: audio.readyState } }, 300);
    }, { once: true });
    audio.addEventListener('ended', () => {
      if (activeAudio === audio) activeAudio = null;
      log('audio-ended-v15', { message: clean }, 300);
    }, { once: true });

    try {
      const promise = audio.play();
      if (promise?.then) await promise;
      return true;
    } catch (error) {
      log('audio-play-error-v15', {
        message: error?.message || String(error),
        target: clean,
        details: { name: error?.name || '', loaded, networkState: audio.networkState, readyState: audio.readyState },
      }, 500);
      if (!silentFailure) toast('Не удалось включить немецкую озвучку. Нажмите 🔊 ещё раз.');
      return false;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = oldText || '🔊';
      }
    }
  }

  function preload(text, options = {}) {
    const clean = String(text || '').trim();
    if (!clean) return;
    try {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = ttsUrl(clean, options);
      audio.load();
    } catch {}
  }

  function chooseMime() {
    if (!window.MediaRecorder) return '';
    const list = ['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'];
    return list.find((x) => MediaRecorder.isTypeSupported?.(x)) || '';
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать запись'));
      reader.readAsDataURL(blob);
    });
  }

  function openModal(expected, hints = []) {
    document.querySelector('[data-v15-speech-modal]')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'v12-modal-backdrop';
    wrap.dataset.v15SpeechModal = '1';
    wrap.innerHTML = `<section class="v12-modal" role="dialog" aria-modal="true"><div class="v12-modal-head"><b>Проверка произношения</b><button type="button" data-close>×</button></div><div class="v12-modal-body"><div class="v12-pron-target">${escapeHtml(expected)}</div><p class="v12-muted">Сначала послушайте немецкий образец, затем запишите себя. Отто проверит реальную запись, а не поставит случайный балл.</p>${hints.length ? `<div class="v12-note"><b>Подсказка по чтению:</b> ${escapeHtml(hints.join(' '))}</div>` : ''}<div class="v12-modal-actions"><button class="v12-btn secondary" type="button" data-listen>🔊 Послушать</button><button class="v12-btn primary" type="button" data-record>🎤 Начать запись</button></div><div data-result></div></div></section>`;
    wrap.querySelector('[data-close]')?.addEventListener('click', () => wrap.remove());
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
    wrap.querySelector('[data-listen]')?.addEventListener('click', (e) => void play(expected, { mode: 'normal', button: e.currentTarget }));
    document.body.appendChild(wrap);
    return wrap;
  }

  async function check(expected, hints = []) {
    const clean = String(expected || '').trim();
    if (!clean) return;
    stop();
    const wrap = openModal(clean, Array.isArray(hints) ? hints : []);
    const resultBox = wrap.querySelector('[data-result]');
    const recordButton = wrap.querySelector('[data-record]');

    recordButton?.addEventListener('click', async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        resultBox.innerHTML = '<div class="v12-feedback bad">Этот браузер не поддерживает запись, необходимую для проверки произношения.</div>';
        return;
      }
      recordButton.disabled = true;
      resultBox.innerHTML = '<div class="v12-feedback">Запрашиваю доступ к микрофону…</div>';
      log('record-request-v15', { message: clean }, 300);
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        log('record-permission-ok-v15', { message: clean }, 300);
      } catch (error) {
        recordButton.disabled = false;
        log('record-permission-error-v15', { message: error?.message || String(error), target: clean, details: { name: error?.name || '' } }, 300);
        resultBox.innerHTML = '<div class="v12-feedback bad">Микрофон не разрешён. Разрешите доступ для этого сайта и попробуйте снова.</div>';
        return;
      }

      const mime = chooseMime();
      let recorder;
      try {
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch (error) {
        stream.getTracks().forEach((t) => t.stop());
        recordButton.disabled = false;
        log('record-init-error-v15', { message: error?.message || String(error), target: clean }, 300);
        resultBox.innerHTML = '<div class="v12-feedback bad">Не удалось запустить запись в этом браузере.</div>';
        return;
      }

      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
      resultBox.innerHTML = '<div class="v12-feedback listening"><b>Слушаю…</b><br><span>Скажите слово или фразу спокойно.</span><div style="margin-top:10px"><button class="v12-btn primary" type="button" data-stop>Готово</button></div></div>';
      const finish = () => { if (recorder.state !== 'inactive') recorder.stop(); };
      resultBox.querySelector('[data-stop]')?.addEventListener('click', finish, { once: true });
      const timer = setTimeout(finish, clean.length < 25 ? 5200 : 7600);

      recorder.onstop = async () => {
        clearTimeout(timer);
        stream.getTracks().forEach((t) => t.stop());
        if (!document.body.contains(wrap)) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || mime || 'audio/webm' });
        log('record-complete-v15', { message: clean, details: { bytes: blob.size, mime: blob.type } }, 300);
        if (blob.size < 300) {
          resultBox.innerHTML = '<div class="v12-feedback bad">Запись получилась пустой. Попробуйте ещё раз и говорите после появления слова «Слушаю».</div>';
          recordButton.disabled = false;
          return;
        }
        resultBox.innerHTML = '<div class="v12-feedback">Проверяю запись…</div>';
        try {
          const audioBase64 = await blobToBase64(blob);
          const response = await fetch('/api/otto-start-pronunciation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64, mimeType: blob.type || 'audio/webm', expected: clean, hints: Array.isArray(hints) ? hints : [] }),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || `Проверка недоступна (${response.status})`);
          const good = payload.status === 'good';
          const slower = payload.status === 'slower';
          const title = good ? '✓ Хорошо' : slower ? 'Почти. Скажите медленнее' : 'Попробуйте ещё раз';
          resultBox.innerHTML = `<div class="v12-feedback ${good ? 'good' : 'bad'}"><b>${title}</b><p>${escapeHtml(payload.feedbackRu || '')}</p>${payload.transcript ? `<small>Отто услышал: <b>${escapeHtml(payload.transcript)}</b></small>` : ''}</div>`;
          log('pronunciation-ok-v15', { message: clean, details: { status: payload.status || '', transcript: payload.transcript || '' } }, 300);
        } catch (error) {
          log('pronunciation-error-v15', { message: error?.message || String(error), target: clean }, 300);
          resultBox.innerHTML = `<div class="v12-feedback bad">${escapeHtml(error?.message || 'Не удалось проверить запись.')}</div>`;
        } finally {
          recordButton.disabled = false;
          recordButton.textContent = '🎤 Записать ещё раз';
        }
      };

      try {
        recorder.start(200);
        log('record-start-v15', { message: clean, details: { mime: recorder.mimeType || mime || '' } }, 300);
      } catch (error) {
        clearTimeout(timer);
        stream.getTracks().forEach((t) => t.stop());
        recordButton.disabled = false;
        resultBox.innerHTML = '<div class="v12-feedback bad">Не удалось начать запись.</div>';
      }
    });
  }

  function status() {
    return activeAudio ? { active: true, paused: activeAudio.paused, currentTime: activeAudio.currentTime, readyState: activeAudio.readyState, networkState: activeAudio.networkState, url: activeUrl } : { active: false };
  }

  window.OttoSpeechV15 = { play, preload, stop, check, status, ttsUrl };
})();