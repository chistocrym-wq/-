(() => {
  'use strict';

  const CORE_KEY = 'ottoStartLearningPathV2';
  const EXTRA_KEY = 'ottoStartCurriculumV6';
  const RECOVERY_KEY = 'ottoStartRecoveryV6';
  const TARGET_LESSONS = new Set([15, 17, 18, 19]);

  const FAMILY = [
    {id:'mutter', de:'die Mutter', speak:'die Mutter', ru:'мама', emoji:'👩', example:'Das ist meine Mutter.'},
    {id:'vater', de:'der Vater', speak:'der Vater', ru:'папа', emoji:'👨', example:'Das ist mein Vater.'},
    {id:'tochter', de:'die Tochter', speak:'die Tochter', ru:'дочь', emoji:'👧', example:'Das ist meine Tochter.'},
    {id:'sohn', de:'der Sohn', speak:'der Sohn', ru:'сын', emoji:'👦', example:'Das ist mein Sohn.'},
    {id:'schwester', de:'die Schwester', speak:'die Schwester', ru:'сестра', emoji:'👩', example:'Das ist meine Schwester.'},
    {id:'bruder', de:'der Bruder', speak:'der Bruder', ru:'брат', emoji:'👨', example:'Das ist mein Bruder.'},
    {id:'oma', de:'die Großmutter / Oma', speak:'die Großmutter. die Oma.', ru:'бабушка', emoji:'👵', example:'Das ist meine Oma.'},
    {id:'opa', de:'der Großvater / Opa', speak:'der Großvater. der Opa.', ru:'дедушка', emoji:'👴', example:'Das ist mein Opa.'},
    {id:'tante', de:'die Tante', speak:'die Tante', ru:'тётя', emoji:'👩', example:'Das ist meine Tante.'},
    {id:'onkel', de:'der Onkel', speak:'der Onkel', ru:'дядя', emoji:'👨', example:'Das ist mein Onkel.'},
    {id:'eltern', de:'die Eltern', speak:'die Eltern', ru:'родители', emoji:'👨‍👩‍👧', example:'Das sind meine Eltern.'},
    {id:'grosseltern', de:'die Großeltern', speak:'die Großeltern', ru:'бабушка и дедушка / дедушки и бабушки', emoji:'👵👴', example:'Das sind meine Großeltern.'},
    {id:'kind', de:'das Kind', speak:'das Kind', ru:'ребёнок', emoji:'🧒', example:'Das ist mein Kind.'},
    {id:'frau', de:'die Frau', speak:'die Frau', ru:'женщина / жена', emoji:'👩', example:'Das ist meine Frau.'},
    {id:'mann', de:'der Mann', speak:'der Mann', ru:'мужчина / муж', emoji:'👨', example:'Das ist mein Mann.'}
  ];

  const NUMBERS_1_10 = [
    ['1','eins'],['2','zwei'],['3','drei'],['4','vier'],['5','fünf'],['6','sechs'],['7','sieben'],['8','acht'],['9','neun'],['10','zehn']
  ].map(([digit,de]) => ({id:`n${digit}`, digit, de, speak:de, ru:digit, emoji:'🔢', example:`${de}.`}));

  const NUMBERS_11_20 = [
    ['11','elf'],['12','zwölf'],['13','dreizehn'],['14','vierzehn'],['15','fünfzehn'],['16','sechzehn'],['17','siebzehn'],['18','achtzehn'],['19','neunzehn'],['20','zwanzig']
  ].map(([digit,de]) => ({id:`n${digit}`, digit, de, speak:de, ru:digit, emoji:'🔢', example:`${de}.`}));

  const DAYS = [
    {id:'montag',de:'Montag',speak:'Montag',ru:'понедельник',emoji:'📅',example:'Am Montag.'},
    {id:'dienstag',de:'Dienstag',speak:'Dienstag',ru:'вторник',emoji:'📅',example:'Am Dienstag.'},
    {id:'mittwoch',de:'Mittwoch',speak:'Mittwoch',ru:'среда',emoji:'📅',example:'Am Mittwoch.'},
    {id:'donnerstag',de:'Donnerstag',speak:'Donnerstag',ru:'четверг',emoji:'📅',example:'Am Donnerstag.'},
    {id:'freitag',de:'Freitag',speak:'Freitag',ru:'пятница',emoji:'📅',example:'Am Freitag.'},
    {id:'samstag',de:'Samstag',speak:'Samstag',ru:'суббота',emoji:'📅',example:'Am Samstag.'},
    {id:'sonntag',de:'Sonntag',speak:'Sonntag',ru:'воскресенье',emoji:'📅',example:'Am Sonntag.'}
  ];

  const TOPICS = {
    15:{title:'Семья', items:FAMILY, countLabel:'14+ слов'},
    17:{title:'Числа 1–10', items:NUMBERS_1_10, countLabel:'10 чисел'},
    18:{title:'Числа 11–20', items:NUMBERS_11_20, countLabel:'10 чисел'},
    19:{title:'Все дни недели', items:DAYS, countLabel:'7 дней'}
  };

  const ALL_EXTRA = [...FAMILY, ...NUMBERS_1_10, ...NUMBERS_11_20, ...DAYS];

  function readJSON(key, fallback={}) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return structuredClone(fallback); }
  }
  function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function coreState() { return readJSON(CORE_KEY, {}); }
  function extraState() { return readJSON(EXTRA_KEY, {practiceDone:{}, mastery:{}, mistakes:{}, attempts:{}}); }
  function saveExtra(patchFn) {
    const s = extraState();
    patchFn(s);
    writeJSON(EXTRA_KEY, s);
    return s;
  }
  function lessonId() { return Number(coreState().currentLesson || 1); }
  function lessonStep() { return Number(coreState().lessonStep || 0); }

  function escapeHtml(v='') { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escapeAttr(v='') { return escapeHtml(v).replace(/'/g,'&#39;'); }
  function cssValue(v='') { return String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"'); }

  function addStyles() {
    if (document.getElementById('otto-v6-style')) return;
    const style = document.createElement('style');
    style.id = 'otto-v6-style';
    style.textContent = `
      .v6-topic-card{margin-top:14px;padding:16px;border-radius:22px;background:#f7fbfa;border:1px solid #d7e8e5;box-shadow:0 8px 22px rgba(29,72,68,.06)}
      .v6-topic-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.v6-topic-head b{font-size:17px;color:#153f43}.v6-topic-head span{font-size:12px;font-weight:800;color:#0a756e;background:#e1f3f0;padding:6px 9px;border-radius:999px;white-space:nowrap}
      .v6-word-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v6-word-chip{min-width:0;border:1px solid #d9e7e5;background:white;border-radius:16px;padding:10px;text-align:left;display:grid;grid-template-columns:30px 1fr auto;gap:7px;align-items:center;color:#183e42;cursor:pointer}.v6-word-chip .ico{font-size:21px}.v6-word-chip b{font-size:13px;line-height:1.2;overflow-wrap:anywhere}.v6-word-chip small{display:block;font-size:11px;color:#657b7e;margin-top:2px}.v6-word-chip i{font-style:normal;font-size:14px}
      .v6-dictionary{margin:18px 0 4px}.v6-dictionary h3{margin:0 0 5px}.v6-dictionary>p{margin:0 0 12px;color:#667e80;font-size:13px}.v6-dictionary-list{display:grid;gap:9px}.v6-dict-card{display:grid;grid-template-columns:42px 1fr;gap:10px;background:white;border:1px solid #dde9e7;border-radius:18px;padding:12px}.v6-dict-card .pic{font-size:25px;display:grid;place-items:center}.v6-dict-card b{font-size:14px;color:#173f43}.v6-dict-card span{display:block;color:#667b7e;font-size:12px;margin-top:2px}.v6-dict-card p{font-size:12px;margin:7px 0;color:#3f585b}.v6-dict-actions{display:flex;flex-wrap:wrap;gap:6px}.v6-dict-actions button{border:0;border-radius:10px;padding:7px 9px;background:#e8f3f2;color:#185752;font:700 11px/1.2 system-ui;cursor:pointer}.v6-dict-actions button.known{background:#d9f2e9;color:#126a57}
      .v6-overlay{position:fixed;inset:0;z-index:11000;background:rgba(10,40,44,.56);backdrop-filter:blur(7px);display:flex;align-items:flex-end;justify-content:center;padding:12px}.v6-practice{width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:26px 26px 18px 18px;padding:20px;color:#173f43;box-shadow:0 28px 80px rgba(0,0,0,.22)}
      .v6-practice-top{display:flex;justify-content:space-between;align-items:center;gap:12px}.v6-practice-top b{font-size:13px;color:#0b746e}.v6-practice-top span{font-size:12px;color:#718486}.v6-bar{height:8px;border-radius:999px;background:#e6efee;margin:10px 0 20px;overflow:hidden}.v6-bar i{display:block;height:100%;background:#168d87;width:0;transition:width .2s}.v6-question{text-align:center}.v6-question .emoji{font-size:48px;margin:8px}.v6-question h2{font-size:22px;margin:8px 0 7px}.v6-question p{color:#607779;margin:0 0 14px}.v6-audio{border:0;width:58px;height:58px;border-radius:50%;font-size:24px;background:#dff2ef;color:#0a6d67;cursor:pointer;margin:3px auto 13px}.v6-options{display:grid;gap:8px}.v6-options button{border:1px solid #d7e4e2;background:#fff;border-radius:14px;padding:13px;text-align:left;font:750 15px/1.25 system-ui;color:#173f43;cursor:pointer}.v6-options button.correct{border-color:#48a987;background:#e6f7f0}.v6-options button.wrong{border-color:#e78a82;background:#fff0ee}.v6-options button:disabled{cursor:default;opacity:1}.v6-feedback{min-height:48px;margin-top:12px;padding:11px 12px;border-radius:13px;background:#f1f7f6;color:#355b5d;font-size:13px}.v6-next{width:100%;border:0;border-radius:14px;padding:13px;margin-top:10px;background:#158c87;color:white;font-weight:850;font-size:15px;cursor:pointer}.v6-next[hidden]{display:none}.v6-finish{text-align:center}.v6-finish .check{width:64px;height:64px;border-radius:50%;background:#dff5eb;color:#08735e;display:grid;place-items:center;font-size:30px;margin:4px auto 12px}.v6-finish h2{margin:0 0 7px}.v6-finish p{color:#5d7779}.v6-recovery{position:fixed;z-index:12000;right:12px;bottom:86px;max-width:270px;background:#173f43;color:#fff;border-radius:16px;padding:12px 13px;box-shadow:0 12px 36px #0003;font:600 12px/1.4 system-ui}.v6-recovery button{margin-top:8px;border:0;border-radius:10px;background:white;color:#173f43;padding:8px 10px;font-weight:800;cursor:pointer}.v6-recovery-close{float:right;background:transparent!important;color:white!important;padding:0!important;margin:0!important;font-size:18px}.v6-plus-summary{margin-top:12px;padding:12px;border-radius:14px;background:#eef8f6;color:#315d5c;font-size:13px}.v6-plus-summary b{color:#0b716a}.v6-topic-card button,.v6-overlay button,.v6-dictionary button{touch-action:manipulation}
      @media(max-width:430px){.v6-word-grid{grid-template-columns:1fr}.v6-practice{padding:17px}.v6-question h2{font-size:20px}}
    `;
    document.head.appendChild(style);
  }

  function speak(text, mode='slow') {
    const t = String(text || '').trim();
    if (!t) return;
    if (window.OttoStartSpeech?.play) { void window.OttoStartSpeech.play(t, {mode}); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t); u.lang='de-DE'; u.rate=mode==='slow'?.8:.96; speechSynthesis.speak(u);
    } catch (_) {}
  }

  function preloadTopic(items) {
    const fn = window.OttoStartSpeech?.preload;
    if (typeof fn !== 'function' || !navigator.onLine) return;
    items.slice(0,18).forEach((item, i) => setTimeout(() => { void fn(item.speak || item.de, 'slow'); }, 250 + i * 140));
  }

  function topicCard(topic) {
    return `<div class="v6-topic-card" data-v6-topic-card data-no-word-tap="1"><div class="v6-topic-head"><div><b>${escapeHtml(topic.title)} — полный набор</b><div style="font-size:12px;color:#6d8284;margin-top:3px">Нажимай на слово, чтобы услышать его.</div></div><span>${escapeHtml(topic.countLabel)}</span></div><div class="v6-word-grid">${topic.items.map(item => `<button type="button" class="v6-word-chip" data-v6-speak="${escapeAttr(item.speak || item.de)}"><span class="ico">${item.emoji}</span><span><b>${escapeHtml(item.de)}</b><small>${escapeHtml(item.ru)}</small></span><i>🔊</i></button>`).join('')}</div></div>`;
  }

  function patchVisibleCopy() {
    const id = lessonId();
    const replacements = new Map([
      ['Моя семья — 4 слова','Моя семья — близкие и родные'],
      ['назвать близких','назвать близких и основных родственников'],
      ['узнавать и произносить основные числа','узнавать и произносить все числа от 1 до 10'],
      ['услышать цену до 20','узнавать все числа от 11 до 20 и понимать простую цену'],
      ['понять Montag и Freitag','знать и узнавать все 7 дней недели']
    ]);
    document.querySelectorAll('#app h1,#app h2,#app h3,#app b,#app small,#app p').forEach(el => {
      const t = (el.textContent || '').trim();
      if (replacements.has(t)) el.textContent = replacements.get(t);
    });
    if (lessonStep() === 0) {
      const meta = document.querySelector('#app .lesson-meta span:nth-child(2)');
      if (meta && TARGET_LESSONS.has(id)) {
        meta.textContent = id===15?'＋ 15 слов':id===17?'＋ 10 чисел':id===18?'＋ 10 чисел':'＋ 7 дней';
      }
    }
  }

  function enhanceLessonTopic() {
    const id = lessonId();
    const step = lessonStep();
    const topic = TOPICS[id];
    if (!topic || step !== 1) return;
    const screen = document.querySelector('#app .screen');
    if (!screen || screen.querySelector('[data-v6-topic-card]')) return;
    const anchor = screen.querySelector('.learn-words,.number-strip,.question-grid,.phrase-focus');
    if (!anchor) return;
    anchor.insertAdjacentHTML('afterend', topicCard(topic));
    preloadTopic(topic.items);
  }

  function addFinishSummary() {
    const id = lessonId();
    if (!TOPICS[id] || lessonStep() !== 3) return;
    const screen = document.querySelector('#app .screen');
    if (!screen || screen.querySelector('.v6-plus-summary')) return;
    const finish = screen.querySelector('.finish-card');
    if (!finish) return;
    const text = id===15
      ? 'Теперь в теме есть не только мама/папа/сын, но и дочь, брат, сестра, бабушка, дедушка, тётя, дядя, родители и другие базовые родственники.'
      : id===17 ? 'В уроке пройдены все числа от 1 до 10.'
      : id===18 ? 'В уроке пройдены все числа от 11 до 20.'
      : 'В уроке пройдены все семь дней недели.';
    const box = document.createElement('div'); box.className='v6-plus-summary'; box.setAttribute('data-no-word-tap','1'); box.innerHTML=`<b>Практика расширена.</b> ${escapeHtml(text)}`; finish.appendChild(box);
  }

  function unlockedExtraItems() {
    const id = lessonId();
    const completed = new Set(coreState().completed || []);
    const out=[];
    if (id >= 15 || completed.has(15)) out.push(...FAMILY);
    if (id >= 17 || completed.has(17)) out.push(...NUMBERS_1_10);
    if (id >= 18 || completed.has(18)) out.push(...NUMBERS_11_20);
    if (id >= 19 || completed.has(19)) out.push(...DAYS);
    const seen = new Set();
    return out.filter(x => !seen.has(x.id) && seen.add(x.id));
  }

  function masteryLabel(item) {
    const level = Number(extraState().mastery?.[item.id] || 0);
    return level >= 3 ? '✓ знаю' : level >= 1 ? '↗ повторяю' : 'новое';
  }

  function enhanceDictionary() {
    const screen = document.querySelector('#app .screen');
    if (!screen || !screen.querySelector('.word-cards') || screen.querySelector('[data-v6-dictionary]')) return;
    const items = unlockedExtraItems();
    if (!items.length) return;
    const section = document.createElement('section');
    section.className='v6-dictionary'; section.dataset.v6Dictionary='1'; section.setAttribute('data-no-word-tap','1');
    section.innerHTML=`<h3>Расширенный словарь Otto Start</h3><p>Слова из расширенных уроков тоже остаются здесь.</p><div class="v6-dictionary-list">${items.map(item => `<div class="v6-dict-card"><div class="pic">${item.emoji}</div><div><b>${escapeHtml(item.de)}</b><span>${escapeHtml(item.ru)} · ${masteryLabel(item)}</span><p>${escapeHtml(item.example || '')}</p><div class="v6-dict-actions"><button type="button" data-v6-speak="${escapeAttr(item.speak || item.de)}">🔊 Слово</button>${item.example?`<button type="button" data-v6-speak="${escapeAttr(item.example)}">🔊 Фраза</button>`:''}<button type="button" data-v6-mastery="${escapeAttr(item.id)}" data-v6-level="1">↗ Повторить</button><button type="button" class="known" data-v6-mastery="${escapeAttr(item.id)}" data-v6-level="3">✓ Знаю</button></div></div></div>`).join('')}</div>`;
    screen.querySelector('.word-cards')?.after(section);
  }

  function patchLearnedCount() {
    const proof = document.querySelector('#app .proof-grid>div:first-child strong');
    if (!proof || proof.dataset.v6Counted==='1') return;
    const extraKnown = Object.values(extraState().mastery || {}).filter(v => Number(v) >= 2).length;
    const base = Number((proof.textContent || '').replace(/\D/g,'')) || 0;
    proof.textContent = String(base + extraKnown);
    proof.dataset.v6Counted='1';
  }

  function randomOptions(correct, pool, label, n=3) {
    const others = pool.filter(x => x.id !== correct.id).sort(() => Math.random() - .5).slice(0,n-1);
    return [correct, ...others].sort(() => Math.random() - .5).map(item => ({value:label(item), correct:item.id===correct.id}));
  }

  function familyTasks() {
    const chosen = ['oma','opa','tante','onkel','tochter','bruder','schwester','eltern','grosseltern','kind'].map(id => FAMILY.find(x=>x.id===id));
    return chosen.map((item, i) => i % 2 === 0
      ? {kind:'meaning', item, title:`Как по-немецки «${item.ru}»?`, options:randomOptions(item,FAMILY,x=>x.de)}
      : {kind:'listen', item, title:'Кого ты услышала?', subtitle:'Сначала слушай, потом выбирай значение.', options:randomOptions(item,FAMILY,x=>x.ru)}
    );
  }
  function numberTasks(items, start) {
    return items.map((item, i) => i % 2 === 0
      ? {kind:'meaning', item, title:`Как по-немецки число ${item.digit}?`, options:randomOptions(item,items,x=>x.de)}
      : {kind:'listen', item, title:'Какое число ты услышала?', subtitle:`Задание ${start+i}`, options:randomOptions(item,items,x=>x.digit)}
    );
  }
  function dayTasks() {
    const base = DAYS.map((item,i) => i % 2 === 0
      ? {kind:'meaning',item,title:`Как по-немецки «${item.ru}»?`,options:randomOptions(item,DAYS,x=>x.de)}
      : {kind:'listen',item,title:'Какой день недели ты услышала?',options:randomOptions(item,DAYS,x=>x.ru)}
    );
    const extra = [
      {kind:'custom', item:DAYS[1], title:'Какой день идёт после Montag?', options:[{value:'Dienstag',correct:true},{value:'Donnerstag',correct:false},{value:'Sonntag',correct:false}]},
      {kind:'custom', item:DAYS[5], title:'Какой день идёт перед Sonntag?', options:[{value:'Samstag',correct:true},{value:'Freitag',correct:false},{value:'Mittwoch',correct:false}]}
    ];
    return [...base, ...extra];
  }
  function tasksFor(id) {
    if (id===15) return familyTasks();
    if (id===17) return numberTasks(NUMBERS_1_10,1);
    if (id===18) return numberTasks(NUMBERS_11_20,11);
    if (id===19) return dayTasks();
    return [];
  }

  function markMastery(id, good) {
    saveExtra(s => {
      s.mastery = s.mastery || {}; s.mistakes = s.mistakes || {};
      const cur = Number(s.mastery[id] || 0);
      s.mastery[id] = good ? Math.min(4, cur + 1) : Math.max(1, cur);
      if (!good) s.mistakes[id] = Number(s.mistakes[id] || 0) + 1;
    });
  }

  function openPractice(id, continueFn) {
    if (document.querySelector('.v6-overlay')) return;
    const tasks = tasksFor(id);
    if (!tasks.length) { continueFn?.(); return; }
    let index = 0, mistakes = 0, answered = false;
    const overlay = document.createElement('div');
    overlay.className='v6-overlay'; overlay.setAttribute('data-no-word-tap','1');
    overlay.innerHTML='<section class="v6-practice" role="dialog" aria-modal="true"></section>';
    document.body.appendChild(overlay);
    const panel = overlay.querySelector('.v6-practice');

    function renderTask() {
      answered=false;
      const task = tasks[index];
      const pct = Math.round((index/tasks.length)*100);
      panel.innerHTML=`<div class="v6-practice-top"><b>Практика+ · ${escapeHtml(TOPICS[id].title)}</b><span>${index+1} из ${tasks.length}</span></div><div class="v6-bar"><i style="width:${pct}%"></i></div><div class="v6-question">${task.kind==='listen'?`<button class="v6-audio" type="button" data-v6-audio="${escapeAttr(task.item.speak || task.item.de)}">🔊</button>`:`<div class="emoji">${task.item?.emoji || '🧠'}</div>`}<h2>${escapeHtml(task.title)}</h2>${task.subtitle?`<p>${escapeHtml(task.subtitle)}</p>`:''}<div class="v6-options">${task.options.map((o,i)=>`<button type="button" data-v6-choice="${i}" data-correct="${o.correct?'1':'0'}">${escapeHtml(o.value)}</button>`).join('')}</div><div class="v6-feedback">Выбери один вариант.</div><button type="button" class="v6-next" hidden>Дальше →</button></div>`;
      if (task.kind==='listen') setTimeout(()=>speak(task.item.speak || task.item.de,'slow'),180);
      panel.querySelector('[data-v6-audio]')?.addEventListener('click',e=>speak(e.currentTarget.dataset.v6Audio,'slow'));
      panel.querySelectorAll('[data-v6-choice]').forEach(btn => btn.addEventListener('click',() => {
        if (answered) return;
        answered=true;
        const good=btn.dataset.correct==='1';
        if (!good) mistakes++;
        markMastery(task.item.id, good);
        panel.querySelectorAll('[data-v6-choice]').forEach(b => {
          b.disabled=true;
          if (b.dataset.correct==='1') b.classList.add('correct');
        });
        if (!good) btn.classList.add('wrong');
        const feedback=panel.querySelector('.v6-feedback');
        feedback.textContent=good?'Верно. Ещё один шаг закреплён.':`Правильный вариант подсвечен. Ничего страшного — это слово вернётся ещё раз.`;
        panel.querySelector('.v6-next').hidden=false;
      }));
      panel.querySelector('.v6-next').addEventListener('click',() => {
        if (!answered) return;
        index++;
        if (index<tasks.length) renderTask(); else finish();
      });
    }

    function finish() {
      saveExtra(s => { s.practiceDone=s.practiceDone||{}; s.practiceDone[id]=true; });
      panel.innerHTML=`<div class="v6-finish"><div class="check">✓</div><h2>Расширенная практика пройдена</h2><p>${mistakes?`Ошибок: ${mistakes}. Эти слова будут помечены для повторения.`:'Все задания выполнены без ошибок.'}</p><button type="button" class="v6-next" data-v6-finish>Продолжить урок →</button></div>`;
      panel.querySelector('[data-v6-finish]').addEventListener('click',()=>{overlay.remove();continueFn?.()});
    }
    renderTask();
  }

  function practiceDone(id) { return Boolean(extraState().practiceDone?.[id]); }
  function resetPracticeForAttempt(id) {
    if (!TARGET_LESSONS.has(id)) return;
    saveExtra(s => { s.practiceDone=s.practiceDone||{}; s.practiceDone[id]=false; s.attempts=s.attempts||{}; s.attempts[id]=Date.now(); });
  }

  function startRecoveryWatch(button) {
    if (!button || button.disabled || button.closest('.v6-overlay')) return;
    if (!button.matches('[data-go],[data-start-lesson],[data-open-lesson],[data-next-step],[data-complete],[data-phase],[data-mini-step],[data-mini-answer]')) return;
    const beforeHtml = document.querySelector('#app')?.innerHTML || '';
    const beforeState = localStorage.getItem(CORE_KEY) || '';
    const descriptor = {
      go:button.dataset.go||'', start:button.hasAttribute('data-start-lesson'), open:button.dataset.openLesson||'', next:button.dataset.nextStep||'', complete:button.dataset.complete||'', phase:button.dataset.phase||'', miniStep:button.dataset.miniStep||'', miniAnswer:button.dataset.miniAnswer||''
    };
    setTimeout(() => {
      if (!document.body.contains(button)) return;
      const afterHtml = document.querySelector('#app')?.innerHTML || '';
      const afterState = localStorage.getItem(CORE_KEY) || '';
      if (afterHtml !== beforeHtml || afterState !== beforeState) return;
      sessionStorage.setItem(RECOVERY_KEY, JSON.stringify({...descriptor, at:Date.now(), tried:false}));
      location.reload();
    }, 1100);
  }

  function recoverPendingAction() {
    let action;
    try { action = JSON.parse(sessionStorage.getItem(RECOVERY_KEY) || 'null'); } catch { action=null; }
    if (!action || Date.now()-Number(action.at||0)>15000) { sessionStorage.removeItem(RECOVERY_KEY); return; }
    if (action.tried) { sessionStorage.removeItem(RECOVERY_KEY); showRecovery('Экран восстановлен после сбоя. Если кнопка снова не срабатывает, нажми «Обновить экран».'); return; }
    action.tried=true; sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(action));
    setTimeout(() => {
      let selector='';
      if (action.go) selector=`[data-go="${cssValue(action.go)}"]`;
      else if (action.start) selector='[data-start-lesson]';
      else if (action.open) selector=`[data-open-lesson="${cssValue(action.open)}"]`;
      else if (action.next) selector=`[data-next-step="${cssValue(action.next)}"]`;
      else if (action.complete) selector=`[data-complete="${cssValue(action.complete)}"]`;
      else if (action.phase) selector=`[data-phase="${cssValue(action.phase)}"]`;
      else if (action.miniStep) selector=`[data-mini-step="${cssValue(action.miniStep)}"]`;
      const target = selector ? document.querySelector(selector) : null;
      if (target && !target.disabled) target.click(); else { sessionStorage.removeItem(RECOVERY_KEY); showRecovery('Otto восстановил экран после сбоя. Можно продолжать с текущего места.'); }
    }, 650);
  }

  function showRecovery(message) {
    if (document.querySelector('.v6-recovery')) return;
    const box=document.createElement('div'); box.className='v6-recovery'; box.setAttribute('data-no-word-tap','1');
    box.innerHTML=`<button class="v6-recovery-close" aria-label="Закрыть">×</button><div>${escapeHtml(message)}</div><button type="button" data-v6-reload>↻ Обновить экран</button>`;
    document.body.appendChild(box);
    box.querySelector('.v6-recovery-close').addEventListener('click',()=>box.remove());
    box.querySelector('[data-v6-reload]').addEventListener('click',()=>location.reload());
  }

  let errorTimes=[];
  function noteError() {
    const now=Date.now(); errorTimes=errorTimes.filter(x=>now-x<10000); errorTimes.push(now);
    if (errorTimes.length>=2) showRecovery('Otto заметил технический сбой. Прогресс сохранён; можно безопасно обновить экран.');
  }

  function enhance() {
    try {
      patchVisibleCopy();
      enhanceLessonTopic();
      addFinishSummary();
      enhanceDictionary();
      patchLearnedCount();
    } catch (err) { console.warn('Otto v6 enhancement:', err); noteError(); }
  }

  document.addEventListener('click', e => {
    const speakBtn=e.target.closest?.('[data-v6-speak]');
    if (speakBtn) { e.preventDefault(); e.stopImmediatePropagation(); speak(speakBtn.dataset.v6Speak,'slow'); return; }

    const mastery=e.target.closest?.('[data-v6-mastery]');
    if (mastery) {
      e.preventDefault(); e.stopImmediatePropagation();
      const id=mastery.dataset.v6Mastery, level=Number(mastery.dataset.v6Level||1);
      saveExtra(s=>{s.mastery=s.mastery||{};s.mastery[id]=level;});
      const card=mastery.closest('.v6-dict-card'); const label=card?.querySelector('span');
      const item=ALL_EXTRA.find(x=>x.id===id); if(label&&item) label.textContent=`${item.ru} · ${level>=3?'✓ знаю':'↗ повторяю'}`;
      return;
    }

    const start=e.target.closest?.('[data-start-lesson]');
    if (start) resetPracticeForAttempt(lessonId());
    const open=e.target.closest?.('[data-open-lesson]');
    if (open) resetPracticeForAttempt(Number(open.dataset.openLesson||0));

    const next=e.target.closest?.('[data-next-step="3"]');
    const complete=e.target.closest?.('[data-complete]');
    const id=lessonId();
    if (TARGET_LESSONS.has(id) && !practiceDone(id) && (next||complete)) {
      e.preventDefault(); e.stopImmediatePropagation();
      const original=next||complete;
      openPractice(id,()=>{ original.dataset.v6Bypass='1'; original.click(); delete original.dataset.v6Bypass; });
      return;
    }

    const button=e.target.closest?.('button');
    if (button && !button.dataset.v6Bypass) startRecoveryWatch(button);
  }, true);

  window.addEventListener('error', noteError);
  window.addEventListener('unhandledrejection', noteError);

  addStyles();
  enhance();
  recoverPendingAction();
  document.addEventListener('click',()=>setTimeout(enhance,60),false);
  setInterval(enhance, 1800);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)enhance()});

  window.OttoStartV6={version:'6.0.0', topics:TOPICS};
})();
