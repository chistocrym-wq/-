(() => {
  'use strict';
  if (window.__ottoStartV15) return;
  window.__ottoStartV15 = true;

  const DATA = window.OttoCourseDataV8;
  const root = document.getElementById('app');
  if (!DATA || !root) return;

  const STORAGE = 'ottoStartV15';
  const DAY = 86400000;
  const today = () => Math.floor(Date.now() / DAY);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const attr = (s='') => esc(s).replace(/'/g,'&#39;');
  const stripArticle = (s='') => String(s).replace(/^(der|die|das)\s+/i,'').trim();
  const norm = (s='') => stripArticle(s).toLocaleLowerCase('de-DE').replace(/\s+/g,' ').trim();
  const W = (id,de,ru,example='',exampleRu='',rule='') => ({id,de,ru,example,exampleRu,rule});
  const P = (id,de,ru) => ({id,de,ru});
  const WORD = (id,title,icon,words=[],phrases=[],intro='') => ({id,title,icon,kind:'words',words,phrases,intro,sectionId:'zero',sectionTitle:'Старт с абсолютного нуля'});
  const ALPHA = (id,title,letters,intro='') => ({id,title,icon:'🔤',kind:'alphabet',letters,words:[],phrases:[],intro,sectionId:'zero',sectionTitle:'Старт с абсолютного нуля'});
  const RULE = (id,title,rules,intro='') => ({id,title,icon:'📖',kind:'rules',rules,words:[],phrases:[],intro,sectionId:'zero',sectionTitle:'Старт с абсолютного нуля'});

  const READING_RULES = [
    {id:'j',pattern:'j',answer:'читается как «й»',text:'В обычных немецких словах j звучит как «й».',examples:['ja','Jahr']},
    {id:'ei',pattern:'ei',answer:'примерно «ай»',text:'Сочетание ei обычно звучит примерно как «ай».',examples:['nein','drei','heißen']},
    {id:'ie',pattern:'ie',answer:'долгое «и»',text:'Сочетание ie обычно даёт долгий звук «и».',examples:['vier','sieben','hier']},
    {id:'sch',pattern:'sch',answer:'читается как «ш»',text:'sch — один из самых частых способов передать звук «ш».',examples:['Schule','Schwester']},
    {id:'ichch',pattern:'ch после i/e',answer:'мягкий звук [ç]',text:'В ich, mich, nicht ch произносится мягко, не как русский твёрдый «х».',examples:['ich','mich','nicht']},
    {id:'achch',pattern:'ch после a/o/u/au',answer:'более твёрдый звук [x]',text:'После a, o, u и au ch звучит твёрже.',examples:['acht','auch','Buch']},
    {id:'z',pattern:'z',answer:'читается как «ц»',text:'Немецкая z в начале и середине слова обычно звучит как «ц».',examples:['zwei','zehn','Zeit']},
    {id:'w',pattern:'w',answer:'читается как «в»',text:'Немецкая w произносится как русский «в».',examples:['wo','Wasser']},
    {id:'v',pattern:'v',answer:'часто читается как «ф»',text:'В частых немецких словах Vater, vier, Vogel буква v звучит как «ф». В заимствованиях возможен звук «в».',examples:['Vater','vier','Vogel']},
    {id:'sp',pattern:'sp в начале',answer:'примерно «шп»',text:'В начале слова sp обычно звучит как «шп».',examples:['Sport','sprechen']},
    {id:'st',pattern:'st в начале',answer:'примерно «шт»',text:'В начале слова st обычно звучит как «шт».',examples:['Stadt','Straße']},
    {id:'eu',pattern:'eu / äu',answer:'примерно «ой»',text:'eu и äu обычно передают один и тот же дифтонг, примерно «ой».',examples:['heute','neun','Häuser']},
    {id:'ss',pattern:'ß',answer:'глухой звук «с»',text:'ß читается как глухой «с». Это не отдельный звук «бета».',examples:['heißen','Straße','groß']},
    {id:'umlaut',pattern:'ä / ö / ü',answer:'отдельные немецкие гласные',text:'Умлауты — самостоятельные немецкие гласные. Их лучше запоминать на слух, а не заменять русскими буквами.',examples:['Mädchen','schön','fünf']},
    {id:'ending',pattern:'-e / -er в конце',answer:'произносятся ослабленно, но не исчезают',text:'Конечные -e и -er часто звучат слабее, но правило «окончания не произносятся» неверно.',examples:['bitte','Name','Vater']},
  ];
  const rulesById = (ids) => READING_RULES.filter((r) => ids.includes(r.id));

  const STARTER = [
    WORD('z01','Первое слово','👋',[W('z-hallo','Hallo','привет','Hallo!','Привет!')],[],'Одно слово. Сначала смысл, потом немецкое звучание.'),
    WORD('z02','Да и нет','✓',[W('z-ja','ja','да','Ja.','Да.','j → «й».'),W('z-nein','nein','нет','Nein.','Нет.','ei → примерно «ай».')],[],'Два самых простых ответа.'),
    WORD('z03','Спасибо и пожалуйста','🌿',[W('z-danke','danke','спасибо','Danke!','Спасибо!'),W('z-bitte','bitte','пожалуйста / не за что','Bitte.','Пожалуйста.')],[],'Два слова для повседневного общения.'),
    WORD('z04','Пока','👋',[W('z-tschuss','Tschüss','пока','Tschüss!','Пока!','ü — отдельный немецкий звук; сначала слушаем образец.')],[],'Ещё одно короткое слово.'),
    ALPHA('a01','Алфавит: A–M',['A','B','C','D','E','F','G','H','I','J','K','L','M'],'Нажимайте на буквы и слушайте именно немецкие названия.'),
    ALPHA('a02','Алфавит: N–Z и особые буквы',['N','O','P','Q','R','S','T','U','V','W','X','Y','Z','Ä','Ö','Ü','ß'],'Особенно важны J, V, W, Y, Z, Ä, Ö, Ü и ß.'),
    RULE('r01','Читаем: j, ei, ie',rulesById(['j','ei','ie']),'Три правила, которые сразу понадобятся в простых словах.'),
    WORD('z05','Я и ты','🙂',[W('z-ich','ich','я','Ich.','Я.','ch в ich — мягкий немецкий звук [ç].'),W('z-du','du','ты','Du.','Ты.')],[],'Сначала местоимения без грамматики.'),
    RULE('r02','Читаем: sch и ch',rulesById(['sch','ichch','achch']),'Теперь различаем sch и два основных варианта ch.'),
    WORD('z06','Хорошо, очень, тоже','⭐',[W('z-gut','gut','хорошо','Gut!','Хорошо!'),W('z-sehr','sehr','очень','Sehr gut!','Очень хорошо.'),W('z-auch','auch','тоже','Ich auch.','Я тоже.','ch после au звучит твёрже: [x].')],[],'Три очень частых коротких слова.'),
    RULE('r03','Читаем: z, w, v, sp, st',rulesById(['z','w','v','sp','st']),'Эти правила помогают читать очень много базовых слов A1.'),
    RULE('r04','Читаем: eu/äu, ß, умлауты и окончания',rulesById(['eu','ss','umlaut','ending']),'Не пытаемся заменить немецкие звуки русской транскрипцией — слушаем и замечаем закономерность.'),
    WORD('z07','Как назвать своё имя','🪪',[W('z-name','der Name','имя / фамилия','Mein Name ist Anna.','Меня зовут Анна.'),W('z-heissen','heißen','называться','Ich heiße Anna.','Меня зовут Анна.','ei → «ай», ß → «с», конечное -e произносится ослабленно.')],[P('z-ich-heisse','Ich heiße …','Меня зовут …')],'Сначала два элемента, затем готовая фраза.'),
    WORD('z08','Где? Здесь. Там.','📍',[W('z-wo','wo','где','Wo?','Где?','w → «в».'),W('z-hier','hier','здесь','Hier.','Здесь.','ie → долгое «и».'),W('z-da','da','там / здесь','Da.','Там.')],[],'Короткий вопрос и два коротких ответа.'),
    WORD('z09','Сегодня и завтра','🗓️',[W('z-heute','heute','сегодня','Heute.','Сегодня.','eu → примерно «ой».'),W('z-morgen','morgen','завтра / утром','Bis morgen!','До завтра!')],[],'Два слова времени.'),
    WORD('z10','Числа 0–3','🔢',[W('z-null','null','ноль','null','0'),W('z-eins','eins','один','eins','1'),W('z-zwei','zwei','два','zwei','2'),W('z-drei','drei','три','drei','3')],[],'Всего четыре числа.'),
    WORD('z11','Числа 4–6','🔢',[W('z-vier','vier','четыре','vier','4'),W('z-fuenf','fünf','пять','fünf','5'),W('z-sechs','sechs','шесть','sechs','6')],[],'Следующие три числа.'),
    WORD('z12','Числа 7–10','🔢',[W('z-sieben','sieben','семь','sieben','7'),W('z-acht','acht','восемь','acht','8'),W('z-neun','neun','девять','neun','9'),W('z-zehn','zehn','десять','zehn','10')],[],'Закрываем числа от 0 до 10.'),
    WORD('z13','Самая близкая семья','👨‍👩‍👧',[W('z-mutter','die Mutter','мама','Das ist meine Mutter.','Это моя мама.'),W('z-vater','der Vater','папа','Das ist mein Vater.','Это мой папа.'),W('z-kind','das Kind','ребёнок','Das ist mein Kind.','Это мой ребёнок.')],[],'Сначала три базовых слова семьи.'),
    WORD('z14','Сын, дочь, брат, сестра','👨‍👩‍👧‍👦',[W('z-sohn','der Sohn','сын','Das ist mein Sohn.','Это мой сын.'),W('z-tochter','die Tochter','дочь','Das ist meine Tochter.','Это моя дочь.'),W('z-bruder','der Bruder','брат','Das ist mein Bruder.','Это мой брат.'),W('z-schwester','die Schwester','сестра','Das ist meine Schwester.','Это моя сестра.','sch → «ш».')]),
    WORD('z15','Бабушка, дедушка, тётя, дядя','👵',[W('z-oma','die Oma','бабушка','Das ist meine Oma.','Это моя бабушка.'),W('z-opa','der Opa','дедушка','Das ist mein Opa.','Это мой дедушка.'),W('z-tante','die Tante','тётя','Das ist meine Tante.','Это моя тётя.'),W('z-onkel','der Onkel','дядя','Das ist mein Onkel.','Это мой дядя.')]),
    WORD('z16','Дни недели: 1–4','📅',[W('z-mo','der Montag','понедельник','Am Montag.','В понедельник.'),W('z-di','der Dienstag','вторник','Am Dienstag.','Во вторник.'),W('z-mi','der Mittwoch','среда','Am Mittwoch.','В среду.'),W('z-do','der Donnerstag','четверг','Am Donnerstag.','В четверг.')]),
    WORD('z17','Дни недели: 5–7','📅',[W('z-fr','der Freitag','пятница','Am Freitag.','В пятницу.'),W('z-sa','der Samstag','суббота','Am Samstag.','В субботу.'),W('z-so','der Sonntag','воскресенье','Am Sonntag.','В воскресенье.')]),
    WORD('z18','Ещё три частых слова','💬',[W('z-gern','gern','охотно / с удовольствием','Ja, gern.','Да, с удовольствием.'),W('z-entschuldigung','Entschuldigung','извините','Entschuldigung!','Извините!'),W('z-tag','der Tag','день','Guten Tag!','Добрый день.')],[P('z-guten-tag','Guten Tag.','Добрый день.'),P('z-auf-wiedersehen','Auf Wiedersehen.','До свидания.')],'Теперь можно добавить чуть более длинные, но очень частые слова.'),
  ];

  const starterLexemes = new Set(STARTER.flatMap((u) => u.words || []).map((w) => norm(w.de)));
  const preferredTopics = ['person','numbers','family','calendar','food','home','city','transport','shopping','daily-life','work','free-time','health','weather','course','countries-languages','documents','services','travel-hotel','questions-actions','personal-things','environment'];
  const topicRank = new Map(preferredTopics.map((id,i) => [id,i]));
  function chunks(items,n){const out=[];for(let i=0;i<items.length;i+=n)out.push(items.slice(i,i+n));return out;}
  function orderedTopics(){
    return [...(DATA.topics || [])].filter((t) => !['start','alphabet'].includes(t.id)).sort((a,b) => (topicRank.get(a.id) ?? 999) - (topicRank.get(b.id) ?? 999));
  }
  function buildUnits(){
    const units = [...STARTER];
    for (const topic of orderedTopics()) {
      const words = (topic.words || []).filter((w) => w?.de && w?.ru && !starterLexemes.has(norm(w.de)));
      chunks(words,4).forEach((part,i) => units.push({id:`${topic.id}-w${i+1}`,title:`${topic.title} · слова ${i+1}`,icon:topic.icon||'🌿',kind:'words',words:part,phrases:[],intro:`Только ${part.length} новых слова. Сложность растёт постепенно.`,sectionId:topic.id,sectionTitle:topic.title}));
      chunks(topic.phrases || [],3).forEach((part,i) => units.push({id:`${topic.id}-p${i+1}`,title:`${topic.title} · фразы ${i+1}`,icon:topic.icon||'💬',kind:'phrases',words:[],phrases:part,intro:'Короткие готовые конструкции. Перевод всегда рядом.',sectionId:topic.id,sectionTitle:topic.title}));
      units.push({id:`${topic.id}-review`,title:`${topic.title} · закрепление`,icon:'✓',kind:'review',words:[],phrases:[],intro:'Новых слов нет. Проверяем только уже знакомое.',sectionId:topic.id,sectionTitle:topic.title});
    }
    units.push({id:'readiness-a1',title:'Мини‑тест готовности к Otto A1',icon:'🎯',kind:'readiness',words:[],phrases:[],intro:'20 коротких заданий: словарь, слух, чтение и готовые фразы.',sectionId:'ready',sectionTitle:'Готовность к тренажёру A1'});
    return units;
  }

  const UNITS = buildUnits();
  const SECTIONS = (() => {
    const map = new Map();
    UNITS.forEach((u,i) => {
      if (!map.has(u.sectionId)) map.set(u.sectionId,{id:u.sectionId,title:u.sectionTitle,icon:u.icon,indexes:[]});
      map.get(u.sectionId).indexes.push(i);
    });
    return [...map.values()];
  })();
  const READINESS_INDEX = UNITS.findIndex((u) => u.kind === 'readiness');

  const DEFAULT = {version:15,unitIndex:0,completed:[],wordState:{},phraseState:{},sessions:0,minutes:0,duration:7,readiness:null,createdAt:Date.now(),lastVisit:Date.now()};
  function load(){try{const raw=JSON.parse(localStorage.getItem(STORAGE)||'{}');return {...clone(DEFAULT),...raw,completed:Array.isArray(raw.completed)?raw.completed:[],wordState:raw.wordState&&typeof raw.wordState==='object'?raw.wordState:{},phraseState:raw.phraseState&&typeof raw.phraseState==='object'?raw.phraseState:{}}}catch{return clone(DEFAULT)}}
  let state = load();
  let view='home', returnView='home', quiz=null, dictFilter='all', dictPage=0, dictSearch='', toastTimer=null;
  function save(){state.lastVisit=Date.now();try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch{}}
  const currentUnit = () => UNITS[Math.max(0,Math.min(state.unitIndex,UNITS.length-1))];
  const knownCount = () => Object.values(state.wordState).filter((x) => Number(x.level||0)>=2).length;
  const seenCount = () => Object.keys(state.wordState).length;
  const dueCount = () => Object.values(state.wordState).filter((x) => Number(x.due||0)<=today()).length;
  const progress = () => Math.round(state.completed.filter((id) => id !== 'readiness-a1').length / Math.max(1,UNITS.length-1) * 100);
  const interval = (level) => [0,1,3,7,14,30][Math.max(0,Math.min(5,Number(level||0)))] || 30;
  const keyFor = (item,phrase=false) => `${phrase?'p':'w'}:${item.id||norm(item.de)}`;

  function markSeen(item,phrase=false,topic=''){
    const bucket=phrase?state.phraseState:state.wordState, key=keyFor(item,phrase);
    if(!bucket[key])bucket[key]={id:item.id||key,de:item.de,ru:item.ru,example:item.example||'',exampleRu:item.exampleRu||'',topic,level:0,seen:0,errors:0,due:today(),firstSeen:Date.now()};
    bucket[key].seen=Math.max(1,Number(bucket[key].seen||0));save();return key;
  }
  function markAnswer(item,good,phrase=false,topic=''){
    const bucket=phrase?state.phraseState:state.wordState,key=markSeen(item,phrase,topic),entry=bucket[key];
    entry.seen=Number(entry.seen||0)+1;entry.last=Date.now();
    if(good)entry.level=Math.min(5,Number(entry.level||0)+1);else{entry.errors=Number(entry.errors||0)+1;entry.level=Math.max(0,Number(entry.level||0)-1)}
    entry.due=today()+interval(entry.level);save();
  }
  function readingHint(item){
    if(item.rule)return item.rule;
    const w=norm(item.de),a=[];const add=(x)=>{if(!a.includes(x))a.push(x)};
    if(/^j/.test(w))add('j → «й».');if(w.includes('sch'))add('sch → «ш».');if(/^sp/.test(w))add('sp в начале → «шп».');if(/^st/.test(w))add('st в начале → «шт».');if(w.includes('ei'))add('ei → примерно «ай».');if(w.includes('ie'))add('ie → долгое «и».');if(w.includes('eu')||w.includes('äu'))add('eu/äu → примерно «ой».');if(w.includes('ß'))add('ß → глухой «с».');if(/^z/.test(w))add('z → «ц».');if(/^w/.test(w))add('w → «в».');return a.slice(0,2).join(' ');
  }

  function top(){return `<header class="v12-top"><div class="v12-brand"><img src="/otto/otto-home.webp" alt="Отто"><div><b>Otto Start</b><small>от абсолютного нуля к тренажёру A1</small></div></div><button class="v12-icon-btn" type="button" data-action="nav-more">⋯</button></header>`}
  function nav(active=''){const items=[['home','⌂','Главная'],['route','🧭','Путь'],['dictionary','📖','Слова'],['profile','◎','Прогресс'],['more','⋯','Ещё']];return `<nav class="v12-bottom">${items.map(([id,ic,tx])=>`<button type="button" data-action="nav-${id}" class="${active===id?'active':''}"><span>${ic}</span>${tx}</button>`).join('')}</nav>`}
  function shell(name,main,active=''){return `<div class="v12-app" data-v15-screen="${attr(name)}">${top()}<main class="v12-main">${main}</main>${nav(active)}</div>`}
  function showToast(message){document.querySelector('.v12-toast')?.remove();const el=document.createElement('div');el.className='v12-toast';el.textContent=String(message||'');document.body.appendChild(el);clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),3500)}
  function stageFor(index=state.unitIndex){if(index<STARTER.length)return 'С нуля';const ratio=(index-STARTER.length)/Math.max(1,READINESS_INDEX-STARTER.length);if(ratio<.34)return 'База A1';if(ratio<.72)return 'Уверенная база';return 'Подготовка к тренажёру A1'}
  function stageChips(){const active=stageFor();return `<div class="v15-stage">${['С нуля','База A1','Уверенная база','Подготовка к тренажёру A1'].map((x)=>`<span class="${x===active?'active':''}">${x}</span>`).join('')}</div>`}

  function renderHome(){
    const u=currentUnit(),starterDone=STARTER.filter((x)=>state.completed.includes(x.id)).length;
    const ready=state.readiness;
    const readinessHtml=ready?`<section class="v12-section"><div class="v15-ready-banner"><strong>${ready.ready?'✓ База для Otto A1 готова':'Нужно ещё немного закрепить базу'}</strong><p>Последний мини‑тест: ${ready.score}%. ${ready.ready?'Можно переходить к основному тренажёру A1, продолжая повторять слабые места.':'Повторите отмеченные навыки и пройдите тест снова.'}</p><button class="v12-btn secondary small" type="button" data-action="open-readiness">Пройти мини‑тест снова</button></div></section>`:'';
    const main=`<section class="v12-hero"><div><div class="v12-kicker">Пошаговое вхождение</div><h1>От первого слова — к готовности открыть Otto A1</h1><p>Сначала самые простые слова, затем алфавит и правила чтения, потом словарь и фразы уровня A1. Сложность растёт постепенно.</p><div class="v12-pill-row"><span class="v12-pill">${seenCount()} слов встречалось</span><span class="v12-pill">${knownCount()} закреплено</span></div></div><img src="/otto/otto-guide.webp" alt="Отто"></section>${stageChips()}<section class="v12-section"><div class="v12-section-head"><h2>Следующий шаг</h2><small>${Math.min(state.unitIndex+1,UNITS.length)} из ${UNITS.length}</small></div><div class="v12-card"><div class="v12-next"><div class="v12-next-icon">${u.icon||'🌿'}</div><div><h3>${esc(u.title)}</h3><p>${esc(u.intro||'Короткий учебный шаг.')}</p></div></div><div class="v12-progress"><i style="width:${Math.max(2,progress())}%"></i></div><button class="v12-btn primary block" type="button" data-action="start-unit">${u.kind==='readiness'?'Начать мини‑тест готовности →':'Начать занятие →'}</button></div></section><section class="v12-section"><div class="v12-stat-grid"><div class="v12-stat"><strong>${starterDone}/${STARTER.length}</strong><span>шагов «с нуля»</span></div><div class="v12-stat"><strong>${dueCount()}</strong><span>на повторение</span></div><div class="v12-stat"><strong>${state.sessions}</strong><span>занятий</span></div></div></section>${readinessHtml}<section class="v12-section"><div class="v12-note"><b>Правило Otto:</b> вопрос «Что означает …?» всегда даёт варианты <b>по-русски</b>. Немецкие варианты появляются только в вопросе «Как будет по-немецки?».</div></section>`;
    root.innerHTML=shell('Главная',main,'home');
  }

  function reviewItems(sectionId){const title=SECTIONS.find((s)=>s.id===sectionId)?.title||'';return Object.values(state.wordState).filter((x)=>x.topic===title).slice(-8)}
  function renderLesson(){
    const u=currentUnit();
    if(u.kind==='readiness'){startReadiness();return;}
    const items=u.kind==='review'?reviewItems(u.sectionId):u.words||[];
    items.forEach((x)=>markSeen(x,false,u.sectionTitle));(u.phrases||[]).forEach((x)=>markSeen(x,true,u.sectionTitle));
    let body=`<div class="v12-screen-head"><button class="v12-back" type="button" data-action="back-home">←</button><div class="text"><b>${esc(u.title)}</b><small>${esc(u.sectionTitle)}</small></div></div><div class="v12-kicker">${u.kind==='alphabet'?'Алфавит':u.kind==='rules'?'Правила чтения':'Короткое занятие'}</div><h1 class="v12-title">${esc(u.title)}</h1><p class="v12-lead">${esc(u.intro||'Сначала смысл, затем звук, затем короткое закрепление.')}</p>`;
    if(u.kind==='review')body+=`<div class="v12-note">Новых слов нет. Повторяем только знакомое.</div>`;
    if(u.kind==='alphabet'){
      body+=`<section class="v12-section"><div class="v15-alpha-grid">${u.letters.map((letter)=>`<button class="v15-alpha" type="button" data-action="audio" data-text="${attr(letter==='ß'?'ß':letter)}" data-kind="letter">${esc(letter)}</button>`).join('')}</div></section><div class="v12-note">Здесь важно именно <b>услышать немецкое название буквы</b>. J — Jot, V — Vau, W — Weh, Y — Ypsilon, Z — Zett, ß — Eszett.</div>`;
    }
    if(u.kind==='rules'){
      body+=`<section class="v12-section">${u.rules.map((rule)=>`<article class="v15-rule-card"><div class="v15-rule-pattern">${esc(rule.pattern)}</div><div class="v15-rule-answer">${esc(rule.answer)}</div><p class="v12-muted">${esc(rule.text)}</p><div class="v15-examples">${rule.examples.map((example)=>`<button class="v15-example-chip" type="button" data-action="audio" data-text="${attr(example)}">🔊 ${esc(example)}</button>`).join('')}</div></article>`).join('')}</section>`;
    }
    if(items.length){
      body+=`<section class="v12-section"><div class="v12-word-list">${items.map((item)=>{const hint=readingHint(item);return `<article class="v12-word-card"><div><h3>${esc(item.de)}</h3><div class="ru">${esc(item.ru)}</div></div><button class="v12-audio" type="button" data-action="audio" data-text="${attr(item.de)}">🔊</button>${item.example?`<div class="v12-example"><b>${esc(item.example)}</b><span>${esc(item.exampleRu||'')}</span></div>`:''}${hint?`<div class="v12-rule"><b>Почему так читается?</b> ${esc(hint)}</div>`:''}<div class="v12-actions" style="grid-column:1/-1"><button class="v12-btn secondary small" type="button" data-action="pronounce" data-text="${attr(stripArticle(item.de))}" data-hint="${attr(hint)}">🎤 Повторить</button></div></article>`}).join('')}</div></section>`;
    }
    if((u.phrases||[]).length){
      body+=`<section class="v12-section"><div class="v12-section-head"><h2>Полезная фраза</h2><small>перевод сразу по-русски</small></div><div class="v12-word-list">${u.phrases.map((item)=>`<article class="v12-word-card"><div><h3>${esc(item.de)}</h3><div class="ru">${esc(item.ru)}</div></div><button class="v12-audio" type="button" data-action="audio" data-text="${attr(item.de)}">🔊</button><div class="v12-actions" style="grid-column:1/-1"><button class="v12-btn secondary small" type="button" data-action="pronounce" data-text="${attr(item.de)}">🎤 Сказать</button></div></article>`).join('')}</div></section>`;
    }
    body+=`<section class="v12-section"><button class="v12-btn primary block" type="button" data-action="start-quiz">Закрепить →</button></section>`;
    root.innerHTML=shell('Занятие',body);
    if(items[0]?.de)window.OttoSpeechV15?.preload?.(items[0].de,{mode:'normal'});
  }

  function shuffle(arr){const out=[...arr];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
  function poolWords(extra=[]){const map=new Map();[...extra,...Object.values(state.wordState)].forEach((x)=>{if(x?.de&&x?.ru)map.set(x.id||norm(x.de),x)});return [...map.values()]}
  function makeRuOptions(item,pool){const correct=String(item.ru||'').trim();const vals=[...new Set(shuffle(pool.map((x)=>String(x.ru||'').trim()).filter((x)=>x&&x!==correct)))].slice(0,3);for(const x of ['дом','вода','работа','город','книга','время','семья','день']){if(vals.length>=3)break;if(x!==correct&&!vals.includes(x))vals.push(x)}return shuffle([{label:correct,correct:true},...vals.slice(0,3).map((label)=>({label,correct:false}))])}
  function makeDeOptions(item,pool){const correct=stripArticle(item.de);const vals=[...new Set(shuffle(pool.map((x)=>stripArticle(x.de||'')).filter((x)=>x&&x!==correct)))].slice(0,3);for(const x of ['Haus','Wasser','Arbeit','Stadt','Buch','Zeit']){if(vals.length>=3)break;if(x!==correct&&!vals.includes(x))vals.push(x)}return shuffle([{label:correct,correct:true},...vals.slice(0,3).map((label)=>({label,correct:false}))])}
  function makeRuleOptions(rule){const pool=[...new Set(READING_RULES.map((r)=>r.answer).filter((x)=>x!==rule.answer))];return shuffle([{label:rule.answer,correct:true},...shuffle(pool).slice(0,3).map((label)=>({label,correct:false}))])}
  function makeLetterOptions(letter,letters){const pool=shuffle(letters.filter((x)=>x!==letter)).slice(0,3);return shuffle([{label:letter,correct:true},...pool.map((label)=>({label,correct:false}))])}

  function quizTasksFor(u){
    if(u.kind==='alphabet')return shuffle(u.letters).slice(0,Math.min(6,u.letters.length)).map((letter)=>({type:'letter-listen',letter,options:makeLetterOptions(letter,u.letters),category:'alphabet'}));
    if(u.kind==='rules')return u.rules.map((rule)=>({type:'rule',rule,options:makeRuleOptions(rule),category:'reading'}));
    const words=u.kind==='review'?reviewItems(u.sectionId):(u.words||[]),tasks=[];
    if(words.length){const pool=poolWords(words);words.forEach((item)=>tasks.push({type:'meaning',item,phrase:false,options:makeRuOptions(item,pool),category:'vocabulary'}));words.slice(0,Math.min(2,words.length)).forEach((item)=>tasks.push({type:'listen',item,phrase:false,options:makeRuOptions(item,pool),category:'listening'}))}
    (u.phrases||[]).slice(0,3).forEach((item)=>tasks.push({type:'phrase',item,phrase:true,options:makeRuOptions(item,u.phrases),category:'phrases'}));
    return tasks.slice(0,8);
  }

  function startQuiz(){const u=currentUnit();if(u.kind==='readiness'){startReadiness();return}const tasks=quizTasksFor(u);if(!tasks.length){completeUnit();return}quiz={mode:'lesson',unitId:u.id,tasks,index:0,good:0,bad:0,answered:false,selected:-1,byCategory:{}};view='quiz';render()}
  function taskPrompt(task){
    if(task.type==='listen')return {title:'Что вы услышали?',sub:'Немецкое слово заранее не показываем. Выберите перевод на русском языке.'};
    if(task.type==='letter-listen')return {title:'Какую букву вы услышали?',sub:'Нажмите 🔊 и выберите букву.'};
    if(task.type==='rule')return {title:`Как читается «${task.rule.pattern}»?`,sub:'Выберите правило чтения.'};
    if(task.type==='reverse')return {title:`Как будет по-немецки «${task.item.ru}»?`,sub:'Только здесь варианты ответа даны по-немецки.'};
    if(task.type==='phrase')return {title:`Что означает фраза «${task.item.de}»?`,sub:'Выберите перевод на русском языке.'};
    return {title:`Что означает «${stripArticle(task.item.de)}»?`,sub:'Выберите перевод на русском языке.'};
  }
  function taskAudio(task){if(task.type==='listen')return task.item.de;if(task.type==='letter-listen')return task.letter;return ''}
  function taskKind(task){return task.type==='letter-listen'?'letter':'text'}
  function renderQuiz(){
    if(!quiz){view='lesson';render();return}
    if(quiz.index>=quiz.tasks.length){renderQuizDone();return}
    const task=quiz.tasks[quiz.index],p=taskPrompt(task),audio=taskAudio(task),correct=task.options[quiz.selected]?.correct;
    const feedback=quiz.answered?taskFeedback(task,correct):'';
    const body=`<div class="v12-screen-head"><button class="v12-back" type="button" data-action="back-lesson">←</button><div class="text"><b>${quiz.mode==='readiness'?'Мини‑тест готовности':esc(currentUnit().title)}</b><small>${quiz.index+1}/${quiz.tasks.length}</small></div></div><div class="v12-progress"><i style="width:${Math.max(3,Math.round(quiz.index/quiz.tasks.length*100))}%"></i></div><section class="v12-quiz"><div class="v12-quiz-card"><div class="v12-quiz-icon">${audio?'🔊':task.type==='rule'?'📖':'🌿'}</div>${audio?`<button class="v12-btn secondary small" type="button" data-action="audio" data-text="${attr(audio)}" data-kind="${taskKind(task)}">🔊 Послушать</button>`:''}<h1>${esc(p.title)}</h1><p>${esc(p.sub)}</p><div class="v12-options">${task.options.map((o,i)=>`<button type="button" class="v12-option ${quiz.answered&&o.correct?'correct':''} ${quiz.answered&&quiz.selected===i&&!o.correct?'wrong':''}" data-action="answer" data-index="${i}" ${quiz.answered?'disabled':''}>${esc(o.label)}</button>`).join('')}</div>${quiz.answered?`<div class="v12-feedback ${correct?'good':'bad'}">${feedback}</div><button class="v12-btn primary block" style="margin-top:10px" type="button" data-action="quiz-next">Дальше →</button>`:'<div class="v12-feedback">Выберите один вариант.</div>'}</div></section>`;
    root.innerHTML=shell('Закрепление',body);
  }
  function taskFeedback(task,correct){
    const lead=correct?'Верно.':'Правильный вариант выделен зелёным.';
    if(task.type==='rule')return `${lead}<br><b>${esc(task.rule.pattern)}</b> — ${esc(task.rule.answer)}`;
    if(task.type==='letter-listen')return `${lead}<br>Это буква <b>${esc(task.letter)}</b>.`;
    return `${lead}<br><b>${esc(task.item.de)}</b> — ${esc(task.item.ru)}`;
  }
  function answerQuiz(index){
    if(!quiz||quiz.answered)return;const task=quiz.tasks[quiz.index],option=task.options[index];if(!option)return;
    quiz.answered=true;quiz.selected=index;if(option.correct)quiz.good++;else quiz.bad++;
    const cat=task.category||'other';if(!quiz.byCategory[cat])quiz.byCategory[cat]={good:0,total:0};quiz.byCategory[cat].total++;if(option.correct)quiz.byCategory[cat].good++;
    if(task.item&&quiz.mode!=='readiness')markAnswer(task.item,!!option.correct,!!task.phrase,currentUnit().sectionTitle);
    render();
  }
  function nextQuiz(){if(!quiz?.answered)return;quiz.index++;quiz.answered=false;quiz.selected=-1;render()}
  function renderQuizDone(){
    if(quiz?.mode==='readiness'){renderReadinessResult();return;}
    const body=`<section class="v12-quiz"><div class="v12-quiz-card"><div class="v12-quiz-icon">${quiz.bad?'🌿':'✓'}</div><div class="v12-kicker">Занятие закончено</div><h1>${quiz.bad?'Ошибки вернутся позже.':'Этот шаг закреплён.'}</h1><p>Верно: ${quiz.good} · Ошибок: ${quiz.bad}</p><button class="v12-btn primary block" type="button" data-action="complete-unit">Продолжить →</button></div></section>`;root.innerHTML=shell('Результат',body)
  }
  function completeUnit(){const u=currentUnit();if(!state.completed.includes(u.id))state.completed.push(u.id);state.sessions++;state.minutes+=Number(state.duration||7);let next=state.unitIndex+1;while(next<UNITS.length&&state.completed.includes(UNITS[next].id))next++;state.unitIndex=Math.min(next,UNITS.length-1);save();quiz=null;view='home';render()}

  function sectionProgress(section){const done=section.indexes.filter((i)=>state.completed.includes(UNITS[i].id)).length;return {done,total:section.indexes.length,pct:Math.round(done/Math.max(1,section.indexes.length)*100)}}
  function sectionUnlocked(index){if(index===0)return true;return SECTIONS.slice(0,index).every((s)=>sectionProgress(s).done===s.indexes.length)}
  function renderRoute(){
    const main=`<div class="v12-kicker">Большой путь</div><h1 class="v12-title">От нуля к тренажёру A1</h1><p class="v12-lead">Сначала простые слова и чтение. Затем темы A1 идут от базовых к более насыщенным. Последний шаг — мини‑тест готовности.</p>${stageChips()}<div class="v12-route">${SECTIONS.map((s,i)=>{const p=sectionProgress(s),unlocked=sectionUnlocked(i),current=s.indexes.includes(state.unitIndex),done=p.done===p.total;return `<button class="v12-topic ${current?'current':''} ${done?'done':''} ${!unlocked?'locked':''}" type="button" data-action="open-section" data-section="${attr(s.id)}" ${!unlocked?'disabled':''}><span class="ico">${s.icon||'🌿'}</span><span><b>${esc(s.title)}</b><small>${p.total} коротких занятий · ${p.done} завершено${s.id==='ready'?' · итоговая проверка':''}</small></span><span class="pct">${done?'✓':p.pct+'%'}</span></button>`}).join('')}</div>`;
    root.innerHTML=shell('Путь',main,'route');
  }
  function openSection(id){const index=SECTIONS.findIndex((s)=>s.id===id);if(index<0)return;if(!sectionUnlocked(index)){showToast('Сначала завершите предыдущий раздел.');return}const s=SECTIONS[index],target=s.indexes.find((i)=>!state.completed.includes(UNITS[i].id))??s.indexes[0];state.unitIndex=target;save();view='lesson';render()}

  function dictionaryItems(){let list=Object.values(state.wordState);if(dictFilter==='new')list=list.filter((x)=>Number(x.level||0)<2);if(dictFilter==='review')list=list.filter((x)=>Number(x.due||0)<=today()||Number(x.errors||0)>0);if(dictFilter==='known')list=list.filter((x)=>Number(x.level||0)>=2);const q=dictSearch.trim().toLocaleLowerCase('ru-RU');if(q)list=list.filter((x)=>`${x.de} ${x.ru}`.toLocaleLowerCase('ru-RU').includes(q));return list.sort((a,b)=>Number(a.firstSeen||0)-Number(b.firstSeen||0))}
  function renderDictionary(){
    const list=dictionaryItems(),size=12,pages=Math.max(1,Math.ceil(list.length/size));dictPage=Math.max(0,Math.min(dictPage,pages-1));const page=list.slice(dictPage*size,dictPage*size+size);
    const main=`<div class="v12-kicker">Мои слова</div><h1 class="v12-title">Словарь</h1><p class="v12-lead">Здесь только уже встречавшиеся слова. Немецкое слово, русский перевод, пример, звук и запись себя.</p><div class="v12-dict-toolbar"><input class="v12-search" data-v15-search type="search" value="${attr(dictSearch)}" placeholder="Найти слово"><div class="v12-tabs">${[['all','Все'],['new','Новые'],['review','Повторить'],['known','Знаю']].map(([id,t])=>`<button type="button" data-action="dict-filter" data-filter="${id}" class="${dictFilter===id?'active':''}">${t}</button>`).join('')}</div></div>${page.length?`<div class="v12-dict-list">${page.map((x)=>{const hint=readingHint(x);return `<article class="v12-dict-card"><h3>${esc(x.de)}</h3><div class="ru">${esc(x.ru)}</div>${x.example?`<div class="v12-example"><b>${esc(x.example)}</b><span>${esc(x.exampleRu||'')}</span></div>`:''}${hint?`<div class="v12-rule"><b>Чтение:</b> ${esc(hint)}</div>`:''}<div class="v12-dict-card-actions"><button class="v12-btn secondary small" type="button" data-action="audio" data-text="${attr(x.de)}">🔊 Слушать</button><button class="v12-btn secondary small" type="button" data-action="pronounce" data-text="${attr(stripArticle(x.de))}" data-hint="${attr(hint)}">🎤 Сказать</button></div></article>`}).join('')}</div><div class="v12-pager"><button class="v12-btn secondary small" type="button" data-action="dict-prev" ${dictPage<=0?'disabled':''}>←</button><span>${dictPage+1} / ${pages}</span><button class="v12-btn secondary small" type="button" data-action="dict-next" ${dictPage>=pages-1?'disabled':''}>→</button></div>`:'<div class="v12-empty">Пока пусто. Пройдите первое занятие — слова появятся здесь автоматически.</div>'}`;
    root.innerHTML=shell('Словарь',main,'dictionary');
    const input=root.querySelector('[data-v15-search]');if(input)input.addEventListener('change',(e)=>{dictSearch=e.target.value;dictPage=0;render()});
  }

  function renderReadingGuide(){
    const main=`<div class="v12-screen-head"><button class="v12-back" type="button" data-action="nav-more">←</button><div class="text"><b>Правила чтения</b><small>можно возвращаться в любой момент</small></div></div><div class="v12-kicker">Секреты чтения</div><h1 class="v12-title">Основные сочетания и особенности</h1><p class="v12-lead">Не зубрим русскую транскрипцию. Смотрим правило, слушаем немецкий пример и повторяем.</p>${READING_RULES.map((r)=>`<article class="v15-rule-card"><div class="v15-rule-pattern">${esc(r.pattern)}</div><div class="v15-rule-answer">${esc(r.answer)}</div><p class="v12-muted">${esc(r.text)}</p><div class="v15-examples">${r.examples.map((x)=>`<button class="v15-example-chip" type="button" data-action="audio" data-text="${attr(x)}">🔊 ${esc(x)}</button>`).join('')}</div></article>`).join('')}`;
    root.innerHTML=shell('Правила чтения',main,'more');
  }
  function renderAlphabetGuide(){const letters=DATA.topic?.('alphabet')?.alphabet||['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','Ä','Ö','Ü','ß'];const main=`<div class="v12-screen-head"><button class="v12-back" type="button" data-action="nav-more">←</button><div class="text"><b>Немецкий алфавит</b><small>слушайте названия букв</small></div></div><div class="v12-kicker">Алфавит</div><h1 class="v12-title">A–Z + Ä Ö Ü ß</h1><div class="v15-alpha-grid">${letters.map((l)=>`<button class="v15-alpha" type="button" data-action="audio" data-text="${attr(l)}" data-kind="letter">${esc(l)}</button>`).join('')}</div><div class="v12-note" style="margin-top:12px">Особенно запомните немецкие названия J, V, W, Y, Z и ß — они не называются по-английски.</div>`;root.innerHTML=shell('Алфавит',main,'more')}

  function readinessPool(topicId,type='words'){const t=DATA.topic?.(topicId);return type==='phrases'?(t?.phrases||[]):(t?.words||[])}
  function pickFirst(topicId,type='words',offset=0){const list=readinessPool(topicId,type);return list[offset%Math.max(1,list.length)]||null}
  function allWordPool(){return DATA.allWords?.()||orderedTopics().flatMap((t)=>t.words||[])}
  function allPhrasePool(){return DATA.allPhrases?.()||orderedTopics().flatMap((t)=>t.phrases||[])}
  function readinessTasks(){
    const tasks=[];const wp=allWordPool(),pp=allPhrasePool();
    const meaningTopics=['person','numbers','family','calendar','food','home'];
    meaningTopics.forEach((id,i)=>{const item=pickFirst(id,'words',i+1);if(item)tasks.push({type:'meaning',item,options:makeRuOptions(item,wp),category:'vocabulary'})});
    ['city','transport','shopping','work'].forEach((id,i)=>{const item=pickFirst(id,'words',i+2);if(item)tasks.push({type:'listen',item,options:makeRuOptions(item,wp),category:'listening'})});
    ['health','weather','course','documents'].forEach((id,i)=>{const item=pickFirst(id,'words',i+1);if(item)tasks.push({type:'reverse',item,options:makeDeOptions(item,wp),category:'vocabulary'})});
    ['services','travel-hotel','daily-life'].forEach((id,i)=>{const item=pickFirst(id,'phrases',i);if(item)tasks.push({type:'phrase',item,phrase:true,options:makeRuOptions(item,pp),category:'phrases'})});
    [READING_RULES.find((r)=>r.id==='ei'),READING_RULES.find((r)=>r.id==='sch'),READING_RULES.find((r)=>r.id==='st')].filter(Boolean).forEach((rule)=>tasks.push({type:'rule',rule,options:makeRuleOptions(rule),category:'reading'}));
    const needed=20-tasks.length;for(let i=0;i<needed;i++){const item=wp[(i*17+9)%wp.length];if(item)tasks.push({type:i%2?'meaning':'listen',item,options:makeRuOptions(item,wp),category:i%2?'vocabulary':'listening'})}
    return tasks.slice(0,20);
  }
  function startReadiness(){
    const readySectionIndex=SECTIONS.findIndex((s)=>s.id==='ready');
    if(!sectionUnlocked(readySectionIndex)){showToast('Мини‑тест откроется после прохождения программы Otto Start.');view='route';render();return}
    quiz={mode:'readiness',unitId:'readiness-a1',tasks:readinessTasks(),index:0,good:0,bad:0,answered:false,selected:-1,byCategory:{}};view='quiz';render();
  }
  function renderReadinessResult(){
    const total=quiz.tasks.length,score=Math.round(quiz.good/Math.max(1,total)*100),cats={};
    for(const [k,v] of Object.entries(quiz.byCategory)){cats[k]=Math.round(v.good/Math.max(1,v.total)*100)}
    const required=['vocabulary','listening','reading','phrases'];const ready=score>=80&&required.every((k)=>(cats[k]??0)>=60);
    state.readiness={score,categories:cats,ready,at:Date.now()};if(ready&&!state.completed.includes('readiness-a1'))state.completed.push('readiness-a1');save();
    const labels={vocabulary:'Словарь',listening:'Слух',reading:'Чтение',phrases:'Фразы'};
    const weak=required.filter((k)=>(cats[k]??0)<60).map((k)=>labels[k]);
    const body=`<section class="v12-quiz"><div class="v12-quiz-card"><div class="v12-quiz-icon">${ready?'🎯':'🌿'}</div><div class="v12-kicker">Мини‑тест завершён</div><h1>${ready?'База готова для перехода в Otto A1':'Базу ещё стоит закрепить'}</h1><p>Результат: <b>${score}%</b>. Это не оценка экзамена A1 — это проверка, готов ли пользователь перейти из Otto Start в основной тренажёр.</p><div class="v15-readiness-grid">${required.map((k)=>`<div class="v15-readiness-box"><span>${labels[k]}</span><strong>${cats[k]??0}%</strong></div>`).join('')}</div>${weak.length?`<div class="v12-note" style="margin-top:12px"><b>Повторить:</b> ${esc(weak.join(', '))}.</div>`:`<div class="v12-note" style="margin-top:12px"><b>Порог пройден:</b> общий результат не ниже 80%, каждый навык не ниже 60%.</div>`}<div class="v12-actions" style="margin-top:12px"><button class="v12-btn secondary" type="button" data-action="pronounce" data-text="Ich heiße Anna." data-hint="ei → «ай», ß → «с». Тренируем спокойную немецкую фразу.">🎤 Проверить речь</button><button class="v12-btn primary" type="button" data-action="finish-readiness">На главную</button></div></div></section>`;
    root.innerHTML=shell('Готовность к A1',body);
  }

  function renderProfile(){
    const ready=state.readiness;const starterDone=STARTER.filter((x)=>state.completed.includes(x.id)).length;
    const main=`<div class="v12-kicker">Прогресс</div><h1 class="v12-title">Ваш путь к Otto A1</h1><div class="v12-stat-grid"><div class="v12-stat"><strong>${state.sessions}</strong><span>занятий</span></div><div class="v12-stat"><strong>${knownCount()}</strong><span>слов закреплено</span></div><div class="v12-stat"><strong>${progress()}%</strong><span>программы</span></div></div><section class="v12-section"><div class="v12-card"><div class="v15-skillline"><span>Пошаговый старт</span><b>${starterDone}/${STARTER.length}</b></div><div class="v15-skillline"><span>Алфавит и чтение</span><b>${STARTER.filter((x)=>['alphabet','rules'].includes(x.kind)&&state.completed.includes(x.id)).length}/${STARTER.filter((x)=>['alphabet','rules'].includes(x.kind)).length}</b></div><div class="v15-skillline"><span>Слова встречались</span><b>${seenCount()}</b></div><div class="v15-skillline"><span>Нужно повторить</span><b>${dueCount()}</b></div></div></section><section class="v12-section"><div class="v15-ready-banner"><strong>${ready?(ready.ready?'✓ Мини‑тест пройден':'Мини‑тест пока не пройден'):'Мини‑тест готовности'}</strong><p>${ready?`Последний результат: ${ready.score}%.`:'Откроется после завершения учебного маршрута и проверит словарь, слух, чтение и фразы.'}</p>${sectionUnlocked(SECTIONS.findIndex((s)=>s.id==='ready'))?'<button class="v12-btn secondary small" type="button" data-action="open-readiness">Открыть мини‑тест</button>':''}</div></section><section class="v12-section"><button class="v12-btn ghost block" type="button" data-action="reset">Сбросить тестовый прогресс</button></section>`;
    root.innerHTML=shell('Прогресс',main,'profile');
  }
  function renderMore(){const main=`<div class="v12-kicker">Otto Start</div><h1 class="v12-title">Ещё</h1><div class="v12-grid-2"><button class="v12-card" type="button" data-action="reading-guide" style="text-align:left"><div style="font-size:28px">📖</div><b>Правила чтения</b><p class="v12-muted">ei, ie, sch, ch, sp, st и другие</p></button><button class="v12-card" type="button" data-action="alphabet-guide" style="text-align:left"><div style="font-size:28px">🔤</div><b>Алфавит</b><p class="v12-muted">немецкие названия букв</p></button><button class="v12-card" type="button" data-action="share" style="text-align:left"><div style="font-size:28px">↗</div><b>Поделиться Otto</b></button><button class="v12-card" type="button" data-action="support" style="text-align:left"><div style="font-size:28px">?</div><b>Поддержка</b></button></div><section class="v12-section"><div class="v12-note">Otto Start ведёт не просто по списку слов: <b>простые слова → алфавит → чтение → базовые темы A1 → закрепление → мини‑тест готовности к основному тренажёру</b>.</div></section>`;root.innerHTML=shell('Ещё',main,'more')}
  function support(){const w=document.createElement('div');w.className='v12-modal-backdrop';w.innerHTML=`<section class="v12-modal"><div class="v12-modal-head"><b>Поддержка</b><button type="button" data-close>×</button></div><div class="v12-modal-body"><form><textarea required name="message" placeholder="Что произошло?"></textarea><button class="v12-btn primary block" type="submit">Отправить</button></form><div data-result></div></div></section>`;w.querySelector('[data-close]').onclick=()=>w.remove();w.querySelector('form').onsubmit=async(e)=>{e.preventDefault();const fd=new FormData(e.currentTarget),box=w.querySelector('[data-result]');try{const res=await fetch('/api/otto-start-support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:'Ошибка в приложении',message:fd.get('message'),page:location.href,device:navigator.userAgent,lesson:currentUnit()?.id})});const p=await res.json().catch(()=>({}));if(!res.ok)throw new Error(p.error||'Ошибка');box.innerHTML='<div class="v12-feedback good">Сообщение отправлено.</div>'}catch(err){box.innerHTML=`<div class="v12-feedback bad">${esc(err.message||'Не удалось отправить')}</div>`}};document.body.appendChild(w)}
  async function share(){const d={title:'Otto Start',text:'Немецкий с абсолютного нуля до готовности к тренажёру A1.',url:location.origin+'/'};try{if(navigator.share)await navigator.share(d);else{await navigator.clipboard.writeText(`${d.text} ${d.url}`);showToast('Ссылка скопирована.')}}catch{}}
  function reset(){if(!confirm('Сбросить учебный прогресс Otto Start на этом устройстве?'))return;state=clone(DEFAULT);save();view='home';quiz=null;dictPage=0;dictSearch='';render()}

  function render(){
    const started=performance.now();
    if(view==='home')renderHome();else if(view==='lesson')renderLesson();else if(view==='quiz')renderQuiz();else if(view==='route')renderRoute();else if(view==='dictionary')renderDictionary();else if(view==='profile')renderProfile();else if(view==='more')renderMore();else if(view==='reading')renderReadingGuide();else if(view==='alphabet')renderAlphabetGuide();else{view='home';renderHome()}
    const ms=Math.round(performance.now()-started);(window.OttoClientLogV14||window.OttoClientLogV12)?.send?.('render-v15',{message:`${view}:${ms}ms`,details:{elapsedMs:ms,count:root.querySelectorAll('*').length}},5000);window.scrollTo(0,0);
  }

  root.addEventListener('click',(e)=>{
    const t=e.target.closest?.('[data-action]');if(!t||t.disabled)return;const a=t.dataset.action;const started=performance.now();
    try{
      if(a==='nav-home'){view='home';quiz=null;render();return}
      if(a==='nav-route'){view='route';quiz=null;render();return}
      if(a==='nav-dictionary'){view='dictionary';quiz=null;dictPage=0;render();return}
      if(a==='nav-profile'){view='profile';quiz=null;render();return}
      if(a==='nav-more'){view='more';quiz=null;render();return}
      if(a==='start-unit'){returnView='home';view='lesson';render();return}
      if(a==='back-home'){view=returnView||'home';quiz=null;render();return}
      if(a==='back-lesson'){view='lesson';quiz=null;render();return}
      if(a==='start-quiz'){startQuiz();return}
      if(a==='answer'){answerQuiz(Number(t.dataset.index));return}
      if(a==='quiz-next'){nextQuiz();return}
      if(a==='complete-unit'){completeUnit();return}
      if(a==='audio'){void window.OttoSpeechV15?.play?.(t.dataset.text,{mode:'normal',kind:t.dataset.kind==='letter'?'letter':'text',button:t});return}
      if(a==='pronounce'){void window.OttoSpeechV15?.check?.(t.dataset.text,t.dataset.hint?[t.dataset.hint]:[]);return}
      if(a==='open-section'){openSection(t.dataset.section);return}
      if(a==='dict-filter'){dictFilter=t.dataset.filter||'all';dictPage=0;render();return}
      if(a==='dict-prev'){dictPage=Math.max(0,dictPage-1);render();return}
      if(a==='dict-next'){dictPage++;render();return}
      if(a==='reading-guide'){view='reading';render();return}
      if(a==='alphabet-guide'){view='alphabet';render();return}
      if(a==='open-readiness'){state.unitIndex=READINESS_INDEX;save();startReadiness();return}
      if(a==='finish-readiness'){quiz=null;view='home';render();return}
      if(a==='reset'){reset();return}
      if(a==='share'){void share();return}
      if(a==='support'){support();return}
    }catch(err){(window.OttoClientLogV14||window.OttoClientLogV12)?.send?.('action-error-v15',{message:err?.message||String(err),stack:err?.stack||'',target:a});throw err}
    finally{const ms=Math.round(performance.now()-started);if(ms>120)(window.OttoClientLogV14||window.OttoClientLogV12)?.send?.('slow-action-v15',{message:`${a}:${ms}ms`,details:{elapsedMs:ms}},1000)}
  });

  window.addEventListener('otto:v15-toast',(e)=>showToast(e.detail?.message||''));
  window.OttoStartV15={state:()=>clone(state),units:()=>UNITS.length,starter:()=>STARTER.length,readingRules:()=>READING_RULES.length,readinessIndex:READINESS_INDEX,signature:()=>`${view}|${state.unitIndex}|${state.completed.length}|${quiz?.index??-1}|${dictFilter}|${dictPage}`,openReadiness:()=>{state.unitIndex=READINESS_INDEX;save();startReadiness()}};
  render();
})();