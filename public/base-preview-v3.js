(() => {
'use strict';
const root=document.getElementById('app');if(!root)return;
const STORE='ottoStartBasePreviewV4',SESSION_KEY='ottoStartSessionV8';
const TODAY=()=>new Date().toISOString().slice(0,10),clone=x=>JSON.parse(JSON.stringify(x));
const DEFAULT={screen:'register',authMode:'register',authChannel:'email',authProviders:{email:false,phone:false},authMessage:'',user:null,onboardingStep:0,onboardingCompleted:false,onboardingManual:false,firstName:'',lastName:'',extraName:'',alphaStep:0,alphaControlIndex:0,alphaControlResults:[],readingRule:0,readingPhase:0,readingStarted:false,readingControlIndex:0,readingControlResults:[],readingControlItems:[],numberStep:0,numberControlIndex:0,numberControlResults:[],numberAssembly:[],completed:[],errors:[],retryCounts:{},learnedElements:[],tests:{},sessions:0,sessionDate:'',lastStudyDate:'',lastStudyTopic:'alphabet',reviewStep:0,reviewSkippedDate:'',activeErrorId:'',feedback:'',assembly:[]};
let state=loadLocal(),cloudTimer=null,toastTimer=null,booted=false;
function loadLocal(){try{return Object.assign(clone(DEFAULT),JSON.parse(localStorage.getItem(STORE)||'{}'))}catch{return clone(DEFAULT)}}
function token(){try{return localStorage.getItem(SESSION_KEY)||''}catch{return''}}
function isDeployPreviewHost(){return /^deploy-preview-\d+--otto-start\.netlify\.app$/i.test(String(location.hostname||''))}
function isPreviewTestUser(){return isDeployPreviewHost()&&state.user?.login==='preview-test-user'}
 function setToken(v){try{if(v)localStorage.setItem(SESSION_KEY,v);else localStorage.removeItem(SESSION_KEY)}catch{}}
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function norm(v){return String(v==null?'':v).trim().toLocaleLowerCase('de-DE').replace(/[.,!?]/g,'').replace(/\s+/g,' ')}
function saveLocal(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}} function save(){saveLocal();scheduleCloud()}
function scheduleCloud(){if(!token())return;clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>{void saveCloud()},350)}
function toast(message){document.querySelector('.bp-toast')?.remove();const el=document.createElement('div');el.className='bp-toast';el.textContent=message;document.body.appendChild(el);clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),3200)}
async function api(action,payload,authenticated){const headers={'Content-Type':'application/json'};if(authenticated&&token())headers.Authorization='Bearer '+token();const response=await fetch('/api/otto-start-auth',{method:'POST',headers,body:JSON.stringify(Object.assign({action},payload||{}))});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Сервис аккаунта недоступен.');return data}
function cloudPayload(){return {version:4,profile:{onboardingCompleted:Boolean(state.onboardingCompleted),onboardingCompletedAt:state.onboardingCompletedAt||'',firstName:state.firstName||'',lastName:state.lastName||''},state:Object.assign({},state,{user:null,screen:'home',authMessage:'',onboardingManual:false,feedback:'',assembly:[],numberAssembly:[]}),clientSavedAt:new Date().toISOString()}}
async function saveCloud(){if(!token())return false;try{await api('save-progress',{progress:cloudPayload()},true);return true}catch(error){console.warn('preview progress save',error);return false}}
async function loadCloud(){if(!token())return null;try{return (await api('load-progress',{},true)).progress||null}catch{return null}}
function mergeCloud(progress){if(!progress)return;const cloud=progress.state&&typeof progress.state==='object'?progress.state:{};state=Object.assign(clone(DEFAULT),cloud);const profile=progress.profile||{};state.onboardingCompleted=Boolean(profile.onboardingCompleted||state.onboardingCompleted);state.onboardingCompletedAt=profile.onboardingCompletedAt||state.onboardingCompletedAt||'';state.firstName=profile.firstName||state.firstName||'';state.lastName=profile.lastName||state.lastName||''}
async function boot(){if(booted)return;booted=true;if(!token()){try{const d=await api('status',{},false);state.authProviders=d.providers||state.authProviders}catch{}state.screen='register';saveLocal();render();return}try{const me=await api('me',{},true);const cloud=await loadCloud();mergeCloud(cloud);state.user=me.user||null;state.screen=shouldOfferReview()?'review':(state.onboardingCompleted?'home':'onboarding');saveLocal();render()}catch{setToken('');const providers=state.authProviders;state=clone(DEFAULT);state.authProviders=providers;state.screen='register';saveLocal();render()}}
function shouldOfferReview(){return Boolean(state.onboardingCompleted&&state.lastStudyDate&&state.lastStudyDate!==TODAY()&&state.reviewSkippedDate!==TODAY()&&(state.completed.length||activeErrors().length))}
function startSession(topic){if(state.sessionDate!==TODAY()){state.sessions=Number(state.sessions||0)+1;state.sessionDate=TODAY()}state.lastStudyDate=TODAY();if(topic)state.lastStudyTopic=topic;save()}
function learnElement(id){if(id&&!state.learnedElements.includes(id)){state.learnedElements.push(id);save()}} function completeTopic(id){if(!state.completed.includes(id))state.completed.push(id);state.lastStudyDate=TODAY();state.lastStudyTopic=id;save()}
function addError(id,item,topic,skill,detail,rule){let e=state.errors.find(x=>x.id===id);if(e){e.count=Number(e.count||1)+1;e.detail=detail;e.rule=rule||e.rule;e.resolved=false;e.resolvedAt='';e.lastErrorAt=new Date().toISOString()}else state.errors.push({id,item,topic,skill,detail,rule:rule||'',count:1,practiceCount:0,successes:0,resolved:false,lastErrorAt:new Date().toISOString(),resolvedAt:''});save()}
function lessonMistake(id,item,topic,skill,detail,rule){state.retryCounts=state.retryCounts||{};state.retryCounts[id]=Number(state.retryCounts[id]||0)+1;const repeated=state.retryCounts[id]>=2;if(repeated){addError(id,item,topic,skill,detail,rule);state.retryCounts[id]=0}else save();return repeated}
function clearMistake(id){if(state.retryCounts?.[id]){delete state.retryCounts[id];save()}}
function resolveError(id){const e=state.errors.find(x=>x.id===id);if(!e)return;e.practiceCount=Number(e.practiceCount||0)+1;e.successes=Number(e.successes||0)+1;e.resolved=true;e.resolvedAt=new Date().toISOString();save()}
function activeErrors(){return state.errors.filter(x=>!x.resolved)} function go(screen){state.screen=screen;state.feedback='';state.assembly=[];state.numberAssembly=[];save();render()}
function setFeedback(html){state.feedback=html;save()} function feedback(){return state.feedback?'<div class="bp-feedback '+(state.feedback.includes('Что произошло')?'bad':'good')+'">'+state.feedback+'</div>':''}
function speech(){return window.OttoSpeechV18||window.OttoSpeechV17||window.OttoSpeechV15||null}
function play(text,button,kind){const s=speech();if(s?.play)return s.play(text,{mode:'normal',kind:kind||'text',button});toast('Озвучка OTTO ещё загружается.')}
function pronounce(text){const s=speech();if(s?.check)return s.check(text,[text]);toast('Проверка произношения OTTO ещё загружается.')}
function spellValue(v){return String(v||'').toUpperCase().replace(/ß/g,'ẞ').split('').filter(x=>/[A-ZÄÖÜẞ]/.test(x))} function spellText(v){return spellValue(v).map(x=>x==='ẞ'?'ß':x).join(' ')}
function playLetters(value){const letters=spellValue(value),s=speech();if(!s?.play){toast('Озвучка OTTO ещё загружается.');return}(async()=>{for(const ch of letters){await s.play(ch,{mode:'slow',kind:'letter'});await new Promise(r=>setTimeout(r,180))}})()}
function spellingFailureDetail(value,statusText){const expected=spellValue(value).map(x=>x==='ẞ'?'SS':x),m=String(statusText||'').match(/Отто услышал:\s*([^\n]+)/i);if(!m)return 'Произношение по буквам пока не совпало с образцом.';const heard=String(m[1]||'').toUpperCase().replace(/[^A-ZÄÖÜẞ ]/g,' ').split(/\s+/).filter(Boolean);for(let i=0;i<expected.length;i++){if((heard[i]||'')!==expected[i])return 'Проверь букву '+expected[i]+' в позиции '+(i+1)+'. OTTO услышал её иначе.'}return 'Произношение по буквам пока не совпало с образцом.'}
function trackedSpeech(expected,meta,onDone){pronounce(expected);setTimeout(()=>{const modal=document.querySelector('[data-v17-speech-modal]');if(!modal)return;let last='',badCount=0,finished=false;const ob=new MutationObserver(()=>{const status=modal.querySelector('[data-check-status]');if(!status||finished)return;const txt=(status.textContent||'').trim();if(!txt||txt===last||/Запись готова/.test(txt))return;last=txt;const good=status.classList.contains('good')&&/Хорошо|✓/.test(txt),assessed=good||/Повторите|Почти/.test(txt);if(!assessed)return;if(good){finished=true;ob.disconnect();if(meta?.resolveOnSuccess&&meta?.errorId)resolveError(meta.errorId);modal.querySelector('[data-close]')?.click();onDone?.(true,txt)}else{badCount++;if(badCount===1&&meta?.spellingValue){const detail=spellingFailureDetail(meta.spellingValue,txt),m=detail.match(/букву ([A-ZÄÖÜẞ]+)/i),letter=m?.[1]||'';modal.querySelector('[data-spell-hint]')?.remove();const hint=document.createElement('div');hint.dataset.spellHint='1';hint.className='v12-note';hint.style.marginTop='10px';hint.innerHTML='<b>'+esc(detail)+'</b><div class="v12-modal-actions" style="margin-top:8px">'+(letter?'<button class="v12-btn secondary" type="button" data-letter>🔊 Послушать '+esc(letter)+'</button>':'')+'<button class="v12-btn secondary" type="button" data-whole>🔊 Послушать ещё раз</button></div>';status.parentElement?.appendChild(hint);hint.querySelector('[data-letter]')?.addEventListener('click',e=>play(letter==='ẞ'?'ß':letter,e.currentTarget,'letter'));hint.querySelector('[data-whole]')?.addEventListener('click',()=>playLetters(meta.spellingValue))}if(badCount>=2){finished=true;ob.disconnect();if(meta?.errorId){const detail=meta.spellingValue?spellingFailureDetail(meta.spellingValue,txt):(meta.detail||txt);addError(meta.errorId,meta.item||expected,meta.topic||'',meta.skill||'произношение',detail,meta.rule||'')};modal.querySelector('[data-close]')?.click();onDone?.(false,txt)}}});ob.observe(modal,{subtree:true,childList:true,attributes:true})},80)}
function top(){return '<header class="bp-top"><div class="bp-brand"><img src="/otto/otto-home.webp" alt="OTTO"><div><b>Otto Start</b><small>Базовый немецкий</small></div></div><button class="bp-icon" type="button" onclick="BP.settings()" aria-label="Настройки">⚙</button></header>'}
function nav(active){const items=[['home','⌂','Главная'],['learn','▦','Учусь'],['errors','⚠','Мои ошибки'],['settings','⚙','Настройки']];return '<nav class="bp-bottom">'+items.map(x=>'<button type="button" class="'+(active===x[0]?'active':'')+'" onclick="BP.nav(\''+x[0]+'\')"><span>'+x[1]+'</span>'+x[2]+'</button>').join('')+'</nav>'}
function app(body,active,wide){root.innerHTML='<div class="bp-app">'+top()+'<main class="bp-main"><div class="bp-shell '+(wide?'wide':'')+'">'+body+'</div></main>'+nav(active||'learn')+'</div>';scrollTo(0,0)}
function bare(body){root.innerHTML='<div class="bp-app"><main class="bp-main"><div class="bp-onboard"><section class="bp-onboard-card">'+body+'</section></div></main></div>';scrollTo(0,0)}
function screenHead(title,sub,back){return '<div class="bp-screen-head"><button class="bp-back" onclick="'+(back||'BP.learn()')+'">←</button><div class="text"><b>'+esc(title)+'</b><small>'+esc(sub||'')+'</small></div></div>'}
function lessonProgress(label,step,total){return '<div class="bp-step-label"><span>'+esc(label)+'</span><span>'+(step+1)+' / '+total+'</span></div><div class="bp-progress"><i style="width:'+Math.round((step+1)/Math.max(1,total)*100)+'%"></i></div>'}
function lessonNav(prev,skip,sectionSkip){let x='<div class="bp-lesson-nav">';if(prev)x+='<button type="button" onclick="'+prev+'">← Назад</button>';if(skip)x+='<button type="button" onclick="'+skip+'">Пропустить задание</button>';x+='<button type="button" onclick="BP.learn()">Вернуться к темам</button>';if(sectionSkip)x+='<button type="button" onclick="'+sectionSkip+'">Пропустить тему</button>';return x+'</div>'}
function choice(opts,correct,handler){return '<div class="bp-options">'+opts.map((o,i)=>'<button class="bp-option" onclick="'+(handler||'BP.simpleChoice')+'('+(i===correct)+',this)">'+esc(o)+'</button>').join('')+'</div>'}
function titleCard(kicker,title,lead){return '<div class="bp-card"><div class="bp-kicker">'+esc(kicker)+'</div><h2 class="bp-title">'+esc(title)+'</h2>'+(lead?'<p class="bp-lead">'+esc(lead)+'</p>':'')}


const ALPHABET=[['A','а'],['B','бэ'],['C','цэ'],['D','дэ'],['E','э'],['F','эф'],['G','гэ'],['H','ха'],['I','и'],['J','йот'],['K','ка'],['L','эль'],['M','эм'],['N','эн'],['O','о'],['P','пэ'],['Q','ку'],['R','эр'],['S','эс'],['T','тэ'],['U','у'],['V','фау'],['W','вэ'],['X','икс'],['Y','юпсилон'],['Z','цэт'],['Ä','э'],['Ö','ё'],['Ü','ю'],['ß','эс-цэт']];
const TRICKY=['J','V','W','Y','Z','Ä','Ö','Ü','ß'];
const READING_RULES=(window.OttoReadingRulesV15||[]).map(r=>({key:r.id,label:r.pattern,sound:r.answer,text:r.text,examples:[...(r.examples||[])]}));
const EXTRA_READING_RULES=(window.OttoReadingExtraRulesV16||[]).map((r,i)=>({key:'extra-'+i,label:r[0],sound:r[1],text:r[2],examples:[...(r[3]||[])]}));
function coreWord(de){return String(de||'').replace(/^(der|die|das)\s+/i,'').trim()}
function a1Words(){
  const rows=window.OttoCourseDataV8?.allWords?.()||[];
  const seen=new Set(),out=[];
  for(const row of rows){
    const word=coreWord(row?.de);
    if(!word||word.length<2||word.length>28||/[\/();:]/.test(word)||word.split(/\s+/).length>1)continue;
    const k=word.toLocaleLowerCase('de-DE');
    if(seen.has(k))continue;seen.add(k);out.push({word,ru:String(row?.ru||'').trim()||'слово A1'})
  }
  return out
}
function ruleMatches(rule,word){
  const w=String(word||'').toLocaleLowerCase('de-DE');
  if(rule.key==='j')return /j/.test(w);
  if(rule.key==='ei')return /ei/.test(w);
  if(rule.key==='ie')return /ie/.test(w);
  if(rule.key==='sch')return /sch/.test(w);
  if(rule.key==='ichch')return /(i|e)ch/.test(w)||/^(ich|mich|nicht)$/.test(w);
  if(rule.key==='achch')return /(a|o|u|au)ch/.test(w);
  if(rule.key==='z')return /z/.test(w);
  if(rule.key==='w')return /w/.test(w);
  if(rule.key==='v')return /v/.test(w);
  if(rule.key==='sp')return /^sp/.test(w);
  if(rule.key==='st')return /^st/.test(w);
  if(rule.key==='eu')return /(eu|äu)/.test(w);
  if(rule.key==='ss')return /ß/.test(w);
  if(rule.key==='umlaut')return /[äöü]/.test(w);
  if(rule.key==='ending')return /(e|er)$/.test(w);
  return false
}
function ruleBank(rule){
  const all=a1Words(),by=new Map(all.map(x=>[x.word.toLocaleLowerCase('de-DE'),x]));
  const out=[],seen=new Set();
  const add=x=>{if(!x)return;const k=x.word.toLocaleLowerCase('de-DE');if(seen.has(k))return;seen.add(k);out.push(x)};
  for(const ex of rule.examples||[])add(by.get(coreWord(ex).toLocaleLowerCase('de-DE')));
  for(const row of all)if(ruleMatches(rule,row.word))add(row);
  return out.slice(0,18)
}
function ruleWord(rule,index){const bank=ruleBank(rule);return bank.length?bank[Math.min(index,bank.length-1)]:{word:(rule.examples?.[0]||rule.label),ru:'слово A1'}}
function ruleNeedle(rule,word){
  const w=String(word||'');
  if(rule.key==='ichch'||rule.key==='achch')return 'ch';
  if(rule.key==='eu')return /äu/i.test(w)?'äu':'eu';
  if(rule.key==='ss')return 'ß';
  if(rule.key==='umlaut'){const m=w.match(/[äöü]/i);return m?.[0]||'ü'}
  if(rule.key==='ending')return /er$/i.test(w)?'er':'e';
  if(rule.key==='sp')return 'sp';
  if(rule.key==='st')return 'st';
  return rule.label
}
function maskRuleWord(word,rule){const needle=ruleNeedle(rule,word),i=String(word).toLocaleLowerCase('de-DE').indexOf(String(needle).toLocaleLowerCase('de-DE'));return i<0?word:String(word).slice(0,i)+'__'+String(word).slice(i+needle.length)}
function distractorWords(rule,count=2){
  const all=a1Words().filter(x=>!ruleMatches(rule,x.word));
  return all.slice(0,count)
}
function buildReadingControl(){
  const practiced=[],fresh=[],seen=new Set();
  const add=(bucket,row,rule,familiar)=>{if(!row)return;const k=row.word.toLocaleLowerCase('de-DE');if(seen.has(k))return;seen.add(k);bucket.push({word:row.word,ru:row.ru,rule:rule.key,familiar})};
  for(const rule of READING_RULES){const bank=ruleBank(rule);bank.slice(0,6).forEach(x=>add(practiced,x,rule,true))}
  for(const rule of READING_RULES){const bank=ruleBank(rule);bank.slice(6).forEach(x=>add(fresh,x,rule,false))}
  if(fresh.length<10){
    for(const row of a1Words()){
      const rule=READING_RULES.find(r=>ruleMatches(r,row.word));
      if(rule)add(fresh,row,rule,false);
      if(fresh.length>=10)break
    }
  }
  return [...practiced.slice(0,20),...fresh.slice(0,10)].slice(0,30)
}

const ONES=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'],TENS=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
function numberWord(n){n=Number(n);if(!Number.isInteger(n)||n<0||n>9999)return'';const u100=x=>x<20?ONES[x]:(x%10?(x%10===1?'ein':ONES[x%10])+'und'+TENS[Math.floor(x/10)]:TENS[Math.floor(x/10)]);const u1000=x=>x<100?u100(x):(Math.floor(x/100)===1?'einhundert':ONES[Math.floor(x/100)]+'hundert')+(x%100?u100(x%100):'');if(n<1000)return u1000(n);return (Math.floor(n/1000)===1?'eintausend':u1000(Math.floor(n/1000))+'tausend')+(n%1000?u1000(n%1000):'')}
const NUMBER_CONTROL=[{type:'choice',spoken:'sieben',opts:['7','17','70'],ok:0,target:'7'},{type:'write',spoken:'vierzehn',target:'14'},{type:'speak',target:'9',expected:'neun'},{type:'choice',spoken:'siebzehn',opts:['17','70','77'],ok:0,target:'17'},{type:'speak',target:'20',expected:'zwanzig'},{type:'write',spoken:'dreißig',target:'30'},{type:'speak',target:'47',expected:'siebenundvierzig'},{type:'write',spoken:'achtundfünfzig',target:'58'},{type:'choice',spoken:'neunundsechzig',opts:['69','96','66'],ok:0,target:'69'},{type:'speak',target:'74',expected:'vierundsiebzig'},{type:'write',spoken:'sechsundachtzig',target:'86'},{type:'speak',target:'99',expected:'neunundneunzig'},{type:'write',spoken:'einhundertsiebenundzwanzig',target:'127'},{type:'speak',label:'Возраст',target:'34',expected:'vierunddreißig'},{type:'speak',label:'Номер дома',target:'12',expected:'zwölf'},{type:'write',label:'Почтовый индекс',spoken:'eins null eins eins fünf',target:'10115'},{type:'write',label:'Телефон',spoken:'null eins sieben sechs drei vier fünf',target:'0176345'},{type:'choice',label:'Время',spoken:'achtzehn',opts:['18:00','8:00','80:00'],ok:0,target:'18:00'}];
function routePct(){let sum=0;const a=state.completed.includes('alphabet')?1:Math.min(1,(Number(state.alphaStep||0)+Number(state.alphaControlIndex||0)/8)/12),r=state.completed.includes('reading')?1:Math.min(1,(Math.max(0,Number(state.readingRule||0))*10+Number(state.readingPhase||0)+Number(state.readingControlIndex||0)/30)/(READING_RULES.length*10+1)),n=state.completed.includes('numbers')?1:Math.min(1,(Number(state.numberStep||0)+Number(state.numberControlIndex||0)/18)/16);sum=a+r+n;return Math.round(sum/14*100)}
function currentTopic(){if(!state.completed.includes('alphabet'))return 'Алфавит и произношение по буквам';if(!state.completed.includes('reading'))return 'Как читать немецкие слова';if(!state.completed.includes('numbers'))return 'Числа';return 'Существительные'}
function continueAction(){if(!state.completed.includes('alphabet'))return 'BP.alphabet()';if(!state.completed.includes('reading'))return 'BP.reading()';if(!state.completed.includes('numbers'))return 'BP.numbers()';return 'BP.learn()'}
function stats(){return {pct:routePct(),current:currentTopic(),sessions:Number(state.sessions||0),learned:state.learnedElements.length,errors:activeErrors().length,done:state.completed.length}}


function registerScreen(){
  const login=state.authMode==='login',channel=state.authChannel==='phone'?'phone':'email',providers=state.authProviders||{},available=Boolean(providers[channel]);
  const message=state.authMessage?'<div class="bp-feedback bad" style="margin-top:10px">'+esc(state.authMessage)+'</div>':'';
  let form='';
  if(login){
    form='<label class="bp-kicker">Телефон или email</label><input id="authLogin" class="bp-input" autocomplete="username" placeholder="Email или +49123456789" style="margin-top:7px">'+
      '<label class="bp-kicker" style="display:block;margin-top:10px">Пароль</label><input id="authPassword" class="bp-input" type="password" autocomplete="current-password" placeholder="Пароль" style="margin-top:7px">'+
      '<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.login()">Войти</button>';
  }else{
    form='<label class="bp-kicker">Как к вам обращаться</label><input id="authName" class="bp-input" autocomplete="name" placeholder="Имя" style="margin-top:7px">'+
      '<div class="bp-row" style="margin-top:12px"><button class="bp-btn '+(channel==='email'?'primary':'secondary')+'" type="button" onclick="BP.setAuthChannel(\'email\')">Email</button><button class="bp-btn '+(channel==='phone'?'primary':'secondary')+'" type="button" onclick="BP.setAuthChannel(\'phone\')">Телефон</button></div>'+
      '<label class="bp-kicker" style="display:block;margin-top:10px">'+(channel==='email'?'Email':'Телефон')+'</label><input id="authLogin" class="bp-input" type="'+(channel==='email'?'email':'tel')+'" autocomplete="'+(channel==='email'?'email':'tel')+'" placeholder="'+(channel==='email'?'name@example.com':'+49123456789')+'" style="margin-top:7px">'+
      '<button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.requestCode()" '+(available?'':'disabled')+'>Получить код подтверждения</button>'+
      '<div class="bp-note '+(available?'good':'warn')+'" style="margin-top:8px">'+(available?'Коды подтверждения для '+(channel==='email'?'email':'телефона')+' подключены.':'Для этого способа регистрации отправка кодов сейчас недоступна.')+'</div>'+
      '<label class="bp-kicker" style="display:block;margin-top:10px">Код</label><input id="authCode" class="bp-input" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 цифр" style="margin-top:7px">'+
      '<label class="bp-kicker" style="display:block;margin-top:10px">Пароль</label><input id="authPassword" class="bp-input" type="password" minlength="8" autocomplete="new-password" placeholder="Минимум 8 символов" style="margin-top:7px">'+
      '<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.register()">Создать аккаунт</button>';
  }
  const previewAccess=isDeployPreviewHost()?'<div class="bp-preview-access"><div class="bp-divider"><span>Deploy Preview</span></div><button class="bp-btn preview block" type="button" onclick="BP.previewLogin()">🧪 Войти в тестовый аккаунт</button><small>Только для Deploy Preview</small></div>':'';
  bare('<div class="bp-onboard-hero"><div class="copy"><span class="bp-badge">OTTO START</span><h1 class="bp-title">'+(login?'С возвращением':'Немецкий с самого начала')+'</h1><p class="bp-lead">'+(login?'Войдите, и OTTO восстановит прогресс из профиля.':'Код подтверждения придёт по выбранному способу. После первого входа инструкция сохранится в вашем профиле.')+'</p></div><img src="/otto/otto-guide.webp" alt="OTTO"></div><div class="bp-onboard-body"><div class="bp-card">'+form+message+'<button class="bp-btn secondary block" style="margin-top:10px" onclick="BP.toggleAuth()">'+(login?'Впервые здесь? Создать аккаунт':'Уже есть аккаунт? Войти')+'</button>'+previewAccess+'</div></div>')
}
async function doRequestCode(){
  const channel=state.authChannel==='phone'?'phone':'email',login=document.getElementById('authLogin')?.value.trim()||'';
  state.authMessage='';
  try{const d=await api('request-code',{channel,login,purpose:'register'},false);state.authMessage=d.message||'Код отправлен.';saveLocal();render()}
  catch(error){state.authMessage=error.message;render()}
}
async function doRegister(){
  const channel=state.authChannel==='phone'?'phone':'email',name=document.getElementById('authName')?.value.trim()||'',login=document.getElementById('authLogin')?.value.trim()||'',code=document.getElementById('authCode')?.value.trim()||'',password=document.getElementById('authPassword')?.value||'';
  state.authMessage='';
  try{
    const d=await api('register',{channel,name,login,code,password},false);
    const providers=state.authProviders;setToken(d.session?.token||'');state=clone(DEFAULT);state.authProviders=providers;state.user=d.user||null;state.screen='onboarding';state.onboardingStep=0;saveLocal();await saveCloud();render()
  }catch(error){state.authMessage=error.message;render()}
}
async function doLogin(){
  const login=document.getElementById('authLogin')?.value.trim()||'',password=document.getElementById('authPassword')?.value||'';
  state.authMessage='';
  try{
    const d=await api('login',{login,password},false),providers=state.authProviders;setToken(d.session?.token||'');
    const cloud=await loadCloud();state=clone(DEFAULT);state.authProviders=providers;mergeCloud(cloud);state.user=d.user||null;state.screen=shouldOfferReview()?'review':(state.onboardingCompleted?'home':'onboarding');saveLocal();render()
  }catch(error){state.authMessage=error.message;render()}
}

async function doPreviewLogin(){
  if(!isDeployPreviewHost()){state.authMessage='Тестовый вход доступен только в Deploy Preview.';return render()}
  state.authMessage='';
  try{
    const d=await api('preview-login',{},false),providers=state.authProviders;setToken(d.session?.token||'');
    const cloud=await loadCloud();state=clone(DEFAULT);state.authProviders=providers;mergeCloud(cloud);state.user=d.user||null;
    state.screen=shouldOfferReview()?'review':(state.onboardingCompleted?'home':'onboarding');saveLocal();render()
  }catch(error){state.authMessage=error.message;render()}
}
async function resetPreviewProfile(){
  if(!isPreviewTestUser())return toast('Сброс доступен только тестовому аккаунту Deploy Preview.');
  try{
    await api('preview-reset',{},true);
    const providers=state.authProviders,user=state.user;
    state=clone(DEFAULT);state.authProviders=providers;state.user=user;state.screen='settings';state.onboardingCompleted=false;saveLocal();
    await saveCloud();toast('Тестовый прогресс сброшен. После следующего входа инструкция появится снова.');render()
  }catch(error){toast(error.message||'Не удалось сбросить тестовый профиль.')}
}

const ROADMAP_SHORT=['Алфавит и чтение','Числа','Слова и грамматика','Немецкие предложения','Итоговая проверка','Подготовка к A1'];
function tutorialScreen(){const s=Number(state.onboardingStep||0),back=s>0?'<button class="bp-btn secondary" onclick="BP.tutorialBack()">← Назад</button>':'<span></span>',skip='<button class="bp-btn secondary" onclick="BP.skipTutorial()">Пропустить инструкцию</button>';let body='';if(s===0)body='<h2 class="bp-title">Привет! Я OTTO 👋</h2><p class="bp-lead">Здесь мы соберём базу немецкого, которая понадобится тебе для подготовки к A1.</p><p class="bp-lead">Ты сам решаешь, с какой темы начать. Если базы пока почти нет, я рекомендую идти с самого начала и по порядку.</p><div class="bp-mini-list">'+ROADMAP_SHORT.map((x,i)=>'<div class="bp-mini"><span class="n">'+(i+1)+'</span><div><b>'+esc(x)+'</b></div></div>').join('')+'</div>';if(s===1){const cards=[['🔤','Алфавит','буквы, имя, фамилия, слова по буквам'],['📖','Чтение','основные правила и первые самостоятельные слова'],['🔢','Числа','услышать, понять, написать, произнести'],['📚','Слова','существительные, местоимения, глаголы'],['🧩','Конструкции','утверждения, вопросы и ответы']];body='<h2 class="bp-title">Чему научимся</h2><div class="bp-grid2">'+cards.map(x=>'<div class="bp-card"><div class="bp-kicker">'+x[0]+' '+x[1]+'</div><p class="bp-lead">'+x[2]+'</p></div>').join('')+'</div>'}if(s===2){const cards=[['🔊','Слушаю'],['👀','Читаю'],['✍️','Пишу'],['🎤','Говорю'],['🧩','Собираю'],['🔁','Вспоминаю']];body='<h2 class="bp-title">Как проходят занятия</h2><p class="bp-lead">Я буду проверять ответы, написание и произношение. Если ошибёшься — объясню, что именно не получилось, и позже верну это место в другом задании.</p><div class="bp-grid2">'+cards.map(x=>'<div class="bp-card"><b>'+x[0]+' '+x[1]+'</b></div>').join('')+'</div><div class="bp-note warn" style="margin-top:10px"><b>Мои ошибки</b><br>3 элемента на повторение</div>'}if(s===3)body='<h2 class="bp-title">Ты можешь выбирать свой путь</h2><p class="bp-lead">Если раньше учил немецкий или часть тем уже знаешь — открой нужную тему самостоятельно.</p><div class="bp-card"><b>На каждом задании доступны:</b><div class="bp-mini-list"><div class="bp-mini"><span>→</span><div>Пропустить задание</div></div><div class="bp-mini"><span>→</span><div>Вернуться к темам</div></div><div class="bp-mini"><span>→</span><div>Пропустить тему</div></div></div></div><p class="bp-lead">Если база неуверенная, я рекомендую идти по порядку. Жёстких блокировок нет.</p>';if(s===4)body='<h2 class="bp-title">Как OTTO проверяет прогресс</h2><p class="bp-lead">В конце каждой темы будет небольшая проверка. Ошибки попадут в «Мои ошибки» и смогут быть отработаны отдельно.</p><div class="bp-mini-list"><div class="bp-mini"><span class="n">1</span><div><b>Сегодня</b><small>изучили</small></div></div><div class="bp-mini"><span class="n">2</span><div><b>В следующий раз</b><small>вспомнили</small></div></div><div class="bp-mini"><span class="n">3</span><div><b>Дальше</b><small>новый материал</small></div></div></div><p class="bp-lead">Когда вернёшься, я сначала предложу несколько коротких заданий на то, что ты учил раньше. Повторение можно пропустить.</p><div class="bp-grid2" style="margin-top:12px"><button class="bp-level" onclick="BP.finishTutorial(\'start\')"><span class="ico">🌱</span><b>Начать с самого начала</b><span class="cta">Продолжить →</span></button><button class="bp-level" onclick="BP.finishTutorial(\'choose\')"><span class="ico">▦</span><b>Выбрать тему самому</b><span class="cta">Открыть темы →</span></button></div>';bare('<div class="bp-tutorial-head"><img src="/otto/otto-guide.webp" alt="OTTO"><div><span class="bp-badge">Как заниматься</span><small>Экран '+(s+1)+' из 5</small></div></div><div class="bp-progress" style="margin:10px 0 14px"><i style="width:'+((s+1)*20)+'%"></i></div><div class="bp-onboard-body">'+body+(s<4?'<div class="bp-row" style="margin-top:16px">'+back+'<button class="bp-btn primary" onclick="BP.tutorialNext()">Дальше</button></div><div style="margin-top:8px">'+skip+'</div>':'')+'</div>')}
async function markOnboardingCompleted(target){if(!state.onboardingManual){state.onboardingCompleted=true;state.onboardingCompletedAt=state.onboardingCompletedAt||new Date().toISOString();saveLocal();await saveCloud()}const manual=state.onboardingManual;state.onboardingManual=false;if(manual&&target==='settings')go('settings');else if(target==='choose')go('learn');else go('home')}
function skipTutorial(){void markOnboardingCompleted(state.onboardingManual?'settings':'home')}


const ROUTE=[['alphabet','🔤','Алфавит и произношение по буквам','Открыть','BP.alphabet()',true],['reading','📖','Как читать немецкие слова','Открыть','BP.reading()',true],['numbers','🔢','Числа','Открыть','BP.numbers()',true],['nouns','🏠','Существительные','Маршрут','',false],['pronouns','👤','Личные местоимения','Маршрут','',false],['verbs','⚡','Основные глаголы','Маршрут','',false],['sentence','🧩','Первые конструкции предложения','Маршрут','',false],['prepositions','📍','Предлоги','Маршрут','',false],['questionWords','❓','Вопросительные слова','Маршрут','',false],['questions','？','Вопросительные предложения','Маршрут','',false],['conjunctions','🔗','Союзы','Маршрут','',false],['pronouns2','👥','Расширенные местоимения','Маршрут','',false],['mixed','🔁','Смешанная базовая практика','Маршрут','',false],['final','✓','Итоговая проверка базы','Маршрут','',false],['a1','🎯','Подготовка к A1','Следующий этап','',false]];
function routeList(){return '<div class="bp-path">'+ROUTE.map((r,i)=>{const done=state.completed.includes(r[0]);return '<button class="bp-path-item '+(!r[5]?'soon':'')+'" '+(r[5]?'onclick="'+r[4]+'"':'onclick="BP.routeInfo('+i+')"')+'><span class="ico">'+r[1]+'</span><span><b>'+(i+1)+'. '+r[2]+'</b><small>'+(done?'Тема завершена':'')+'</small></span><span class="state">'+(done?'✓':r[3])+'</span></button>'}).join('')+'</div>'}
function homeScreen(){const st=stats(),review=activeErrors().length?'<div class="bp-note warn" style="margin-top:10px"><b>Нужно повторить:</b> '+activeErrors().length+' элемент(а).</div>':'';const body='<section class="bp-hero"><div><div class="bp-kicker">OTTO START</div><h1>Базовый немецкий</h1><p>Продолжаем с того места, где вы остановились.</p></div><img src="/otto/otto-home.webp" alt="OTTO"></section><div class="bp-home-layout" style="margin-top:16px"><section class="bp-section"><div class="bp-card bp-progress-card"><h3>Ваш прогресс</h3><div class="bp-progress-value">'+st.pct+'%</div><div class="bp-progress"><i style="width:'+st.pct+'%"></i></div><p><b>Сейчас:</b> '+esc(st.current)+'</p><div class="bp-progress-mini"><span>Занятий: '+st.sessions+'</span><span>Изучено: '+st.learned+'</span><span>На повторение: '+st.errors+'</span></div>'+review+'<button class="bp-btn primary block" style="margin-top:12px" onclick="'+continueAction()+'">Продолжить занятие</button><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.openTutorial()">Как здесь всё устроено?</button></div><div class="bp-section-head"><h2>Маршрут обучения</h2></div>'+routeList()+'</section><section class="bp-section"><div class="bp-card"><h3>⚠ Мои ошибки</h3><p>'+activeErrors().length+' элементов ждут повторения.</p><button class="bp-btn secondary block" style="margin-top:12px" onclick="BP.errors()">Открыть</button></div><div class="bp-card"><h3>🎯 Подготовка к A1</h3><p>Следующий этап после базового курса. Жёсткой блокировки не будет.</p></div></section></div>';app(body,'home',true)}
function learnScreen(){app(screenHead('Учусь','Выберите тему','BP.home()')+'<div class="bp-section-head"><h2>Темы</h2></div>'+routeList(),'learn',true)}
function routeInfo(i){const r=ROUTE[i];if(!r)return;root.insertAdjacentHTML('beforeend','<div class="bp-modal-backdrop"><div class="bp-modal"><span class="bp-badge">Маршрут</span><h3 style="margin-top:12px">'+esc(r[2])+'</h3><p class="bp-lead">Эта тема откроется позже. Сейчас можно пройти доступные первые темы, а прогресс сохранится.</p><button class="bp-btn primary block" onclick="this.closest(\'.bp-modal-backdrop\').remove()">Понятно</button></div></div>')}
function testName(k){return k==='alphabet'?'Алфавит':k==='reading'?'Чтение':k==='numbers'?'Числа':k}
function progressDetails(){const st=stats(),tests=Object.entries(state.tests||{});return '<div class="bp-card"><h3>Мой прогресс</h3><div class="bp-progress-value">'+st.pct+'%</div><div class="bp-progress"><i style="width:'+st.pct+'%"></i></div><div class="bp-progress-grid"><div><b>'+esc(st.current)+'</b><small>текущая тема</small></div><div><b>'+state.completed.length+'</b><small>завершено тем</small></div><div><b>'+st.sessions+'</b><small>занятий</small></div><div><b>'+st.learned+'</b><small>изучено элементов</small></div><div><b>'+st.errors+'</b><small>ошибок</small></div><div><b>'+(state.completed.length>=14?'готов':'в процессе')+'</b><small>итоговая проверка</small></div></div></div><div class="bp-card"><h3>Контрольные</h3>'+(tests.length?tests.map(x=>'<div class="bp-settings-row"><div><b>'+esc(testName(x[0]))+'</b><small>'+x[1].score+' из '+x[1].total+'</small></div><span class="bp-badge">'+Math.round(x[1].score/Math.max(1,x[1].total)*100)+'%</span></div>').join(''):'<p class="bp-lead">Пока нет результатов.</p>')+'</div>'}
function settingsScreen(){const reset=isPreviewTestUser()?'<div class="bp-settings-row preview-only"><div><b>🧪 Сбросить тестовый прогресс</b><small>Только Deploy Preview · очистит прогресс, ошибки и onboarding</small></div><button class="bp-btn danger-soft small" onclick="BP.resetPreviewProfile()">Сбросить</button></div>':'';app(screenHead('Настройки','Профиль и обучение','BP.home()')+progressDetails()+'<div class="bp-card"><div class="bp-settings-row"><div><b>📖 Как заниматься в OTTO Start</b><small>Посмотреть инструкцию ещё раз</small></div><button class="bp-btn secondary small" onclick="BP.openTutorial()">Открыть</button></div><div class="bp-settings-row"><div><b>Выбрать тему</b><small>Прогресс не сбрасывается</small></div><button class="bp-btn secondary small" onclick="BP.learn()">Темы</button></div>'+reset+'<div class="bp-settings-row"><div><b>Профиль</b><small>'+esc(state.user?.login||'')+'</small></div><button class="bp-btn danger-soft small" onclick="BP.logout()">Выйти</button></div></div>','settings')}
function topicTitle(t){return t==='alphabet'?'Алфавит':t==='reading'?'Правила чтения':t==='numbers'?'Числа':'Базовый немецкий'}
function errorScreen(){const active=activeErrors(),resolved=state.errors.filter(x=>x.resolved);let body=screenHead('Мои ошибки','Слабые места возвращаются в других заданиях','BP.home()');if(!state.errors.length)body+='<div class="bp-card"><h2 class="bp-title">Пока пусто 🎉</h2><p class="bp-lead">Ошибки из занятий и контрольных появятся здесь.</p></div>';if(active.length){body+='<div class="bp-card"><h3>Нужно повторить · '+active.length+'</h3><button class="bp-btn primary block" onclick="BP.trainErrors()">Потренировать мои ошибки</button></div>';body+=active.map(e=>'<div class="bp-card"><div class="bp-kicker">'+esc(topicTitle(e.topic))+'</div><h3>'+esc(e.item)+'</h3><p class="bp-lead">'+esc(e.detail||'')+'</p><div class="bp-progress-mini"><span>Ошибок: '+e.count+'</span><span>Навык: '+esc(e.skill||'')+'</span></div><button class="bp-btn secondary block" style="margin-top:10px" onclick="BP.trainError(\''+esc(e.id)+'\')">Потренировать</button></div>').join('')}if(resolved.length)body+='<div class="bp-section-head"><h2>Уже отработано</h2></div>'+resolved.map(e=>'<div class="bp-card"><div class="bp-kicker">✓ Успешно выполнено позже</div><b>'+esc(e.item)+'</b><p class="bp-lead">'+esc(topicTitle(e.topic))+'</p></div>').join('');app(body,'errors')}


function nameValue(v){return String(v||'').trim().slice(0,40)}
function hasCyrillic(v){return /[А-Яа-яЁё]/.test(String(v||''))}
function suggestLatinName(v){
  const raw=nameValue(v);if(!raw)return '';if(!hasCyrillic(raw))return raw;
  const common={'юлия':'Julia'},low=raw.toLocaleLowerCase('ru-RU');if(common[low])return common[low];
  const map={'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Shch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya'};
  return [...raw].map(ch=>{const up=ch.toLocaleUpperCase('ru-RU'),out=map[up];if(out==null)return ch;return ch===up?out:(out?out[0].toLocaleLowerCase('en-US')+out.slice(1):'')}).join('')
}
function letterButtons(v){return '<div class="bp-tokens">'+spellValue(v).map(ch=>'<button class="bp-token" onclick="BP.play(\''+(ch==='ẞ'?'ß':ch)+'\',this,\'letter\')">'+ch+'</button>').join('')+'</div>'}
function alphabetReferenceButton(){return '<button type="button" onclick="BP.openAlphabet()">🔤 Алфавит</button>'}
function alphaLessonNav(prev,skip,sectionSkip){let x='<div class="bp-lesson-nav">';if(prev)x+='<button type="button" onclick="'+prev+'">← Назад</button>';if(skip)x+='<button type="button" onclick="'+skip+'">Пропустить задание</button>';x+=alphabetReferenceButton();x+='<button type="button" onclick="BP.learn()">Вернуться к темам</button>';if(sectionSkip)x+='<button type="button" onclick="'+sectionSkip+'">Пропустить тему</button>';return x+'</div>'}
function openAlphabetReference(){
  document.querySelector('[data-alpha-reference]')?.remove();
  const wrap=document.createElement('div');wrap.className='v12-modal-backdrop';wrap.dataset.alphaReference='1';
  wrap.innerHTML='<section class="v12-modal" role="dialog" aria-modal="true"><div class="v12-modal-head"><b>🔤 Немецкий алфавит</b><button type="button" data-close>×</button></div><div class="v12-modal-body"><p class="v12-muted">Нажми на любую букву и послушай её немецкое название.</p><div class="bp-alphabet-map">'+ALPHABET.map(x=>'<button class="bp-token" type="button" data-alpha-letter="'+x[0]+'">'+x[0]+'</button>').join('')+'</div><button class="bp-btn secondary block" type="button" data-close style="margin-top:14px">← Вернуться к заданию</button></div></section>';
  wrap.querySelectorAll('[data-alpha-letter]').forEach(b=>b.addEventListener('click',()=>play(b.dataset.alphaLetter,b,'letter')));
  wrap.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>wrap.remove()));
  wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()});document.body.appendChild(wrap)
}
function alphaPracticeWords(){
  const bank=a1Words(),by=new Map(bank.map(x=>[x.word.toLocaleLowerCase('de-DE'),x]));
  return ['Berlin','Deutschland','Deutsch','Hotel'].map(word=>by.get(word.toLocaleLowerCase('de-DE'))||{word,ru:'слово A1'})
}
function alphabet(){startSession('alphabet');go('alphabet')}
function alphaScreen(){
  const s=Number(state.alphaStep||0),total=9;
  let body=screenHead('Алфавит · Buchstabieren','Тема 1','BP.learn()')+lessonProgress('Тема 1',s,total);
  if(s===0){
    body+=titleCard('Весь немецкий алфавит','A–Z · Ä Ö Ü ß','Это немецкий алфавит. Нажимай на буквы и послушай, как они называются. Запоминать всё сразу не нужно — сейчас мы потренируем это на настоящих словах.')+
      '<div class="bp-alphabet-map">'+ALPHABET.map(x=>'<button class="bp-token" onclick="BP.play(\''+x[0]+'\',this,\'letter\')" title="'+x[1]+'">'+x[0]+'</button>').join('')+'</div>'+
      '<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.alphaNext()">Начать практику →</button></div>';
  }
  if(s===1){
    body+=titleCard('Твоё имя','Давай начнём с твоего имени.','Имя не переводится: мы только предлагаем латинское написание, а затем учимся произносить его по буквам.')+
      '<label class="bp-kicker">Как тебя зовут?</label><input id="firstNameSource" class="bp-input" placeholder="Например: Юлия" oninput="BP.syncLatin(\'first\',this.value)" autocomplete="given-name">'+
      '<label class="bp-kicker" style="display:block;margin-top:10px">Латиницей:</label><input id="firstNameLatin" class="bp-input" placeholder="Julia" value="'+esc(state.firstName)+'" autocomplete="given-name">'+
      '<div class="bp-note" style="margin-top:8px">Проверь написание. Если в твоих документах имя написано иначе — исправь его.</div>'+
      '<button class="bp-btn primary block" style="margin-top:10px" onclick="BP.saveFirstName()">Продолжить →</button>'+feedback()+'</div>';
  }
  if(s===2){const v=state.firstName||'Julia';body+=titleCard('Теперь произнесём имя по буквам',v,'Сначала послушай немецкие названия букв, затем повтори сам(а).')+'<div class="bp-word">'+esc(v)+'</div>'+letterButtons(v)+'<div class="bp-row" style="margin-top:10px"><button class="bp-btn secondary" onclick="BP.playLetters(\''+esc(v)+'\')">🔊 Послушать целиком</button><button class="bp-btn primary" onclick="BP.alphaSpeakName()">🎤 Произнести по буквам</button></div>'+feedback()+'</div>'}
  if(s===3){
    body+=titleCard('Теперь фамилия','Попробуем то же самое с фамилией.','Если пишешь кириллицей, OTTO предложит латинское написание. Его можно исправить по документам.')+
      '<label class="bp-kicker">Фамилия</label><input id="lastNameSource" class="bp-input" placeholder="Например: Петрова" oninput="BP.syncLatin(\'last\',this.value)" autocomplete="family-name">'+
      '<label class="bp-kicker" style="display:block;margin-top:10px">Латиницей:</label><input id="lastNameLatin" class="bp-input" placeholder="Petrova" value="'+esc(state.lastName)+'" autocomplete="family-name">'+
      '<div class="bp-note" style="margin-top:8px">Проверь написание и при необходимости исправь его.</div>'+
      '<button class="bp-btn primary block" style="margin-top:10px" onclick="BP.saveLastName()">Продолжить →</button>'+feedback()+'</div>';
  }
  if(s===4){const v=state.lastName||'Petrova';body+=titleCard('Произнеси фамилию по буквам',v,'Сначала послушай образец, затем повтори.')+'<div class="bp-word">'+esc(v)+'</div>'+letterButtons(v)+'<div class="bp-row" style="margin-top:10px"><button class="bp-btn secondary" onclick="BP.playLetters(\''+esc(v)+'\')">🔊 Послушать целиком</button><button class="bp-btn primary" onclick="BP.alphaSpeakSurname()">🎤 Произнести по буквам</button></div>'+feedback()+'</div>'}
  if(s>=5&&s<=8){
    const idx=s-5,row=alphaPracticeWords()[idx],guided=idx<2;
    body+=titleCard(guided?'Другие слова · сначала с образцом':'Теперь попробуй самостоятельно',row.word,guided?'Послушай, как OTTO произносит слово по буквам, затем повтори.':'Вспомни немецкие названия букв. Если забыл(а) — открой 🔤 Алфавит.')+
      '<div class="bp-word">'+esc(row.word)+'</div>'+(guided?letterButtons(row.word)+'<button class="bp-btn secondary block" onclick="BP.playLetters(\''+esc(row.word)+'\')">🔊 Послушать по буквам</button>':'')+
      '<button class="bp-btn primary block" style="margin-top:8px" onclick="BP.alphaPracticeSpeak('+idx+')">🎤 Произнести по буквам</button>'+feedback()+'</div>';
  }
  body+=alphaLessonNav(s>0?'BP.alphaBack()':'','BP.alphaSkipTask()','BP.skipAlphabetTopic()');app(body,'learn')
}
const ALPHA_CONTROL=[{own:'first'},{own:'last'},{word:'Berlin'},{word:'Deutschland'},{word:'Deutsch'},{word:'Hotel'},{word:'Schule'},{word:'Wasser'}];
function alphaControlScreen(){
  const i=Number(state.alphaControlIndex||0),t=ALPHA_CONTROL[i];if(!t)return alphaResultScreen();
  const word=t.own==='first'?(state.firstName||'Julia'):t.own==='last'?(state.lastName||'Petrova'):t.word;
  let body=screenHead('Контрольная · Buchstabieren','Только навык произношения по буквам','BP.alphabet()')+lessonProgress('Контрольная',i,ALPHA_CONTROL.length);
  body+=titleCard('Задание '+(i+1),'Произнеси по буквам: '+word,'Без предварительного образца. Если забыл(а) букву — можно открыть 🔤 Алфавит.')+'<div class="bp-word">'+esc(word)+'</div><button class="bp-btn primary block" onclick="BP.alphaControlSpeak(\''+esc(word)+'\')">🎤 Произнести по буквам</button>'+feedback()+'</div>';
  body+=alphaLessonNav(i>0?'BP.alphaControlBack()':'','BP.alphaControlSkip()','BP.skipAlphabetTopic()');app(body,'learn')
}
function alphabetWeakLetters(){
  const set=new Set();
  for(const e of activeErrors().filter(x=>x.topic==='alphabet')){const m=String(e.detail||'').match(/букв[ауы]?\s+([A-ZÄÖÜẞ]+)/i);if(m)set.add(m[1].toUpperCase())}
  return [...set]
}
function alphaResultScreen(){
  const score=state.alphaControlResults.filter(Boolean).length,total=ALPHA_CONTROL.length,weak=alphabetWeakLetters();
  state.tests.alphabet={score,total,completedAt:new Date().toISOString(),weakLetters:weak};completeTopic('alphabet');save();
  const resultText=weak.length?'Есть '+weak.length+' '+(weak.length===1?'буква, которую стоит повторить.':'буквы, которые стоит повторить.'):'Ошибок по буквам сейчас нет.';
  app(screenHead('Тема 1 завершена','Результат контрольной','BP.learn()')+'<div class="bp-card bp-praise"><img src="/otto/otto-guide.webp" alt="OTTO" style="width:72px;height:auto"><div><h2 class="bp-title">Отлично! Теперь ты умеешь произносить немецкие слова по буквам.</h2><p class="bp-lead">Этот навык пригодится тебе и дальше, в том числе при подготовке к A1.</p><div class="bp-score">'+score+' <small>из '+total+'</small></div><p class="bp-lead">'+esc(resultText)+'</p>'+(weak.length?'<button class="bp-btn secondary block" style="margin-top:10px" onclick="BP.trainErrors()">Потренировать ещё</button>':'')+'<button class="bp-btn primary block" style="margin-top:10px" onclick="BP.reading()">Перейти к правилам чтения</button></div></div>','learn')
}

