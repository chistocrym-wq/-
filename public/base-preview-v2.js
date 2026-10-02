(() => {
'use strict';

const root=document.getElementById('app');
if(!root)return;

const STORE='ottoStartBasePreviewV3';
const clone=x=>JSON.parse(JSON.stringify(x));
const DEFAULT={
  screen:'register',regStep:'welcome',email:'',level:null,
  diagIndex:0,diagScore:0,
  alphaStep:0,readingRule:0,readingPhase:0,readingTestStep:0,readingTestScore:0,pronounStep:0,verbStep:0,nounStep:0,sentenceStep:0,reviewStep:0,sessions:0,
  feedback:'',lessonInput:'',assembly:[],
  completed:[],currentStage:'Базовый немецкий',
  errors:[]
};
let state=load();
let toastTimer=null;

function load(){try{return Object.assign(clone(DEFAULT),JSON.parse(localStorage.getItem(STORE)||'{}'))}catch{return clone(DEFAULT)}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function norm(v){return String(v??'').trim().toLocaleLowerCase('de-DE').replace(/[.,!?]/g,'').replace(/\s+/g,' ')}
function speech(){return window.OttoSpeechV18||window.OttoSpeechV17||window.OttoSpeechV15||null}
function play(text,button,kind){const api=speech();if(api?.play)return api.play(text,{mode:'normal',kind:kind||'text',button});toast('Озвучка OTTO ещё загружается. Попробуйте ещё раз.')}
function pronounce(text){const api=speech();if(api?.check)return api.check(text,[text]);toast('Проверка произношения OTTO ещё загружается.')}
function toast(message){document.querySelector('.bp-toast')?.remove();const el=document.createElement('div');el.className='bp-toast';el.textContent=message;document.body.appendChild(el);clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),3200)}
function go(screen){state.screen=screen;state.feedback='';state.assembly=[];save();render()}
function complete(id){if(!state.completed.includes(id)){state.completed.push(id);state.sessions=(state.sessions||0)+1}save()}
function addError(id,item,kind,detail){const existing=state.errors.find(x=>x.id===id);if(existing){existing.count=(existing.count||1)+1;existing.detail=detail}else state.errors.push({id,item,kind,detail,count:1});save()}
function progress(){
 const totalUnits=30+15+6+13+10+11+1+7;
 let done=0;
 done+=state.completed.includes('alphabet')?30:Math.min(30,Math.max(0,Number(state.alphaStep||0)-1));
 done+=state.completed.includes('reading')?15:Math.min(15,Math.max(0,Number(state.readingRule||0))+(Number(state.readingPhase||0)/5));
 done+=state.completed.includes('readingTest')?6:Math.min(6,Math.max(0,Number(state.readingTestStep||0)));
 done+=state.completed.includes('pronouns')?13:Math.min(13,Math.max(0,Number(state.pronounStep||0)));
 done+=state.completed.includes('verbs')?10:Math.min(10,Math.max(0,Number(state.verbStep||0)));
 done+=state.completed.includes('nouns')?11:Math.min(11,Math.max(0,Number(state.nounStep||0)));
 done+=state.completed.includes('numbers')?1:0;
 done+=state.completed.includes('sentence')?7:Math.min(7,Math.max(0,Number(state.sentenceStep||0)));
 return Math.max(0,Math.min(100,Math.round(done/totalUnits*100)));
}
function currentTopic(){
 if(state.screen==='alphabet'||!state.completed.includes('alphabet'))return 'Алфавит';
 if(state.screen==='reading'||!state.completed.includes('reading'))return 'Как читаются немецкие слова';
 if(state.screen==='readingTest'||state.screen==='readingPraise'||!state.completed.includes('readingTest'))return 'Уже умеешь читать?';
 if(state.screen==='pronouns'||!state.completed.includes('pronouns'))return 'Личные местоимения';
 if(state.screen==='verb'||!state.completed.includes('verbs'))return 'Основные глаголы';
 if(state.screen==='noun'||!state.completed.includes('nouns'))return 'Существительные';
 if(state.screen==='numbers'||!state.completed.includes('numbers'))return 'Числа';
 if(state.screen==='sentence'||!state.completed.includes('sentence'))return 'Как строится предложение';
 return 'Финальная проверка';
}
function continueAction(){
 const t=currentTopic();
 if(t==='Алфавит')return 'BP.alphabet()';
 if(t==='Как читаются немецкие слова')return 'BP.reading()';
 if(t==='Уже умеешь читать?')return 'BP.readingTest()';
 if(t==='Личные местоимения')return 'BP.pronouns()';
 if(t==='Основные глаголы')return 'BP.verb()';
 if(t==='Существительные')return 'BP.noun()';
 if(t==='Числа')return 'BP.numbers()';
 if(t==='Как строится предложение')return 'BP.sentence()';
 return 'BP.exam()';
}
function progressStats(){
 const learned=Math.max(0,
  Math.min(30,Math.max(0,Number(state.alphaStep||0)-1))+
  Math.min(15,Number(state.readingRule||0))+
  Math.min(9,Math.floor(Number(state.pronounStep||0)/2))+
  Math.min(6,Math.floor(Number(state.verbStep||0)/2))+
  Math.min(5,Math.floor(Number(state.nounStep||0)/2))
 );
 return {pct:progress(),done:state.completed.length,learned,review:state.errors.length,sessions:Number(state.sessions||0)}
}
function progressStats(){return {pct:progress(),done:state.completed.length,learned:Math.max(0,state.completed.length*5),review:state.errors.length,sessions:Math.max(1,state.completed.length)}}
function setFeedback(html){state.feedback=html;save()}
function feedback(){return state.feedback?'<div class="bp-feedback '+(state.feedback.includes('Что произошло')?'bad':'good')+'">'+state.feedback+'</div>':''}

function top(){return '<header class="bp-top"><div class="bp-brand"><img src="/otto/otto-home.webp" alt="OTTO"><div><b>Otto Start</b><small>Базовый немецкий</small></div></div><button class="bp-icon" type="button" onclick="BP.settings()" aria-label="Настройки">⚙</button></header>'}
function nav(active){const items=[['home','⌂','Главная'],['learn','▦','Учусь'],['errors','⚠','Мои ошибки'],['settings','⚙','Настройки']];return '<nav class="bp-bottom">'+items.map(x=>'<button type="button" class="'+(active===x[0]?'active':'')+'" onclick="BP.nav(\''+x[0]+'\')"><span>'+x[1]+'</span>'+x[2]+'</button>').join('')+'</nav>'}
function app(body,active='learn',wide=false){root.innerHTML='<div class="bp-app">'+top()+'<main class="bp-main"><div class="bp-shell '+(wide?'wide':'')+'">'+body+'</div></main>'+nav(active)+'</div>';scrollTo(0,0)}
function screenHead(title,sub,back='BP.learn()'){return '<div class="bp-screen-head"><button class="bp-back" onclick="'+back+'">←</button><div class="text"><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></div></div>'}
function onboarding(body,step){const dots=[0,1,2].map((_,i)=>'<i class="'+(i<=step?'on':'')+'"></i>').join('');root.innerHTML='<div class="bp-app"><main class="bp-main"><div class="bp-onboard"><section class="bp-onboard-card"><div class="bp-onboard-hero"><div class="copy"><span class="bp-badge">OTTO START</span><h1 class="bp-title">Немецкий с самого начала</h1><p class="bp-lead">Будем двигаться постепенно: от первых букв к простым немецким фразам.</p></div><img src="/otto/otto-guide.webp" alt="OTTO"></div><div class="bp-onboard-body"><div class="bp-progress-dots">'+dots+'</div>'+body+'</div></section></div></main></div>';scrollTo(0,0)}
function lessonProgress(label,step,total){return '<div class="bp-step-label"><span>'+esc(label)+'</span><span>'+(step+1)+' / '+total+'</span></div><div class="bp-progress"><i style="width:'+Math.round((step+1)/total*100)+'%"></i></div>'}
function lessonNav(prev,skip,sectionSkip){let x='<div class="bp-lesson-nav">';if(prev)x+='<button type="button" onclick="'+prev+'">← Назад</button>';if(skip)x+='<button type="button" onclick="'+skip+'">Пропустить задание</button>';x+='<button type="button" onclick="BP.learn()">Вернуться к темам</button>';if(sectionSkip)x+='<button type="button" onclick="'+sectionSkip+'">Пропустить раздел</button>';return x+'</div>'}
function choice(opts,correct,handler='BP.answerChoice'){return '<div class="bp-options">'+opts.map((o,i)=>'<button class="bp-option" onclick="'+handler+'('+(i===correct)+',this)">'+esc(o)+'</button>').join('')+'</div>'}
function titleCard(kicker,title,lead=''){return '<div class="bp-card"><div class="bp-kicker">'+esc(kicker)+'</div><h2 class="bp-title">'+esc(title)+'</h2>'+(lead?'<p class="bp-lead">'+esc(lead)+'</p>':'')}
function advance(key,total){state.feedback='';state[key]=Math.min(total-1,state[key]+1);save();render()}
function back(key){state.feedback='';state[key]=Math.max(0,state[key]-1);save();render()}
function markChoice(ok,b,key,total,id,item,detail){b.classList.add(ok?'correct':'wrong');if(!ok&&id)addError(id,item,'ошибка в задании',detail);setTimeout(()=>advance(key,total),ok?320:650)}
function checkWrite(inputId,target,key,total,id,item){const v=norm(document.getElementById(inputId)?.value||'');const t=norm(target);const nounForms=[t,norm('das '+target),norm('der '+target),norm('die '+target)];if(v===t||nounForms.includes(v)){setFeedback('<b>Верно ✓</b> Самостоятельно вспомнили написание.');setTimeout(()=>advance(key,total),520);return true}let hint='Правильно: <b>'+esc(target)+'</b>.';if(target==='wohnen'&&v==='wohne')hint='Почти. Здесь нужно <b>wohnen</b>. Посмотри на окончание слова: <b>-en</b>.';else if(target==='Wasser'&&v==='waser')hint='Почти. В <b>Wasser</b> две буквы <b>s</b>.';else if(target==='kommen'&&v==='kome')hint='Почти. В <b>kommen</b> две буквы <b>m</b>.';addError(id,item,'написание',hint.replace(/<[^>]+>/g,''));setFeedback('<b>Что произошло</b> Написание пока неточное.<br><b>Как правильно</b> '+hint+'<br><b>Что дальше</b> OTTO сохранит ошибку и вернёт этот элемент позже в другом задании.');setTimeout(()=>advance(key,total),1100);return false}

function register(){
  if(state.regStep==='welcome')return onboarding('<h2 class="bp-title">Привет! Я OTTO.</h2><p class="bp-lead">Сначала регистрация, потом выбор стартовой точки.</p><div class="bp-grid2" style="margin-top:16px"><button class="bp-level" onclick="BP.regEmail()"><span class="ico">✉</span><b>Продолжить по Email</b><p>Email → код → профиль.</p><span class="cta">Продолжить</span></button><button class="bp-level" onclick="BP.regTelegram()"><span class="ico">➤</span><b>Продолжить через Telegram</b><p>Тот же принцип единого аккаунта OTTO.</p><span class="cta">Продолжить</span></button></div>',0);
  if(state.regStep==='email')return onboarding('<button class="bp-btn secondary small" onclick="BP.regWelcome()">← Назад</button><h2 class="bp-title">Ваш email</h2><input id="bpEmail" class="bp-input" type="email" placeholder="name@example.com" value="'+esc(state.email)+'" style="margin-top:12px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.sendCode()">Получить код</button>',0);
  if(state.regStep==='otp')return onboarding('<button class="bp-btn secondary small" onclick="BP.regEmail()">← Изменить email</button><h2 class="bp-title">Введите код</h2><p class="bp-lead">В Preview подходят любые 6 цифр.</p><div class="bp-otp" style="margin-top:12px">'+[0,1,2,3,4,5].map(i=>'<input class="bp-input" inputmode="numeric" maxlength="1" data-otp="'+i+'" oninput="BP.otp(this,'+i+')">').join('')+'</div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.verifyCode()">Подтвердить</button>',1);
  level();
}
function level(){onboarding('<h2 class="bp-title">Давайте определим ваш уровень</h2><p class="bp-lead">Стартовую точку потом можно изменить без потери прогресса.</p><div class="bp-levels" style="margin-top:16px"><button class="bp-level" onclick="BP.startZero()"><span class="ico">🌱</span><b>Начинаю с нуля</b><p>Я практически не знаю немецкий. Начнём с алфавита, чтения и первых слов.</p><span class="cta">Начать с самого начала →</span></button><button class="bp-level" onclick="BP.startDiagnostic()"><span class="ico">🔤</span><b>Алфавит уже знаю</b><p>Я знаю немецкий алфавит и некоторые простые слова.</p><span class="cta">Продолжить с базы →</span></button><button class="bp-level disabled" onclick="BP.soonA1()"><span class="ico">🎯</span><b>Хочу готовиться к A1</b><p>Базовые знания уже есть. Хочу перейти к структуре экзамена.</p><span class="cta">Скоро</span></button></div>',2)}

const DIAG=[
  {q:'Какая это немецкая буква?',big:'W',opts:['V','W','U'],ok:1},
  {q:'Как читается начало Wasser?',big:'Wasser',opts:['примерно «вассер»','примерно «фассер»','примерно «уассер»'],ok:0},
  {q:'Какое слово вы услышали?',audio:'wohnen',opts:['wohnen','kommen','Wasser'],ok:0},
  {q:'Что означает ich?',big:'ich',opts:['ты','я','мы'],ok:1},
  {q:'Произнесите короткое слово',big:'Wasser',speak:true}
];
function diagnostic(){const i=state.diagIndex;if(i>=DIAG.length)return diagnosticResult();const t=DIAG[i];let b=screenHead('Проверка алфавита','3–5 минут','BP.level()')+lessonProgress('Диагностика',i,DIAG.length)+titleCard('Короткая проверка',t.q);if(t.big)b+='<div class="'+(t.big.length===1?'bp-letter':'bp-word')+'">'+esc(t.big)+'</div>';if(t.audio)b+='<button class="bp-btn secondary block" onclick="BP.play(\''+t.audio+'\',this)">🔊 Слушать</button>';if(t.speak)b+='<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.diagSpeak()">🎤 Произнести и продолжить</button>';else b+=choice(t.opts,t.ok,'BP.diagAnswer');b+='</div>'+lessonNav('', 'BP.diagSkip()','');app(b,'learn')}
function diagnosticResult(){const good=state.diagScore>=4;app(screenHead('Результат','Стартовую точку можно выбрать самому','BP.level()')+'<div class="bp-card"><div class="bp-kicker">'+(good?'Готово':'Нужно чуть закрепить')+'</div><h2 class="bp-title">'+(good?'Отлично. Алфавит можно пропустить.':'Есть несколько вещей, которые лучше быстро повторить.')+'</h2><p>Результат: <b>'+state.diagScore+' / '+DIAG.length+'</b></p></div>'+(good?'<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.continueBase()">Продолжить</button>':'<div class="bp-row" style="margin-top:12px"><button class="bp-btn primary" onclick="BP.repeatAlphabet()">Повторить</button><button class="bp-btn secondary" onclick="BP.continueBase()">Всё равно продолжить</button></div>'),'learn')}

function home(){
  const st=progressStats(),current=currentTopic(),action=continueAction();
  const body='<section class="bp-hero"><div><div class="bp-kicker">OTTO START</div><h1>Базовый немецкий</h1><p>Продолжаем с того места, где вы остановились.</p></div><img src="/otto/otto-home.webp" alt="OTTO"></section>'+
  '<div class="bp-home-layout" style="margin-top:16px"><section class="bp-section"><div class="bp-card bp-progress-card"><h3>Ваш прогресс</h3><div class="bp-progress-value">Базовый немецкий · '+st.pct+'%</div><div class="bp-progress"><i style="width:'+st.pct+'%"></i></div><p><b>Сейчас:</b> '+current+'</p><div class="bp-progress-mini"><span>Занятий: '+st.sessions+'</span><span>Изучено: '+st.learned+'</span><span>На повторение: '+st.review+'</span></div><button class="bp-btn primary block" style="margin-top:12px" onclick="'+action+'">Продолжить занятие</button></div><div class="bp-section-head"><h2>Базовый путь</h2></div>'+pathList()+'</section>'+
  '<section class="bp-section"><div class="bp-card"><h3>⚠ Мои ошибки</h3><p>'+state.errors.length+' элементов ждут повторения.</p><button class="bp-btn secondary block" style="margin-top:12px" onclick="BP.errors()">Открыть</button></div><div class="bp-card"><h3>🎯 Подготовка к A1</h3><p>Откроется после базового этапа.</p><span class="bp-badge" style="margin-top:10px">Скоро</span></div></section></div>';
  app(body,'home',true)
}
function pathList(){
  const rows=[
    ['alphabet','🔤','Алфавит','A–Z, затем Ä · Ö · Ü · ß','BP.alphabet()'],
    ['reading','📖','Как читаются немецкие слова','sch · w · ei · ie · ch и другие правила','BP.reading()'],
    ['readingTest','✓','Уже умеешь читать?','мини-проверка после алфавита и чтения','BP.readingTest()'],
    ['pronouns','👤','Личные местоимения','ich · du · er · sie …','BP.pronouns()'],
    ['verbs','⚡','Основные глаголы','слово → слух → письмо → готовая фраза','BP.verb()'],
    ['nouns','🏠','Существительные','слово сразу вместе с артиклем','BP.noun()'],
    ['numbers','🔢','Числа','возраст · цена · время · адрес','BP.numbers()'],
    ['sentence','🧩','Как строится предложение','КТО · ДЕЙСТВИЕ · ОСТАЛЬНОЕ','BP.sentence()']
  ];
  return '<div class="bp-path">'+rows.map(r=>'<button class="bp-path-item" onclick="'+r[4]+'"><span class="ico">'+r[1]+'</span><span><b>'+r[2]+'</b><small>'+r[3]+'</small></span><span class="state">'+(state.completed.includes(r[0])?'✓':'Открыть')+'</span></button>').join('')+'<button class="bp-path-item soon" onclick="BP.soonA1()"><span class="ico">🎯</span><span><b>Подготовка к A1</b><small>следующий этап</small></span><span class="state">Скоро</span></button></div>'
}

function learn(){app(screenHead('Учусь','Базовые темы','BP.home()')+pathList(),'learn')}

const ALPHABET=[
['A','A','Anna'],['B','Be','Bus'],['C','Ce','Café'],['D','De','Deutsch'],['E','E','Essen'],['F','Ef','Frau'],['G','Ge','Guten Tag'],['H','Ha','Haus'],['I','I','ich'],['J','Jot','ja'],['K','Ka','Kaffee'],['L','El','lernen'],['M','Em','Mutter'],['N','En','nein'],['O','O','Oma'],['P','Pe','Pass'],['Q','Ku','Quelle'],['R','Er','rot'],['S','Es','Sonne'],['T','Te','Tag'],['U','U','Uhr'],['V','Vau','Vater'],['W','We','Wasser'],['X','Ix','Taxi'],['Y','Ypsilon','Yoga'],['Z','Zett','Zeit'],['Ä','Ä','Äpfel'],['Ö','Ö','Österreich'],['Ü','Ü','Tür'],['ß','Eszett','Straße']
];
const ALPHA_TOTAL=ALPHABET.length+2;
function alphabet(){state.alphaStep=0;state.feedback='';go('alphabet')}
function renderAlpha(){
 const s=state.alphaStep;
 let b=screenHead('Алфавит','A–Z · Ä · Ö · Ü · ß','BP.learn()')+lessonProgress('Алфавит',s,ALPHA_TOTAL);
 if(s===0){
   b+=titleCard('Немецкий алфавит','Сначала увидим порядок')+'<div class="bp-alphabet-map">'+ALPHABET.map(x=>'<span>'+x[0]+'</span>').join('')+'</div><p class="bp-lead" style="margin-top:12px">Не нужно запоминать всё сразу. Дальше пойдём по одной букве.</p><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.alphaNext()">Начать с A</button></div>';
 } else if(s<=ALPHABET.length){
   const idx=s-1, row=ALPHABET[idx], next=ALPHABET[Math.min(idx+1,ALPHABET.length-1)][0], prev=ALPHABET[Math.max(0,idx-1)][0];
   b+=titleCard('Буква '+(idx+1)+' из '+ALPHABET.length,row[0])+
      '<div class="bp-letter">'+row[0]+'</div><div class="bp-translation">Название: '+row[1]+'</div>'+
      '<div class="bp-audio"><button class="bp-btn secondary" onclick="BP.play(\''+row[0]+'\',this,\'letter\')">🔊 Буква</button><button class="bp-btn secondary" onclick="BP.play(\''+row[2].replace(/'/g,"\\'")+'\',this)">🔊 '+row[2]+'</button></div>'+
      '<div class="bp-word">'+row[2]+'</div><p class="bp-lead">Найди букву '+row[0]+'.</p>'+
      choice([prev,row[0],next],1,'BP.alphaChoice')+'</div>';
 } else {
   b+=titleCard('Готово','Алфавит пройден')+'<p class="bp-lead">Теперь отдельно разберём, как буквы и сочетания читаются внутри немецких слов.</p><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.finishAlphabet()">Перейти к правилам чтения</button></div>';
 }
 b+=lessonNav(s>0?'BP.alphaBack()':'','BP.alphaSkipTask()','');
 app(b,'learn')
}

const REVIEWS=[{q:'Какое слово услышал?',audio:'Wasser',opts:['Wasser','Schule','Abend'],ok:0},{q:'Какой буквой начинается Anna?',opts:['W','A','S'],ok:1},{q:'Прочитай старое слово',big:'Schule',speak:true},{q:'Напиши первую букву слова Wasser',write:'W'}];
function nextSession(){state.reviewStep=0;go('nextSession')}
function nextSessionScreen(){const s=state.reviewStep;if(s>=REVIEWS.length)return app(screenHead('Новое занятие','Старое уже вспомнили','BP.home()')+titleCard('Готово','Отлично. Теперь новая тема.','После 3–7 коротких повторений переходим к новому материалу.')+'<button class="bp-btn primary block" style="margin-top:14px" onclick="BP.pronouns()">Местоимения</button></div>','learn');const r=REVIEWS[s];let b=screenHead('Сначала вспомним вчерашнее','Короткое повторение','BP.home()')+lessonProgress('А это помнишь?',s,REVIEWS.length)+titleCard('Повторение',r.q);if(r.audio)b+='<button class="bp-btn secondary block" onclick="BP.play(\''+r.audio+'\',this)">🔊 Слушать</button>';if(r.big)b+='<div class="bp-word">'+r.big+'</div>';if(r.speak)b+='<button class="bp-btn primary block" onclick="BP.reviewSpeak(\''+r.big+'\')">🎤 Произнести</button>';else if(r.write)b+='<input id="reviewInput" class="bp-input" maxlength="1" style="margin-top:12px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.reviewWrite(\''+r.write+'\')">Проверить</button>';else b+=choice(r.opts,r.ok,'BP.reviewChoice');b+='</div>'+lessonNav(s>0?'BP.reviewBack()':'','BP.reviewSkip()','');app(b,'learn')}

const READING_RULES=[
 {key:'j',sound:'«й»',examples:['ja','Jahr'],listen:'ja',newWord:'jetzt'},
 {key:'ei',sound:'примерно «ай»',examples:['nein','drei','heißen'],listen:'drei',newWord:'mein'},
 {key:'ie',sound:'долгое «и»',examples:['vier','sieben','hier'],listen:'sieben',newWord:'Liebe'},
 {key:'sch',sound:'«ш»',examples:['Schule','Schwester'],listen:'Schule',newWord:'Schrank'},
 {key:'ch после i/e',sound:'мягкий [ç]',examples:['ich','mich','nicht'],listen:'ich',newWord:'Milch'},
 {key:'ch после a/o/u/au',sound:'более твёрдый [x]',examples:['acht','auch','Buch'],listen:'Buch',newWord:'machen'},
 {key:'z',sound:'«ц»',examples:['zwei','zehn','Zeit'],listen:'Zeit',newWord:'Zimmer'},
 {key:'w',sound:'«в»',examples:['Wasser','wohnen','wo'],listen:'wohnen',newWord:'wer'},
 {key:'v',sound:'часто «ф»',examples:['Vater','vier','Vogel'],listen:'Vater',newWord:'viel'},
 {key:'sp в начале',sound:'примерно «шп»',examples:['Sport','sprechen'],listen:'Sport',newWord:'spielen'},
 {key:'st в начале',sound:'примерно «шт»',examples:['Stadt','Straße'],listen:'Straße',newWord:'stehen'},
 {key:'eu / äu',sound:'примерно «ой»',examples:['heute','neun','Häuser'],listen:'heute',newWord:'Freund'},
 {key:'ß',sound:'глухой «с»',examples:['heißen','Straße','groß'],listen:'Straße',newWord:'Fuß'},
 {key:'ä / ö / ü',sound:'отдельные немецкие гласные',examples:['Mädchen','schön','fünf'],listen:'fünf',newWord:'Tür'},
 {key:'-e / -er',sound:'ослабленно, но не исчезают',examples:['bitte','Name','Vater'],listen:'Mutter',newWord:'Bruder'}
];
function reading(){state.readingRule=0;state.readingPhase=0;go('reading')}
function readingScreen(){
 const r=READING_RULES[state.readingRule], p=state.readingPhase;
 let b=screenHead('Как читаются немецкие слова','слушаем · читаем · пишем','BP.learn()');
 if(!r){
   b+=titleCard('Раздел завершён','Правила чтения пройдены')+'<button class="bp-btn primary block" onclick="BP.finishReading()">Перейти к мини-проверке</button></div>';
   return app(b,'learn');
 }
 b+=lessonProgress('Правило '+(state.readingRule+1)+' из '+READING_RULES.length,p,5);
 if(p===0)b+=titleCard('Правило',r.key+' → '+r.sound)+'<div class="bp-word">'+r.examples.join(' · ')+'</div><div class="bp-audio">'+r.examples.map(x=>'<button class="bp-btn secondary" onclick="BP.play(\''+x+'\',this)">🔊 '+x+'</button>').join('')+'</div><button class="bp-btn primary block" onclick="BP.readingNext()">Потренироваться</button></div>';
 if(p===1)b+=titleCard('На слух','Какое слово произнёс OTTO?')+'<button class="bp-btn secondary block" onclick="BP.play(\''+r.listen+'\',this)">🔊 Слушать</button>'+choice([r.listen,r.newWord,'Wasser'],0,'BP.readingChoice')+'</div>';
 if(p===2)b+=titleCard('Найди правило','Где здесь '+r.key+'?')+'<div class="bp-word">'+r.examples[0]+'</div><button class="bp-btn primary block" onclick="BP.readingNext()">Нашёл(ла) → дальше</button></div>';
 if(p===3)b+=titleCard('Прочитай самостоятельно',r.newWord)+'<div class="bp-word">'+r.newWord+'</div><button class="bp-btn primary block" onclick="BP.readingSpeak(\''+r.newWord+'\')">🎤 Прочитать</button></div>';
 if(p===4)b+=titleCard('Напиши то, что услышал',r.listen)+'<button class="bp-btn secondary block" onclick="BP.play(\''+r.listen+'\',this)">🔊 Слушать ещё раз</button><input id="readingInput" class="bp-input" autocomplete="off" style="margin-top:12px"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.readingWrite(\''+r.listen+'\')">Проверить</button>'+feedback()+'</div>';
 b+=lessonNav((p>0||state.readingRule>0)?'BP.readingBack()':'','BP.readingSkip()','');
 app(b,'learn')
}
const READING_TEST=[
 {type:'choice',q:'Как читается sch?',opts:['примерно «ш»','примерно «ай»','примерно «ц»'],ok:0},
 {type:'audio',q:'Какое слово услышал?',word:'drei',opts:['drei','vier','hier'],ok:0},
 {type:'choice',q:'Как прочитать новое слово mein?',opts:['по правилу ei','по правилу ie','как написано по-русски'],ok:0},
 {type:'speak',q:'Прочитай новое слово',word:'Schrank'},
 {type:'speak',q:'Прочитай новое слово',word:'Zimmer'},
 {type:'audio',q:'Что услышал?',word:'heute',opts:['heute','hier','Haus'],ok:0}
];
function readingTest(){state.readingTestStep=0;go('readingTest')}
function readingTestScreen(){
 const s=state.readingTestStep,t=READING_TEST[s];
 let b=screenHead('Уже умеешь читать?','мини-проверка','BP.learn()');
 if(!t){complete('readingTest');state.screen='readingPraise';save();return render()}
 b+=lessonProgress('Мини-тест',s,READING_TEST.length)+titleCard('Задание '+(s+1),t.q);
 if(t.type==='audio')b+='<button class="bp-btn secondary block" onclick="BP.play(\''+t.word+'\',this)">🔊 Слушать</button>'+choice(t.opts,t.ok,'BP.readingTestChoice');
 else if(t.type==='choice')b+=choice(t.opts,t.ok,'BP.readingTestChoice');
 else b+='<div class="bp-word">'+t.word+'</div><button class="bp-btn primary block" onclick="BP.readingTestSpeak(\''+t.word+'\')">🎤 Прочитать</button>';
 b+='</div>'+lessonNav(s>0?'BP.readingTestBack()':'','BP.readingTestSkip()','');
 app(b,'learn')
}
function readingPraiseScreen(){
 const score=Math.round((Number(state.readingTestScore||0)/Math.max(1,READING_TEST.length))*100);
 app(screenHead('Готово','Первые правила чтения уже работают','BP.learn()')+'<div class="bp-card bp-praise"><img src="/otto/otto-guide.webp" alt="OTTO"><div><h2 class="bp-title">Отлично! Видишь — ты уже читаешь первые слова по-немецки 😊</h2><p class="bp-lead">А ведь совсем недавно это были просто незнакомые буквы. То ли ещё будет!</p><div class="bp-progress"><i style="width:'+score+'%"></i></div><small>Мини-проверка · '+score+'%</small><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.pronouns()">Дальше: местоимения</button></div></div>','learn')
}
const P_TOTAL=13;
function pronouns(){state.pronounStep=0;state.feedback='';go('pronouns')}
function pronounScreen(){
 const s=state.pronounStep;
 let b=screenHead('Личные местоимения','разберём по одному','BP.learn()')+lessonProgress('Местоимения',s,P_TOTAL);
 const all=[['ich','я'],['du','ты'],['er','он'],['sie','она'],['es','оно'],['wir','мы'],['ihr','вы'],['sie','они'],['Sie','Вы']];
 if(s===0)b+=titleCard('Личные местоимения','Сколько их будет')+'<div class="bp-pronoun-grid">'+all.map(x=>'<div class="bp-pronoun"><b>'+x[0]+'</b><small>'+x[1]+'</small></div>').join('')+'</div><p class="bp-lead" style="margin-top:12px">Не нужно запоминать всё сейчас. Дальше разберём каждое отдельно.</p><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.pronounNext()">Начать с ich</button></div>';
 if(s===1)b+=titleCard('ich','ich — я')+'<div class="bp-word">Ich bin Anna.</div><button class="bp-btn secondary block" onclick="BP.play(\'ich\',this)">🔊 ich</button>'+choice(['я','ты','он'],0,'BP.pronounChoice')+'</div>';
 if(s===2)b+=titleCard('ich','Напиши: «я»')+'<input id="pronounInput" class="bp-input"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.pronounWrite(\'ich\')">Проверить</button>'+feedback()+'</div>';
 if(s===3)b+=titleCard('du','du — ты')+'<div class="bp-word">Du bist hier.</div><button class="bp-btn secondary block" onclick="BP.play(\'du\',this)">🔊 du</button>'+choice(['мы','ты','она'],1,'BP.pronounChoice')+'</div>';
 if(s===4)b+=titleCard('Смешиваем','Anna → ?')+choice(['er','sie','du'],1,'BP.pronounChoice')+'</div>';
 if(s===5)b+=titleCard('er','er — он')+'<div class="bp-word">Peter → er</div><button class="bp-btn secondary block" onclick="BP.play(\'er\',this)">🔊 er</button>'+choice(['он','она','я'],0,'BP.pronounChoice')+'</div>';
 if(s===6)b+=titleCard('Смешиваем','Peter → ?')+choice(['er','sie','ich'],0,'BP.pronounChoice')+'</div>';
 if(s===7)b+=titleCard('sie','sie — она')+'<div class="bp-word">Anna → sie</div><button class="bp-btn secondary block" onclick="BP.play(\'sie\',this)">🔊 sie</button>'+choice(['она','мы','ты'],0,'BP.pronounChoice')+'</div>';
 if(s===8)b+=titleCard('На слух','Какое местоимение услышал?')+'<button class="bp-btn secondary block" onclick="BP.play(\'ich\',this)">🔊 Слушать</button>'+choice(['ich','du','er'],0,'BP.pronounChoice')+'</div>';
 if(s===9)b+=titleCard('Смешиваем','Какое местоимение в фразе?')+'<button class="bp-btn secondary block" onclick="BP.play(\'Ich bin Anna.\',this)">🔊 Ich bin Anna.</button>'+choice(['ich','du','er'],0,'BP.pronounChoice')+'</div>';
 if(s===10)b+=titleCard('По памяти','Напиши: «ты»')+'<input id="pronounInput" class="bp-input"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.pronounWrite(\'du\')">Проверить</button>'+feedback()+'</div>';
 if(s===11)b+=titleCard('Говорение','Скажи: ich')+'<button class="bp-btn primary block" onclick="BP.pronounSpeak(\'ich\')">🎤 ich</button></div>';
 if(s===12)b+=titleCard('А это помнишь?','Peter → ?')+choice(['er','sie','wir'],0,'BP.finishPronouns')+'</div>';
 b+=lessonNav(s>0?'BP.pronounBack()':'','BP.pronounSkip()','');app(b,'learn')
}

const V_TOTAL=10;
function verb(){state.verbStep=0;state.feedback='';go('verb')}
function verbScreen(){
 const s=state.verbStep;
 let b=screenHead('Основные глаголы','сначала слово, потом готовая фраза','BP.learn()')+lessonProgress('Глаголы',s,V_TOTAL);
 if(s===0)b+=titleCard('wohnen','wohnen — жить')+'<div class="bp-word">wohnen</div><button class="bp-btn secondary block" onclick="BP.play(\'wohnen\',this)">🔊 Послушать</button><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.verbNext()">Дальше</button></div>';
 if(s===1)b+=titleCard('Произношение','wohnen')+'<button class="bp-btn primary block" onclick="BP.verbSpeak(\'wohnen\')">🎤 Произнести слово</button></div>';
 if(s===2)b+=titleCard('Смысл','Что значит wohnen?')+choice(['жить','говорить','работать'],0,'BP.verbChoice')+'</div>';
 if(s===3)b+=titleCard('Написание','Напиши: wohnen')+'<input id="verbInput" class="bp-input"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.verbWrite(\'wohnen\')">Проверить</button>'+feedback()+'</div>';
 if(s===4)b+=titleCard('На слух','Какой глагол услышал?')+'<button class="bp-btn secondary block" onclick="BP.play(\'wohnen\',this)">🔊 Слушать</button>'+choice(['kommen','wohnen','lernen'],1,'BP.verbChoice')+'</div>';
 if(s===5)b+=titleCard('Готовая фраза','Ich wohne in Berlin.')+'<div class="bp-word">Ich wohne in Berlin.</div><p class="bp-lead">Пока просто посмотри на готовую фразу. Скоро разберём, как такие предложения строятся.</p><button class="bp-btn secondary block" onclick="BP.play(\'Ich wohne in Berlin.\',this)">🔊 Послушать</button><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.verbNext()">Дальше</button></div>';
 if(s===6){const t=['in Berlin','wohne','Ich'];b+=titleCard('Собери готовые блоки','Готовая фраза: «Я живу в Берлине»')+'<div class="bp-assembly">'+(state.assembly.length?state.assembly.map(x=>'<span>'+x+'</span>').join(''):'<small>Нажимайте готовые блоки</small>')+'</div><div class="bp-tokens">'+t.map((x,i)=>'<button class="bp-token" onclick="BP.verbToken('+i+')">'+x+'</button>').join('')+'</div><div class="bp-row"><button class="bp-btn secondary" onclick="BP.verbClear()">Очистить</button><button class="bp-btn primary" onclick="BP.verbAssemblyCheck()">Проверить</button></div></div>'}
 if(s===7)b+=titleCard('kommen','kommen — приходить / приезжать')+'<button class="bp-btn secondary block" onclick="BP.play(\'kommen\',this)">🔊 kommen</button>'+choice(['приходить','жить','учить'],0,'BP.verbChoice')+'</div>';
 if(s===8)b+=titleCard('lernen','lernen — учить / изучать')+'<button class="bp-btn secondary block" onclick="BP.play(\'lernen\',this)">🔊 lernen</button>'+choice(['говорить','учить','работать'],1,'BP.verbChoice')+'</div>';
 if(s===9)b+=titleCard('А это помнишь?','wohnen')+choice(['жить','ехать','читать'],0,'BP.finishVerbsChoice')+'</div>';
 b+=lessonNav(s>0?'BP.verbBack()':'','BP.verbSkip()','');app(b,'learn')
}

const N_TOTAL=11;
function noun(){state.nounStep=0;state.feedback='';go('noun')}
function nounScreen(){const s=state.nounStep;let b=screenHead('Существительные','несколько слов · разные механики','BP.learn()')+lessonProgress('Существительные',s,N_TOTAL);
  if(s===0)b+=titleCard('Новое','das Haus — дом','Сразу запоминаем вместе с артиклем.')+'<button class="bp-btn secondary block" onclick="BP.play(\'das Haus\',this)">🔊 das Haus</button><div class="bp-note" style="margin-top:10px">Ich wohne in einem Haus.</div><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.nounNext()">Дальше</button></div>';
  if(s===1)b+=titleCard('Новое на слух','der Bus')+'<button class="bp-btn secondary block" onclick="BP.play(\'der Bus\',this)">🔊 Слушать</button>'+choice(['автобус','вокзал','отель'],0,'BP.nounChoice')+'</div>';
  if(s===2)b+=titleCard('Новое','die Schule — школа')+'<div class="bp-word">die Schule</div>'+choice(['сюда идут учиться','сюда приезжает поезд','здесь ночует турист'],0,'BP.nounChoice')+'</div>';
  if(s===3)b+=titleCard('Новое на слух','der Bahnhof')+'<button class="bp-btn secondary block" onclick="BP.play(\'der Bahnhof\',this)">🔊 Слушать</button>'+choice(['вокзал','дом','школа'],0,'BP.nounChoice')+'</div>';
  if(s===4)b+=titleCard('Возвращаем старое','Напиши: «дом»','Можно с артиклем или без него.')+'<input id="nounInput" class="bp-input" autocomplete="off"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.nounWrite(\'Haus\')">Проверить</button>'+feedback()+'</div>';
  if(s===5)b+=titleCard('Новое по ситуации','Где обычно ночует турист?')+choice(['das Hotel','der Bus','die Schule'],0,'BP.nounChoice')+'</div>';
  if(s===6)b+=titleCard('Найди лишнее','Что не относится к поездке по городу?')+choice(['der Bus','der Bahnhof','das Haus'],2,'BP.nounChoice')+'</div>';
  if(s===7)b+=titleCard('Слушаем предложение','Какое знакомое существительное услышал?')+'<button class="bp-btn secondary block" onclick="BP.play(\'Ich fahre mit dem Bus.\',this)">🔊 Слушать</button>'+choice(['der Bus','das Hotel','die Schule'],0,'BP.nounChoice')+'</div>';
  if(s===8)b+=titleCard('Говорение','Назови слово с артиклем: «отель»')+'<button class="bp-btn primary block" onclick="BP.nounSpeak(\'das Hotel\')">🎤 das Hotel</button></div>';
  if(s===9)b+=titleCard('А это помнишь?','Wir wohnen im Hotel.','Что значит wir?')+choice(['мы','они','Вы'],0,'BP.nounChoice')+'</div>';
  if(s===10)b+=titleCard('Урок завершён','5 существительных в разных контекстах','das Haus · der Bus · die Schule · der Bahnhof · das Hotel')+'<button class="bp-btn primary block" style="margin-top:12px" onclick="BP.finishNouns()">Завершить</button></div>';
  b+=lessonNav(s>0?'BP.nounBack()':'','BP.nounSkip()','');app(b,'learn')}

function numberWord(n){n=Number(n);if(!Number.isInteger(n)||n<0||n>9999)return'';const ones=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];const tens=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];const u100=x=>x<20?ones[x]:(x%10?(x%10===1?'ein':ones[x%10])+'und'+tens[Math.floor(x/10)]:tens[Math.floor(x/10)]);const u1000=x=>x<100?u100(x):(Math.floor(x/100)===1?'einhundert':ones[Math.floor(x/100)]+'hundert')+(x%100?u100(x%100):'');if(n<1000)return u1000(n);return (Math.floor(n/1000)===1?'eintausend':u1000(Math.floor(n/1000))+'tausend')+(n%1000?u1000(n%1000):'')}
function numbers(){go('numbers')}
function numberScreen(){app(screenHead('Числа','контекст + произношение','BP.learn()')+'<div class="bp-grid2"><div class="bp-card"><div class="bp-kicker">Принцип</div><h2 class="bp-title">21 = ein + und + zwanzig</h2><div class="bp-mini-list"><div class="bp-mini"><span class="n">35</span><div><b>Ich bin 35 Jahre alt.</b><small>возраст</small></div></div><div class="bp-mini"><span class="n">17€</span><div><b>Das kostet 17 Euro.</b><small>цена</small></div></div><div class="bp-mini"><span class="n">12</span><div><b>Gartenstraße 12</b><small>номер дома</small></div></div></div></div><div class="bp-number-box"><div class="bp-kicker">Как произнести число?</div><input id="numberInput" class="bp-input" inputmode="numeric" value="127" style="margin-top:12px"><button class="bp-btn secondary block" style="margin-top:9px" onclick="BP.makeNumber()">Показать</button><div id="numberResult" class="bp-number-result">einhundertsiebenundzwanzig</div><div class="bp-row"><button class="bp-btn secondary" onclick="BP.listenNumber(this)">🔊 Послушать</button><button class="bp-btn primary" onclick="BP.repeatNumber()">🎤 Повторить</button></div></div></div><button class="bp-btn primary block" style="margin-top:12px" onclick="BP.finishNumbers()">Завершить пример</button>'+lessonNav('','BP.learn()',''),'learn')}

