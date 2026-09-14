(() => {
  'use strict';
  if (window.__ottoVoiceFixV18) return;
  window.__ottoVoiceFixV18 = true;

  const base = window.OttoSpeechV17 || window.OttoSpeechV15;
  if (!base) return;

  let activeAudio = null;
  let activeUtterance = null;

  const MALE_HINTS = ['conrad','stefan','killian','klaus','ralf','bernd','kasper','hans','michael','christoph','markus','male'];
  const FEMALE_HINTS = ['katja','hedda','anna','petra','vicki','amala','seraphina','female'];
  const LETTER_NAMES = {
    A:'A',B:'Be',C:'Ce',D:'De',E:'E',F:'Ef',G:'Ge',H:'Ha',I:'I',J:'Jot',K:'Ka',L:'El',M:'Em',
    N:'En',O:'O',P:'Pe',Q:'Ku',R:'Er',S:'Es',T:'Te',U:'U',V:'Vau',W:'Weh',X:'Iks',Y:'Ypsilon',Z:'Zett',
    'Ä':'Ä','Ö':'Ö','Ü':'Ü','ẞ':'Eszett','ß':'Eszett'
  };

  const toast = (message) => window.dispatchEvent(new CustomEvent('otto:v15-toast', { detail: { message } }));
  const log = (kind, payload = {}, throttle = 0) => {
    const api = window.OttoClientLogV14 || window.OttoClientLogV12;
    api?.send?.(kind, payload, throttle);
  };

  function stopOwn() {
    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.currentTime = 0; } catch {}
      activeAudio = null;
    }
    try { window.speechSynthesis?.cancel?.(); } catch {}
    activeUtterance = null;
  }

  async function loadVoices(timeoutMs = 2200) {
    if (!window.speechSynthesis?.getVoices) return [];
    const now = window.speechSynthesis.getVoices() || [];
    if (now.length) return now;
    return await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        try { window.speechSynthesis.removeEventListener?.('voiceschanged', onChange); } catch {}
        resolve(window.speechSynthesis.getVoices?.() || []);
      };
      const onChange = () => {
        const voices = window.speechSynthesis.getVoices?.() || [];
        if (voices.length) finish();
      };
      try { window.speechSynthesis.addEventListener?.('voiceschanged', onChange); } catch {}
      setTimeout(finish, timeoutMs);
    });
  }

  function rankGermanVoice(voice) {
    const name = String(voice?.name || '').toLowerCase();
    const lang = String(voice?.lang || '').replace('_','-').toLowerCase();
    if (!lang.startsWith('de-') && lang !== 'de') return -9999;
    let score = 0;
    if (lang === 'de-de') score += 100;
    else if (lang.startsWith('de-')) score += 55;
    else score += 30;
    if (MALE_HINTS.some((hint) => name.includes(hint))) score += 180;
    if (FEMALE_HINTS.some((hint) => name.includes(hint))) score -= 20;
    if (name.includes('natural') || name.includes('online') || name.includes('neural')) score += 45;
    if (name.includes('microsoft')) score += 24;
    if (name.includes('google')) score += 18;
    if (voice.localService === false) score += 8;
    if (voice.default) score += 2;
    return score;
  }

  function pickGermanVoice(voices = []) {
    return voices
      .map((voice) => ({ voice, score: rankGermanVoice(voice) }))
      .filter((x) => x.score > -9999)
      .sort((a,b) => b.score - a.score)[0]?.voice || null;
  }

  function looksMale(voice) {
    const name = String(voice?.name || '').toLowerCase();
    return MALE_HINTS.some((hint) => name.includes(hint));
  }

  async function tryServer(text, options = {}) {
    if (!base.ttsUrl || typeof Audio === 'undefined') return false;
    return await new Promise((resolve) => {
      const audio = new Audio();
      activeAudio = audio;
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (!ok && activeAudio === audio) activeAudio = null;
        resolve(ok);
      };
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.volume = 1;
      audio.addEventListener('playing', () => finish(true), { once:true });
      audio.addEventListener('error', () => finish(false), { once:true });
      audio.src = base.ttsUrl(text, options);
      const timer = setTimeout(() => finish(false), 2200);
      try {
        const p = audio.play();
        p?.catch?.(() => finish(false));
      } catch { finish(false); }
    });
  }

  async function speakGerman(text, options = {}) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    const voices = await loadVoices();
    const voice = pickGermanVoice(voices);
    if (!voice) {
      log('de-voice-missing-v18', { details: { voices: voices.map(v => `${v.name}|${v.lang}`).slice(0,25) } }, 1000);
      return false;
    }

    const raw = String(text || '').trim();
    const spoken = options.kind === 'letter' ? (LETTER_NAMES[raw] || raw) : raw;
    if (!spoken) return false;

    try { window.speechSynthesis.cancel(); } catch {}
    return await new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.lang = 'de-DE';
      utterance.voice = voice;
      utterance.rate = options.mode === 'slow' ? 0.70 : 0.86;
      utterance.pitch = looksMale(voice) ? 0.96 : 1.0;
      utterance.volume = 1;
      activeUtterance = utterance;
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        if (activeUtterance === utterance) activeUtterance = null;
        resolve(ok);
      };
      utterance.onstart = () => log('de-tts-start-v18', { message: raw, details: { voice: voice.name, lang: voice.lang, malePreferred: looksMale(voice) } }, 300);
      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);
      try { window.speechSynthesis.speak(utterance); } catch { finish(false); }
      setTimeout(() => { if (!settled && !window.speechSynthesis.speaking) finish(false); }, 1800);
    });
  }

  async function play(text, options = {}) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const button = options.button || null;
    const old = button?.textContent || '';
    stopOwn();
    try { base.stop?.(); } catch {}
    if (button) { button.disabled = true; button.textContent = '🔊 …'; }
    try {
      let ok = await tryServer(clean, options);
      if (!ok) ok = await speakGerman(clean, options);
      if (!ok && !options.silentFailure) {
        toast('Немецкая озвучка временно недоступна на этом устройстве.');
      }
      return ok;
    } finally {
      if (button) { button.disabled = false; button.textContent = old || '🔊'; }
    }
  }

  async function check(expected, hints = []) {
    await base.check?.(expected, hints);
    const oldButton = document.querySelector('[data-v17-speech-modal] [data-listen]');
    if (!oldButton || oldButton.dataset.v18Fixed === '1') return;
    const button = oldButton.cloneNode(true);
    button.dataset.v18Fixed = '1';
    oldButton.replaceWith(button);
    button.addEventListener('click', (event) => void play(expected, { mode:'slow', button:event.currentTarget }));
  }

  function preload() {
    try { window.speechSynthesis?.getVoices?.(); } catch {}
    void loadVoices().then((voices) => {
      const voice = pickGermanVoice(voices);
      log('de-voice-preload-v18', { details: { selected: voice?.name || '', lang: voice?.lang || '', malePreferred: looksMale(voice) } }, 1000);
    });
  }

  function status() {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const voice = pickGermanVoice(voices);
    return {
      active: Boolean(activeAudio || activeUtterance),
      browserSpeech: Boolean(window.speechSynthesis),
      germanVoice: voice?.name || '',
      germanLang: voice?.lang || '',
      malePreferred: looksMale(voice),
    };
  }

  window.OttoSpeechV15 = { ...base, play, check, preload, status, stop: () => { stopOwn(); base.stop?.(); } };
  window.OttoSpeechV17 = window.OttoSpeechV15;
  window.OttoSpeechV18 = window.OttoSpeechV15;
  preload();
})();