function reading(){startSession('reading');if(!state.readingStarted){state.readingRule=-1;state.readingPhase=0}go('reading')} function readingMap(){return titleCard('Карта правил','Сначала увидим весь маршрут','Не пытайся сейчас всё запомнить. Основные правила сразу потренируем на настоящих словах. Ниже также показаны дополнительные особенности чтения, которые уже есть в OTTO.')+'<div class="bp-rule-map">'+READING_RULES.map(r=>'<span>'+esc(r.label)+'</span>').join('')+'</div>'+(EXTRA_READING_RULES.length?'<div class="bp-kicker" style="margin-top:14px">Ещё важные особенности</div><div class="bp-rule-map compact">'+EXTRA_READING_RULES.map(r=>'<span title="'+esc(r.sound)+'">'+esc(r.label)+'</span>').join('')+'</div>':'')+'<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.startReadingRules()">Начать</button><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.skipReadingTopic()">Пропустить тему</button></div>'}
function readingScreen(){
  if(state.readingRule<0){
    const body=screenHead('Как читать немецкие слова','Тема 2','BP.learn()')+readingMap()+lessonNav('','','BP.skipReadingTopic()');
    return app(body,'learn')
  }
  const r=READING_RULES[state.readingRule];
  if(!r){state.screen='readingControl';state.readingControlIndex=0;state.readingControlResults=[];state.readingControlItems=buildReadingControl();save();return render()}
  const p=Number(state.readingPhase||0),bank=ruleBank(r);
  const w=i=>ruleWord(r,i);
  let body=screenHead('Как читать немецкие слова','Правило '+(state.readingRule+1)+' из '+READING_RULES.length,'BP.learn()')+lessonProgress(r.label,p,10);
  if(p===0){
    const a=w(0),b=w(1);
    body+=titleCard('Правило',r.label+' → '+r.sound,r.text)+
      '<div class="bp-grid2"><div class="bp-note"><b>'+esc(a.word)+'</b><br><small>'+esc(a.ru)+'</small><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.play(\''+esc(a.word)+'\',this)">🔊 Послушать</button></div><div class="bp-note"><b>'+esc(b.word)+'</b><br><small>'+esc(b.ru)+'</small><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.play(\''+esc(b.word)+'\',this)">🔊 Послушать</button></div></div>'+
      '<button class="bp-btn primary block" style="margin-top:10px" onclick="BP.readingNext()">Потренироваться</button></div>'
  }
  if(p===1){const x=w(1);body+=titleCard('Послушай и повтори',x.word,'означает: '+x.ru)+'<button class="bp-btn secondary block" onclick="BP.play(\''+esc(x.word)+'\',this)">🔊 Послушать</button><button class="bp-btn primary block" style="margin-top:8px" onclick="BP.readingSpeak(\''+esc(x.word)+'\')">🎤 Повторить</button></div>'}
  if(p===2){const x=w(2);body+=titleCard('Ещё один пример',x.word,'означает: '+x.ru)+'<button class="bp-btn secondary block" onclick="BP.play(\''+esc(x.word)+'\',this)">🔊 Послушать</button><button class="bp-btn primary block" style="margin-top:8px" onclick="BP.readingSpeak(\''+esc(x.word)+'\')">🎤 Повторить</button></div>'}
  if(p===3){const x=w(3),d=distractorWords(r,2);body+=titleCard('Услышал → выбрал','Какое слово произнёс OTTO?')+'<button class="bp-btn secondary block" onclick="BP.play(\''+esc(x.word)+'\',this)">🔊 Слушать</button>'+choice([x.word,d[0]?.word||w(0).word,d[1]?.word||w(1).word],0,'BP.readingChoice')+'</div>'}
  if(p===4){const x=w(4);body+=titleCard('Прочитай сам(а)',x.word,'означает: '+x.ru)+'<button class="bp-btn primary block" onclick="BP.readingSpeak(\''+esc(x.word)+'\')">🎤 Прочитать</button><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.play(\''+esc(x.word)+'\',this)">🔊 Эталон после попытки</button></div>'}
  if(p===5){const x=w(5);body+=titleCard('Прочитай ещё одно слово',x.word,'означает: '+x.ru)+'<button class="bp-btn primary block" onclick="BP.readingSpeak(\''+esc(x.word)+'\')">🎤 Прочитать</button><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.play(\''+esc(x.word)+'\',this)">🔊 Проверить эталон</button></div>'}
  if(p===6){const x=w(6);body+=titleCard('Услышал → написал',x.word,'Послушай и восстанови слово — так легче закрепить его написание.')+'<button class="bp-btn secondary block" onclick="BP.play(\''+esc(x.word)+'\',this)">🔊 Слушать</button><input id="readingWrite" class="bp-input" style="margin-top:10px" placeholder="Напиши слово"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.readingWrite()">Проверить</button>'+feedback()+'</div>'}
  if(p===7){const x=w(7);body+=titleCard('Дополни пропуск',maskRuleWord(x.word,r),'Вставь именно изучаемую часть слова.')+'<input id="readingGap" class="bp-input" style="margin-top:10px" placeholder="'+esc(ruleNeedle(r,x.word))+'"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.readingGap()">Проверить</button>'+feedback()+'</div>'}
  if(p===8){const x=w(8),d=distractorWords(r,2);body+=titleCard('Найди правило','В каком слове сейчас работает «'+r.label+'»?')+choice([x.word,d[0]?.word||'Haus',d[1]?.word||'Name'],0,'BP.readingChoice')+'</div>'}
  if(p===9){const x=w(9);body+=titleCard('Новое слово — проверка переноса',x.word,'означает: '+x.ru+'. Сначала прочитай без звука.')+'<button class="bp-btn primary block" onclick="BP.readingFinalSpeak()">🎤 Прочитать</button><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.play(\''+esc(x.word)+'\',this)">🔊 Эталон после попытки</button></div>'}
  body+=lessonNav((p>0||state.readingRule>0)?'BP.readingBack()':'BP.readingMapScreen()','BP.readingSkipTask()','BP.skipReadingTopic()');
  app(body,'learn')
}
function readingControlItems(){
  if(!Array.isArray(state.readingControlItems)||state.readingControlItems.length!==30)state.readingControlItems=buildReadingControl();
  return state.readingControlItems
}
function readingControlScreen(){
  const items=readingControlItems(),i=Number(state.readingControlIndex||0),t=items[i];
  if(!t)return readingResultScreen();
  const body=screenHead('Контрольная по чтению','20 знакомых + 10 новых слов','BP.reading()')+lessonProgress('Чтение',i,items.length)+titleCard(t.familiar?'Знакомое слово':'Новое слово',t.word,'означает: '+t.ru)+'<button class="bp-btn primary block" onclick="BP.readingControlSpeak()">🎤 Прочитай слово</button></div>'+lessonNav(i>0?'BP.readingControlBack()':'','BP.readingControlSkip()','BP.skipReadingTopic()');
  app(body,'learn')
}
function readingResultScreen(){
  const items=readingControlItems(),score=state.readingControlResults.filter(Boolean).length,total=items.length,per={};
  items.forEach((t,i)=>{per[t.rule]=per[t.rule]||{ok:0,total:0};per[t.rule].total++;if(state.readingControlResults[i])per[t.rule].ok++});
  const good=Object.entries(per).filter(x=>x[1].ok/x[1].total>=.75).slice(0,5).map(x=>READING_RULES.find(r=>r.key===x[0])?.label||x[0]);
  const weak=Object.entries(per).filter(x=>x[1].ok/x[1].total<.75).slice(0,5).map(x=>READING_RULES.find(r=>r.key===x[0])?.label||x[0]);
  state.tests.reading={score,total,completedAt:new Date().toISOString(),good,weak};completeTopic('reading');save();
  app(screenHead('Тема 2 завершена','Результат чтения','BP.learn()')+'<div class="bp-card bp-praise"><img src="/otto/otto-guide.webp" alt="OTTO"><div><h2 class="bp-title">Видишь? Теперь ты уже можешь читать немецкие слова, которых раньше даже не видел(а).</h2><p class="bp-lead">То ли ещё будет 🙂</p><div class="bp-score">'+score+' <small>из '+total+'</small></div>'+(good.length?'<div class="bp-note good"><b>Хорошо получается:</b> '+good.map(x=>'✓ '+esc(x)).join(' · ')+'</div>':'')+(weak.length?'<div class="bp-note warn"><b>Стоит повторить:</b> '+weak.map(x=>'→ '+esc(x)).join(' · ')+'</div>':'')+'<button class="bp-btn secondary block" style="margin-top:10px" onclick="BP.errors()">Потренировать слабые правила</button><button class="bp-btn primary block" style="margin-top:8px" onclick="BP.numbers()">Перейти к числам</button></div></div>','learn')
}


