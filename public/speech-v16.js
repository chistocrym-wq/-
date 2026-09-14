(() => {
  'use strict';
  if (window.__ottoSpeechV16) return;
  window.__ottoSpeechV16 = true;

  let activeAudio = null;
  let activeObjectUrl = '';
  let activeUtterance = null;

  const LETTER_NAMES = {
    A:'A',B:'Be',C:'Ce',D:'De',E:'E',F:'Ef',G:'Ge',H:'Ha',I:'I',J:'Jot',K:'Ka',L:'El',M:'Em',
    N:'En',O:'O',P:'Pe',Q:'Ku',R:'Er',S:'Es',T:'Te',U:'U',V:'Vau',W:'Weh',X:'Iks',Y:'Ypsilon',Z:'Zett',
    'Ä':'Ä','Ö':'Ö','Ü':'Ü','ẞ':'Eszett','ß':'Eszett'
  };

  const log = (kind, payload = {}, throttle = 0) => {
    const api = window.OttoClientLogV14 || window.OttoClientLogV12;
    api?.send?.(kind, payload, throttle);
  };
  const toast = (message) => window.dispatchEvent(new CustomEvent('otto:v15-toast', { detail: { message: String(message || '') } }));
  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function stop() {
    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.currentTime = 0; } catch {}
      activeAudio = null;
    }
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    activeUtterance = null;
  }

  function germanVoice() {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const de = voices.filter(v => /^de(?:-|_)/i.test(v.lang || ''));
    const preferred = ['katja','conrad','stefan','anna','petra','google deutsch','german','deutsch'];
    return preferred.map(name => de.find(v => String(v.name || '').toLowerCase().includes(name))).find(Boolean) || de[0] || null;
  }

  function browserSpeak(text, options = {}) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return resolve(false);
      const raw = String(text || '').trim();
      const spoken = options.kind === 'letter' ? (LETTER_NAMES[raw] || raw) : raw;
      if (!spoken) return resolve(false);
      try { window.speechSynthesis.cancel(); } catch {}
      const utterance = new SpeechSynthesisUtterance(spoken);
      utterance.lang = 'de-DE';
      const voice = germanVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = options.mode === 'slow' ? 0.72 : 0.88;
      utterance.pitch = 1;
      utterance.volume = 1;
      activeUtterance = utterance;
      let settled = false;
      const done = (ok) => { if (settled) return; settled = true; if (activeUtterance === utterance) activeUtterance = null; resolve(ok); };
      utterance.onstart = () => log('browser-tts-start-v16', { message: raw, details: { voice: voice?.name || 'system', lang: voice?.lang || 'de-DE' } }, 300);
      utterance.onend = () => done(true);
      utterance.onerror = () => done(false);
      window.speechSynthesis.speak(utterance);
      setTimeout(() => { if (!settled && !window.speechSynthesis.speaking) done(false); }, 1200);
    });
  }

  function ttsUrl(text, options = {}) {
    const q = new URLSearchParams({
      text: String(text || '').trim(),
      mode: options.mode === 'slow' ? 'slow' : 'normal',
      kind: options.kind === 'letter' ? 'letter' : 'text',
      v: '16',
    });
    return `/api/otto-tts?${q.toString()}`;
  }

  async function serverSpeak(text, options = {}) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const url = ttsUrl(clean, options);
    const audio = new Audio(url);
    activeAudio = audio;
    audio.preload = 'auto';
    audio.playsInline = true;
    audio.volume = 1;
    try {
      const p = audio.play();
      if (p?.then) await p;
      log('server-tts-playing-v16', { message: clean }, 300);
      return true;
    } catch (error) {
      log('server-tts-fallback-v16', { message: error?.message || String(error), target: clean }, 500);
      return false;
    }
  }

  async function play(text, options = {}) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const button = options.button || null;
    const old = button?.textContent || '';
    stop();
    if (button) { button.disabled = true; button.textContent = '🔊 …'; }
    try {
      // Browser de-DE voice is the reliable baseline: it works even when an external TTS key is absent.
      let ok = await browserSpeak(clean, options);
      if (!ok) ok = await serverSpeak(clean, options);
      if (!ok && !options.silentFailure) toast('Не удалось включить немецкую озвучку. Проверьте звук устройства и нажмите ещё раз.');
      return ok;
    } finally {
      if (button) { button.disabled = false; button.textContent = old || '🔊'; }
    }
  }

  function preload() {
    // Native browser speech does not need a network preload.
    try { window.speechSynthesis?.getVoices?.(); } catch {}
  }

  function chooseMime() {
    if (!window.MediaRecorder) return '';
    const list = ['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'];
    return list.find(x => MediaRecorder.isTypeSupported?.(x)) || '';
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать запись'));
      reader.readAsDataURL(blob);
    });
  }

  function normalizeSpeech(value='') {
    return String(value)
      .toLocaleLowerCase('de-DE')
      .replace(/[.,!?;:„“"'()]/g,' ')
      .replace(/\b(der|die|das)\b/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function levenshtein(a,b) {
    const x=[...a], y=[...b], row=Array(y.length+1).fill(0).map((_,i)=>i);
    for(let i=1;i<=x.length;i++){
      let prev=row[0]; row[0]=i;
      for(let j=1;j<=y.length;j++){
        const old=row[j];
        row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(x[i-1]===y[j-1]?0:1));
        prev=old;
      }
    }
    return row[y.length];
  }

  function similarity(expected, heard) {
    const a=normalizeSpeech(expected), b=normalizeSpeech(heard);
    if(!a || !b) return 0;
    if(a===b) return 1;
    return Math.max(0,1-levenshtein(a,b)/Math.max(a.length,b.length));
  }

  function createRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    try {
      const r = new SR();
      r.lang = 'de-DE';
      r.interimResults = false;
      r.continuous = false;
      r.maxAlternatives = 3;
      return r;
    } catch { return null; }
  }

  function openModal(expected, hints = []) {
    document.querySelector('[data-v16-speech-modal]')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'v12-modal-backdrop';
    wrap.dataset.v16SpeechModal = '1';
    wrap.innerHTML = `<section class="v12-modal" role="dialog" aria-modal="true"><div class="v12-modal-head"><b>Проверка произношения</b><button type="button" data-close>×</button></div><div class="v12-modal-body"><div class="v12-pron-target">${esc(expected)}</div><p class="v12-muted">Сначала послушайте немецкий образец. Затем запишите себя — запись можно сразу прослушать и сравнить.</p>${hints.length?`<div class="v12-note"><b>Подсказка по чтению:</b> ${esc(hints.join(' '))}</div>`:''}<div class="v12-modal-actions"><button class="v12-btn secondary" type="button" data-listen>🔊 Послушать</button><button class="v12-btn primary" type="button" data-record>🎤 Начать запись</button></div><div data-result></div></div></section>`;
    wrap.querySelector('[data-close]')?.addEventListener('click',()=>wrap.remove());
    wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()});
    wrap.querySelector('[data-listen]')?.addEventListener('click',e=>void play(expected,{mode:'slow',button:e.currentTarget}));
    document.body.appendChild(wrap);
    return wrap;
  }

  async function serverPronunciation(blob, expected, hints) {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),4500);
    try {
      const audioBase64 = await blobToBase64(blob);
      const response = await fetch('/api/otto-start-pronunciation', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({audioBase64,mimeType:blob.type||'audio/webm',expected,hints:Array.isArray(hints)?hints:[]}),
        signal:controller.signal,
      });
      const payload = await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(payload.error || `Проверка недоступна (${response.status})`);
      return payload;
    } finally { clearTimeout(timer); }
  }

  function playbackHtml(url) {
    return `<div class="v16-record-playback"><button class="v12-btn secondary small" type="button" data-play-own>▶ Моя запись</button><small>Прослушайте себя и сравните с образцом.</small></div>`;
  }

  async function check(expected, hints = []) {
    const clean=String(expected||'').trim();
    if(!clean) return;
    stop();
    const wrap=openModal(clean,Array.isArray(hints)?hints:[]);
    const box=wrap.querySelector('[data-result]');
    const recordButton=wrap.querySelector('[data-record]');

    recordButton?.addEventListener('click',async()=>{
      if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){
        box.innerHTML='<div class="v12-feedback bad">Этот браузер не поддерживает запись с микрофона. Откройте Otto Start в современном Chrome, Edge или Яндекс Браузере.</div>';
        return;
      }
      recordButton.disabled=true;
      box.innerHTML='<div class="v12-feedback">Запрашиваю доступ к микрофону…</div>';
      let stream;
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      }catch(error){
        recordButton.disabled=false;
        box.innerHTML='<div class="v12-feedback bad">Микрофон не разрешён. Нажмите на значок замка у адреса сайта, разрешите микрофон и повторите.</div>';
        log('record-permission-error-v16',{message:error?.message||String(error),target:clean},300);
        return;
      }

      const mime=chooseMime();
      let recorder;
      try{recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)}catch{
        stream.getTracks().forEach(t=>t.stop());recordButton.disabled=false;
        box.innerHTML='<div class="v12-feedback bad">Не удалось запустить запись в этом браузере.</div>';return;
      }

      let transcript='';
      const recognition=createRecognition();
      if(recognition){
        recognition.onresult=(event)=>{
          const alt=event.results?.[0];
          transcript=Array.from(alt||[]).map(x=>x.transcript||'').sort((a,b)=>similarity(clean,b)-similarity(clean,a))[0]||'';
        };
        try{recognition.start()}catch{}
      }

      const chunks=[];
      recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
      box.innerHTML='<div class="v12-feedback listening"><b>Слушаю…</b><br><span>Скажите слово или фразу спокойно.</span><div style="margin-top:10px"><button class="v12-btn primary" type="button" data-stop>Готово</button></div></div>';
      const finish=()=>{if(recorder.state!=='inactive')recorder.stop()};
      box.querySelector('[data-stop]')?.addEventListener('click',finish,{once:true});
      const timer=setTimeout(finish,clean.length<25?5200:7600);

      recorder.onstop=async()=>{
        clearTimeout(timer);
        stream.getTracks().forEach(t=>t.stop());
        try{recognition?.stop?.()}catch{}
        if(!document.body.contains(wrap))return;
        const blob=new Blob(chunks,{type:recorder.mimeType||mime||'audio/webm'});
        if(activeObjectUrl)URL.revokeObjectURL(activeObjectUrl);
        activeObjectUrl=URL.createObjectURL(blob);
        if(blob.size<300){box.innerHTML='<div class="v12-feedback bad">Запись получилась пустой. Попробуйте ещё раз и говорите после слова «Слушаю».</div>';recordButton.disabled=false;return}

        box.innerHTML=`${playbackHtml(activeObjectUrl)}<div class="v12-feedback">Проверяю запись…</div>`;
        box.querySelector('[data-play-own]')?.addEventListener('click',()=>{
          try{const a=new Audio(activeObjectUrl);a.play()}catch{}
        });
        log('record-complete-v16',{message:clean,details:{bytes:blob.size,mime:blob.type}},300);

        let payload=null;
        try{payload=await serverPronunciation(blob,clean,hints)}catch(error){log('pronunciation-server-fallback-v16',{message:error?.message||String(error),target:clean},500)}
        await new Promise(r=>setTimeout(r,250));

        const playBlock=playbackHtml(activeObjectUrl);
        if(payload){
          const good=payload.status==='good', slower=payload.status==='slower';
          box.innerHTML=`${playBlock}<div class="v12-feedback ${good?'good':'bad'}"><b>${good?'✓ Хорошо':slower?'Почти. Скажите медленнее':'Попробуйте ещё раз'}</b><p>${esc(payload.feedbackRu||'')}</p>${payload.transcript?`<small>Отто услышал: <b>${esc(payload.transcript)}</b></small>`:''}</div>`;
        }else if(transcript){
          const score=similarity(clean,transcript);
          const good=score>=0.82, close=score>=0.58;
          box.innerHTML=`${playBlock}<div class="v12-feedback ${good?'good':'bad'}"><b>${good?'✓ Браузер уверенно распознал фразу':close?'Почти. Повторите ещё раз':'Попробуйте ещё раз медленнее'}</b><p>${good?'Сказанное распознано близко к образцу.':close?'Смысл близок, но произношение стоит повторить после образца.':'Распознанная фраза заметно отличается от образца.'}</p><small>Распознано: <b>${esc(transcript)}</b></small></div>`;
        }else{
          box.innerHTML=`${playBlock}<div class="v12-feedback"><b>Запись работает.</b><p>Автоматическое распознавание в этом браузере сейчас недоступно. Прослушайте свою запись, затем немецкий образец и повторите ещё раз.</p></div>`;
        }
        box.querySelector('[data-play-own]')?.addEventListener('click',()=>{try{const a=new Audio(activeObjectUrl);a.play()}catch{}});
        recordButton.disabled=false;
        recordButton.textContent='🎤 Записать ещё раз';
      };

      try{recorder.start(200)}catch{
        clearTimeout(timer);stream.getTracks().forEach(t=>t.stop());recordButton.disabled=false;
        box.innerHTML='<div class="v12-feedback bad">Не удалось начать запись.</div>';
      }
    });
  }

  function status(){return {active:Boolean(activeAudio||activeUtterance),browserSpeech:Boolean(window.speechSynthesis),germanVoice:germanVoice()?.name||''}}

  window.OttoSpeechV15={play,preload,stop,check,status,ttsUrl};
  window.OttoSpeechV16=window.OttoSpeechV15;
})();