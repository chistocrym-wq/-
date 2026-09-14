(() => {
  'use strict';
  if (window.__ottoSpeechV12) return;
  window.__ottoSpeechV12 = true;

  const memory = new Map();
  let activeAudio = null;
  let activeController = null;

  function toast(message) {
    window.dispatchEvent(new CustomEvent('otto:v12-toast', { detail: { message: String(message || '') } }));
  }

  function stop() {
    try { activeController?.abort(); } catch {}
    activeController = null;
    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.currentTime = 0; } catch {}
      activeAudio = null;
    }
  }

  async function fetchAudio(text, mode = 'slow', kind = 'text') {
    const clean = String(text || '').trim();
    if (!clean) throw new Error('Пустой текст');
    const key = `${mode}:${kind}:${clean}`;
    if (memory.has(key)) return memory.get(key);

    const controller = new AbortController();
    activeController = controller;
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/otto-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, mode: mode === 'normal' ? 'normal' : 'slow', kind }),
        signal: controller.signal,
      });
      if (!response.ok || !String(response.headers.get('content-type') || '').includes('audio/')) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Озвучка недоступна (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      memory.set(key, url);
      return url;
    } finally {
      clearTimeout(timer);
      if (activeController === controller) activeController = null;
    }
  }

  async function play(text, options = {}) {
    const mode = options.mode === 'normal' ? 'normal' : 'slow';
    const kind = options.kind === 'letter' ? 'letter' : 'text';
    const button = options.button || null;
    stop();
    if (button) {
      button.disabled = true;
      button.dataset.oldText = button.textContent || '';
      button.textContent = '…';
    }
    try {
      const url = await fetchAudio(text, mode, kind);
      const audio = new Audio(url);
      activeAudio = audio;
      audio.preload = 'auto';
      audio.onended = () => { if (activeAudio === audio) activeAudio = null; };
      await audio.play();
      return true;
    } catch (error) {
      window.OttoClientLogV12?.send?.('tts-error', {
        message: error?.message || String(error),
        target: String(text || '').slice(0, 180),
      }, 2500);
      toast('Не удалось загрузить немецкую озвучку. Я не подменяю её случайным голосом браузера — попробуйте ещё раз при стабильном интернете.');
      return false;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.oldText || '🔊';
        delete button.dataset.oldText;
      }
    }
  }

  async function preload(text, mode = 'slow') {
    try { await fetchAudio(text, mode, 'text'); } catch {}
  }

  function chooseMime() {
    if (!window.MediaRecorder) return '';
    const choices = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
    return choices.find((value) => MediaRecorder.isTypeSupported?.(value)) || '';
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать запись'));
      reader.readAsDataURL(blob);
    });
  }

  function modal(title, bodyHtml) {
    document.querySelector('[data-v12-speech-modal]')?.remove();
    const wrap = document.createElement('div');
    wrap.dataset.v12SpeechModal = '1';
    wrap.className = 'v12-modal-backdrop';
    wrap.innerHTML = `<section class="v12-modal" role="dialog" aria-modal="true"><div class="v12-modal-head"><div><b>${escapeHtml(title)}</b></div><button type="button" data-v12-modal-close aria-label="Закрыть">×</button></div><div class="v12-modal-body">${bodyHtml}</div></section>`;
    const close = () => wrap.remove();
    wrap.querySelector('[data-v12-modal-close]')?.addEventListener('click', close);
    wrap.addEventListener('click', (event) => { if (event.target === wrap) close(); });
    document.body.appendChild(wrap);
    return wrap;
  }

  async function evaluate(blob, expected) {
    const audioBase64 = await blobToBase64(blob);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch('/api/otto-start-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || 'audio/webm',
          expected: String(expected || '').trim(),
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Проверка произношения недоступна');
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  async function checkPronunciation(expected) {
    const clean = String(expected || '').trim();
    if (!clean) return;
    stop();

    const dialog = modal('Проверка произношения', `<div class="v12-pron-target">${escapeHtml(clean)}</div><p class="v12-muted">Сначала послушайте немецкий образец, затем нажмите «Начать запись» и произнесите слово или фразу.</p><div class="v12-modal-actions"><button type="button" class="v12-btn secondary" data-v12-listen>🔊 Послушать</button><button type="button" class="v12-btn primary" data-v12-record>🎤 Начать запись</button></div><div data-v12-pron-result></div>`);
    const resultBox = dialog.querySelector('[data-v12-pron-result]');
    dialog.querySelector('[data-v12-listen]')?.addEventListener('click', (event) => play(clean, { mode: 'slow', button: event.currentTarget }));

    dialog.querySelector('[data-v12-record]')?.addEventListener('click', async (event) => {
      const startButton = event.currentTarget;
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        resultBox.innerHTML = '<div class="v12-feedback bad">Этот браузер не даёт приложению записать микрофон. Откройте Otto Start в актуальном Chrome, Safari или другом современном браузере.</div>';
        return;
      }

      startButton.disabled = true;
      resultBox.innerHTML = '<div class="v12-feedback">Запрашиваю доступ к микрофону…</div>';
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch (error) {
        startButton.disabled = false;
        resultBox.innerHTML = '<div class="v12-feedback bad">Доступ к микрофону не разрешён. Разрешите микрофон для этого сайта в настройках браузера и попробуйте снова.</div>';
        return;
      }

      const mime = chooseMime();
      let recorder;
      try {
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch (error) {
        stream.getTracks().forEach((track) => track.stop());
        startButton.disabled = false;
        resultBox.innerHTML = '<div class="v12-feedback bad">Не удалось запустить запись в этом браузере.</div>';
        return;
      }

      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      resultBox.innerHTML = '<div class="v12-feedback listening"><b>Слушаю…</b><br><span>Произнесите спокойно и естественно.</span><div style="margin-top:10px"><button type="button" class="v12-btn primary" data-v12-stop-record>Готово</button></div></div>';
      const stopButton = resultBox.querySelector('[data-v12-stop-record]');
      const finish = () => { if (recorder.state !== 'inactive') recorder.stop(); };
      stopButton?.addEventListener('click', finish, { once: true });
      const timer = setTimeout(finish, clean.length < 25 ? 5500 : 8000);

      recorder.onstop = async () => {
        clearTimeout(timer);
        stream.getTracks().forEach((track) => track.stop());
        if (!document.body.contains(dialog)) return;
        resultBox.innerHTML = '<div class="v12-feedback">Проверяю запись…</div>';
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || mime || 'audio/webm' });
          const result = await evaluate(blob, clean);
          const good = result.status === 'good' || result.result === 'great';
          const transcript = String(result.transcript || '').trim();
          const feedback = String(result.feedbackRu || result.feedback || (good ? 'Хорошо.' : 'Попробуйте ещё раз.')).trim();
          resultBox.innerHTML = `<div class="v12-feedback ${good ? 'good' : 'bad'}"><b>${good ? '✓ Хорошо' : 'Попробуйте ещё раз'}</b><p>${escapeHtml(feedback)}</p>${transcript ? `<small>Отто услышал: <b>${escapeHtml(transcript)}</b></small>` : ''}</div>`;
        } catch (error) {
          window.OttoClientLogV12?.send?.('pronunciation-error', { message: error?.message || String(error), target: clean }, 3000);
          resultBox.innerHTML = `<div class="v12-feedback bad">${escapeHtml(error?.message || 'Не удалось проверить запись. Попробуйте ещё раз.')}</div>`;
        } finally {
          startButton.disabled = false;
          startButton.textContent = '🎤 Записать ещё раз';
        }
      };

      recorder.start(200);
    });
  }

  function escapeHtml(value = '') {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.OttoSpeechV12 = { play, preload, stop, checkPronunciation };
})();