function numbers(){startSession('numbers');go('numbers')} function numberMap(from,to){let h='<div class="bp-pronoun-grid">';for(let i=from;i<=to;i++)h+='<button class="bp-pronoun" onclick="BP.play(\''+numberWord(i)+'\',this)"><b>'+i+'</b><small>'+numberWord(i)+'</small></button>';return h+'</div>'}
function numberScreen(){
 const s=Number(state.numberStep||0),total=15;
 let body=screenHead('Числа','Тема 3','BP.learn()')+lessonProgress('Тема 3',s,total);
 if(s===0)body+=titleCard('0–10','Короткое знакомство','Нажимай на число, слушай и повторяй.')+numberMap(0,10)+'<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.numberNext()">Дальше</button></div>';
 if(s===1)body+=titleCard('Услышал → выбрал','Какое число произнёс OTTO?')+'<button class="bp-btn secondary block" onclick="BP.play(\'sieben\',this)">🔊 Слушать</button>'+choice(['7','17','70'],0,'BP.numberChoice')+'</div>';
 if(s===2)body+=titleCard('Увидел → сказал','7')+'<div class="bp-letter">7</div><button class="bp-btn primary block" onclick="BP.numberSpeak(\'7\')">🎤 Произнеси</button></div>';
 if(s===3)body+=titleCard('11–20','Здесь есть несколько форм, которые лучше сразу услышать и использовать')+numberMap(11,20)+'<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.numberNext()">Дальше</button></div>';
 if(s===4)body+=titleCard('Услышал → написал цифрами','vierzehn')+'<button class="bp-btn secondary block" onclick="BP.play(\'vierzehn\',this)">🔊 Слушать</button><input id="numberWrite" class="bp-input" inputmode="numeric" style="margin-top:10px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.numberWrite(14)">Проверить</button>'+feedback()+'</div>';
 if(s===5)body+=titleCard('Увидел → сказал','17')+'<div class="bp-letter">17</div><button class="bp-btn primary block" onclick="BP.numberSpeak(\'17\')">🎤 Произнеси</button></div>';
 if(s===6)body+=titleCard('Десятки','20 · 30 · 40 · 50 · 60 · 70 · 80 · 90 · 100','Сначала послушай каждое число.')+'<div class="bp-tokens">'+[20,30,40,50,60,70,80,90,100].map(n=>'<button class="bp-token" onclick="BP.play(\''+numberWord(n)+'\',this)">🔊 '+n+'</button>').join('')+'</div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.numberNext()">Проверим</button></div>';
 if(s===7)body+=titleCard('Слушай внимательно','Что услышал?')+'<button class="bp-btn secondary block" onclick="BP.play(\'siebzig\',this)">🔊 Слушать</button>'+choice(['17','70','77'],1,'BP.numberChoice')+'</div>';
 if(s===8)body+=titleCard('Увидел → сказал','40')+'<div class="bp-letter">40</div><button class="bp-btn primary block" onclick="BP.numberSpeak(\'40\')">🎤 Произнеси</button></div>';
 if(s===9)body+=titleCard('Услышал → написал','dreißig')+'<button class="bp-btn secondary block" onclick="BP.play(\'dreißig\',this)">🔊 Слушать</button><input id="numberWrite" class="bp-input" inputmode="numeric" style="margin-top:10px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.numberWrite(30)">Проверить</button>'+feedback()+'</div>';
 if(s===10)body+=titleCard('Составные числа','21 = ein + und + zwanzig','В немецком сначала единица, потом und, потом десяток.')+'<div class="bp-structure"><div><b>1</b><span>ein</span></div><div><b>+</b><span>und</span></div><div><b>20</b><span>zwanzig</span></div></div><div class="bp-tokens" style="margin-top:12px">'+[21,32,47,58,69,74,86,99].map(n=>'<button class="bp-token" onclick="BP.play(\''+numberWord(n)+'\',this)">🔊 '+n+'</button>').join('')+'</div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.numberNext()">Собрать самому</button></div>';
 if(s===11){const tokens=['vierzig','sieben','und'];body+=titleCard('Собери 47','sieben + und + vierzig')+'<div class="bp-assembly">'+(state.numberAssembly.length?state.numberAssembly.map(x=>'<span>'+x+'</span>').join(''):'<small>Нажимай на части</small>')+'</div><div class="bp-tokens">'+tokens.map((x,i)=>'<button class="bp-token" onclick="BP.numberToken('+i+')">'+x+'</button>').join('')+'</div><div class="bp-row"><button class="bp-btn secondary" onclick="BP.numberClear()">Очистить</button><button class="bp-btn primary" onclick="BP.numberAssemblyCheck()">Проверить</button></div></div>'}
 if(s===12)body+=titleCard('Числа в реальных ситуациях','Возраст · дом · телефон · индекс · цена · время')+'<div class="bp-mini-list"><div class="bp-mini"><span class="n">34</span><div><b>Ich bin 34 Jahre alt.</b><small>возраст</small></div></div><div class="bp-mini"><span class="n">12</span><div><b>Gartenstraße 12</b><small>номер дома</small></div></div><div class="bp-mini"><span class="n">17€</span><div><b>17 Euro</b><small>цена</small></div></div><div class="bp-mini"><span class="n">18:00</span><div><b>um 18 Uhr</b><small>время</small></div></div></div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.numberNext()">Дальше</button></div>';
 if(s===13)body+=titleCard('Как произнести число?','Введи число от 0 до 9999')+'<input id="numberInput" class="bp-input" inputmode="numeric" value="127"><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.makeNumber()">Показать</button><div id="numberResult" class="bp-number-result">'+numberWord(127)+'</div><div class="bp-row"><button class="bp-btn secondary" onclick="BP.listenNumber(this)">🔊 Послушать</button><button class="bp-btn primary" onclick="BP.repeatNumber()">🎤 Повторить</button></div><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.numberNext()">Дальше</button></div>';
 if(s===14)body+=titleCard('Готовы к проверке','Смешаем обычные числа и реальные A1-ситуации.')+'<button class="bp-btn primary block" onclick="BP.startNumberControl()">Начать контрольную</button></div>';
 body+=lessonNav(s>0?'BP.numberBack()':'','BP.numberSkipTask()','BP.skipNumberTopic()');
 app(body,'learn')
}

