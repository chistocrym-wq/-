(() => {
'use strict';

const root=document.getElementById('app');
if(!root)return;

const STORE='ottoStartBasePreviewV2';
const clone=x=>JSON.parse(JSON.stringify(x));
const DEFAULT={
  screen:'register',regStep:'welcome',email:'',level:null,
  diagIndex:0,diagScore:0,diagAnswered:false,
  alphaStep:0,alphaAttempts:0,alphaAssembly:[],alphaFeedback:'',
  reviewStep:0,pronounStep:0,verbStep:0,nounStep:0,
  sentenceAssembly:[],sentenceStep:0,
  errors:[
    {id:'wasser-pron',item:'Wasser',kind:'произношение',detail:'Нужно ещё раз услышать W и повторить слово.'},
    {id:'wohnen-recall',item:'wohnen',kind:'вспоминание',detail:'Перевод не вспомнился сразу.'}
  ],
  completed:[],currentStage:'Базовый немецкий',toast:''
};
let state=load();
let toastTimer=null;

function load(){
  try{return Object.assign(clone(DEFAULT),JSON.parse(localStorage.getItem(STORE)||'{}'))}
  catch{return clone(DEFAULT)}
}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function speech(){return window.OttoSpeechV18||window.OttoSpeechV17||window.OttoSpeechV15||null}
function play(text,button,kind){
  const api=speech();
  if(api&&api.play)return api.play(text,{mode:'normal',kind:kind||'text',button:button});
  toast('Озвучка OTTO ещё загружается. Попробуйте ещё раз.');
}
function pronounce(text){
  const api=speech();
  if(api&&api.check)return api.check(text,[text]);
  toast('Проверка произношения OTTO ещё загружается.');
}
function toast(message){
  document.querySelector('.bp-toast')?.remove();
  const el=document.createElement('div');el.className='bp-toast';el.textContent=message;
  document.body.appendChild(el);clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),3200);
}
function go(screen){state.screen=screen;save();render()}
function complete(id){if(!state.completed.includes(id))state.completed.push(id);save()}
function progress(){
  const ids=['alphabet','pronouns','verbs','nouns','numbers','sentence'];
  return Math.round(ids.filter(x=>state.completed.includes(x)).length/ids.length*100);
}
function top(){
  return '<header class="bp-top"><div class="bp-brand"><img src="/otto/otto-home.webp" alt="OTTO"><div><b>Otto Start</b><small>Базовый немецкий · Preview</small></div></div><button class="bp-icon" type="button" onclick="BP.settings()" aria-label="Настройки">⚙</button></header>';
}
function nav(active){
  const items=[
    ['home','⌂','Главная'],
    ['learn','▦','Учусь'],
    ['errors','⚠','Мои ошибки'],
    ['settings','⚙','Настройки']
  ];
  return '<nav class="bp-bottom">'+items.map(x=>'<button type="button" class="'+(active===x[0]?'active':'')+'" onclick="BP.nav(\''+x[0]+'\')"><span>'+x[1]+'</span>'+x[2]+'</button>').join('')+'</nav>';
}
function app(body,active,wide){
  root.innerHTML='<div class="bp-app">'+top()+'<main class="bp-main"><div class="bp-shell '+(wide?'wide':'')+'">'+body+'</div></main>'+nav(active||'')+'</div>';
  window.scrollTo(0,0);
}
function screenHead(title,sub,back){
  return '<div class="bp-screen-head"><button class="bp-back" onclick="'+(back||'BP.learn()')+'">←</button><div class="text"><b>'+esc(title)+'</b><small>'+esc(sub||'')+'</small></div></div>';
}
function onboarding(body,step){
  const dots=[0,1,2].map((_,i)=>'<i class="'+(i<=step?'on':'')+'"></i>').join('');
  root.innerHTML='<div class="bp-app"><main class="bp-main"><div class="bp-onboard"><section class="bp-onboard-card"><div class="bp-onboard-hero"><div class="copy"><span class="bp-badge">OTTO START</span><h1 class="bp-title">Немецкий с самого начала</h1><p class="bp-lead">Спокойно, короткими шагами и с постоянным возвращением к тому, что уже изучали.</p></div><img src="/otto/otto-guide.webp" alt="OTTO"></div><div class="bp-onboard-body"><div class="bp-progress-dots">'+dots+'</div>'+body+'</div></section></div></main></div>';
  window.scrollTo(0,0);
}
function register(){
  if(state.regStep==='welcome'){
    onboarding('<h2 class="bp-title">Привет! Я OTTO.</h2><p class="bp-lead">Сначала зарегистрируемся, а потом определим, с какого места лучше начать.</p><div class="bp-grid2" style="margin-top:16px"><button class="bp-level" onclick="BP.regEmail()"><span class="ico">✉</span><b>Продолжить по Email</b><p>Email → код подтверждения → профиль.</p><span class="cta">Продолжить</span></button><button class="bp-level" onclick="BP.regTelegram()"><span class="ico">➤</span><b>Продолжить через Telegram</b><p>Тот же принцип единого аккаунта OTTO.</p><span class="cta">Продолжить</span></button></div><div class="bp-note" style="margin-top:12px"><b>Preview:</b> регистрация здесь демонстрационная и не создаёт реальный аккаунт.</div>',0);return;
  }
  if(state.regStep==='email'){
    onboarding('<button class="bp-btn secondary small" onclick="BP.regWelcome()">← Назад</button><h2 class="bp-title">Ваш email</h2><p class="bp-lead">На реальном шаге OTTO отправляет одноразовый код. В Preview мы только проверяем интерфейс.</p><input id="bpEmail" class="bp-input" type="email" placeholder="name@example.com" value="'+esc(state.email)+'" style="margin-top:15px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.sendCode()">Получить код</button>',0);return;
  }
  if(state.regStep==='otp'){
    onboarding('<button class="bp-btn secondary small" onclick="BP.regEmail()">← Изменить email</button><h2 class="bp-title">Введите код</h2><p class="bp-lead">Код отправлен на <b>'+esc(state.email||'ваш email')+'</b>. В Preview подходят любые 6 цифр.</p><div class="bp-otp" style="margin-top:15px">'+[0,1,2,3,4,5].map(i=>'<input class="bp-input" inputmode="numeric" maxlength="1" data-otp="'+i+'" oninput="BP.otp(this,'+i+')">').join('')+'</div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.verifyCode()">Подтвердить</button>',1);return;
  }
  level();
}
function level(){
  onboarding('<h2 class="bp-title">Давайте определим ваш уровень</h2><p class="bp-lead">Выберите ближайший вариант. Ничего не блокируется навсегда — стартовую точку потом можно изменить.</p><div class="bp-levels" style="margin-top:16px"><button class="bp-level" onclick="BP.startZero()"><span class="ico">🌱</span><b>Начинаю с нуля</b><p>Я практически не знаю немецкий. Начнём с алфавита, чтения и самых первых слов.</p><span class="cta">Начать с самого начала →</span></button><button class="bp-level" onclick="BP.startDiagnostic()"><span class="ico">🔤</span><b>Алфавит уже знаю</b><p>Я знаю немецкий алфавит и некоторые простые слова.</p><span class="cta">Продолжить с базы →</span></button><button class="bp-level disabled" onclick="BP.soonA1()"><span class="ico">🎯</span><b>Хочу готовиться к A1</b><p>Базовые знания уже есть. Хочу перейти к структуре и заданиям экзамена A1.</p><span class="cta">Скоро</span></button></div>',2);
}
const DIAG=[
  {q:'Какая это немецкая буква?',big:'W',opts:['V','W','U'],ok:1},
  {q:'Как читается начало слова Wasser?',big:'Wasser',opts:['примерно «вассер»','примерно «фассер»','примерно «уассер»'],ok:0},
  {q:'Какое слово вы услышали?',audio:'wohnen',opts:['wohnen','kommen','Wasser'],ok:0},
  {q:'Что означает ich?',big:'ich',opts:['ты','я','мы'],ok:1},
  {q:'Произнесите короткое слово',big:'Wasser',speak:true}
];
function diagnostic(){
  const i=state.diagIndex,item=DIAG[i];
  if(i>=DIAG.length){diagnosticResult();return}
  let task='<div class="bp-step-label"><span>Быстрая проверка · 3–5 минут</span><span>'+(i+1)+' / '+DIAG.length+'</span></div><div class="bp-progress"><i style="width:'+Math.round(i/DIAG.length*100)+'%"></i></div><div class="bp-card">';
  task+='<div class="bp-kicker">Диагностика</div><h2 class="bp-title">'+esc(item.q)+'</h2>';
  if(item.big)task+='<div class="'+(item.big.length===1?'bp-letter':'bp-word')+'">'+esc(item.big)+'</div>';
  if(item.audio)task+='<button class="bp-btn secondary block" onclick="BP.play(\''+item.audio+'\',this)">🔊 Слушать</button>';
  if(item.speak){
    task+='<button class="bp-btn primary block" onclick="BP.diagSpeak()">🎤 Произнести и продолжить</button>';
  }else{
    task+='<div class="bp-options">'+item.opts.map((o,j)=>'<button class="bp-option" onclick="BP.diagAnswer('+j+',this)">'+esc(o)+'</button>').join('')+'</div>';
  }
  task+='</div><div class="bp-note" style="margin-top:12px">Если есть пробелы, OTTO предложит быстро повторить, но не будет блокировать продолжение.</div>';
  app(screenHead('Проверка алфавита','Коротко и без экзамена','BP.level()')+task,'learn');
}
function diagnosticResult(){
  const good=state.diagScore>=4;
  app(screenHead('Результат проверки','Можно выбрать стартовую точку','BP.level()')+
    '<div class="bp-card"><div class="bp-kicker">'+(good?'Готово':'Нужно чуть закрепить')+'</div><h2 class="bp-title">'+(good?'Отлично. Алфавит можно пропустить.':'Есть несколько вещей, которые лучше быстро повторить.')+'</h2><p>Результат: <b>'+state.diagScore+' / '+DIAG.length+'</b></p></div>'+
    (good?'<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.continueBase()">Продолжить</button>':'<div class="bp-row" style="margin-top:12px"><button class="bp-btn primary" onclick="BP.repeatAlphabet()">Повторить</button><button class="bp-btn secondary" onclick="BP.continueBase()">Всё равно продолжить</button></div>'),'learn');
}
function home(){
  const pct=progress();
  const body='<section class="bp-hero"><div><div class="bp-kicker">Текущий этап</div><h1>Базовый немецкий</h1><p>От алфавита и чтения до простых немецких предложений. Старый материал постоянно возвращается.</p><div class="bp-pills"><span class="bp-pill">без жёстких блокировок</span><span class="bp-pill">слух + письмо + речь</span><span class="bp-pill">повторение</span></div></div><img src="/otto/otto-home.webp" alt="OTTO"></section>'+
  '<div class="bp-home-layout" style="margin-top:16px"><section class="bp-section"><div class="bp-section-head"><h2>Продолжить</h2><small>'+pct+'% Preview</small></div><div class="bp-card"><div class="bp-next"><div class="bp-next-icon">🔤</div><div><h3>Алфавит и чтение</h3><p>Буквы через реальные слова: услышать → выбрать → вспомнить → написать → произнести.</p></div><button class="bp-btn primary small" onclick="BP.alphabet()">Начать</button></div><div class="bp-progress"><i style="width:'+pct+'%"></i></div></div><div class="bp-section-head"><h2>Базовый путь</h2><small>Preview примеры</small></div>'+pathList()+'</section>'+
  '<section class="bp-section"><div class="bp-section-head"><h2>Сегодня</h2><small>старое + новое</small></div><div class="bp-card"><h3>🧠 А это помнишь?</h3><p>Даже во время новой темы OTTO неожиданно возвращает старые слова и буквы.</p><button class="bp-btn secondary block" style="margin-top:12px" onclick="BP.nextSession()">Посмотреть повторение</button></div><div class="bp-card"><h3>⚠ Мои ошибки</h3><p>'+state.errors.length+' слабых элемента в Preview.</p><button class="bp-btn secondary block" style="margin-top:12px" onclick="BP.errors()">Потренировать мои ошибки</button></div><div class="bp-card"><h3>🎯 Подготовка к A1</h3><p>Следующий большой этап.</p><span class="bp-badge" style="margin-top:10px">Скоро</span></div></section></div>';
  app(body,'home',true);
}
function pathList(){
  const rows=[
    ['alphabet','🔤','Алфавит и чтение','Буквы, звуки, чтение в контексте','BP.alphabet()'],
    ['pronouns','👤','Местоимения','ich, du, er, sie, es, wir, ihr, sie, Sie','BP.pronouns()'],
    ['verbs','⚡','Основные глаголы','wohnen, sein, haben, kommen, sprechen…','BP.verb()'],
    ['nouns','🏠','Существительные','Сразу со статьёй: das Haus, der Bus…','BP.noun()'],
    ['numbers','🔢','Числа','Возраст, телефон, цена, время, адрес','BP.numbers()'],
    ['sentence','🧩','Как строится предложение','КТО · ДЕЙСТВИЕ · ГДЕ','BP.sentence()'],
    ['exam','✓','Проверим, что ты уже умеешь','Каркас итоговой проверки','BP.exam()']
  ];
  return '<div class="bp-path">'+rows.map((r,i)=>'<button class="bp-path-item '+(i===0?'current':'')+'" onclick="'+r[4]+'"><span class="ico">'+r[1]+'</span><span><b>'+r[2]+'</b><small>'+r[3]+'</small></span><span class="state">'+(state.completed.includes(r[0])?'✓':'Открыть')+'</span></button>').join('')+'<button class="bp-path-item soon" onclick="BP.soonA1()"><span class="ico">🎯</span><span><b>Подготовка к A1</b><small>Структура и задания экзамена</small></span><span class="state">Скоро</span></button></div>';
}
function learn(){
  app(screenHead('Учусь','Весь базовый путь','BP.home()')+pathList(),'learn');
}
const ALPHA_STEPS=12;
function alphabet(){
  state.screen='alphabet';save();renderAlpha();
}
function alphaHeader(){
  return screenHead('Алфавит и чтение','Занятие 1 · маленькая группа букв','BP.learn()')+
  '<div class="bp-step-label"><span>W · A · S</span><span>'+(state.alphaStep+1)+' / '+ALPHA_STEPS+'</span></div><div class="bp-progress"><i style="width:'+Math.round((state.alphaStep+1)/ALPHA_STEPS*100)+'%"></i></div>';
}
function renderAlpha(){
  let b=alphaHeader();
  const s=state.alphaStep;
  if(s===0)b+='<div class="bp-card"><div class="bp-kicker">Сегодня</div><h2 class="bp-title">Не учим 26 букв подряд</h2><p class="bp-lead">Берём маленькую группу и сразу встречаем буквы в настоящих словах.</p><div class="bp-pronoun-grid" style="margin-top:14px"><div class="bp-pronoun"><b>W</b><small>Wasser · wohnen</small></div><div class="bp-pronoun"><b>A</b><small>Anna · Abend</small></div><div class="bp-pronoun"><b>S</b><small>Schule · Stadt</small></div></div><button class="bp-btn primary block" style="margin-top:14px" onclick="BP.alphaNext()">Начать</button></div>';
  if(s===1)b+='<div class="bp-card"><div class="bp-kicker">Буква в контексте</div><div class="bp-letter">W</div><div class="bp-word">Wasser</div><div class="bp-translation">вода</div><div class="bp-audio"><button class="bp-btn secondary" onclick="BP.play(\'W\',this,\'letter\')">🔊 W</button><button class="bp-btn secondary" onclick="BP.play(\'Wasser\',this)">🔊 Wasser</button><button class="bp-btn secondary" onclick="BP.play(\'wohnen\',this)">🔊 wohnen</button></div><div class="bp-note">Немецкая <b>W</b> в этих словах звучит примерно как русский «в».</div><button class="bp-btn primary block" onclick="BP.alphaNext()">Дальше</button></div>';
  if(s===2)b+=alphaChoice('Найди букву','В каком слове есть W?',['Bus','Wasser','Schule'],1,'Wasser содержит W.');
  if(s===3)b+=alphaChoice('Вставь пропущенную букву','_asser',['V','W','B'],1,'Получается Wasser.');
  if(s===4)b+='<div class="bp-card"><div class="bp-kicker">Что услышал?</div><h2 class="bp-title">Слушай, не смотри на перевод</h2><button class="bp-btn secondary block" onclick="BP.play(\'Wasser\',this)">🔊 Воспроизвести</button><div class="bp-options"><button class="bp-option" onclick="BP.alphaAnswer(false,this)">wohnen</button><button class="bp-option" onclick="BP.alphaAnswer(true,this)">Wasser</button><button class="bp-option" onclick="BP.alphaAnswer(false,this)">Schule</button></div>'+alphaFeedback()+'</div>';
  if(s===5){
    const pool=['W','a','s','s','e','r'];
    b+='<div class="bp-card"><div class="bp-kicker">Собери слово</div><h2 class="bp-title">Wasser</h2><div class="bp-assembly">'+(state.alphaAssembly.length?state.alphaAssembly.map(x=>'<span>'+esc(x)+'</span>').join(''):'<small>Нажимайте буквы</small>')+'</div><div class="bp-tokens">'+pool.map((x,i)=>'<button class="bp-token" onclick="BP.alphaToken('+i+')">'+x+'</button>').join('')+'</div><div class="bp-row"><button class="bp-btn secondary" onclick="BP.alphaClear()">Очистить</button><button class="bp-btn primary" onclick="BP.alphaCheckWord()">Проверить</button></div>'+alphaFeedback()+'</div>';
  }
  if(s===6)b+='<div class="bp-card"><div class="bp-kicker">Напиши по памяти</div><h2 class="bp-title">Как по-немецки «вода»?</h2><p class="bp-lead">Слово уже исчезло. Теперь не узнаём, а вспоминаем сами.</p><input id="alphaWrite" class="bp-input" autocomplete="off" style="margin-top:14px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.alphaWrite()">Проверить</button>'+alphaFeedback()+'</div>';
  if(s===7)b+='<div class="bp-card"><div class="bp-kicker">Прочитай вслух</div><div class="bp-word">Wasser</div><p class="bp-lead">Сначала можно ещё раз услышать, потом произнести самому.</p><div class="bp-audio"><button class="bp-btn secondary" onclick="BP.play(\'Wasser\',this)">🔊 Послушать</button><button class="bp-btn primary" onclick="BP.alphaSpeak()">🎤 Произнести</button></div><div class="bp-note">Используется существующий механизм проверки произношения OTTO. Если не получится несколько раз, урок не блокируется — слабое место вернётся позже.</div></div>';
  if(s===8)b+='<div class="bp-card"><div class="bp-kicker">Как читается?</div><h2 class="bp-title">W в слове Wasser</h2><div class="bp-options"><button class="bp-option" onclick="BP.alphaRule(false,this)">как «ф»</button><button class="bp-option" onclick="BP.alphaRule(true,this)">примерно как «в»</button></div>'+alphaFeedback()+'</div>';
  if(s===9)b+='<div class="bp-card"><div class="bp-kicker">Смешиваем новые буквы</div><h2 class="bp-title">A · S · W</h2><div class="bp-mini-list"><div class="bp-mini"><span class="n">A</span><div><b>Anna</b><small>буква встречается в знакомом имени</small></div></div><div class="bp-mini"><span class="n">S</span><div><b>Stadt · Schule</b><small>два разных сочетания со знакомой S</small></div></div><div class="bp-mini"><span class="n">W</span><div><b>Wasser · wohnen</b><small>старое сразу перемешивается с новым</small></div></div></div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.alphaNext()">Дальше</button></div>';
  if(s===10)b+='<div class="bp-card"><div class="bp-kicker">А это помнишь?</div><h2 class="bp-title">Какой буквой начинается слово?</h2><div class="bp-word">Wasser</div><div class="bp-options"><button class="bp-option" onclick="BP.alphaAnswer(false,this)">V</button><button class="bp-option" onclick="BP.alphaAnswer(true,this)">W</button><button class="bp-option" onclick="BP.alphaAnswer(false,this)">U</button></div>'+alphaFeedback()+'<div class="bp-note">Старый материал возвращается неожиданно, а не только в отдельном тесте.</div></div>';
  if(s===11)b+='<div class="bp-card"><div class="bp-kicker">Занятие завершено</div><h2 class="bp-title">Сегодня не просто посмотрели буквы</h2><div class="bp-mini-list"><div class="bp-mini"><span class="n">✓</span><div><b>услышали</b><small>букву и реальные слова</small></div></div><div class="bp-mini"><span class="n">✓</span><div><b>вспомнили и написали</b><small>без готового ответа перед глазами</small></div></div><div class="bp-mini"><span class="n">✓</span><div><b>произнесли</b><small>с существующей проверкой OTTO</small></div></div></div><div class="bp-row" style="margin-top:14px"><button class="bp-btn secondary" onclick="BP.skipAlphabet()">Пропустить этот раздел</button><button class="bp-btn primary" onclick="BP.finishAlphabet()">Завершить занятие</button></div></div>';
  app(b,'learn');
}
function alphaChoice(k,q,opts,ok,msg){
  return '<div class="bp-card"><div class="bp-kicker">'+k+'</div><h2 class="bp-title">'+q+'</h2><div class="bp-options">'+opts.map((x,i)=>'<button class="bp-option" onclick="BP.alphaChoiceAnswer('+(i===ok)+',this,\''+esc(msg).replace(/'/g,'&#39;')+'\')">'+x+'</button>').join('')+'</div>'+alphaFeedback()+'</div>';
}
function alphaFeedback(){
  if(!state.alphaFeedback)return '';
  const bad=state.alphaFeedback.startsWith('Что произошло');
  return '<div class="bp-feedback '+(bad?'bad':'good')+'">'+state.alphaFeedback+'</div>';
}
function alphaWrongFeedback(){
  state.alphaAttempts++;
  if(state.alphaAttempts>=2){
    addError('w-rule','W / Wasser','чтение','W в Wasser пока путается. Вернём это позже.');
    return '<b>Что произошло</b>W перепуталась с другой буквой.<br><b>Как правильно</b>В Wasser буква W звучит примерно как «в».<br><b>Попробуй ещё раз</b>🔊 послушай Wasser и выбери ответ.';
  }
  return '<b>Что произошло</b>Ответ пока не совпал.<br><b>Как правильно</b>Посмотри на слово и послушай ещё раз.<br><b>Попробуй ещё раз</b>';
}
function addError(id,item,kind,detail){
  if(!state.errors.some(x=>x.id===id))state.errors.push({id,item,kind,detail});
  save();
}
function nextSession(){
  state.reviewStep=0;go('nextSession');
}
const REVIEWS=[
  {q:'Какое слово ты услышал?',audio:'Wasser',opts:['Wasser','wohnen','Schule'],ok:0},
  {q:'Вставь пропущенную букву',big:'_asser',opts:['W','V','B'],ok:0},
  {q:'Как читается W в Wasser?',big:'W',opts:['примерно «в»','примерно «ф»','не произносится'],ok:0},
  {q:'Прочитай старое слово вслух',big:'Wasser',speak:true}
];
function nextSessionScreen(){
  const i=state.reviewStep;
  if(i>=REVIEWS.length){
    app(screenHead('Новое занятие','Старое уже вспомнили','BP.home()')+'<div class="bp-card"><div class="bp-kicker">Готово</div><h2 class="bp-title">Отлично. Теперь новая тема.</h2><p class="bp-lead">Именно так начинается следующий день, если вчера были изучены буквы и слова.</p><button class="bp-btn primary block" style="margin-top:14px" onclick="BP.pronouns()">Перейти к примеру «Местоимения»</button></div>','learn');return;
  }
  const r=REVIEWS[i];
  let x=screenHead('Сначала вспомним вчерашнее','3–7 коротких заданий до нового материала','BP.home()')+'<div class="bp-step-label"><span>Повторение</span><span>'+(i+1)+' / '+REVIEWS.length+'</span></div><div class="bp-progress"><i style="width:'+Math.round(i/REVIEWS.length*100)+'%"></i></div><div class="bp-card"><div class="bp-kicker">А это помнишь?</div><h2 class="bp-title">'+esc(r.q)+'</h2>';
  if(r.big)x+='<div class="'+(r.big.length===1?'bp-letter':'bp-word')+'">'+r.big+'</div>';
  if(r.audio)x+='<button class="bp-btn secondary block" onclick="BP.play(\''+r.audio+'\',this)">🔊 Слушать</button>';
  if(r.speak)x+='<button class="bp-btn primary block" onclick="BP.reviewSpeak()">🎤 Произнести</button>';
  else x+='<div class="bp-options">'+r.opts.map((o,j)=>'<button class="bp-option" onclick="BP.reviewAnswer('+(j===r.ok)+',this)">'+o+'</button>').join('')+'</div>';
  x+='</div>';
  app(x,'learn');
}
function pronouns(){
  state.pronounStep=0;go('pronouns');
}
function pronounScreen(){
  const s=state.pronounStep;
  let b=screenHead('Местоимения','Только базовый набор и сразу в контексте','BP.learn()')+'<div class="bp-step-label"><span>Пример урока</span><span>'+(s+1)+' / 4</span></div><div class="bp-progress"><i style="width:'+((s+1)*25)+'%"></i></div>';
  if(s===0)b+='<div class="bp-card"><h2 class="bp-title">Кто вместо имени?</h2><div class="bp-pronoun-grid">'+[['ich','я'],['du','ты'],['er','он'],['sie','она / они'],['es','оно'],['wir','мы'],['ihr','вы, мн.'],['Sie','Вы, вежливо']].map(x=>'<div class="bp-pronoun"><b>'+x[0]+'</b><small>'+x[1]+'</small></div>').join('')+'</div><div class="bp-note" style="margin-top:12px">mich, mir, dich, dir и другие формы пока не добавляем.</div><button class="bp-btn primary block" onclick="BP.pronounNext()">Применить</button></div>';
  if(s===1)b+='<div class="bp-card"><h2 class="bp-title">Anna → ?</h2><div class="bp-options"><button class="bp-option" onclick="BP.simpleNext(false,this,\'pronoun\')">er</button><button class="bp-option" onclick="BP.simpleNext(true,this,\'pronoun\')">sie</button><button class="bp-option" onclick="BP.simpleNext(false,this,\'pronoun\')">ich</button></div></div>';
  if(s===2)b+='<div class="bp-card"><h2 class="bp-title">Peter → ?</h2><div class="bp-options"><button class="bp-option" onclick="BP.simpleNext(true,this,\'pronoun\')">er</button><button class="bp-option" onclick="BP.simpleNext(false,this,\'pronoun\')">sie</button><button class="bp-option" onclick="BP.simpleNext(false,this,\'pronoun\')">wir</button></div></div>';
  if(s===3)b+='<div class="bp-card"><div class="bp-word">Ich wohne in Berlin.</div><p class="bp-lead">Кто говорит?</p><div class="bp-options"><button class="bp-option" onclick="BP.finishPronoun(this)">я</button><button class="bp-option" onclick="BP.simpleWrong(this)">он</button><button class="bp-option" onclick="BP.simpleWrong(this)">они</button></div></div>';
  app(b,'learn');
}
function verb(){
  state.verbStep=0;go('verb');
}
function verbScreen(){
  const s=state.verbStep;let b=screenHead('Основные глаголы','Не таблица — слово сразу работает во фразе','BP.learn()')+'<div class="bp-step-label"><span>wohnen</span><span>'+(s+1)+' / 4</span></div><div class="bp-progress"><i style="width:'+((s+1)*25)+'%"></i></div>';
  if(s===0)b+='<div class="bp-card"><div class="bp-word">wohnen</div><div class="bp-translation">жить / проживать</div><div class="bp-audio"><button class="bp-btn secondary" onclick="BP.play(\'wohnen\',this)">🔊 Послушать</button><button class="bp-btn primary" onclick="BP.verbNext()">Дальше</button></div></div>';
  if(s===1)b+='<div class="bp-card"><div class="bp-word">Ich wohne in Berlin.</div><div class="bp-translation">Я живу в Берлине.</div><button class="bp-btn secondary block" onclick="BP.play(\'Ich wohne in Berlin.\',this)">🔊 Послушать фразу</button><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.verbNext()">Дальше</button></div>';
  if(s===2)b+='<div class="bp-card"><h2 class="bp-title">Ich ____ in Hamburg.</h2><div class="bp-options"><button class="bp-option" onclick="BP.simpleWrong(this)">komme</button><button class="bp-option" onclick="BP.verbNextAnswer(this)">wohne</button><button class="bp-option" onclick="BP.simpleWrong(this)">trinke</button></div></div>';
  if(s===3)b+='<div class="bp-card"><h2 class="bp-title">Скажи без подсказки</h2><p class="bp-lead">«Я живу в Берлине.»</p><button class="bp-btn primary block" style="margin-top:14px" onclick="BP.finishVerb()">🎤 Произнести: Ich wohne in Berlin.</button></div>';
  app(b,'learn');
}
function noun(){
  state.nounStep=0;go('noun');
}
function nounScreen(){
  const s=state.nounStep;let b=screenHead('Существительные','Слово сразу вместе с артиклем','BP.learn()')+'<div class="bp-step-label"><span>Артикль + слово</span><span>'+(s+1)+' / 3</span></div><div class="bp-progress"><i style="width:'+Math.round((s+1)/3*100)+'%"></i></div>';
  if(s===0)b+='<div class="bp-card"><h2 class="bp-title">Запоминаем вместе</h2><div class="bp-pronoun-grid"><div class="bp-pronoun"><b>das Haus</b><small>дом</small></div><div class="bp-pronoun"><b>der Bus</b><small>автобус</small></div><div class="bp-pronoun"><b>die Schule</b><small>школа</small></div></div><div class="bp-note" style="margin-top:12px">Сейчас главное — понимать и использовать слово, но постепенно запоминаем его вместе с артиклем.</div><button class="bp-btn primary block" onclick="BP.nounNext()">Проверить</button></div>';
  if(s===1)b+='<div class="bp-card"><h2 class="bp-title">Как будет «автобус»?</h2><div class="bp-options"><button class="bp-option" onclick="BP.simpleWrong(this)">die Bus</button><button class="bp-option" onclick="BP.nounNextAnswer(this)">der Bus</button><button class="bp-option" onclick="BP.simpleWrong(this)">das Bus</button></div></div>';
  if(s===2)b+='<div class="bp-card"><div class="bp-word">der Bus</div><button class="bp-btn secondary block" onclick="BP.play(\'der Bus\',this)">🔊 Послушать</button><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.finishNoun()">Готово → продолжить</button></div>';
  app(b,'learn');
}
function numbers(){
  go('numbers');
}
function numberScreen(){
  app(screenHead('Числа','Не список: сразу в возрасте, цене, времени и адресе','BP.learn()')+
  '<div class="bp-grid2"><div class="bp-card"><div class="bp-kicker">Принцип</div><h2 class="bp-title">21 = ein + und + zwanzig</h2><p>Сначала единица, затем <b>und</b>, потом десяток.</p><div class="bp-mini-list" style="margin-top:12px"><div class="bp-mini"><span class="n">35</span><div><b>Ich bin 35 Jahre alt.</b><small>возраст</small></div></div><div class="bp-mini"><span class="n">17€</span><div><b>Das kostet 17 Euro.</b><small>цена</small></div></div><div class="bp-mini"><span class="n">12</span><div><b>Gartenstraße 12</b><small>номер дома</small></div></div></div></div><div class="bp-number-box"><div class="bp-kicker">Как произнести число?</div><p class="bp-lead">Введите любое число от 0 до 9999.</p><input id="numberInput" class="bp-input" inputmode="numeric" placeholder="Например, 127" value="127" style="margin-top:12px"><button class="bp-btn secondary block" style="margin-top:9px" onclick="BP.makeNumber()">Показать</button><div id="numberResult" class="bp-number-result">einhundertsiebenundzwanzig</div><div class="bp-row"><button class="bp-btn secondary" onclick="BP.listenNumber()">🔊 Послушать</button><button class="bp-btn primary" onclick="BP.repeatNumber()">🎤 Повторить</button></div></div></div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.finishNumbers()">Завершить пример урока</button>','learn');
}
function sentence(){
  state.sentenceStep=0;state.sentenceAssembly=[];go('sentence');
}
function sentenceScreen(){
  const s=state.sentenceStep;let b=screenHead('Как строится предложение','Сначала видим закономерность, потом правило','BP.learn()');
  if(s===0)b+='<div class="bp-card"><div class="bp-kicker">Русский смысл</div><h2 class="bp-title">Я живу в Берлине.</h2><div class="bp-structure"><div><b>КТО</b><span>Я</span></div><div><b>ДЕЙСТВИЕ</b><span>живу</span></div><div><b>ГДЕ</b><span>в Берлине</span></div></div><button class="bp-btn primary block" style="margin-top:14px" onclick="BP.sentenceNext()">Теперь по-немецки</button></div>';
  if(s===1)b+='<div class="bp-card"><div class="bp-structure"><div><b>КТО</b><span>Ich</span></div><div><b>ДЕЙСТВИЕ</b><span>wohne</span></div><div><b>ГДЕ</b><span>in Berlin</span></div></div><div class="bp-word">Ich wohne in Berlin.</div><button class="bp-btn primary block" onclick="BP.sentenceNext()">Собрать самому</button></div>';
  if(s===2){
    const tokens=['in Berlin','wohne','Ich'];
    b+='<div class="bp-card"><h2 class="bp-title">Собери: «Я живу в Берлине»</h2><div class="bp-assembly">'+(state.sentenceAssembly.length?state.sentenceAssembly.map(x=>'<span>'+x+'</span>').join(''):'<small>Нажимайте блоки</small>')+'</div><div class="bp-tokens">'+tokens.map((x,i)=>'<button class="bp-token" onclick="BP.sentenceToken('+i+')">'+x+'</button>').join('')+'</div><div class="bp-row"><button class="bp-btn secondary" onclick="BP.sentenceClear()">Очистить</button><button class="bp-btn primary" onclick="BP.sentenceCheck()">Проверить</button></div></div>';
  }
  if(s===3)b+='<div class="bp-card"><h2 class="bp-title">Сравни</h2><div class="bp-word" style="font-size:24px">Ich arbeite heute.</div><div class="bp-word" style="font-size:24px">Heute arbeite ich.</div><div class="bp-note"><b>Посмотри:</b> Heute стало первым, но глагол <b>arbeite</b> остался на втором месте.</div><p class="bp-lead">Сначала человек замечает закономерность. Только потом OTTO формулирует простое правило.</p><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.finishSentence()">Готово</button></div>';
  app(b,'learn');
}
function errorsScreen(){
  app(screenHead('Мои ошибки','Не наказание, а персональное повторение','BP.home()')+
  '<div class="bp-note">Ошибки не заставляют проходить весь урок заново. OTTO возвращает именно слабое слово, звук или конструкцию.</div><div class="bp-error-list" style="margin-top:12px">'+state.errors.map((e,i)=>'<div class="bp-error"><div><b>'+esc(e.item)+'</b><small>'+esc(e.kind)+' · '+esc(e.detail)+'</small></div><button class="bp-btn secondary small" onclick="BP.trainError('+i+')">Потренировать</button></div>').join('')+'</div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.trainErrors()">Потренировать мои ошибки</button>','errors');
}
function settingsScreen(){
  app(screenHead('Настройки','Стартовую точку можно менять без потери прогресса','BP.home()')+
  '<div class="bp-card"><div class="bp-settings-row"><div><b>Аккаунт</b><small>Preview-пользователь · регистрация демонстрационная</small></div><span>›</span></div><div class="bp-settings-row"><div><b>Текущий этап</b><small>'+state.currentStage+'</small></div><span>База</span></div><div class="bp-settings-row"><div><b>Изменить стартовую точку</b><small>С нуля / после проверки алфавита</small></div><button class="bp-btn secondary small" onclick="BP.level()">Изменить</button></div><div class="bp-settings-row"><div><b>Вернуться к алфавиту</b><small>Прогресс не теряется</small></div><button class="bp-btn secondary small" onclick="BP.alphabet()">Открыть</button></div><div class="bp-settings-row"><div><b>Открыть другой базовый урок</b><small>Для Preview все примеры доступны</small></div><button class="bp-btn secondary small" onclick="BP.learn()">Выбрать</button></div><div class="bp-settings-row"><div><b>Выйти</b><small>В Preview возвращает на демонстрационную регистрацию</small></div><button class="bp-btn danger-soft small" onclick="BP.logout()">Выйти</button></div></div>','settings');
}
function examScreen(){
  app(screenHead('Проверим, что ты уже умеешь','Каркас итогового экзамена базового этапа','BP.learn()')+
  '<div class="bp-card"><div class="bp-kicker">Финальная проверка</div><div class="bp-score">20–25 <small>заданий</small></div><p>Финальная оценка: <b>0–100 баллов</b>. Учитывается не только последний тест, но и накопленная история ошибок, вспоминание, произношение, написание и чтение.</p></div><div class="bp-section"><div class="bp-section-head"><h2>Что проверяем</h2><small>каркас</small></div><div class="bp-exam-grid">'+['буквы и чтение','произношение','написание','изученные слова','местоимения','глаголы','существительные','числа','предлоги и союзы','простые конструкции','порядок слов','голосовые задания'].map((x,i)=>'<div class="bp-card"><b>'+(i+1)+'. '+x+'</b></div>').join('')+'</div></div><div class="bp-card" style="margin-top:12px"><h3>Примеры голосом</h3><div class="bp-mini-list"><div class="bp-mini"><span class="n">🎤</span><div><b>Прочитать новое простое слово</b></div></div><div class="bp-mini"><span class="n">🎤</span><div><b>Назвать число</b></div></div><div class="bp-mini"><span class="n">🎤</span><div><b>Сказать: Ich wohne in Berlin.</b></div></div></div></div><div class="bp-note good" style="margin-top:12px"><b>70/100 и выше:</b> «Ты готов(а) перейти дальше.»</div><div class="bp-note warn"><b>Ниже 70:</b> OTTO показывает конкретные слабые места. Можно потренировать их или всё равно перейти дальше — жёсткой блокировки нет.</div><div class="bp-card"><h3>После базового этапа</h3><p>Теперь у тебя есть основа: ты читаешь простые немецкие слова, понимаешь базовую лексику и умеешь строить простые предложения.</p><button class="bp-level disabled" style="margin-top:12px" onclick="BP.soonA1()"><span class="ico">🎯</span><b>Подготовка к A1</b><p>Следующий этап.</p><span class="cta">Скоро</span></button></div>','learn');
}

function numberWord(n){
  n=Number(n);
  if(!Number.isInteger(n)||n<0||n>9999)return '';
  const ones=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
  const tens=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
  function under100(x){
    if(x<20)return ones[x];
    const t=Math.floor(x/10),u=x%10;
    if(!u)return tens[t];
    return (u===1?'ein':ones[u])+'und'+tens[t];
  }
  function under1000(x){
    if(x<100)return under100(x);
    const h=Math.floor(x/100),r=x%100;
    return (h===1?'einhundert':ones[h]+'hundert')+(r?under100(r):'');
  }
  if(n<1000)return under1000(n);
  const th=Math.floor(n/1000),r=n%1000;
  return (th===1?'eintausend':under1000(th)+'tausend')+(r?under1000(r):'');
}
function render(){
  if(state.screen==='register')return register();
  if(state.screen==='level')return level();
  if(state.screen==='diagnostic')return diagnostic();
  if(state.screen==='home')return home();
  if(state.screen==='learn')return learn();
  if(state.screen==='alphabet')return renderAlpha();
  if(state.screen==='nextSession')return nextSessionScreen();
  if(state.screen==='pronouns')return pronounScreen();
  if(state.screen==='verb')return verbScreen();
  if(state.screen==='noun')return nounScreen();
  if(state.screen==='numbers')return numberScreen();
  if(state.screen==='sentence')return sentenceScreen();
  if(state.screen==='errors')return errorsScreen();
  if(state.screen==='settings')return settingsScreen();
  if(state.screen==='exam')return examScreen();
  return home();
}

window.BP={
  play,
  nav(id){if(id==='home')go('home');if(id==='learn')go('learn');if(id==='errors')go('errors');if(id==='settings')go('settings')},
  home(){go('home')},learn(){go('learn')},errors(){go('errors')},settings(){go('settings')},level(){go('level')},
  regEmail(){state.regStep='email';go('register')},
  regTelegram(){state.regStep='done';state.level=null;go('level')},
  regWelcome(){state.regStep='welcome';go('register')},
  sendCode(){const v=document.getElementById('bpEmail')?.value.trim()||'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){toast('Введите корректный email.');return}state.email=v;state.regStep='otp';go('register')},
  otp(el,i){el.value=el.value.replace(/\D/g,'').slice(-1);const n=document.querySelector('[data-otp="'+(i+1)+'"]');if(el.value&&n)n.focus()},
  verifyCode(){const v=[...document.querySelectorAll('[data-otp]')].map(x=>x.value).join('');if(v.length!==6){toast('Введите 6 цифр. В Preview подходит любой код.');return}state.regStep='done';go('level')},
  startZero(){state.level='zero';state.alphaStep=0;go('home')},
  startDiagnostic(){state.level='base';state.diagIndex=0;state.diagScore=0;go('diagnostic')},
  soonA1(){root.insertAdjacentHTML('beforeend','<div class="bp-modal-backdrop" id="soonModal"><div class="bp-modal"><span class="bp-badge">Скоро</span><h3 style="margin-top:12px">Подготовка к A1</h3><p class="bp-lead">Этот второй большой этап будем делать позже. Сейчас Preview проверяет только «Базовый немецкий».</p><button class="bp-btn primary block" style="margin-top:14px" onclick="this.closest(&quot;.bp-modal-backdrop&quot;).remove()">Понятно</button></div></div>')},
  diagAnswer(idx,b){const item=DIAG[state.diagIndex],ok=idx===item.ok;b.classList.add(ok?'correct':'wrong');if(ok)state.diagScore++;setTimeout(()=>{state.diagIndex++;save();render()},420)},
  diagSpeak(){pronounce('Wasser');state.diagScore++;setTimeout(()=>{state.diagIndex++;save();render()},200)},
  continueBase(){state.level='base';go('home')},
  repeatAlphabet(){state.alphaStep=0;go('alphabet')},
  alphabet(){state.alphaStep=Math.min(state.alphaStep,ALPHA_STEPS-1);go('alphabet')},
  alphaNext(){state.alphaFeedback='';state.alphaAttempts=0;state.alphaStep=Math.min(ALPHA_STEPS-1,state.alphaStep+1);save();render()},
  alphaChoiceAnswer(ok,b,msg){if(ok){b.classList.add('correct');state.alphaFeedback='<b>Верно ✓</b>'+msg;save();setTimeout(()=>{state.alphaStep++;state.alphaFeedback='';state.alphaAttempts=0;save();render()},450)}else{b.classList.add('wrong');state.alphaFeedback=alphaWrongFeedback();save();setTimeout(render,600)}},
  alphaAnswer(ok,b){if(ok){b.classList.add('correct');state.alphaFeedback='<b>Верно ✓</b>Это именно тот материал, который уже встречался.';save();setTimeout(()=>{state.alphaStep++;state.alphaFeedback='';state.alphaAttempts=0;save();render()},450)}else{b.classList.add('wrong');state.alphaFeedback=alphaWrongFeedback();save();setTimeout(render,600)}},
  alphaToken(i){const pool=['W','a','s','s','e','r'];state.alphaAssembly.push(pool[i]);save();render()},
  alphaClear(){state.alphaAssembly=[];state.alphaFeedback='';save();render()},
  alphaCheckWord(){if(state.alphaAssembly.join('')==='Wasser'){state.alphaFeedback='<b>Верно ✓</b>Слово собрано из букв.';save();setTimeout(()=>{state.alphaStep++;state.alphaAssembly=[];state.alphaFeedback='';save();render()},550)}else{state.alphaFeedback=alphaWrongFeedback();save();render()}},
  alphaWrite(){const v=(document.getElementById('alphaWrite')?.value||'').trim().toLowerCase();if(v==='wasser'){state.alphaFeedback='<b>Верно ✓</b>Ты вспомнил(а) слово без вариантов ответа.';save();setTimeout(()=>{state.alphaStep++;state.alphaFeedback='';save();render()},550)}else{addError('wasser-write','Wasser','написание','Слово не получилось написать по памяти.');state.alphaFeedback='<b>Что произошло</b>Слово пока не вспомнилось полностью.<br><b>Как правильно</b>Wasser<br><b>Попробуй ещё раз</b>Напиши слово снова.';save();render()}},
  alphaSpeak(){pronounce('Wasser');setTimeout(()=>{state.alphaStep++;save();render()},180)},
  alphaRule(ok,b){if(ok){b.classList.add('correct');state.alphaFeedback='<b>Верно ✓</b>W в Wasser звучит примерно как «в».';save();setTimeout(()=>{state.alphaStep++;state.alphaFeedback='';save();render()},480)}else{b.classList.add('wrong');state.alphaFeedback=alphaWrongFeedback();save();setTimeout(render,600)}},
  skipAlphabet(){complete('alphabet');toast('Вы сможете вернуться к алфавиту в любое время. Прогресс сохранится.');setTimeout(()=>go('home'),650)},
  finishAlphabet(){complete('alphabet');go('nextSession')},
  nextSession,
  reviewAnswer(ok,b){b.classList.add(ok?'correct':'wrong');if(!ok)addError('review-'+state.reviewStep,'Вчерашний материал','повторение','На старте нового занятия возникла ошибка.');setTimeout(()=>{state.reviewStep++;save();render()},420)},
  reviewSpeak(){pronounce('Wasser');setTimeout(()=>{state.reviewStep++;save();render()},180)},
  pronouns,
  pronounNext(){state.pronounStep++;save();render()},
  simpleNext(ok,b,type){if(!ok){b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),450);return}b.classList.add('correct');setTimeout(()=>{if(type==='pronoun')state.pronounStep++;save();render()},420)},
  simpleWrong(b){b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),450)},
  finishPronoun(b){b.classList.add('correct');complete('pronouns');setTimeout(()=>go('learn'),450)},
  verb,
  verbNext(){state.verbStep++;save();render()},
  verbNextAnswer(b){b.classList.add('correct');setTimeout(()=>{state.verbStep++;save();render()},420)},
  finishVerb(){pronounce('Ich wohne in Berlin.');complete('verbs');setTimeout(()=>go('learn'),220)},
  noun,
  nounNext(){state.nounStep++;save();render()},
  nounNextAnswer(b){b.classList.add('correct');setTimeout(()=>{state.nounStep++;save();render()},420)},
  finishNoun(){complete('nouns');go('learn')},
  numbers,
  makeNumber(){const n=document.getElementById('numberInput')?.value||'';const w=numberWord(n);document.getElementById('numberResult').textContent=w||'Введите число от 0 до 9999.'},
  listenNumber(){const n=document.getElementById('numberInput')?.value||'127',w=numberWord(n);if(w)play(w,null)},
  repeatNumber(){const n=document.getElementById('numberInput')?.value||'127',w=numberWord(n);if(w)pronounce(w)},
  finishNumbers(){complete('numbers');go('learn')},
  sentence,
  sentenceNext(){state.sentenceStep++;save();render()},
  sentenceToken(i){const p=['in Berlin','wohne','Ich'];state.sentenceAssembly.push(p[i]);save();render()},
  sentenceClear(){state.sentenceAssembly=[];save();render()},
  sentenceCheck(){if(state.sentenceAssembly.join(' ')==='Ich wohne in Berlin'){state.sentenceStep++;state.sentenceAssembly=[];save();render()}else{addError('sentence-order','Ich wohne in Berlin.','порядок слов','Блоки предложения собраны не в том порядке.');toast('Порядок пока не тот. Попробуйте ещё раз.')}},
  finishSentence(){complete('sentence');go('learn')},
  trainError(i){const e=state.errors[i];if(!e)return;if(e.item.includes('Wasser')||e.item==='W / Wasser'){play('Wasser');pronounce('Wasser')}else if(e.item==='wohnen'){play('wohnen');pronounce('wohnen')}else toast('Этот слабый элемент OTTO вернёт отдельным микроупражнением.')},
  trainErrors(){if(!state.errors.length){toast('Слабых мест пока нет.');return}go('alphabet')},
  exam(){go('exam')},
  logout(){localStorage.removeItem(STORE);state=clone(DEFAULT);render()},
};

render();
})();