const S_TOTAL=7;
function sentence(){state.sentenceStep=0;state.feedback='';state.assembly=[];go('sentence')}
function sentenceScreen(){const s=state.sentenceStep;let b=screenHead('Как строится предложение','сборка · письмо · речь','BP.learn()')+lessonProgress('Предложение',s,S_TOTAL);
  if(s===0)b+=titleCard('Русский смысл','Я живу в Берлине.')+'<div class="bp-structure"><div><b>КТО</b><span>Я</span></div><div><b>ДЕЙСТВИЕ</b><span>живу</span></div><div><b>ГДЕ</b><span>в Берлине</span></div></div><button class="bp-btn primary block" style="margin-top:14px" onclick="BP.sentenceNext()">Теперь по-немецки</button></div>';
  if(s===1)b+=titleCard('Немецкие блоки','Ich | wohne | in Berlin.')+'<div class="bp-structure"><div><b>КТО</b><span>Ich</span></div><div><b>ДЕЙСТВИЕ</b><span>wohne</span></div><div><b>ГДЕ</b><span>in Berlin</span></div></div><button class="bp-btn primary block" style="margin-top:14px" onclick="BP.sentenceNext()">Собрать самому</button></div>';
  if(s===2){const t=['in Berlin','wohne','Ich'];b+=titleCard('Собери предложение','Я живу в Берлине')+'<div class="bp-assembly">'+(state.assembly.length?state.assembly.map(x=>'<span>'+x+'</span>').join(''):'<small>Нажимайте блоки</small>')+'</div><div class="bp-tokens">'+t.map((x,i)=>'<button class="bp-token" onclick="BP.sentenceToken('+i+')">'+x+'</button>').join('')+'</div><div class="bp-row"><button class="bp-btn secondary" onclick="BP.sentenceClear()">Очистить</button><button class="bp-btn primary" onclick="BP.sentenceCheck()">Проверить</button></div></div>'}
  if(s===3)b+=titleCard('Теперь без блоков','Напиши: «Я живу в Берлине.»')+'<input id="sentenceInput" class="bp-input" autocomplete="off"><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.sentenceWrite()">Проверить</button>'+feedback()+'</div>';
  if(s===4)b+=titleCard('Говорение','Скажи: «Я живу в Берлине.»')+'<button class="bp-btn secondary block" onclick="BP.play(\'Ich wohne in Berlin.\',this)">🔊 Послушать</button><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.sentenceSpeak()">🎤 Сказать</button></div>';
  if(s===5)b+=titleCard('Замечаем правило','Heute arbeite ich.')+'<div class="bp-word" style="font-size:24px">Ich arbeite heute.</div><div class="bp-word" style="font-size:24px">Heute arbeite ich.</div><div class="bp-note"><b>Посмотри:</b> Heute стало первым, но глагол arbeite остался на втором месте.</div><button class="bp-btn primary block" style="margin-top:10px" onclick="BP.sentenceNext()">Дальше</button></div>';
  if(s===6)b+=titleCard('А это помнишь?','Peter → ?','Старое местоимение возвращается уже после темы предложения.')+choice(['er','sie','wir'],0,'BP.finishSentenceChoice')+'</div>';
  b+=lessonNav(s>0?'BP.sentenceBack()':'','BP.sentenceSkip()','');app(b,'learn')}