function numberControlScreen(){const i=Number(state.numberControlIndex||0),t=NUMBER_CONTROL[i];if(!t)return numberResultScreen();let body=screenHead('Контрольная по числам','Смешанная проверка','BP.numbers()')+lessonProgress('Числа',i,NUMBER_CONTROL.length);if(t.type==='choice')body+=titleCard(t.label||'Услышал → выбрал','Что услышал?')+'<button class="bp-btn secondary block" onclick="BP.play(\''+esc(t.spoken)+'\',this)">🔊 Слушать</button>'+choice(t.opts,t.ok,'BP.numberControlChoice')+'</div>';if(t.type==='write')body+=titleCard(t.label||'Услышал → написал','Напиши цифрами')+'<button class="bp-btn secondary block" onclick="BP.play(\''+esc(t.spoken)+'\',this)">🔊 Слушать</button><input id="numberControlInput" class="bp-input" inputmode="numeric" style="margin-top:10px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.numberControlWrite()">Проверить</button>'+feedback()+'</div>';if(t.type==='speak')body+=titleCard(t.label||'Цифры → произнёс',t.target)+'<div class="bp-letter">'+esc(t.target)+'</div><button class="bp-btn primary block" onclick="BP.numberControlSpeak()">🎤 Произнеси</button></div>';body+=lessonNav(i>0?'BP.numberControlBack()':'','BP.numberControlSkip()','BP.skipNumberTopic()');app(body,'learn')}
function numberResultScreen(){const score=state.numberControlResults.filter(Boolean).length,total=NUMBER_CONTROL.length;state.tests.numbers={score,total,completedAt:new Date().toISOString()};completeTopic('numbers');save();app(screenHead('Тема 3 завершена','Результат контрольной','BP.learn()')+'<div class="bp-card bp-praise"><img src="/otto/otto-guide.webp" alt="OTTO"><div><h2 class="bp-title">Числа уже работают в реальных ситуациях.</h2><div class="bp-score">'+score+' <small>из '+total+'</small></div><p class="bp-lead">Слабые числа вернутся в «А это помнишь?» и в «Мои ошибки».</p><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.home()">На главную</button></div></div>','learn')}


