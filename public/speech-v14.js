(() => {
  'use strict';
  if (window.__ottoSpeechV14) return;
  window.__ottoSpeechV14 = true;

  const memory = new Map();
  let activeAudio = null;
  let activeController = null;

  function emit(message) {
    window.dispatchEvent(new CustomEvent('otto:v14-toast', { detail: { message: String(message || '') } }));
  }

  function stop() {
    try { activeController?.abort(); } catch {}
    activeController = null;
    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.currentTime = 0; } catch {}
      activeAudio = null;
    }
  }

  async function audioUrl(text, mode = 'normal') {
    const clean = String(text || '').trim();
    if (!clean) throw new Error('Пустой текст');
    const key = `${mode}:${clean}`;
    if (memory.has(key)) return memory.get(key);
    const controller = new AbortController();
    activeController = controller;
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/otto-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, mode: mode === 'slow' ? 'slow' : 'normal' }),
        signal: controller.signal,
        cache: 'no-store',
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
    const button = options.button || null;
    const mode = options.mode === 'slow' ? 'slow' : 'normal';
    stop();
    let old = '';
    if (button) {
      old = button.textContent || '';
      button.disabled = true;
      button.textContent = '…';
    }
    try {
      const url = await audioUrl(text, mode);
      const audio = new Audio(url);
      activeAudio = audio;
      audio.preload = 'auto';
      audio.onended = () => { if (activeAudio === audio) activeAudio = null; };
      await audio.play();
      return true;
    } catch (error) {
      window.OttoClientLogV12?.send?.('tts-error-v14', { message: error?.message || String(error), target: String(text || '').slice(0, 160) }, 2000);
      emit('Немецкая озвучка сейчас не загрузилась. Попробуйте ещё раз.');
      return false;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = old || '🔊';
      }
    }
  }

  function modal(expected) {
    document.querySelector('[data-v14-speech-modal]')?.remove();
    const wrap = document.createElement('div');
    wrap.dataset.v14SpeechModal = '1';
    wrap.className = 'v12-modal-backdrop';
    wrap.innerHTML = `<section class="v12-modal" role="dialog" aria-modal="true"><div class="v12-modal-head"><b>Проверка произношения</b><button type="button" data-close>×</button></div><div class="v12-modal-body"><div class="v12-pron-target">${escapeHtml(expected)}</div><p class="v12-muted">Сначала послушайте образец. Затем запишите себя.</p><div class="v12-modal-actions"><button class="v12-btn secondary" type="button" data-listen>🔊 Послушать</button><button class="v12-btn primary" type="button" data-record>🎤 Записать</button></div><div data-result></div></div></section>`;
    wrap.querySelector('[data-close]')?.addEventListener('click', () => wrap.remove());
    wrap.querySelector('[data-listen]')?.addEventListener('click', (e) => play(expected, { mode: 'normal', button: e.currentTarget }));
    document.body.appendChild(wrap);
    return wrap;
  }

  function mimeType() {
    if (!window.MediaRecorder) return '';
    return ['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find((x) => MediaRecorder.isTypeSupported?.(x)) || '';
  }
  function base64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || '').split(',')[1] || '');
      r.onerror = () => reject(r.error || new Error('Не удалось прочитать запись'));
      r.readAsDataURL(blob);
    });
  }

  async function check(expected) {
    const clean = String(expected || '').trim();
    if (!clean) return;
    const wrap = modal(clean);
    const result = wrap.querySelector('[data-result]');
    const record = wrap.querySelector('[data-record]');
    record?.addEventListener('click', async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        result.innerHTML = '<div class="v12-feedback bad">Этот браузер не поддерживает запись, нужную для проверки.</div>';
        return;
      }
      record.disabled = true;
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch {
        record.disabled = false;
        result.innerHTML = '<div class="v12-feedback bad">Разрешите микрофон для Otto Start и попробуйте снова.</div>';
        return;
      }
      const mime = mimeType();
      let rec;
      try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); }
      catch {
        stream.getTracks().forEach((t) => t.stop());
        record.disabled = false;
        result.innerHTML = '<div class="v12-feedback bad">Не удалось запустить запись.</div>';
        return;
      }
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      result.innerHTML = '<div class="v12-feedback listening"><b>Слушаю…</b><div style="margin-top:10px"><button type="button" class="v12-btn primary" data-stop>Готово</button></div></div>';
      const finish = () => { if (rec.state !== 'inactive') rec.stop(); };
      result.querySelector('[data-stop]')?.addEventListener('click', finish, { once: true });
      const timer = setTimeout(finish, clean.length < 24 ? 5200 : 7600);
      rec.onstop = async () => {
        clearTimeout(timer);
        stream.getTracks().forEach((t) => t.stop());
        if (!document.body.contains(wrap)) return;
        result.innerHTML = '<div class="v12-feedback">Проверяю…</div>';
        try {
          const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' });
          const response = await fetch('/api/otto-start-pronunciation', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: await base64(blob), mimeType: blob.type || 'audio/webm', expected: clean }),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || 'Проверка недоступна');
          const good = payload.status === 'good' || payload.result === 'great';
          result.innerHTML = `<div class="v12-feedback ${good ? 'good' : 'bad'}"><b>${good ? '✓ Хорошо' : 'Попробуйте ещё раз'}</b><p>${escapeHtml(payload.feedbackRu || payload.feedback || '')}</p>${payload.transcript ? `<small>Отто услышал: <b>${escapeHtml(payload.transcript)}</b></small>` : ''}</div>`;
        } catch (error) {
          window.OttoClientLogV12?.send?.('pronunciation-error-v14', { message: error?.message || String(error), target: clean }, 2000);
          result.innerHTML = `<div class="v12-feedback bad">${escapeHtml(error?.message || 'Не удалось проверить запись')}</div>`;
        } finally { record.disabled = false; }
      };
      rec.start(200);
    });
  }

  function escapeHtml(v='') { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  window.OttoSpeechV14 = { play, check, stop };
})();
