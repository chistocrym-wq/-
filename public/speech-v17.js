(() => {
  'use strict';
  if (window.__ottoSpeechV17) return;
  window.__ottoSpeechV17 = true;

  let activeAudio = null;
  let activeUtterance = null;
  let activeObjectUrl = '';
  let serverVoiceUnavailableUntil = 0;

  const LETTER_NAMES = {
    A:'A',B:'Be',C:'Ce',D:'De',E:'E',F:'Ef',G:'Ge',H:'Ha',I:'I',J:'Jot',K:'Ka',L:'El',M:'Em',
    N:'En',O:'O',P:'Pe',Q:'Ku',R:'Er',S:'Es',T:'Te',U:'U',V:'Vau',W:'Weh',X:'Iks',Y:'Ypsilon',Z:'Zett',
    'Ä':'Ä','Ö':'Ö','Ü':'Ü','ẞ':'Eszett','ß':'Eszett'
  };

  const MALE_DE_NAMES = [
    'conrad','stefan','killian','klaus','ralf','bernd','kasper','hans','michael','christoph','markus','male'
  ];
  const FEMALE_DE_NAMES = ['katja','hedda','anna','petra','vicki','amala','seraphina','female'];

  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const log = (kind, payload = {}, throttle = 0) => {
    const api = window.OttoClientLogV14 || window.OttoClientLogV12;
    api?.send?.(kind, payload, throttle);
  };
  const toast = (message) => window.dispatchEvent(new CustomEvent('otto:v15-toast', { detail: { message: String(message || '') } }));

  function stop() {
    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.currentTime = 0; } catch {}
      activeAudio = null;
    }
    try { window.speechSynthesis?.cancel?.(); } catch {}
    activeUtterance = null;
  }

  async function loadVoices(timeoutMs = 1800) {
    if (!window.speechSynthesis?.getVoices) return [];
    const initial = window.speechSynthesis.getVoices() || [];
    if (initial.length) return initial;
    return await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        try { window.speechSynthesis.removeEventListener?.('voiceschanged', onChange); } catch {}
        resolve(window.speechSynthesis.getVoices?.() || []);
      };
      const onChange = () => {
        const list = window.speechSynthesis.getVoices?.() || [];
        if (list.length) finish();
      };
      try { window.speechSynthesis.addEventListener?.('voiceschanged', onChange); } catch {}
      setTimeout(finish, timeoutMs);
    });
  }

  function pickGermanMaleVoice(voices = []) {
    const german = voices.filter((voice) => /^de(?:-|_)/i.test(String(voice.lang || '')));
    const candidates = german
      .filter((voice) => !FEMALE_DE_NAMES.some((name) => String(voice.name || '').toLowerCase().includes(name)))
      .map((voice) => {
        const name = String(voice.name || '').toLowerCase();
        const lang = String(voice.lang || '').replace('_','-').toLowerCase();
        let score = 0;
        if (lang === 'de-de') score += 60;
        else if (lang.startsWith('de-')) score += 25;
        if (MALE_DE_NAMES.some((hint) => name.includes(hint))) score += 120;
        if (name.includes('natural') || name.includes('online')) score += 30;
        if (name.includes('microsoft')) score += 16;
        if (name.includes('google')) score += 8;
        if (voice.default) score += 2;
        return { voice, score };
      })
      .filter((entry) => entry.score >= 120)
      .sort((a,b) => b.score - a.score);
    return candidates[0]?.voice || null;
  }

  async function browserMaleSpeak(text, options = {}) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    const voices = await loadVoices();
    const voice = pickGermanMaleVoice(voices);
    if (!voice) {
      log('male-de-voice-missing-v17', { details: { availableGerman: voices.filter(v => /^de(?:-|_)/i.test(v.lang || '')).map(v => `${v.name}|${v.lang}`).slice(0,20) } }, 1000);
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
      utterance.pitch = 0.96;
      utterance.volume = 1;
      activeUtterance = utterance;
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        if (activeUtterance === utterance) activeUtterance = null;
        resolve(ok);
      };
      utterance.onstart = () => log('browser-male-de-tts-start-v17', { message: raw, details: { voice: voice.name, lang: voice.lang } }, 300);
      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);
      try { window.speechSynthesis.speak(utterance); } catch { finish(false); }
      setTimeout(() => { if (!settled && !window.speechSynthesis.speaking) finish(false); }, 1800);
    });
  }

  function ttsUrl(text, options = {}) {
    const q = new URLSearchParams({
      text: String(text || '').trim(),
      mode: options.mode === 'slow' ? 'slow' : 'normal',
      kind: options.kind === 'letter' ? 'letter' : 'text',
      v: '17',
    });
    return `/api/otto-tts?${q.toString()}`;
  }

  async function serverSpeak(text, options = {}) {
    if (Date.now() < serverVoiceUnavailableUntil) return false;
    const clean = String(text || '').trim();
    if (!clean) return false;
    return await new Promise((resolve) => {
      const audio = new Audio();
      activeAudio = audio;
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.volume = 1;
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('error', onError);
        if (!ok && activeAudio === audio) activeAudio = null;
        resolve(ok);
      };
      const onPlaying = () => {
        log('server-male-de-tts-playing-v17', { message: clean }, 300);
        finish(true);
      };
      const onError = () => {
        serverVoiceUnavailableUntil = Date.now() + 60_000;
        log('server-male-de-tts-unavailable-v17', { message: clean }, 500);
        finish(false);
      };
      audio.addEventListener('playing', onPlaying, { once:true });
      audio.addEventListener('error', onError, { once:true });
      audio.src = ttsUrl(clean, options);
      const timer = setTimeout(() => { serverVoiceUnavailableUntil = Date.now() + 30_000; finish(false); }, 6500);
      try {
        const p = audio.play();
        if (p?.catch) p.catch(onError);
      } catch { onError(); }
    });
  }

  async function play(text, options = {}) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const button = options.button || null;
    const old = button?.textContent || '';
    stop();
    if (button) { button.disabled = true; button.textContent = '🔊 …'; }
    try {
      // Quality first: neural server voice. If unavailable, use only a verified German male system voice.
      let ok = await serverSpeak(clean, options);
      if (!ok) ok = await browserMaleSpeak(clean, options);
      if (!ok && !options.silentFailure) {
        toast('Немецкий мужской голос на этом устройстве сейчас недоступен. Неправильным голосом Otto говорить не будет.');
      }
      return ok;
    } finally {
      if (button) { button.disabled = false; button.textContent = old || '🔊'; }
    }
  }

  function preload() {
    try { window.speechSynthesis?.getVoices?.(); } catch {}
    void loadVoices(2200).then((voices) => {
      const voice = pickGermanMaleVoice(voices);
      log('male-de-voice-preload-v17', { details: { selected: voice?.name || '', lang: voice?.lang || '' } }, 1000);
    });
  }

  function chooseMime() {
    if (!window.MediaRecorder) return '';
    const list = ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
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

  function normalizeSpeech(value='') {
    return String(value).toLocaleLowerCase('de-DE').replace(/[.,!?;:„“"'()]/g,' ').replace(/\b(der|die|das)\b/g,' ').replace(/\s+/g,' ').trim();
  }
  function levenshtein(a,b) {
    const x=[...a],y=[...b],row=Array(y.length+1).fill(0).map((_,i)=>i);
    for(let i=1;i<=x.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=y.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(x[i-1]===y[j-1]?0:1));prev=old;}}
    return row[y.length];
  }
  function similarity(a,b) {
    const x=normalizeSpeech(a),y=normalizeSpeech(b);if(!x||!y)return 0;if(x===y)return 1;return Math.max(0,1-levenshtein(x,y)/Math.max(x.length,y.length));
  }

  function createRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    try {
      const r = new SR();
      r.lang = 'de-DE';
      r.interimResults = false;
      r.continuous = false;
      r.maxAlternatives = 5;
      return r;
    } catch { return null; }
  }

  function openModal(expected, hints = []) {
    document.querySelector('[data-v17-speech-modal]')?.remove();
    const wrap=document.createElement('div');
    wrap.className='v12-modal-backdrop';
    wrap.dataset.v17SpeechModal='1';
    wrap.innerHTML=`<section class="v12-modal" role="dialog" aria-modal="true"><div class="v12-modal-head"><b>Проверка произношения</b><button type="button" data-close>×</button></div><div class="v12-modal-body"><div class="v12-pron-target">${esc(expected)}</div><p class="v12-muted">1. Послушайте немецкий образец. 2. Запишите себя. 3. Обязательно прослушайте свою запись и сравните.</p>${hints.length?`<div class="v12-note"><b>Подсказка по чтению:</b> ${esc(hints.join(' '))}</div>`:''}<div class="v12-modal-actions"><button class="v12-btn secondary" type="button" data-listen>🔊 Послушать образец</button><button class="v12-btn primary" type="button" data-record>🎤 Записать себя</button></div><div data-result></div></div></section>`;
    const close=()=>{
      if(activeObjectUrl){try{URL.revokeObjectURL(activeObjectUrl)}catch{} activeObjectUrl='';}
      wrap.remove();
    };
    wrap.querySelector('[data-close]')?.addEventListener('click',close);
    wrap.addEventListener('click',(e)=>{if(e.target===wrap)close()});
    wrap.querySelector('[data-listen]')?.addEventListener('click',(e)=>void play(expected,{mode:'slow',button:e.currentTarget}));
    document.body.appendChild(wrap);
    return wrap;
  }

  async function serverPronunciation(blob, expected, hints) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    try {
      const audioBase64=await blobToBase64(blob);
      const response=await fetch('/api/otto-start-pronunciation',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({audioBase64,mimeType:blob.type||'audio/webm',expected,hints:Array.isArray(hints)?hints:[]}),
        signal:controller.signal,
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(payload.error||`Проверка недоступна (${response.status})`);
      return payload;
    } finally { clearTimeout(timer); }
  }

  function playbackHtml(url) {
    return `<div class="v16-record-playback" data-own-playback><button class="v12-btn secondary small" type="button" data-play-own>▶ Прослушать мою запись</button><audio data-own-audio controls preload="metadata" src="${url}" style="width:100%;max-width:100%;margin-top:8px"></audio><small>Это именно ваша запись с микрофона.</small></div>`;
  }

  function bindOwnPlayback(box) {
    const audio=box.querySelector('[data-own-audio]');
    const button=box.querySelector('[data-play-own]');
    if(!audio||!button)return;
    button.addEventListener('click',async()=>{
      try{
        if(!audio.paused){audio.pause();audio.currentTime=0;button.textContent='▶ Прослушать мою запись';return;}
        audio.currentTime=0;
        await audio.play();
        button.textContent='■ Остановить мою запись';
      }catch(error){
        log('own-recording-play-error-v17',{message:error?.message||String(error)},300);
        toast('Не удалось воспроизвести запись. Запишите ещё раз.');
      }
    });
    audio.addEventListener('ended',()=>{button.textContent='▶ Прослушать мою запись'});
    audio.addEventListener('pause',()=>{if(audio.currentTime===0||audio.ended)button.textContent='▶ Прослушать мою запись'});
  }

  function fallbackAssessment(expected, transcript) {
    if(!transcript)return null;
    const score=similarity(expected,transcript);
    if(score>=0.84)return {status:'good',transcript,feedbackRu:'Фраза распознана близко к образцу.'};
    if(score>=0.58)return {status:'slower',transcript,feedbackRu:'Очень близко. Повторите ещё раз чуть медленнее и чётче.'};
    return {status:'retry',transcript,feedbackRu:'Распознанная фраза отличается от образца. Прослушайте образец и повторите ещё раз.'};
  }

  async function check(expected, hints = []) {
    const clean=String(expected||'').trim();
    if(!clean)return;
    stop();
    const wrap=openModal(clean,Array.isArray(hints)?hints:[]);
    const box=wrap.querySelector('[data-result]');
    const recordButton=wrap.querySelector('[data-record]');

    recordButton?.addEventListener('click',async()=>{
      if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
        box.innerHTML='<div class="v12-feedback bad">На этом устройстве не удалось открыть запись с микрофона.</div>';
        return;
      }
      recordButton.disabled=true;
      box.innerHTML='<div class="v12-feedback">Разрешите микрофон, если браузер спросит.</div>';
      let stream;
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
      }catch(error){
        recordButton.disabled=false;
        box.innerHTML='<div class="v12-feedback bad"><b>Микрофон не разрешён.</b><br>Нажмите значок замка рядом с адресом сайта → Микрофон → Разрешить, затем попробуйте ещё раз.</div>';
        log('record-permission-error-v17',{message:error?.message||String(error),target:clean},300);
        return;
      }

      const mime=chooseMime();
      let recorder;
      try{recorder=mime?new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:96000}):new MediaRecorder(stream)}catch(error){
        stream.getTracks().forEach(t=>t.stop());recordButton.disabled=false;
        box.innerHTML='<div class="v12-feedback bad">Не удалось запустить запись. Попробуйте ещё раз.</div>';
        log('recorder-create-error-v17',{message:error?.message||String(error)},300);return;
      }

      let transcript='';
      const recognition=createRecognition();
      if(recognition){
        recognition.onresult=(event)=>{
          const result=event.results?.[0];
          const alternatives=Array.from(result||[]).map(x=>String(x.transcript||'')).filter(Boolean);
          transcript=alternatives.sort((a,b)=>similarity(clean,b)-similarity(clean,a))[0]||'';
        };
        try{recognition.start()}catch{}
      }

      const chunks=[];
      recorder.ondataavailable=(event)=>{if(event.data?.size)chunks.push(event.data)};
      box.innerHTML='<div class="v12-feedback listening"><b>● Идёт запись</b><br><span>Скажите слово или фразу. Затем нажмите «Остановить запись».</span><div style="margin-top:10px"><button class="v12-btn primary" type="button" data-stop>■ Остановить запись</button></div></div>';
      const finish=()=>{try{if(recorder.state!=='inactive')recorder.stop()}catch{}};
      box.querySelector('[data-stop]')?.addEventListener('click',finish,{once:true});
      const timer=setTimeout(finish,clean.length<25?6500:9500);

      recorder.onstop=async()=>{
        clearTimeout(timer);
        stream.getTracks().forEach(t=>t.stop());
        try{recognition?.stop?.()}catch{}
        if(!document.body.contains(wrap))return;
        const blob=new Blob(chunks,{type:recorder.mimeType||mime||'audio/webm'});
        if(blob.size<250){
          box.innerHTML='<div class="v12-feedback bad">Запись получилась пустой. Нажмите «Записать себя» ещё раз и начните говорить после появления надписи «Идёт запись».</div>';
          recordButton.disabled=false;return;
        }
        if(activeObjectUrl){try{URL.revokeObjectURL(activeObjectUrl)}catch{}}
        activeObjectUrl=URL.createObjectURL(blob);
        box.innerHTML=`${playbackHtml(activeObjectUrl)}<div class="v12-feedback good" data-check-status><b>✓ Запись готова.</b><p>Нажмите «Прослушать мою запись». Otto параллельно попробует проверить произношение.</p></div>`;
        bindOwnPlayback(box);
        recordButton.disabled=false;
        recordButton.textContent='🎤 Записать ещё раз';
        log('record-complete-v17',{message:clean,details:{bytes:blob.size,mime:blob.type}},300);

        let payload=null;
        try{payload=await serverPronunciation(blob,clean,hints)}catch(error){log('pronunciation-server-unavailable-v17',{message:error?.message||String(error),target:clean},500)}
        if(!document.body.contains(wrap))return;
        if(!payload) payload=fallbackAssessment(clean,transcript);
        const statusBox=box.querySelector('[data-check-status]');
        if(payload&&statusBox){
          const good=payload.status==='good',slower=payload.status==='slower';
          statusBox.className=`v12-feedback ${good?'good':'bad'}`;
          statusBox.innerHTML=`<b>${good?'✓ Хорошо':slower?'Почти — повторите медленнее':'Повторите ещё раз'}</b><p>${esc(payload.feedbackRu||'')}</p>${payload.transcript?`<small>Отто услышал: <b>${esc(payload.transcript)}</b></small>`:''}`;
        }else if(statusBox){
          statusBox.className='v12-feedback';
          statusBox.innerHTML='<b>Запись сохранена и её можно прослушать.</b><p>Сравните свою запись с немецким образцом. Автоматическая оценка не мешает записи и воспроизведению.</p>';
        }
      };

      try{recorder.start(200)}catch(error){
        clearTimeout(timer);stream.getTracks().forEach(t=>t.stop());recordButton.disabled=false;
        box.innerHTML='<div class="v12-feedback bad">Не удалось начать запись. Попробуйте ещё раз.</div>';
        log('recorder-start-error-v17',{message:error?.message||String(error)},300);
      }
    });
  }

  function status() {
    const voices=window.speechSynthesis?.getVoices?.()||[];
    const voice=pickGermanMaleVoice(voices);
    return {active:Boolean(activeAudio||activeUtterance),browserSpeech:Boolean(window.speechSynthesis),germanMaleVoice:voice?.name||'',germanMaleLang:voice?.lang||''};
  }

  window.OttoSpeechV15={play,preload,stop,check,status,ttsUrl};
  window.OttoSpeechV17=window.OttoSpeechV15;
  preload();
})();