function errorPracticeScreen(){
  const e=state.errors.find(x=>x.id===state.activeErrorId);if(!e)return go('errors');
  let body=screenHead('Отработка ошибки',topicTitle(e.topic),'BP.errors()')+titleCard('Слабое место',e.item,e.detail||'');
  if(e.topic==='reading'){
    const r=READING_RULES.find(x=>x.key===e.rule)||READING_RULES[0],bank=ruleBank(r),row=bank[Math.min(10,Math.max(0,bank.length-1))]||ruleWord(r,0);
    body+='<p class="bp-lead">То же правило, но другое слово из базы OTTO A1.</p><div class="bp-word">'+esc(row.word)+'</div><small>означает: '+esc(row.ru)+'</small><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.errorSpeak(\''+esc(row.word)+'\',\''+esc(e.id)+'\')">🎤 Прочитай слово</button></div>'
  }else if(e.topic==='numbers'){
    body+='<p class="bp-lead">Напиши цифрами число, которое слышишь.</p><button class="bp-btn secondary block" onclick="BP.play(\'siebenundvierzig\',this)">🔊 Слушать</button><input id="errorNumber" class="bp-input" inputmode="numeric" style="margin-top:10px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.errorNumber(\''+esc(e.id)+'\')">Проверить</button></div>'
  }else{
    body+='<p class="bp-lead">Произнеси по буквам: <b>'+esc(e.item||'Berlin')+'</b></p><button class="bp-btn primary block" onclick="BP.errorAlphaSpeak(\''+esc(e.id)+'\',\''+esc(e.item||'Berlin')+'\')">🎤 Произнести по буквам</button><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.openAlphabet()">🔤 Алфавит</button></div>'
  }
  app(body,'errors')
}