function errorsScreen(){app(screenHead('Мои ошибки','Повторим то, что пока даётся сложнее','BP.home()')+'<div class="bp-error-list">'+(state.errors.length?state.errors.map((e,i)=>'<div class="bp-error"><div><b>'+esc(e.item)+'</b><small>'+esc(e.detail)+'</small></div><button class="bp-btn secondary small" onclick="BP.trainError('+i+')">Потренировать</button></div>').join(''):'<div class="bp-card"><b>Ошибок пока нет.</b></div>')+'</div>','errors')}
function settingsScreen(){
 const st=progressStats(),current=currentTopic();
 app(screenHead('Настройки','Личный кабинет и прогресс','BP.home()')+
 '<div class="bp-card"><h3>Мой прогресс</h3><div class="bp-progress-value">Базовый немецкий · '+st.pct+'%</div><div class="bp-progress"><i style="width:'+st.pct+'%"></i></div><div class="bp-progress-grid"><div><b>'+current+'</b><small>текущая тема</small></div><div><b>'+st.done+'</b><small>завершено тем</small></div><div><b>'+st.sessions+'</b><small>учебных сессий</small></div><div><b>'+st.learned+'</b><small>изучено элементов</small></div><div><b>'+st.review+'</b><small>слабых элементов</small></div><div><b>'+(st.pct>=70?'готов':'в процессе')+'</b><small>финальная проверка</small></div></div></div>'+
 '<div class="bp-card"><div class="bp-settings-row"><div><b>Изменить стартовую точку</b><small>Без потери прогресса</small></div><button class="bp-btn secondary small" onclick="BP.level()">Изменить</button></div><div class="bp-settings-row"><div><b>Вернуться к алфавиту</b></div><button class="bp-btn secondary small" onclick="BP.alphabet()">Открыть</button></div><div class="bp-settings-row"><div><b>Выбрать другую тему</b></div><button class="bp-btn secondary small" onclick="BP.learn()">Темы</button></div><div class="bp-settings-row"><div><b>Выйти</b></div><button class="bp-btn danger-soft small" onclick="BP.logout()">Выйти</button></div></div>','settings')
}
function examScreen(){app(screenHead('Проверим, что ты уже умеешь','финальная проверка','BP.learn()')+'<div class="bp-card"><div class="bp-kicker">Финальный этап</div><div class="bp-score">20–25 <small>заданий</small></div><p>0–100 баллов. Учитываются тест, история ошибок, вспоминание, произношение, написание и чтение.</p></div><div class="bp-exam-grid" style="margin-top:12px">'+['буквы и чтение','произношение','написание','слова','местоимения','глаголы','существительные','числа','предлоги и союзы','простые конструкции','порядок слов','голосовые задания'].map((x,i)=>'<div class="bp-card"><b>'+(i+1)+'. '+x+'</b></div>').join('')+'</div><div class="bp-note good" style="margin-top:12px"><b>70/100 и выше:</b> Ты готов(а) перейти дальше.</div><div class="bp-note warn"><b>Ниже 70:</b> показать слабые места, но не блокировать.</div><button class="bp-level disabled" style="margin-top:12px" onclick="BP.soonA1()"><span class="ico">🎯</span><b>Подготовка к A1</b><p>Следующий этап.</p><span class="cta">Скоро</span></button>','learn')}

