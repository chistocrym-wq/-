(() => {
  'use strict';

  const STORAGE = 'ottoStartLearningPathV2';
  const FIX_KEY = 'learningFixesV4';
  const MODE_KEY = 'ottoStartSpeechModeV4';
  const AUDIO_DB = 'otto-start-audio-v1';
  const AUDIO_STORE = 'clips';
  const audioUrls = new Map();
  let activeAudio = null;
  let requestSerial = 0;

  const LEXICON = {
    hallo:{ru:'Привет',example:'Hallo! Ich bin Anna.',exampleRu:'Привет! Я Анна.'},
    danke:{ru:'Спасибо',example:'Danke, Otto!',exampleRu:'Спасибо, Отто!'},
    'tschüss':{ru:'Пока',example:'Tschüss! Bis bald.',exampleRu:'Пока! До скорого.'},
    ja:{ru:'да',example:'Ja, gern.',exampleRu:'Да, с удовольствием.'},
    nein:{ru:'нет',example:'Nein, danke.',exampleRu:'Нет, спасибо.'},
    ich:{ru:'я',example:'Ich bin Anna.',exampleRu:'Я Анна.'},
    'heiße':{ru:'зовусь',example:'Ich heiße Anna.',exampleRu:'Меня зовут Анна.'},
    heißen:{ru:'называться',example:'Wie heißen Sie?',exampleRu:'Как Вас зовут?'},
    komme:{ru:'родом / прихожу',example:'Ich komme aus Russland.',exampleRu:'Я из России.'},
    aus:{ru:'из',example:'Ich komme aus Russland.',exampleRu:'Я из России.'},
    deutschland:{ru:'Германия',example:'Ich komme aus Deutschland.',exampleRu:'Я из Германии.'},
    russland:{ru:'Россия',example:'Ich komme aus Russland.',exampleRu:'Я из России.'},
    kasachstan:{ru:'Казахстан',example:'Ich komme aus Kasachstan.',exampleRu:'Я из Казахстана.'},
    mutter:{ru:'мама',example:'Das ist meine Mutter.',exampleRu:'Это моя мама.'},
    vater:{ru:'папа',example:'Das ist mein Vater.',exampleRu:'Это мой папа.'},
    sohn:{ru:'сын',example:'Ich habe einen Sohn.',exampleRu:'У меня есть сын.'},
    familie:{ru:'семья',example:'Meine Familie ist hier.',exampleRu:'Моя семья здесь.'},
    eins:{ru:'один',example:'eins, zwei, drei',exampleRu:'один, два, три'},
    zwei:{ru:'два',example:'zwei Kaffee',exampleRu:'два кофе'},
    drei:{ru:'три',example:'drei Euro',exampleRu:'три евро'},
    zehn:{ru:'десять',example:'zehn Euro',exampleRu:'десять евро'},
    zwanzig:{ru:'двадцать',example:'zwanzig Euro',exampleRu:'двадцать евро'},
    montag:{ru:'понедельник',example:'Am Montag.',exampleRu:'В понедельник.'},
    freitag:{ru:'пятница',example:'Am Freitag.',exampleRu:'В пятницу.'},
    heute:{ru:'сегодня',example:'Heute habe ich Zeit.',exampleRu:'Сегодня у меня есть время.'},
    morgen:{ru:'завтра / утром',example:'Bis morgen!',exampleRu:'До завтра!'},
    uhr:{ru:'час / часов',example:'Es ist drei Uhr.',exampleRu:'Сейчас три часа.'},
    wasser:{ru:'вода',example:'Ich möchte Wasser.',exampleRu:'Я хотел(а) бы воду.'},
    kaffee:{ru:'кофе',example:'Ich möchte Kaffee.',exampleRu:'Я хотел(а) бы кофе.'},
    tee:{ru:'чай',example:'Ein Tee, bitte.',exampleRu:'Один чай, пожалуйста.'},
    brot:{ru:'хлеб',example:'Ich kaufe Brot.',exampleRu:'Я покупаю хлеб.'},
    apfel:{ru:'яблоко',example:'Ein Apfel, bitte.',exampleRu:'Одно яблоко, пожалуйста.'},
    milch:{ru:'молоко',example:'Ich brauche Milch.',exampleRu:'Мне нужно молоко.'},
    euro:{ru:'евро',example:'Drei Euro.',exampleRu:'Три евро.'},
    kosten:{ru:'стоить',example:'Was kostet das?',exampleRu:'Сколько это стоит?'},
    kostet:{ru:'стоит',example:'Was kostet das?',exampleRu:'Сколько это стоит?'},
    bitte:{ru:'пожалуйста',example:'Ein Kaffee, bitte.',exampleRu:'Один кофе, пожалуйста.'},
    'möchte':{ru:'хотел(а) бы',example:'Ich möchte Wasser.',exampleRu:'Я хотел(а) бы воду.'},
    haus:{ru:'дом',example:'Das ist mein Haus.',exampleRu:'Это мой дом.'},
    zimmer:{ru:'комната',example:'Das Zimmer ist klein.',exampleRu:'Комната маленькая.'},
    'straße':{ru:'улица',example:'Die Straße ist hier.',exampleRu:'Улица здесь.'},
    bahnhof:{ru:'вокзал',example:'Ich bin am Bahnhof.',exampleRu:'Я на вокзале.'},
    bus:{ru:'автобус',example:'Ich fahre mit dem Bus.',exampleRu:'Я еду на автобусе.'},
    ticket:{ru:'билет',example:'Ein Ticket nach Berlin.',exampleRu:'Один билет до Берлина.'},
    arbeit:{ru:'работа',example:'Ich bin bei der Arbeit.',exampleRu:'Я на работе.'},
    arzt:{ru:'врач',example:'Ich brauche einen Arzt.',exampleRu:'Мне нужен врач.'},
    termin:{ru:'приём / встреча',example:'Ich habe einen Termin.',exampleRu:'У меня назначена встреча.'},
    name:{ru:'имя / фамилия',example:'Mein Name ist Anna.',exampleRu:'Меня зовут Анна.'},
    adresse:{ru:'адрес',example:'Wie ist Ihre Adresse?',exampleRu:'Какой у Вас адрес?'},
    geburtsdatum:{ru:'дата рождения',example:'Mein Geburtsdatum ist 12.03.1987.',exampleRu:'Моя дата рождения — 12.03.1987.'},
    wo:{ru:'где',example:'Wo ist der Bahnhof?',exampleRu:'Где вокзал?'},
    wann:{ru:'когда',example:'Wann ist der Termin?',exampleRu:'Когда встреча?'},
    wie:{ru:'как',example:'Wie heißt du?',exampleRu:'Как тебя зовут?'},
    was:{ru:'что',example:'Was kostet das?',exampleRu:'Сколько это стоит?'},
    gut:{ru:'хорошо',example:'Sehr gut!',exampleRu:'Очень хорошо!'},
    klein:{ru:'маленький',example:'Das Zimmer ist klein.',exampleRu:'Комната маленькая.'},
    'groß':{ru:'большой',example:'Das Haus ist groß.',exampleRu:'Дом большой.'},
    warm:{ru:'тепло',example:'Heute ist es warm.',exampleRu:'Сегодня тепло.'},
    kalt:{ru:'холодно',example:'Heute ist es kalt.',exampleRu:'Сегодня холодно.'},
    schule:{ru:'школа',example:'Die Schule ist hier.',exampleRu:'Школа здесь.'},
    schuh:{ru:'ботинок / туфля',example:'Der Schuh ist neu.',exampleRu:'Ботинок новый.'},
    'schön':{ru:'красивый / хорошо',example:'Das ist schön.',exampleRu:'Это красиво.'},
    schrank:{ru:'шкаф',example:'Der Schrank ist groß.',exampleRu:'Шкаф большой.'},
    mein:{ru:'мой',example:'Mein Name ist Anna.',exampleRu:'Меня зовут Анна.'},
    reise:{ru:'поездка / путешествие',example:'Die Reise ist gut.',exampleRu:'Поездка хорошая.'},
    biene:{ru:'пчела',example:'Die Biene ist klein.',exampleRu:'Пчела маленькая.'},
    mich:{ru:'меня / мне',example:'Hören Sie mich?',exampleRu:'Вы меня слышите?'},
    zeit:{ru:'время',example:'Ich habe Zeit.',exampleRu:'У меня есть время.'},
    liebe:{ru:'любовь / дорогая',example:'Liebe Anna,',exampleRu:'Дорогая Анна,'},
    sieben:{ru:'семь',example:'sieben Euro',exampleRu:'семь евро'},
    vier:{ru:'четыре',example:'vier Euro',exampleRu:'четыре евро'},
    leute:{ru:'люди',example:'Viele Leute.',exampleRu:'Много людей.'},
    sport:{ru:'спорт',example:'Ich mache Sport.',exampleRu:'Я занимаюсь спортом.'},
    sprechen:{ru:'говорить',example:'Ich spreche Deutsch.',exampleRu:'Я говорю по-немецки.'},
    stadt:{ru:'город',example:'Die Stadt ist groß.',exampleRu:'Город большой.'},
    stehen:{ru:'стоять',example:'Ich stehe hier.',exampleRu:'Я стою здесь.'},
    jahr:{ru:'год',example:'Ein Jahr.',exampleRu:'Один год.'},
    'spät':{ru:'поздно',example:'Es ist spät.',exampleRu:'Уже поздно.'},
    'fünf':{ru:'пять',example:'fünf Euro',exampleRu:'пять евро'},
    'häuser':{ru:'дома',example:'Die Häuser sind groß.',exampleRu:'Дома большие.'},
    'bäume':{ru:'деревья',example:'Die Bäume sind schön.',exampleRu:'Деревья красивые.'},
    miete:{ru:'арендная плата',example:'Die Miete ist hoch.',exampleRu:'Арендная плата высокая.'},
    mitte:{ru:'середина',example:'In der Mitte.',exampleRu:'В середине.'},
    ofen:{ru:'печь / духовка',example:'Der Ofen ist warm.',exampleRu:'Печь тёплая.'},
    offen:{ru:'открыто',example:'Das Café ist offen.',exampleRu:'Кафе открыто.'},
    berlin:{ru:'Берлин',example:'Ich fahre nach Berlin.',exampleRu:'Я еду в Берлин.'}
  };

  const DISPLAY_WORDS = Object.keys(LEXICON).sort((a,b)=>b.length-a.length);

  function readState(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return{}}}
  function writeState(state){try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch{}}
  function fixState(){const s=readState();return s[FIX_KEY]||{}}
  function setFix(patch){const s=readState();s[FIX_KEY]={...(s[FIX_KEY]||{}),...patch};writeState(s)}
  function currentLesson(){return Number(readState().currentLesson||1)}
  function currentStep(){return Number(readState().lessonStep||0)}
  function markRuleSeen(key){const s=readState();s.ruleState=s.ruleState||{};const r=s.ruleState[key]||{level:0,errors:0};r.level=Math.max(1,Number(r.level||0));s.ruleState[key]=r;writeState(s)}

  function normalizeWord(value){return String(value||'').toLocaleLowerCase('de-DE').replace(/^[^\p{L}]+|[^\p{L}]+$/gu,'')}
  function lexiconFor(word){return LEXICON[normalizeWord(word)]||null}

  function readingHints(word){
    const w=String(word||'');
    const low=w.toLocaleLowerCase('de-DE');
    const hints=[];
    const add=(key,label,text)=>{if(!hints.some(x=>x.key===key))hints.push({key,label,text})};
    if(low.includes('sch'))add('sch','sch','sch → примерно «ш»');
    if(low.includes('ch'))add('ch','ch','ch в ich/mich звучит мягко; сначала слушай образец');
    if(low.includes('äu'))add('aeu','äu','äu → примерно «ой»');
    if(low.includes('ei'))add('ei','ei','ei → примерно «ай»');
    if(low.includes('ie'))add('ie','ie','ie → долгое «и»');
    if(low.includes('eu'))add('eu','eu','eu → примерно «ой»');
    if(/^sp/i.test(w))add('sp','sp','sp в начале слова → примерно «шп»');
    if(/^st/i.test(w))add('st','st','st в начале слова → примерно «шт»');
    if(low.includes('z'))add('z','z','z → «ц»');
    if(low.includes('w'))add('w','w','w → «в»');
    if(/^v/i.test(w))add('v','v','v во многих частых словах звучит как «ф»');
    if(low.includes('j'))add('j','j','j → «й»');
    if(low.includes('ß'))add('ss','ß','ß передаёт звук «с»');
    if(/[äöü]/i.test(w))add('umlaut','ä ö ü','умлауты имеют отдельные немецкие звуки — лучше сначала услышать образец');
    if(/e$/i.test(w))add('final-e','-e','конечное -e обычно звучит слабо и без ударения, но не исчезает');
    if(/er$/i.test(w))add('final-er','-er','конечное -er в обычной речи звучит слабее буквального русского «эр»');
    return hints;
  }

  function speechMode(){try{return localStorage.getItem(MODE_KEY)==='normal'?'normal':'slow'}catch{return'normal'}}
  function setSpeechMode(mode){try{localStorage.setItem(MODE_KEY,mode==='slow'?'slow':'normal')}catch{};syncSpeedControls()}

  let dbPromise=null;
  function openAudioDb(){
    if(!('indexedDB'in window))return Promise.resolve(null);
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(resolve=>{
      try{
        const req=indexedDB.open(AUDIO_DB,1);
        req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(AUDIO_STORE))db.createObjectStore(AUDIO_STORE)};
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>resolve(null);
      }catch{resolve(null)}
    });
    return dbPromise;
  }
  async function idbGet(key){const db=await openAudioDb();if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction(AUDIO_STORE,'readonly');const req=tx.objectStore(AUDIO_STORE).get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>resolve(null)}catch{resolve(null)}})}
  async function idbPut(key,blob){const db=await openAudioDb();if(!db)return;return new Promise(resolve=>{try{const tx=db.transaction(AUDIO_STORE,'readwrite');tx.objectStore(AUDIO_STORE).put(blob,key);tx.oncomplete=()=>resolve();tx.onerror=()=>resolve()}catch{resolve()}})}
  function audioKey(text,mode){return `${mode}:${String(text||'').trim()}`}
  async function audioUrl(text,mode=speechMode()){
    const clean=String(text||'').trim();if(!clean)throw new Error('empty audio');
    const key=audioKey(clean,mode);
    if(audioUrls.has(key))return audioUrls.get(key);
    const stored=await idbGet(key);
    if(stored instanceof Blob){const url=URL.createObjectURL(stored);audioUrls.set(key,url);return url}
    const response=await fetch('/api/otto-tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:clean,mode})});
    if(!response.ok||!String(response.headers.get('content-type')||'').includes('audio/'))throw new Error(`tts ${response.status}`);
    const blob=await response.blob();
    void idbPut(key,blob);
    const url=URL.createObjectURL(blob);audioUrls.set(key,url);return url;
  }
  async function preloadAudio(text,mode=speechMode()){try{await audioUrl(text,mode)}catch{}}
  function bestGermanVoice(){const synth=window.speechSynthesis;if(!synth?.getVoices)return null;const list=synth.getVoices().filter(v=>/^de([_-]|$)/i.test(v.lang||''));return list.find(v=>/natural|neural|premium|enhanced/i.test(`${v.name} ${v.voiceURI}`))||list.find(v=>/google|microsoft|apple/i.test(`${v.name} ${v.voiceURI}`))||list[0]||null}
  const synth=window.speechSynthesis;
  const nativeSpeak=synth?.speak?synth.speak.bind(synth):null;
  const nativeCancel=synth?.cancel?synth.cancel.bind(synth):null;
  function browserFallback(text,mode){if(!nativeSpeak||!window.SpeechSynthesisUtterance)return false;nativeCancel?.();const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=mode==='slow'?.82:.96;u.pitch=1;const voice=bestGermanVoice();if(voice)u.voice=voice;nativeSpeak(u);return true}
  function stopAudio(){requestSerial++;if(activeAudio){try{activeAudio.pause();activeAudio.currentTime=0}catch{}activeAudio=null}nativeCancel?.()}
  async function playAudio(text,{mode=speechMode(),button=null}={}){
    const clean=String(text||'').trim();if(!clean)return false;
    stopAudio();const id=++requestSerial;let loadingTimer=null;
    if(button)loadingTimer=setTimeout(()=>{button.classList.add('otto-audio-loading');button.setAttribute('aria-busy','true')},120);
    try{
      const url=await audioUrl(clean,mode);if(id!==requestSerial)return false;
      const audio=new Audio(url);activeAudio=audio;audio.preload='auto';await audio.play();return true;
    }catch{return browserFallback(clean,mode)}finally{if(loadingTimer)clearTimeout(loadingTimer);if(button){button.classList.remove('otto-audio-loading');button.removeAttribute('aria-busy')}}
  }
  if(synth&&nativeSpeak){try{synth.speak=(utterance)=>{const text=String(utterance?.text||'').trim();if(!text)return nativeSpeak(utterance);void playAudio(text,{mode:speechMode()})};synth.cancel=()=>stopAudio()}catch{}}
  window.OttoStartSpeech={play:playAudio,preload:preloadAudio,stop:stopAudio};

  function warmCommon(){['Hallo','Ja','Nein','Schule','mein','Familie','heiße','Ich heiße Anna.'].forEach((text,i)=>setTimeout(()=>void preloadAudio(text,i<6?'slow':speechMode()),450+i*250))}
  function prefetchVisible(){const els=[...document.querySelectorAll('#app [data-speak],#app [data-letter],#app [data-start-audio]')].slice(0,4);els.forEach((el,i)=>setTimeout(()=>void preloadAudio(el.dataset.startAudio||el.dataset.speak||el.dataset.letter,speechMode()),120+i*160))}

  function sheetShell(className=''){const back=document.createElement('div');back.className='otto-sheet-backdrop';back.innerHTML=`<section class="otto-sheet ${className}" role="dialog" aria-modal="true"><div class="otto-sheet-head"><div class="otto-sheet-title"></div><button class="otto-sheet-close" type="button" aria-label="Закрыть">×</button></div><div class="otto-sheet-body"></div></section>`;back.querySelector('.otto-sheet-close').addEventListener('click',()=>back.remove());back.addEventListener('click',e=>{if(e.target===back)back.remove()});document.body.appendChild(back);return back}

  async function translateParts(parts){try{const r=await fetch('/api/translate-task',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts})});const p=await r.json();return Array.isArray(p.translations)?p.translations:[]}catch{return[]}}
  function openWordSheet(rawWord){
    const word=String(rawWord||'').trim();const data=lexiconFor(word);const hints=readingHints(word);const modal=sheetShell('otto-word-sheet');
    modal.querySelector('.otto-sheet-title').innerHTML=`<h2>${escapeHtml(word)}</h2><p>${data?escapeHtml(data.ru):'Перевод загружается…'}</p>`;
    const example=data?.example||'';const exampleRu=data?.exampleRu||'';
    modal.querySelector('.otto-sheet-body').innerHTML=`<div class="otto-sheet-actions"><button type="button" data-start-audio="${escapeAttr(word)}">🔊 Послушать</button><button type="button" class="otto-strong" data-otto-pronounce="${escapeAttr(word)}">🎤 Произнеси сам</button></div>${example?`<div class="otto-word-example"><b>${escapeHtml(example)}</b><span>${escapeHtml(exampleRu)}</span><div class="otto-sheet-actions"><button type="button" data-start-audio="${escapeAttr(example)}">🔊 Фраза</button><button type="button" data-otto-pronounce="${escapeAttr(example)}">🎤 Сказать фразу</button></div></div>`:''}<details class="otto-rule-explain" ${hints.length?'':'hidden'}><summary>Почему так читается?</summary><div class="otto-rule-list">${hints.map(h=>`<div class="otto-rule-line"><strong>${escapeHtml(h.label)}</strong><span>${escapeHtml(h.text)}</span></div>`).join('')}</div></details>${!hints.length?'<p class="otto-rule-empty">Здесь пока нет нового правила из твоего маршрута. Сначала послушай образец целиком.</p>':''}`;
    if(!data){void translateParts([word]).then(([ru])=>{const p=modal.querySelector('.otto-sheet-title p');if(p)p.textContent=ru||'Перевод пока недоступен'})}
    void preloadAudio(word,speechMode());
  }

  function audioBlobToBase64(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||'').split(',')[1]||'');r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
  function chooseRecorderMime(){if(!window.MediaRecorder)return'';const list=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'];return list.find(x=>MediaRecorder.isTypeSupported?.(x))||''}
  function expectedFixedTokens(expected){return String(expected||'').toLocaleLowerCase('de-DE').replace(/[…\.!,?;:]/g,' ').split(/\s+/).filter(x=>x&&x!=='anna'&&x!=='name')}
  function normalizeSpeech(v){return String(v||'').toLocaleLowerCase('de-DE').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim()}
  function transcriptLooksClose(transcript,expected){const t=normalizeSpeech(transcript),e=normalizeSpeech(expected);if(!t)return false;if(expected.includes('…'))return expectedFixedTokens(expected).every(x=>t.includes(normalizeSpeech(x)));const ea=e.split(' '),ta=t.split(' ');const hits=ea.filter(x=>ta.includes(x)).length;return hits>=Math.max(1,Math.ceil(ea.length*.65))}
  function applyPronunciationFeedback(source,result){
    const slot=source?.closest('.exercise-card,.phrase-focus,.word-card,.otto-reading-gate,.otto-transfer-card')?.querySelector('.feedback-slot')||source?.closest('.exercise-card')?.querySelector('.feedback-slot');
    if(!slot)return;
    slot.innerHTML=`<div class="feedback ${result.status==='good'?'good':'try'}">${result.status==='good'?'✓ ':''}${escapeHtml(result.feedbackRu||'')}</div>${result.status==='good'&&currentStep()===2?'<button class="btn btn-primary btn-block" data-next-step="3">Продолжить →</button>':''}`;
  }
  function showMicResult(modal,source,result){
    const body=modal.querySelector('.otto-sheet-body');const status=result.status||'retry';const title=status==='good'?'Отлично, похоже.':status==='slower'?'Почти. Скажи чуть медленнее.':'Попробуй ещё раз.';
    body.innerHTML=`<div class="otto-mic-result ${status}"><b>${escapeHtml(title)}</b><p>${escapeHtml(result.feedbackRu||'')}</p>${result.transcript?`<div class="otto-transcript">Отто услышал: <b>${escapeHtml(result.transcript)}</b></div>`:''}</div><div class="otto-sheet-actions"><button type="button" data-mic-retry>🎤 Попробовать ещё</button><button type="button" class="otto-strong" data-mic-done>Готово</button></div>`;
    applyPronunciationFeedback(source,result);
    body.querySelector('[data-mic-retry]')?.addEventListener('click',()=>{modal.remove();void startPronunciation(source)});
    body.querySelector('[data-mic-done]')?.addEventListener('click',()=>{modal.remove();if(status==='good'&&source?.matches('[data-mini-speak]')){source.dataset.ottoVerified='1';source.click()}});
  }
  async function evaluateRecording(blob,expected){const audioBase64=await audioBlobToBase64(blob);const response=await fetch('/api/otto-start-pronunciation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audioBase64,mimeType:blob.type||'audio/webm',expected,hints:readingHints(expected).map(x=>x.text)})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||'Проверка речи недоступна');return payload}

  function recognitionFallback(source,expected,modal){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition)return false;
    const body=modal.querySelector('.otto-sheet-body');body.innerHTML='<div class="otto-mic-status is-listening"><span class="otto-mic-dot"></span><div><b>Слушаю…</b><span>Говори спокойно и достаточно близко к микрофону.</span></div></div><div class="otto-sheet-actions"><button type="button" data-mic-cancel>Отмена</button></div>';
    const rec=new Recognition();rec.lang='de-DE';rec.interimResults=false;rec.maxAlternatives=3;
    body.querySelector('[data-mic-cancel]')?.addEventListener('click',()=>{try{rec.abort()}catch{}modal.remove()});
    rec.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';const good=transcriptLooksClose(text,expected);showMicResult(modal,source,{status:good?'good':'retry',transcript:text,feedbackRu:good?'Отлично, фраза распознана и звучит достаточно похоже.':'Отто услышал другую фразу. Послушай образец и попробуй ещё раз.'})};
    rec.onerror=e=>{body.innerHTML=`<div class="otto-permission-note">${e.error==='not-allowed'?'Чтобы Отто мог проверить произношение, разрешите доступ к микрофону в браузере.':'Распознавание речи сейчас не сработало. Можно послушать образец и повторить позже.'}</div><div class="otto-sheet-actions"><button type="button" data-mic-done>Закрыть</button></div>`;body.querySelector('[data-mic-done]')?.addEventListener('click',()=>modal.remove())};
    try{rec.start();return true}catch{return false}
  }

  async function startPronunciation(source){
    const expected=source?.dataset.ottoPronounce||source?.dataset.pronounce||(source?.matches('[data-mini-speak]')?'Ich heiße …':'');if(!expected)return;
    stopAudio();const modal=sheetShell('otto-mic-sheet');modal.querySelector('.otto-sheet-title').innerHTML='<h2>Проверка произношения</h2><p>Отто действительно слушает запись и сравнивает её с образцом.</p>';
    const body=modal.querySelector('.otto-sheet-body');body.innerHTML=`<div class="otto-mic-target">${escapeHtml(expected)}</div><div class="otto-mic-status"><span class="otto-mic-dot"></span><div><b>Подключаю микрофон…</b><span>Браузер может показать запрос разрешения.</span></div></div>`;
    if(!navigator.mediaDevices?.getUserMedia){if(recognitionFallback(source,expected,modal))return;body.innerHTML='<div class="otto-permission-note">Этот браузер не даёт Otto доступ к записи микрофона. Послушай образец и попробуй проверку в актуальном Chrome, Safari или другом браузере с поддержкой микрофона.</div>';return}
    let stream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}catch(err){body.innerHTML=`<div class="otto-permission-note"><b>Чтобы Отто мог проверить произношение, разрешите доступ к микрофону.</b><br>Если доступ уже был запрещён, откройте настройки сайта/браузера и разрешите микрофон для Otto Start.</div><div class="otto-sheet-actions"><button type="button" data-mic-retry-permission>Разрешить микрофон</button><button type="button" data-mic-done>Закрыть</button></div>`;body.querySelector('[data-mic-retry-permission]')?.addEventListener('click',()=>{modal.remove();void startPronunciation(source)});body.querySelector('[data-mic-done]')?.addEventListener('click',()=>modal.remove());return}
    if(!window.MediaRecorder){stream.getTracks().forEach(t=>t.stop());if(recognitionFallback(source,expected,modal))return;body.innerHTML='<div class="otto-permission-note">Микрофон доступен, но этот браузер не поддерживает запись, нужную для проверки. Можно пользоваться озвучкой, а произношение проверить в другом современном браузере.</div>';return}
    const mime=chooseRecorderMime();let recorder;try{recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)}catch{stream.getTracks().forEach(t=>t.stop());if(recognitionFallback(source,expected,modal))return;body.innerHTML='<div class="otto-permission-note">Не удалось запустить запись в этом браузере.</div>';return}
    const chunks=[];recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    const maxMs=expected.length<24?5200:7600;let autoTimer;
    body.innerHTML=`<div class="otto-mic-target">${escapeHtml(expected)}</div><div class="otto-mic-status is-listening"><span class="otto-mic-dot"></span><div><b>Слушаю…</b><span>Скажи слово или фразу. Когда закончишь — нажми «Готово».</span></div></div><div class="otto-sheet-actions"><button type="button" class="otto-strong" data-mic-stop>Готово</button><button type="button" data-mic-cancel>Отмена</button></div>`;
    const finish=()=>{if(recorder.state!=='inactive')recorder.stop()};body.querySelector('[data-mic-stop]')?.addEventListener('click',finish);body.querySelector('[data-mic-cancel]')?.addEventListener('click',()=>{clearTimeout(autoTimer);try{recorder.stop()}catch{}stream.getTracks().forEach(t=>t.stop());modal.remove()});
    recorder.onstop=async()=>{clearTimeout(autoTimer);stream.getTracks().forEach(t=>t.stop());if(!document.body.contains(modal))return;body.innerHTML='<div class="otto-mic-status"><span class="otto-mic-dot"></span><div><b>Проверяю…</b><span>Отто распознаёт сказанное и сравнивает произношение.</span></div></div>';try{const blob=new Blob(chunks,{type:recorder.mimeType||mime||'audio/webm'});const result=await evaluateRecording(blob,expected);showMicResult(modal,source,result)}catch(err){body.innerHTML=`<div class="otto-permission-note">${escapeHtml(err.message||'Не удалось проверить запись. Попробуй ещё раз.')}</div><div class="otto-sheet-actions"><button type="button" data-mic-retry>Попробовать ещё</button><button type="button" data-mic-done>Закрыть</button></div>`;body.querySelector('[data-mic-retry]')?.addEventListener('click',()=>{modal.remove();void startPronunciation(source)});body.querySelector('[data-mic-done]')?.addEventListener('click',()=>modal.remove())}};
    recorder.start(200);autoTimer=setTimeout(finish,maxMs);
  }

  function openSupport(){
    const modal=sheetShell('otto-support-sheet');modal.querySelector('.otto-sheet-title').innerHTML='<h2>Помощь / Поддержка</h2><p>Сообщи, если что-то не работает, или задай вопрос по Otto Start.</p>';
    const body=modal.querySelector('.otto-sheet-body');body.innerHTML=`<form class="otto-support-form"><select name="category" aria-label="Тема"><option>Вопрос по обучению</option><option>Ошибка в задании</option><option>Проблема с микрофоном</option><option>Проблема со звуком</option><option>Оплата / аккаунт</option><option>Другое</option></select><textarea name="message" maxlength="3000" placeholder="Что случилось или какой у вас вопрос?" required></textarea><button class="btn btn-primary btn-block" type="submit">Отправить в поддержку</button></form><div class="otto-sheet-actions"><button type="button" data-copy-diagnostics>Скопировать тех. информацию</button></div><div data-support-result></div>`;
    const form=body.querySelector('form');form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Отправляю…';const fd=new FormData(form);try{const r=await fetch('/api/otto-start-support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:fd.get('category'),message:fd.get('message'),lesson:currentLesson(),page:location.href.split('?')[0],device:navigator.userAgent})});const p=await r.json();if(!r.ok)throw new Error(p.error||'Не удалось отправить');body.querySelector('[data-support-result]').innerHTML=`<div class="otto-support-result">Сообщение отправлено. Номер обращения: <b>${escapeHtml(p.ticket||'')}</b></div>`;form.reset()}catch(err){body.querySelector('[data-support-result]').innerHTML=`<div class="otto-permission-note">${escapeHtml(err.message||'Не удалось отправить сообщение.')}</div>`}finally{button.disabled=false;button.textContent='Отправить в поддержку'}});
    body.querySelector('[data-copy-diagnostics]')?.addEventListener('click',async()=>{const text=`Otto Start\nУрок: ${currentLesson()}\nСтраница: ${location.href.split('?')[0]}\nУстройство: ${navigator.userAgent}`;try{await navigator.clipboard.writeText(text);body.querySelector('[data-support-result]').innerHTML='<div class="otto-support-result">Техническая информация скопирована.</div>'}catch{}})
  }
  async function shareOtto(){const data={title:'Otto Start',text:'Я учу немецкий с нуля в Otto Start.',url:`${location.origin}/otto-start/`};try{if(navigator.share){await navigator.share(data);return}await navigator.clipboard.writeText(`${data.text} ${data.url}`);toastLocal('Ссылка на Otto Start скопирована')}catch(err){if(err?.name!=='AbortError')toastLocal('Не удалось открыть меню «Поделиться»')}}
  function toastLocal(text){let el=document.querySelector('.otto-fix-toast');if(!el){el=document.createElement('div');el.className='toast otto-fix-toast';document.body.appendChild(el)}el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1900)}

  function speedControl(){const mode=speechMode();return `<div class="otto-speech-speed" role="group" aria-label="Скорость немецкой речи"><span>Темп</span><button type="button" data-otto-start-mode="normal" class="${mode==='normal'?'is-active':''}">🔊 Нормально</button><button type="button" data-otto-start-mode="slow" class="${mode==='slow'?'is-active':''}">🐢 Медленнее</button></div>`}
  function syncSpeedControls(){document.querySelectorAll('[data-otto-start-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.ottoStartMode===speechMode()))}
  function enhanceSpeed(){const screen=document.querySelector('#app .screen');if(!screen||screen.querySelector('.otto-speech-speed')||!screen.querySelector('[data-speak],[data-letter],[data-start-audio]'))return;const holder=document.createElement('div');holder.innerHTML=speedControl();const anchor=screen.querySelector('.lesson-top,.topbar');anchor?.insertAdjacentElement('afterend',holder.firstElementChild)}

  function enhanceTopbar(){document.querySelectorAll('#app .topbar').forEach(top=>{if(top.querySelector('.otto-top-actions'))return;const menu=top.querySelector('.icon-btn[data-go="more"]');if(!menu)return;const wrap=document.createElement('div');wrap.className='otto-top-actions';const support=document.createElement('button');support.type='button';support.className='otto-support-trigger';support.dataset.ottoSupport='1';support.setAttribute('aria-label','Помощь и поддержка');support.textContent='?';menu.before(wrap);wrap.append(support,menu)})}
  function enhanceMore(){const grid=document.querySelector('#app .menu-grid');if(!grid||grid.querySelector('[data-otto-share]'))return;const share=document.createElement('button');share.className='menu-card otto-share-card';share.dataset.ottoShare='1';share.innerHTML='<span>↗</span><b>Поделиться Otto</b><small>Системное меню или копирование ссылки</small>';const support=document.createElement('button');support.className='menu-card otto-support-card';support.dataset.ottoSupport='1';support.innerHTML='<span>?</span><b>Помощь / Поддержка</b><small>Вопрос, ошибка, звук или микрофон</small>';grid.append(share,support)}

  function dictionaryWord(card){return card.querySelector('.word-info>div:first-child b')?.textContent?.trim()||''}
  function enhanceDictionary(){
    document.querySelectorAll('#app .word-card').forEach(card=>{if(card.dataset.ottoEnhanced==='1')return;const word=dictionaryWord(card);const data=lexiconFor(word);if(!word)return;card.dataset.ottoEnhanced='1';if(normalizeWord(word)==='ich'&&currentLesson()<6){card.classList.add('otto-word-card-hidden');return}
      const example=card.querySelector('.word-info>p');if(example&&data?.exampleRu){const ru=document.createElement('p');ru.className='otto-example-ru';ru.textContent=data.exampleRu;example.after(ru)}
      const actions=card.querySelector('.word-actions');if(actions){const buttons=[...actions.querySelectorAll('button')];if(buttons[0]){buttons[0].textContent='🔊 Слово';buttons[0].dataset.speak=word}if(buttons[1]){buttons[1].removeAttribute('data-speak');buttons[1].dataset.ottoPronounce=word;buttons[1].textContent='🎤 Сказать'}if(!actions.querySelector('[data-otto-word-more]')){const more=document.createElement('button');more.type='button';more.className='otto-word-actions-more';more.dataset.ottoWordMore=word;more.textContent='⋯ Ещё';actions.appendChild(more)}}
    })
  }

  function dictionaryTip(){const s=readState(),fix=s[FIX_KEY]||{};if(!s.completed?.length||fix.dictionaryIntroShown)return;const screen=document.querySelector('#app .screen');if(!screen||screen.querySelector('.otto-dictionary-tip'))return;const hero=screen.querySelector('.home-hero');if(!hero)return;const tip=document.createElement('div');tip.className='otto-dictionary-tip';tip.innerHTML='<b>Все новые слова сохраняются в «Мои слова».</b><p>Если забудешь значение или произношение — словарь всегда в нижнем меню.</p><button type="button" data-go="words" data-dict-tip-open>Открыть «Мои слова»</button><button type="button" class="otto-tip-close" data-dict-tip-close aria-label="Закрыть">×</button>';hero.after(tip);document.querySelector('.bottom-nav [data-go="words"]')?.classList.add('otto-nav-highlight')}

  function statusForRule(state,key){const r=state.ruleState?.[key]||{};const level=Number(r.level||0),errors=Number(r.errors||0);if(level>=3&&errors<=1)return['уверенно','is-confident'];if(errors>0&&level<3)return['повторить','is-review'];if(level>0)return['учимся','is-learning'];return['ещё не проходили','is-future']}
  function enhanceSkills(){const grid=document.querySelector('#app .mastery-grid');if(!grid||grid.dataset.ottoDetailed==='1')return;const s=readState();const topics=[['sch','sch'],['ei','ei'],['ie','ie'],['ch','ch'],['ö','umlaut'],['ß','ss']];grid.dataset.ottoDetailed='1';grid.classList.add('otto-skill-detail-grid');grid.innerHTML=topics.map(([label,key])=>{const [txt,cls]=statusForRule(s,key);return`<div class="otto-skill-detail"><b>${label}</b><span class="${cls}">${txt}</span></div>`}).join('')}

  function addGate({id,title,html,before,lock=[],flag,rules=[]}){if(document.querySelector(`[data-otto-gate="${id}"]`))return;const fix=fixState();if(flag&&fix[flag])return;const gate=document.createElement('div');gate.className='otto-reading-gate';gate.dataset.ottoGate=id;gate.setAttribute('data-no-word-tap','1');gate.innerHTML=`<div class="otto-gate-kicker">Новое маленькое правило</div><h3>${title}</h3>${html}<div class="otto-inline-actions"><button type="button" class="otto-strong" data-otto-unlock="${flag||id}" data-otto-rules="${rules.join(',')}">Понятно — продолжить</button></div>`;before?.before(gate);lock.forEach(el=>el?.classList.add('is-locked',el?.classList?.contains('btn')?'otto-gated-cta':'otto-gated-content'))}
  function unlockGate(button){const gate=button.closest('.otto-reading-gate');const flag=button.dataset.ottoUnlock;if(flag)setFix({[flag]:true});String(button.dataset.ottoRules||'').split(',').filter(Boolean).forEach(markRuleSeen);const screen=gate?.closest('.screen');screen?.querySelectorAll('.otto-gated-content,.otto-gated-cta').forEach(el=>el.classList.remove('is-locked','otto-gated-content','otto-gated-cta'));gate?.remove()}

  function enhanceLessonSequence(){const id=currentLesson(),step=currentStep(),screen=document.querySelector('#app .screen');if(!screen)return;
    if(id===1&&step===1){const learn=screen.querySelector('.learn-words'),cta=[...screen.querySelectorAll('.btn-primary')].at(-1);addGate({id:'lesson1-reading',flag:'lesson1ReadingReady',title:'Перед первыми словами — две короткие подсказки',before:learn,lock:[learn,cta],rules:['umlaut'],html:'<p><b>Danke:</b> конечное <b>-e</b> звучит слабо, но не исчезает.<br><b>Tschüss:</b> <b>tsch</b> звучит примерно как «ч», а <b>ü</b> — отдельный немецкий звук. Его лучше сначала услышать.</p><div class="otto-inline-actions"><button type="button" data-start-audio="Danke. Tschüss.">🔊 Послушать</button></div>'})}
    if(id===2&&step===1){const orb=screen.querySelector('.audio-orb'),cta=[...screen.querySelectorAll('.btn-primary')].at(-1);addGate({id:'lesson2-reading',flag:'lesson2ReadingReady',title:'Ja и Nein читаются не по-русски',before:orb,lock:[orb,cta],rules:['j','ei'],html:'<div class="otto-rule-pills"><span class="otto-rule-pill">j → «й»</span><span class="otto-rule-pill">ei → «ай»</span></div><p><b>ja</b> начинается со звука «й». В <b>nein</b> сочетание ei даёт «ай».</p><div class="otto-inline-actions"><button type="button" data-start-audio="Ja. Nein.">🔊 Послушать</button></div>'})}
    if(id===3&&step===2&&!screen.dataset.ottoL3){screen.dataset.ottoL3='1';const card=screen.querySelector('.exercise-card');const audio=card?.querySelector('[data-speak]');const h=card?.querySelector('h2');if(audio)audio.dataset.speak='Schule';if(h)h.textContent='Где ты слышишь знакомый звук «ш»?';const opts=card?.querySelectorAll('.options button');if(opts?.[0])opts[0].textContent='В начале: «ш…»';if(opts?.[1])opts[1].textContent='Звука «ш» нет'}
    if(id===3&&step===3){screen.querySelectorAll('.learned-list span').forEach(el=>{if(/\bich\b/i.test(el.textContent||''))el.remove()});addTransfer(screen,'Schrank','шкаф','sch → «ш»')}
    if(id===4&&step===1&&!screen.querySelector('[data-otto-ie-card]')){const cards=screen.querySelectorAll('.rule-focus.mini');const first=cards[0];if(first){const div=document.createElement('div');div.className='rule-focus mini card';div.dataset.ottoIeCard='1';div.innerHTML='<div class="rule-symbol">ie</div><div><b>долгое «и»</b><p><mark>ie</mark>: Liebe · sieben · vier</p><button class="tiny-audio" type="button" data-start-audio="Liebe. sieben. vier.">🔊 Послушать</button></div>';first.after(div);markRuleSeen('ie')}const cta=[...screen.querySelectorAll('.btn-primary')].at(-1);if(cta)cta.textContent='Я различаю ei и ie →'}
    if(id===4&&step===2&&!screen.dataset.ottoL4){screen.dataset.ottoL4='1';const card=screen.querySelector('.exercise-card');const h=card?.querySelector('h2');if(h)h.textContent='Какой звук ты услышала?';const opts=card?.querySelectorAll('.options button');if(opts?.[0])opts[0].textContent='«ай» — это ei';if(opts?.[1])opts[1].textContent='долгое «и» — это ie';const eye=card?.querySelector('.eyebrow');if(eye)eye.textContent='Только слушай → не подсматривай слово';card?.classList.add('otto-listen-only')}
    if(id===4&&step===3)addTransfer(screen,'Reise','поездка','ei → «ай»');
    if(id===6&&step===0){const h=screen.querySelector('.lesson-intro h1');if(h)h.textContent='Как назвать своё имя';const p=screen.querySelector('.lesson-intro p');if(p)p.innerHTML='Сегодня ты научишься: <b>назвать своё имя по-немецки</b>.'}
    if(id===6&&step===1){const phrase=screen.querySelector('.phrase-focus'),why=screen.querySelector('.why-card'),cta=[...screen.querySelectorAll('.btn-primary')].at(-1);addGate({id:'heisse-reading',flag:'heisseReadingReady',title:'Сначала разберём слово heiße',before:phrase,lock:[phrase,why,cta],rules:['ch','ei','ss'],html:'<div class="otto-word-focus">h<mark>ei</mark>ße</div><div class="otto-rule-pills"><span class="otto-rule-pill">ich: ch → мягкий звук</span><span class="otto-rule-pill">ei → «ай»</span><span class="otto-rule-pill">ß → «с»</span><span class="otto-rule-pill">-e → слабый звук</span></div><p>Сначала услышь слово, затем повтори. Только потом появится вся фраза.</p><div class="otto-inline-actions"><button type="button" data-start-audio="heiße">🔊 heiße</button><button type="button" data-otto-pronounce="heiße">🎤 Повторить</button></div>'})}
    if(id===12&&step===0){const p=screen.querySelector('.lesson-intro p');if(p)p.innerHTML='Сегодня ты научишься: <b>читать слова, которые начинаются с sp и st</b>.'}
    if(id===12&&step===1&&!screen.dataset.ottoL12){screen.dataset.ottoL12='1';screen.querySelectorAll('.rule-focus.mini').forEach(card=>{if(card.querySelector('.rule-symbol')?.textContent?.trim()==='st'){const p=card.querySelector('p');if(p)p.innerHTML='<mark>St</mark>adt · <mark>st</mark>ehen'}});const cta=[...screen.querySelectorAll('.btn-primary')].at(-1);addGate({id:'strasse-reading',flag:'strasseReadingReady',title:'Теперь можно прочитать Straße',before:cta,lock:[],rules:['ss'],html:'<div class="otto-word-focus"><mark>St</mark>ra<mark>ß</mark>e</div><div class="otto-rule-pills"><span class="otto-rule-pill">st в начале → «шт»</span><span class="otto-rule-pill">ß → «с»</span><span class="otto-rule-pill">-e звучит слабо</span></div><div class="otto-inline-actions"><button type="button" data-start-audio="Straße">🔊 Послушать</button><button type="button" data-otto-pronounce="Straße">🎤 Повторить</button></div>'})}
  }
  function addTransfer(screen,word,ru,rule){if(screen.querySelector(`[data-transfer="${word}"]`))return;const cta=[...screen.querySelectorAll('.btn-primary')].at(-1);if(!cta)return;const box=document.createElement('div');box.className='otto-transfer-card';box.dataset.transfer=word;box.innerHTML=`<div class="otto-gate-kicker">Проверь навык, а не память</div><h3>${word}</h3><p>Это новое слово: «${ru}». Правило уже знакомо: <b>${rule}</b>. Попробуй прочитать сам, потом сравни с Отто.</p><div class="otto-inline-actions"><button type="button" data-otto-pronounce="${word}">🎤 Прочитать</button><button type="button" data-start-audio="${word}">🔊 Проверить себя</button></div>`;cta.before(box)}

  function wrapWords(){const root=document.querySelector('#app .screen');if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const p=node.parentElement;if(!p||p.closest('[data-no-word-tap],.otto-sheet,.otto-speech-speed,.word-actions,.otto-reading-gate,.otto-transfer-card')||p.matches('script,style,textarea,input'))return NodeFilter.FILTER_REJECT;const text=node.nodeValue||'';return DISPLAY_WORDS.some(w=>text.toLocaleLowerCase('de-DE').includes(w))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const text=node.nodeValue||'';const lower=text.toLocaleLowerCase('de-DE');let cursor=0;const frag=document.createDocumentFragment();while(cursor<text.length){let best=null;for(const key of DISPLAY_WORDS){const idx=lower.indexOf(key,cursor);if(idx<0)continue;const before=idx>0?lower[idx-1]:'';const after=idx+key.length<lower.length?lower[idx+key.length]:'';if(before&&/\p{L}/u.test(before))continue;if(after&&/\p{L}/u.test(after))continue;if(!best||idx<best.idx||(idx===best.idx&&key.length>best.key.length))best={idx,key}}if(!best){frag.append(text.slice(cursor));break}if(best.idx>cursor)frag.append(text.slice(cursor,best.idx));const span=document.createElement('span');span.className='otto-word-tap';span.dataset.ottoWord=text.slice(best.idx,best.idx+best.key.length);span.setAttribute('role','button');span.setAttribute('tabindex','0');span.title='Нажми: перевод, произношение и чтение';span.textContent=text.slice(best.idx,best.idx+best.key.length);frag.append(span);cursor=best.idx+best.key.length}node.parentNode?.replaceChild(frag,node)}}

  function enhance(){enhanceTopbar();enhanceMore();enhanceDictionary();dictionaryTip();enhanceSkills();enhanceLessonSequence();enhanceSpeed();wrapWords();prefetchVisible();syncSpeedControls()}
  let enhanceQueued=false;function queueEnhance(){if(enhanceQueued)return;enhanceQueued=true;queueMicrotask(()=>{enhanceQueued=false;enhance()})}
  const root=document.querySelector('#app');if(root)new MutationObserver(queueEnhance).observe(root,{childList:true,subtree:true});

  document.addEventListener('click',e=>{
    const word=e.target.closest?.('[data-otto-word]');if(word){e.preventDefault();e.stopImmediatePropagation();openWordSheet(word.dataset.ottoWord);return}
    const mode=e.target.closest?.('[data-otto-start-mode]');if(mode){e.preventDefault();e.stopImmediatePropagation();setSpeechMode(mode.dataset.ottoStartMode);return}
    const unlock=e.target.closest?.('[data-otto-unlock]');if(unlock){e.preventDefault();e.stopImmediatePropagation();unlockGate(unlock);return}
    const support=e.target.closest?.('[data-otto-support]');if(support){e.preventDefault();e.stopImmediatePropagation();openSupport();return}
    const share=e.target.closest?.('[data-otto-share]');if(share){e.preventDefault();e.stopImmediatePropagation();void shareOtto();return}
    const more=e.target.closest?.('[data-otto-word-more]');if(more){e.preventDefault();e.stopImmediatePropagation();openWordSheet(more.dataset.ottoWordMore);return}
    const tipOpen=e.target.closest?.('[data-dict-tip-open]');if(tipOpen){setFix({dictionaryIntroShown:true});return}
    const tipClose=e.target.closest?.('[data-dict-tip-close]');if(tipClose){e.preventDefault();e.stopImmediatePropagation();setFix({dictionaryIntroShown:true});tipClose.closest('.otto-dictionary-tip')?.remove();return}
    const mic=e.target.closest?.('[data-otto-pronounce],[data-pronounce],[data-mini-speak]');if(mic){if(mic.dataset.ottoVerified==='1'){delete mic.dataset.ottoVerified;return}e.preventDefault();e.stopImmediatePropagation();void startPronunciation(mic);return}
    const audio=e.target.closest?.('[data-start-audio],[data-speak],[data-letter]');if(audio){e.preventDefault();e.stopImmediatePropagation();const text=audio.dataset.startAudio||audio.dataset.speak||audio.dataset.letter;void playAudio(text,{mode:speechMode(),button:audio});return}
  },true);
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('[data-otto-word]')){e.preventDefault();openWordSheet(e.target.dataset.ottoWord)}});

  enhance();warmCommon();

  function escapeHtml(value=''){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function escapeAttr(value=''){return escapeHtml(value).replace(/'/g,'&#39;')}
})();