function buildReviewTasks(){const tasks=[];for(const e of activeErrors().slice(0,3)){if(e.topic==='reading')tasks.push({type:'reading',label:e.item,errorId:e.id});else if(e.topic==='numbers')tasks.push({type:'number',label:e.item,errorId:e.id});else tasks.push({type:'alpha',label:e.item,errorId:e.id})}if(state.completed.includes('alphabet')){tasks.push({type:'alpha',label:state.firstName||'Berlin'},{type:'alpha',label:'Deutsch'},{type:'alpha',label:'Deutschland'})}if(state.completed.includes('reading'))tasks.push({type:'reading',label:'sch'});if(state.completed.includes('numbers'))tasks.push({type:'number',label:'47'});return tasks.slice(0,Math.min(7,tasks.length))}
function reviewScreen(){const tasks=buildReviewTasks();if(!tasks.length){state.reviewSkippedDate=TODAY();return go('home')}const i=Number(state.reviewStep||0);if(i>=tasks.length){state.reviewSkippedDate=TODAY();save();return app(screenHead('Повторение готово','Можно переходить к новому','BP.home()')+'<div class="bp-card bp-praise"><img src="/otto/otto-guide.webp" alt="OTTO"><div><h2 class="bp-title">Отлично. Старое вспомнили.</h2><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.home()">Продолжить</button></div></div>','learn')}const t=tasks[i];let body=screenHead('А это помнишь?','Короткое повторение перед новым','BP.home()')+lessonProgress('Повторение',i,tasks.length);if(t.type==='alpha'){body+=titleCard('Buchstabieren','Произнеси по буквам: '+t.label,'Если забыл(а) букву — открой алфавит.')+'<button class="bp-btn primary block" onclick="BP.reviewAlphaSpeak()">🎤 Произнести по буквам</button><button class="bp-btn secondary block" style="margin-top:8px" onclick="BP.openAlphabet()">🔤 Алфавит</button></div>'}if(t.type==='reading')body+=titleCard('Чтение','Прочитай новое слово с уже знакомым правилом')+'<div class="bp-word">Schwester</div><small>означает: сестра</small><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.reviewSpeak()">🎤 Прочитать</button></div>';if(t.type==='number')body+=titleCard('Числа','Что услышал?')+'<button class="bp-btn secondary block" onclick="BP.play(\'siebenundvierzig\',this)">🔊 Слушать</button>'+choice(['47','74','44'],0,'BP.reviewChoice')+'</div>';body+='<div class="bp-lesson-nav">'+(i>0?'<button type="button" onclick="BP.reviewBack()">← Назад</button>':'')+'<button type="button" onclick="BP.skipReview()">Пропустить повторение</button><button type="button" onclick="BP.home()">На главную</button></div>';app(body,'learn')}
function render(){if(!booted)return;if(state.screen==='register')return registerScreen();if(state.screen==='onboarding')return tutorialScreen();if(state.screen==='home')return homeScreen();if(state.screen==='learn')return learnScreen();if(state.screen==='settings')return settingsScreen();if(state.screen==='errors')return errorScreen();if(state.screen==='errorPractice')return errorPracticeScreen();if(state.screen==='review')return reviewScreen();if(state.screen==='alphabet')return alphaScreen();if(state.screen==='alphaControl')return alphaControlScreen();if(state.screen==='alphaResult')return alphaResultScreen();if(state.screen==='reading')return readingScreen();if(state.screen==='readingControl')return readingControlScreen();if(state.screen==='readingResult')return readingResultScreen();if(state.screen==='numbers')return numberScreen();if(state.screen==='numberControl')return numberControlScreen();if(state.screen==='numberResult')return numberResultScreen();state.screen='home';homeScreen()}
window.__OTTO_BASE_PREVIEW_SET_STATE=(patch)=>{Object.assign(state,patch||{});save();render();return clone(state)};window.__OTTO_BASE_PREVIEW_GET_STATE=()=>clone(state);window.__OTTO_BASE_PREVIEW_SAVE_CLOUD=()=>saveCloud();