function render(){if(state.screen==='register')return register();if(state.screen==='level')return level();if(state.screen==='diagnostic')return diagnostic();if(state.screen==='home')return home();if(state.screen==='learn')return learn();if(state.screen==='alphabet')return renderAlpha();if(state.screen==='reading')return readingScreen();if(state.screen==='readingTest')return readingTestScreen();if(state.screen==='readingPraise')return readingPraiseScreen();if(state.screen==='nextSession')return nextSessionScreen();if(state.screen==='pronouns')return pronounScreen();if(state.screen==='verb')return verbScreen();if(state.screen==='noun')return nounScreen();if(state.screen==='numbers')return numberScreen();if(state.screen==='sentence')return sentenceScreen();if(state.screen==='errors')return errorsScreen();if(state.screen==='settings')return settingsScreen();if(state.screen==='exam')return examScreen();home()}

window.__OTTO_BASE_PREVIEW_SET_STATE=(patch)=>{Object.assign(state,patch||{});save();render();return clone(state)};

window.BP={
  play,
  answerChoice(ok,b){b.classList.add(ok?'correct':'wrong');},
  nav(id){if(id==='home')go('home');if(id==='learn')go('learn');if(id==='errors')go('errors');if(id==='settings')go('settings')},
  home(){go('home')},learn(){go('learn')},errors(){go('errors')},settings(){go('settings')},level(){go('level')},
  regEmail(){state.regStep='email';go('register')},regTelegram(){state.regStep='done';go('level')},regWelcome(){state.regStep='welcome';go('register')},
  sendCode(){const v=document.getElementById('bpEmail')?.value.trim()||'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return toast('Введите корректный email.');state.email=v;state.regStep='otp';go('register')},
  otp(el,i){el.value=el.value.replace(/\D/g,'').slice(-1);const n=document.querySelector('[data-otp="'+(i+1)+'"]');if(el.value&&n)n.focus()},
  verifyCode(){const v=[...document.querySelectorAll('[data-otp]')].map(x=>x.value).join('');if(v.length!==6)return toast('Введите 6 цифр.');state.regStep='done';go('level')},
  startZero(){state.level='zero';go('home')},startDiagnostic(){state.diagIndex=0;state.diagScore=0;go('diagnostic')},
  soonA1(){root.insertAdjacentHTML('beforeend','<div class="bp-modal-backdrop"><div class="bp-modal"><span class="bp-badge">Скоро</span><h3 style="margin-top:12px">Подготовка к A1</h3><p class="bp-lead">Сейчас делаем только базовый этап.</p><button class="bp-btn primary block" style="margin-top:14px" onclick="this.closest(&quot;.bp-modal-backdrop&quot;).remove()">Понятно</button></div></div>')},
  diagAnswer(ok,b){b.classList.add(ok?'correct':'wrong');if(ok)state.diagScore++;setTimeout(()=>{state.diagIndex++;save();render()},360)},diagSpeak(){pronounce('Wasser');state.diagScore++;setTimeout(()=>{state.diagIndex++;save();render()},180)},diagSkip(){state.diagIndex++;save();render()},continueBase(){go('home')},repeatAlphabet(){go('alphabet')},
  alphabet,alphaNext(){advance('alphaStep',ALPHA_TOTAL)},alphaBack(){back('alphaStep')},alphaSkipTask(){advance('alphaStep',ALPHA_TOTAL)},alphaChoice(ok,b){markChoice(ok,b,'alphaStep',ALPHA_TOTAL,ok?'':'alpha-'+state.alphaStep,'буква','Буква не вспомнилась; вернуть позже.')},skipAlphabet(){complete('alphabet');setTimeout(()=>BP.reading(),250)},finishAlphabet(){complete('alphabet');BP.reading()},
  reading(){state.readingRule=0;state.readingPhase=0;go('reading')},readingNext(){state.readingPhase++;if(state.readingPhase>4){state.readingPhase=0;state.readingRule++}save();render()},readingBack(){if(state.readingPhase>0)state.readingPhase--;else if(state.readingRule>0){state.readingRule--;state.readingPhase=4}save();render()},readingSkip(){BP.readingNext()},readingChoice(ok,b){b.classList.add(ok?'correct':'wrong');if(!ok)addError('reading-'+state.readingRule,READING_RULES[state.readingRule]?.key||'правило','чтение','Правило не узнано сразу.');setTimeout(()=>BP.readingNext(),ok?300:650)},readingSpeak(word){pronounce(word);setTimeout(()=>BP.readingNext(),180)},readingWrite(word){checkWrite('readingInput',word,'readingPhase',5,'reading-write-'+state.readingRule,word);setTimeout(()=>{if(state.readingPhase===4)BP.readingNext()},700)},finishReading(){complete('reading');BP.readingTest()},
  readingTest(){if(state.completed.includes('readingTest')){state.readingTestStep=0;state.readingTestScore=0}go('readingTest')},readingTestChoice(ok,b){b.classList.add(ok?'correct':'wrong');if(ok)state.readingTestScore=(state.readingTestScore||0)+1;else addError('reading-test-'+state.readingTestStep,'чтение','мини-тест','Вернуть позже.');setTimeout(()=>{state.readingTestStep++;save();render()},ok?300:600)},readingTestSpeak(word){pronounce(word);state.readingTestScore=(state.readingTestScore||0)+1;setTimeout(()=>{state.readingTestStep++;save();render()},180)},readingTestBack(){state.readingTestStep=Math.max(0,state.readingTestStep-1);save();render()},readingTestSkip(){state.readingTestStep++;save();render()},
  nextSession,reviewChoice(ok,b){markChoice(ok,b,'reviewStep',REVIEWS.length,'review-'+state.reviewStep,'старый материал','Ошибка на повторении; вернуть позже.')},reviewSpeak(text){pronounce(text);setTimeout(()=>advance('reviewStep',REVIEWS.length),180)},reviewWrite(target){const v=norm(document.getElementById('reviewInput')?.value||'');if(v===norm(target)){state.reviewStep++;save();render()}else{addError('review-write','W / Wasser','написание','Первая буква не вспомнилась.');state.reviewStep++;save();render()}},reviewBack(){back('reviewStep')},reviewSkip(){state.reviewStep++;save();render()},
  pronouns,pronounNext(){advance('pronounStep',P_TOTAL)},pronounBack(){back('pronounStep')},pronounSkip(){advance('pronounStep',P_TOTAL)},pronounChoice(ok,b){markChoice(ok,b,'pronounStep',P_TOTAL,'pronoun-'+state.pronounStep,'местоимение','Местоимение не вспомнилось; вернуть в следующем уроке.')},pronounWrite(target){checkWrite('pronounInput',target,'pronounStep',P_TOTAL,'pronoun-write-'+target,target)},pronounSpeak(text){pronounce(text);setTimeout(()=>advance('pronounStep',P_TOTAL),180)},finishPronouns(ok,b){b.classList.add(ok?'correct':'wrong');if(!ok)addError('alpha-return-w','W / Wasser','повторение','Старая буква не вспомнилась внутри урока местоимений.');complete('pronouns');setTimeout(()=>go('learn'),420)},
  verb,verbNext(){state.assembly=[];advance('verbStep',V_TOTAL)},verbBack(){state.assembly=[];back('verbStep')},verbSkip(){state.assembly=[];advance('verbStep',V_TOTAL)},verbChoice(ok,b){markChoice(ok,b,'verbStep',V_TOTAL,'verb-'+state.verbStep,'глагол','Глагол не вспомнился; вернуть позже.')},verbWrite(target){checkWrite('verbInput',target,'verbStep',V_TOTAL,'verb-write-'+target,target)},verbSpeak(text){pronounce(text);setTimeout(()=>advance('verbStep',V_TOTAL),180)},verbToken(i){const t=['in Berlin','wohne','Ich'];state.assembly.push(t[i]);save();render()},verbClear(){state.assembly=[];save();render()},verbAssemblyCheck(){if(state.assembly.join(' ')==='Ich wohne in Berlin'){state.assembly=[];advance('verbStep',V_TOTAL)}else{addError('verb-assembly','Ich wohne in Berlin.','сборка','Готовые блоки собраны не в том порядке.');toast('Попробуй переставить готовые блоки.')}},finishVerbs(){complete('verbs');go('learn')},finishVerbsChoice(ok,b){b.classList.add(ok?'correct':'wrong');if(!ok)addError('verb-return','wohnen','повторение','Глагол не вспомнился позже.');complete('verbs');setTimeout(()=>go('learn'),350)},
  noun,nounNext(){advance('nounStep',N_TOTAL)},nounBack(){back('nounStep')},nounSkip(){advance('nounStep',N_TOTAL)},nounChoice(ok,b){markChoice(ok,b,'nounStep',N_TOTAL,'noun-'+state.nounStep,'существительное','Слово или ситуация не вспомнились; вернуть позже.')},nounWrite(target){checkWrite('nounInput',target,'nounStep',N_TOTAL,'noun-write-'+target,target)},nounSpeak(text){pronounce(text);setTimeout(()=>advance('nounStep',N_TOTAL),180)},finishNouns(){complete('nouns');go('learn')},
  numbers,makeNumber(){const w=numberWord(document.getElementById('numberInput')?.value||'');document.getElementById('numberResult').textContent=w||'Введите число от 0 до 9999.'},listenNumber(btn){const w=numberWord(document.getElementById('numberInput')?.value||'127');if(w)play(w,btn)},repeatNumber(){const w=numberWord(document.getElementById('numberInput')?.value||'127');if(w)pronounce(w)},finishNumbers(){complete('numbers');go('learn')},
  sentence,sentenceNext(){advance('sentenceStep',S_TOTAL)},sentenceBack(){back('sentenceStep')},sentenceSkip(){advance('sentenceStep',S_TOTAL)},sentenceToken(i){const t=['in Berlin','wohne','Ich'];state.assembly.push(t[i]);save();render()},sentenceClear(){state.assembly=[];save();render()},sentenceCheck(){if(state.assembly.join(' ')==='Ich wohne in Berlin'){advance('sentenceStep',S_TOTAL)}else{addError('sentence-order','Ich wohne in Berlin.','порядок слов','Блоки собраны не в том порядке.');toast('Порядок пока не тот. OTTO вернёт это позже другим заданием.');setTimeout(()=>advance('sentenceStep',S_TOTAL),650)}},sentenceWrite(){checkWrite('sentenceInput','Ich wohne in Berlin','sentenceStep',S_TOTAL,'sentence-write','Ich wohne in Berlin.')},sentenceSpeak(){pronounce('Ich wohne in Berlin.');setTimeout(()=>advance('sentenceStep',S_TOTAL),180)},finishSentenceChoice(ok,b){b.classList.add(ok?'correct':'wrong');if(!ok)addError('pronoun-return-er','er','повторение','Местоимение не вспомнилось после темы предложения.');complete('sentence');setTimeout(()=>go('learn'),420)},
  trainError(i){const e=state.errors[i];if(!e)return;if(/Wasser|W \/ Wasser/.test(e.item))return play('Wasser');if(/wohnen/i.test(e.item))return play('wohnen');if(/kommen/i.test(e.item))return play('kommen');toast('Этот элемент вернётся отдельным микроупражнением.')},
  exam(){go('exam')},logout(){localStorage.removeItem(STORE);state=clone(DEFAULT);render()}
};

render();
})();