window.BP={play,playLetters,nav(id){if(id==='home')go('home');if(id==='learn')go('learn');if(id==='errors')go('errors');if(id==='settings')go('settings')},home(){go('home')},learn(){go('learn')},errors(){go('errors')},settings(){go('settings')},toggleAuth(){state.authMode=state.authMode==='login'?'register':'login';state.authMessage='';render()},setAuthChannel(channel){state.authChannel=channel==='phone'?'phone':'email';state.authMessage='';saveLocal();render()},requestCode(){void doRequestCode()},register(){void doRegister()},login(){void doLogin()},previewLogin(){void doPreviewLogin()},resetPreviewProfile(){void resetPreviewProfile()},async logout(){const providers=state.authProviders;try{await api('logout',{},true)}catch{}setToken('');state=clone(DEFAULT);state.authProviders=providers;saveLocal();render()},openTutorial(){state.onboardingManual=true;state.onboardingStep=0;go('onboarding')},tutorialNext(){state.onboardingStep=Math.min(4,Number(state.onboardingStep||0)+1);save();render()},tutorialBack(){state.onboardingStep=Math.max(0,Number(state.onboardingStep||0)-1);save();render()},skipTutorial,finishTutorial(target){void markOnboardingCompleted(target)},routeInfo,
alphabet,openAlphabet:openAlphabetReference,
alphaNext(){state.feedback='';if(Number(state.alphaStep||0)>=8){state.screen='alphaControl';state.alphaControlIndex=0;state.alphaControlResults=[]}else state.alphaStep=Number(state.alphaStep||0)+1;save();render()},
alphaBack(){state.feedback='';state.alphaStep=Math.max(0,Number(state.alphaStep||0)-1);save();render()},alphaSkipTask(){BP.alphaNext()},
syncLatin(kind,value){const id=kind==='last'?'lastNameLatin':'firstNameLatin',el=document.getElementById(id);if(el)el.value=suggestLatinName(value)},
saveFirstName(){const src=nameValue(document.getElementById('firstNameSource')?.value||''),v=nameValue(document.getElementById('firstNameLatin')?.value||suggestLatinName(src));if(!v){setFeedback('<b>Что произошло</b> Введите имя.');return render()}state.firstName=v;learnElement('personal:first-name');state.alphaStep=2;state.feedback='';save();render()},
alphaSpeakName(){const v=state.firstName||'Julia';trackedSpeech(spellText(v),{errorId:'spell-first',item:v,topic:'alphabet',skill:'buchstabieren',spellingValue:v,detail:'Имя по буквам пока произносится неуверенно.'},good=>{if(good)learnElement('spell:first');state.alphaStep=3;state.feedback='';save();render()})},
saveLastName(){const src=nameValue(document.getElementById('lastNameSource')?.value||''),v=nameValue(document.getElementById('lastNameLatin')?.value||suggestLatinName(src));if(!v){setFeedback('<b>Что произошло</b> Введите фамилию.');return render()}state.lastName=v;learnElement('personal:last-name');state.alphaStep=4;state.feedback='';save();render()},
alphaSpeakSurname(){const v=state.lastName||'Petrova';trackedSpeech(spellText(v),{errorId:'spell-last',item:v,topic:'alphabet',skill:'buchstabieren',spellingValue:v,detail:'Фамилия по буквам пока произносится неуверенно.'},good=>{if(good)learnElement('spell:last');state.alphaStep=5;state.feedback='';save();render()})},
alphaPracticeSpeak(index){const row=alphaPracticeWords()[Number(index)||0],word=row?.word||'Berlin';trackedSpeech(spellText(word),{errorId:'alpha-practice-'+index,item:word,topic:'alphabet',skill:'buchstabieren',spellingValue:word,detail:'Слово по буквам пока произносится неуверенно.'},good=>{if(good)learnElement('spell:practice:'+index);if(Number(state.alphaStep||0)>=8){state.screen='alphaControl';state.alphaControlIndex=0;state.alphaControlResults=[]}else state.alphaStep=Number(state.alphaStep||0)+1;state.feedback='';save();render()})},
startAlphaControl(){state.screen='alphaControl';state.alphaControlIndex=0;state.alphaControlResults=[];save();render()},
alphaControlSpeak(word){const i=state.alphaControlIndex;trackedSpeech(spellText(word),{errorId:'alpha-control-'+i,item:word,topic:'alphabet',skill:'buchstabieren',spellingValue:word,detail:'Слово по буквам произносится неуверенно.'},good=>{state.alphaControlResults[i]=good;state.alphaControlIndex++;state.feedback='';save();render()})},
alphaControlBack(){state.feedback='';state.alphaControlIndex=Math.max(0,state.alphaControlIndex-1);save();render()},alphaControlSkip(){state.alphaControlResults[state.alphaControlIndex]=false;state.alphaControlIndex++;save();render()},
skipAlphabetTopic(){completeTopic('alphabet');state.tests.alphabet=state.tests.alphabet||{score:0,total:8,skipped:true};go('learn')},
reading(){startSession('reading');if(!state.readingStarted){state.readingRule=-1;state.readingPhase=0}go('reading')},
readingMapScreen(){state.readingRule=-1;state.readingPhase=0;save();render()},
startReadingRules(){state.readingStarted=true;state.readingRule=0;state.readingPhase=0;save();render()},
readingNext(){state.feedback='';state.readingPhase++;if(state.readingPhase>9){state.readingPhase=0;state.readingRule++}save();render()},
readingBack(){if(state.readingPhase>0)state.readingPhase--;else if(state.readingRule>0){state.readingRule--;state.readingPhase=9}else state.readingRule=-1;save();render()},
readingSkipTask(){BP.readingNext()},
readingChoice(ok,b){
  const r=READING_RULES[state.readingRule],id='reading-'+r.key;
  b.classList.add(ok?'correct':'wrong');
  if(ok){clearMistake(id);learnElement('reading:'+r.key+':recognize');setTimeout(()=>BP.readingNext(),300)}
  else{
    const saved=lessonMistake(id,r.label,'reading','узнавание правила','Правило '+r.label+' пока не узнаётся.',r.key);
    setFeedback('<b>Что произошло</b> Пока не то.<br><b>Как правильно</b> '+esc(r.text)+'<br><b>'+(saved?'Сохранили слабое место — позже вернём другим словом.':'Попробуй ещё раз')+'</b>');
    setTimeout(render,450)
  }
},
readingSpeak(word){
  const r=READING_RULES[state.readingRule];
  trackedSpeech(word,{errorId:'reading-'+r.key,item:r.label,topic:'reading',skill:'произношение',detail:'Правило '+r.label+' пока не получилось в произношении.',rule:r.key},good=>{if(good){clearMistake('reading-'+r.key);learnElement('reading:'+r.key+':speak:'+state.readingPhase)}BP.readingNext()})
},
readingWrite(){
  const r=READING_RULES[state.readingRule],target=ruleWord(r,6).word,v=document.getElementById('readingWrite')?.value||'',id='reading-'+r.key;
  if(norm(v)===norm(target)){clearMistake(id);learnElement('reading:'+r.key+':write');state.feedback='';BP.readingNext()}
  else{
    const saved=lessonMistake(id,r.label,'reading','написание','Слово '+target+' не восстановилось на слух.',r.key);
    setFeedback('<b>Что произошло</b> Написание пока неточное.<br><b>Как правильно</b> '+esc(target)+'.<br><b>'+(saved?'Сохранили слабое правило и позже проверим другим словом.':'Попробуй ещё раз')+'</b>');render()
  }
},
readingGap(){
  const r=READING_RULES[state.readingRule],row=ruleWord(r,7),expected=ruleNeedle(r,row.word),v=norm(document.getElementById('readingGap')?.value||''),id='reading-'+r.key;
  if(v===norm(expected)){clearMistake(id);learnElement('reading:'+r.key+':gap');state.feedback='';BP.readingNext()}
  else{
    const saved=lessonMistake(id,r.label,'reading','зрительная память','Сочетание '+r.label+' не восстановилось.',r.key);
    setFeedback('<b>Что произошло</b> Не хватает '+esc(expected)+'.<br><b>'+(saved?'Слабое место сохранено — вернём другим примером.':'Попробуй ещё раз')+'</b>');render()
  }
},
readingFinalSpeak(){
  const r=READING_RULES[state.readingRule],row=ruleWord(r,9);
  trackedSpeech(row.word,{errorId:'reading-'+r.key,item:r.label,topic:'reading',skill:'контроль переноса',detail:'Новое слово с правилом '+r.label+' пока читается неуверенно.',rule:r.key},good=>{if(good)learnElement('reading:'+r.key+':transfer');BP.readingNext()})
},
readingControlSpeak(){
  const items=readingControlItems(),i=state.readingControlIndex,t=items[i];
  if(!t)return;
  trackedSpeech(t.word,{errorId:'reading-control-'+i,item:t.word,topic:'reading',skill:'контрольная',detail:'Слово '+t.word+' пока читается неуверенно.',rule:t.rule},good=>{state.readingControlResults[i]=good;state.readingControlIndex++;save();render()})
},
readingControlBack(){state.readingControlIndex=Math.max(0,state.readingControlIndex-1);save();render()},
readingControlSkip(){state.readingControlResults[state.readingControlIndex]=false;state.readingControlIndex++;save();render()},
skipReadingTopic(){completeTopic('reading');state.tests.reading=state.tests.reading||{score:0,total:30,skipped:true,good:[],weak:[]};go('learn')},
numbers,numberNext(){state.feedback='';state.numberAssembly=[];state.numberStep=Math.min(14,Number(state.numberStep||0)+1);save();render()},numberBack(){state.numberAssembly=[];state.numberStep=Math.max(0,Number(state.numberStep||0)-1);save();render()},numberSkipTask(){BP.numberNext()},numberChoice(ok,b){const id='number-'+state.numberStep;b.classList.add(ok?'correct':'wrong');if(ok){clearMistake(id);learnElement('numbers:recognition:'+state.numberStep);setTimeout(()=>BP.numberNext(),300)}else{const saved=lessonMistake(id,'Числа','numbers','слух','Число пока не узнаётся на слух.');setFeedback('<b>Что произошло</b> Число пока не узналось.<br><b>Как правильно</b> Послушай ещё раз.<br><b>'+(saved?'Слабое число сохранено — вернём позже.':'Попробуй ещё раз')+'</b>');setTimeout(render,450)}},numberSpeak(n){const expected=numberWord(Number(n));trackedSpeech(expected,{errorId:'number-speak-'+n,item:n,topic:'numbers',skill:'произношение',detail:'Число '+n+' пока произносится неуверенно.'},good=>{if(good)learnElement('number:'+n);BP.numberNext()})},numberWrite(target){const id='number-'+target,v=(document.getElementById('numberWrite')?.value||'').replace(/\D/g,'');if(v===String(target)){clearMistake(id);learnElement('number:'+target);state.feedback='';BP.numberNext()}else{const saved=lessonMistake(id,String(target),'numbers','слух → цифры','Число не записалось цифрами.');setFeedback('<b>Что произошло</b> Пока не то.<br><b>Как правильно</b> '+target+'.<br><b>'+(saved?'Слабое число сохранено — вернём позже.':'Попробуй ещё раз')+'</b>');render()}},numberToken(i){const t=['vierzig','sieben','und'];state.numberAssembly.push(t[i]);save();render()},numberClear(){state.numberAssembly=[];save();render()},numberAssemblyCheck(){if(state.numberAssembly.join(' ')==='sieben und vierzig'){clearMistake('number-47-assembly');learnElement('number:47:assembly');BP.numberNext()}else{const saved=lessonMistake('number-47-assembly','47','numbers','составное число','Части числа собраны не в том порядке.');toast(saved?'Сохранили 47 на повторение. Единица + und + десяток.':'Вспомни: единица + und + десяток.')}},makeNumber(){const input=document.getElementById('numberInput'),result=document.getElementById('numberResult'),w=numberWord(input?.value||'');if(result)result.textContent=w||'Введите число от 0 до 9999.'},listenNumber(btn){const w=numberWord(document.getElementById('numberInput')?.value||'');if(w)play(w,btn)},repeatNumber(){const v=document.getElementById('numberInput')?.value||'',w=numberWord(v);if(w)trackedSpeech(w,{errorId:'number-free-'+v,item:v,topic:'numbers',skill:'произношение',detail:'Это число пока произносится неуверенно.'},good=>{if(good)learnElement('number:free:'+v)})},startNumberControl(){state.screen='numberControl';state.numberControlIndex=0;state.numberControlResults=[];save();render()},numberControlChoice(ok,b){const i=state.numberControlIndex,t=NUMBER_CONTROL[i];b.classList.add(ok?'correct':'wrong');state.numberControlResults[i]=ok;if(!ok)addError('number-control-'+i,t.target,'numbers','контрольная','Число не узналось на слух.');setTimeout(()=>{state.numberControlIndex++;save();render()},ok?300:600)},numberControlWrite(){const i=state.numberControlIndex,t=NUMBER_CONTROL[i],raw=(document.getElementById('numberControlInput')?.value||'').replace(/\D/g,''),target=String(t.target).replace(/\D/g,''),ok=raw===target;state.numberControlResults[i]=ok;if(!ok)addError('number-control-'+i,t.target,'numbers','контрольная','Число не записалось после прослушивания.');state.numberControlIndex++;save();render()},numberControlSpeak(){const i=state.numberControlIndex,t=NUMBER_CONTROL[i];trackedSpeech(t.expected,{errorId:'number-control-'+i,item:t.target,topic:'numbers',skill:'контрольная',detail:'Число '+t.target+' пока произносится неуверенно.'},good=>{state.numberControlResults[i]=good;state.numberControlIndex++;save();render()})},numberControlBack(){state.numberControlIndex=Math.max(0,state.numberControlIndex-1);save();render()},numberControlSkip(){state.numberControlResults[state.numberControlIndex]=false;state.numberControlIndex++;save();render()},skipNumberTopic(){completeTopic('numbers');state.tests.numbers=state.tests.numbers||{score:0,total:18,skipped:true};go('learn')},
trainErrors(){const first=activeErrors()[0];if(!first)return toast('Нет активных ошибок.');state.activeErrorId=first.id;go('errorPractice')},trainError(id){state.activeErrorId=id;go('errorPractice')},errorSpeak(word,id){trackedSpeech(word,{errorId:id,item:word,topic:'reading',skill:'отработка',detail:'Нужно ещё потренировать правило.',resolveOnSuccess:true},good=>{if(good){toast('Успешно выполнено. Ошибка отмечена как отработанная.');setTimeout(()=>go('errors'),650)}})},errorNumber(id){const v=(document.getElementById('errorNumber')?.value||'').replace(/\D/g,'');if(v==='47'){resolveError(id);toast('Успешно выполнено.');setTimeout(()=>go('errors'),500)}else{const e=state.errors.find(x=>x.id===id);if(e)e.practiceCount=Number(e.practiceCount||0)+1;save();toast('Пока не то. Попробуй ещё раз.')}},errorAlphaSpeak(id,word){trackedSpeech(spellText(word),{errorId:id,item:word,topic:'alphabet',skill:'buchstabieren',spellingValue:word,resolveOnSuccess:true},good=>{if(good)resolveError(id);go('errors')})},errorAlpha(ok,b){b.classList.add(ok?'correct':'wrong');const id=state.activeErrorId;if(ok){resolveError(id);setTimeout(()=>go('errors'),400)}else{const e=state.errors.find(x=>x.id===id);if(e)e.practiceCount=Number(e.practiceCount||0)+1;save();toast('Послушай W ещё раз.')}},reviewChoice(ok,b){b.classList.add(ok?'correct':'wrong');const tasks=buildReviewTasks(),t=tasks[state.reviewStep];if(ok&&t?.errorId)resolveError(t.errorId);setTimeout(()=>{state.reviewStep++;save();render()},ok?300:550)},reviewAlphaSpeak(){const tasks=buildReviewTasks(),t=tasks[state.reviewStep];if(!t)return;trackedSpeech(spellText(t.label),{errorId:t.errorId||('review-alpha-'+state.reviewStep),item:t.label,topic:'alphabet',skill:'buchstabieren',spellingValue:t.label,resolveOnSuccess:Boolean(t.errorId)},good=>{state.reviewStep++;save();render()})},reviewSpeak(){const tasks=buildReviewTasks(),t=tasks[state.reviewStep];trackedSpeech('Schwester',{errorId:t?.errorId||'',item:'sch',topic:'reading',skill:'повторение',detail:'Правило sch стоит повторить.',rule:'sch',resolveOnSuccess:Boolean(t?.errorId)},good=>{state.reviewStep++;save();render()})},reviewBack(){state.reviewStep=Math.max(0,state.reviewStep-1);save();render()},skipReview(){state.reviewSkippedDate=TODAY();go('home')},simpleChoice(ok,b){b.classList.add(ok?'correct':'wrong')}};
void boot();
})();