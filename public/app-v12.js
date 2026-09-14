(() => {
  'use strict';
  if (window.__ottoStartV12) return;
  window.__ottoStartV12 = true;

  const DATA = window.OttoCourseDataV8;
  const root = document.getElementById('app');
  if (!root || !DATA) {
    document.body.innerHTML = '<main style="font-family:system-ui;padding:24px">Otto Start не смог загрузить учебные данные. Обновите страницу.</main>';
    return;
  }

  const STORAGE = 'ottoStartV12';
  const DAY = 86400000;
  const today = () => Math.floor(Date.now() / DAY);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const W = (id, de, ru, example, exampleRu, rule = '') => ({ id, de, ru, example, exampleRu, rule });
  const P = (id, de, ru) => ({ id, de, ru });
  const U = (id, title, icon, words = [], phrases = [], intro = '', rules = []) => ({ id, title, icon, words, phrases, intro, rules, sectionId: 'zero', sectionTitle: 'Старт с абсолютного нуля', kind: phrases.length && !words.length ? 'phrases' : 'words' });

  const STARTER = [
    U('zero-01', 'Первые два слова', '👋', [
      W('v12-hallo', 'Hallo', 'привет', 'Hallo!', 'Привет!'),
      W('v12-tschuess', 'Tschüss', 'пока', 'Tschüss!', 'Пока!', 'tsch в начале звучит примерно как «ч», ü — отдельный немецкий звук.'),
    ], [], 'Сегодня только два слова. Сначала узнаём смысл, потом слушаем.'),
    U('zero-02', 'Да и нет', '✓', [
      W('v12-ja', 'ja', 'да', 'Ja.', 'Да.', 'j в немецком читается как «й».'),
      W('v12-nein', 'nein', 'нет', 'Nein.', 'Нет.', 'ei читается примерно как «ай».'),
    ], [], 'Два очень частых ответа. Никаких длинных фраз.'),
    U('zero-03', 'Спасибо и пожалуйста', '🌿', [
      W('v12-danke', 'danke', 'спасибо', 'Danke!', 'Спасибо!'),
      W('v12-bitte', 'bitte', 'пожалуйста / не за что', 'Bitte.', 'Пожалуйста.'),
    ], [], 'Эти слова понадобятся почти в каждом бытовом диалоге.'),
    U('zero-04', 'Я и ты', '🙂', [
      W('v12-ich', 'ich', 'я', 'Ich bin Anna.', 'Я Анна.', 'ch в ich — мягкий немецкий звук [ç]. Не произносим как русский твёрдый «х».'),
      W('v12-du', 'du', 'ты', 'Du bist hier.', 'Ты здесь.'),
    ], [], 'Сначала два местоимения. Формы глагола появятся позже.'),
    U('zero-05', 'Совсем простые оценки', '⭐', [
      W('v12-gut', 'gut', 'хорошо', 'Gut!', 'Хорошо!'),
      W('v12-sehr', 'sehr', 'очень', 'Sehr gut!', 'Очень хорошо.'),
      W('v12-auch', 'auch', 'тоже', 'Ich auch.', 'Я тоже.', 'ch после au звучит твёрже, чем в ich.'),
    ], [], 'Три коротких слова, из которых уже складываются маленькие ответы.'),
    U('zero-06', 'Как назвать своё имя', '🪪', [
      W('v12-name', 'der Name', 'имя / фамилия', 'Mein Name ist Anna.', 'Меня зовут Анна.'),
      W('v12-heissen', 'heißen', 'называться', 'Ich heiße Anna.', 'Меня зовут Анна.', 'В heiße: ei → «ай», ß передаёт звук «с», конечное -e звучит слабо.'),
    ], [P('v12-ich-heisse', 'Ich heiße …', 'Меня зовут …')], 'Перед фразой разбираем только два новых элемента.', [
      { title: 'Сначала правило чтения', text: 'В heiße сочетание ei читается примерно как «ай», а ß передаёт звук «с». Сначала послушайте слово, потом повторите.' },
    ]),
    U('zero-07', 'Где? Здесь. Там.', '📍', [
      W('v12-wo', 'wo', 'где', 'Wo?', 'Где?', 'w в немецком звучит как «в».'),
      W('v12-hier', 'hier', 'здесь', 'Hier.', 'Здесь.', 'ie обычно даёт долгое «и».'),
      W('v12-da', 'da', 'там / здесь', 'Da.', 'Там.'),
    ], [], 'Учимся понимать один короткий вопрос и два ответа.'),
    U('zero-08', 'Сегодня и завтра', '🗓️', [
      W('v12-heute', 'heute', 'сегодня', 'Heute.', 'Сегодня.', 'eu читается примерно как «ой».'),
      W('v12-morgen', 'morgen', 'завтра / утром', 'Bis morgen!', 'До завтра!'),
    ], [], 'Два слова времени. Пока без сложных дат.'),
    U('zero-09', 'Числа 0–3', '🔢', [
      W('v12-null', 'null', 'ноль', 'null', '0'),
      W('v12-eins', 'eins', 'один', 'eins', '1', 'ei → примерно «ай».'),
      W('v12-zwei', 'zwei', 'два', 'zwei', '2', 'z в немецком звучит как «ц», ei → «ай».'),
      W('v12-drei', 'drei', 'три', 'drei', '3', 'ei → примерно «ай».'),
    ], [], 'Всего четыре числа. Следующие появятся отдельным занятием.'),
    U('zero-10', 'Числа 4–6', '🔢', [
      W('v12-vier', 'vier', 'четыре', 'vier', '4', 'ie → долгое «и».'),
      W('v12-fuenf', 'fünf', 'пять', 'fünf', '5'),
      W('v12-sechs', 'sechs', 'шесть', 'sechs', '6'),
    ]),
    U('zero-11', 'Числа 7–10', '🔢', [
      W('v12-sieben', 'sieben', 'семь', 'sieben', '7', 'ie → долгое «и».'),
      W('v12-acht', 'acht', 'восемь', 'acht', '8', 'ch после a звучит твёрже — [x].'),
      W('v12-neun', 'neun', 'девять', 'neun', '9', 'eu → примерно «ой».'),
      W('v12-zehn', 'zehn', 'десять', 'zehn', '10', 'z → «ц».'),
    ]),
    U('zero-12', 'Самая близкая семья', '👨‍👩‍👧', [
      W('v12-mutter', 'die Mutter', 'мама', 'Das ist meine Mutter.', 'Это моя мама.'),
      W('v12-vater', 'der Vater', 'папа', 'Das ist mein Vater.', 'Это мой папа.', 'v в Vater звучит как «ф».'),
      W('v12-kind', 'das Kind', 'ребёнок', 'Das ist mein Kind.', 'Это мой ребёнок.'),
    ], [], 'Сначала только три самых базовых слова семьи.'),
    U('zero-13', 'Дети, брат и сестра', '👨‍👩‍👧‍👦', [
      W('v12-sohn', 'der Sohn', 'сын', 'Das ist mein Sohn.', 'Это мой сын.'),
      W('v12-tochter', 'die Tochter', 'дочь', 'Das ist meine Tochter.', 'Это моя дочь.'),
      W('v12-bruder', 'der Bruder', 'брат', 'Das ist mein Bruder.', 'Это мой брат.'),
      W('v12-schwester', 'die Schwester', 'сестра', 'Das ist meine Schwester.', 'Это моя сестра.', 'sch → «ш».'),
    ]),
    U('zero-14', 'Бабушка, дедушка, тётя, дядя', '👵', [
      W('v12-oma', 'die Oma', 'бабушка', 'Das ist meine Oma.', 'Это моя бабушка.'),
      W('v12-opa', 'der Opa', 'дедушка', 'Das ist mein Opa.', 'Это мой дедушка.'),
      W('v12-tante', 'die Tante', 'тётя', 'Das ist meine Tante.', 'Это моя тётя.'),
      W('v12-onkel', 'der Onkel', 'дядя', 'Das ist mein Onkel.', 'Это мой дядя.'),
    ]),
    U('zero-15', 'Дни недели: 1–4', '📅', [
      W('v12-montag', 'der Montag', 'понедельник', 'Am Montag.', 'В понедельник.'),
      W('v12-dienstag', 'der Dienstag', 'вторник', 'Am Dienstag.', 'Во вторник.'),
      W('v12-mittwoch', 'der Mittwoch', 'среда', 'Am Mittwoch.', 'В среду.'),
      W('v12-donnerstag', 'der Donnerstag', 'четверг', 'Am Donnerstag.', 'В четверг.'),
    ]),
    U('zero-16', 'Дни недели: 5–7', '📅', [
      W('v12-freitag', 'der Freitag', 'пятница', 'Am Freitag.', 'В пятницу.', 'ei → примерно «ай».'),
      W('v12-samstag', 'der Samstag', 'суббота', 'Am Samstag.', 'В субботу.'),
      W('v12-sonntag', 'der Sonntag', 'воскресенье', 'Am Sonntag.', 'В воскресенье.'),
    ]),
  ];

  const starterLexemes = new Set(STARTER.flatMap((u) => u.words).map((w) => normalizeGerman(w.de)));

  function normalizeGerman(value) {
    return String(value || '')
      .toLocaleLowerCase('de-DE')
      .replace(/^(der|die|das)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function chunk(items, size) {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
  }

  function buildUnits() {
    const units = STARTER.map((x) => ({ ...x }));
    for (const topic of DATA.topics.filter((x) => x.id !== 'start')) {
      const words = (topic.words || []).filter((word) => !starterLexemes.has(normalizeGerman(word.de)));
      chunk(words, 4).forEach((items, index) => {
        units.push({
          id: `${topic.id}-w-${index + 1}`,
          title: `${topic.title} · слова ${index + 1}`,
          icon: topic.icon || '🌿',
          intro: `Небольшой блок: ${items.length} новых слов. Сначала значение, затем немецкое звучание.`,
          words: items,
          phrases: [],
          rules: [],
          sectionId: topic.id,
          sectionTitle: topic.title,
          kind: 'words',
        });
      });
      chunk(topic.phrases || [], 3).forEach((items, index) => {
        units.push({
          id: `${topic.id}-p-${index + 1}`,
          title: `${topic.title} · полезные фразы ${index + 1}`,
          icon: topic.icon || '💬',
          intro: 'Готовые короткие конструкции. Смысл всегда показан по-русски.',
          words: [],
          phrases: items,
          rules: [],
          sectionId: topic.id,
          sectionTitle: topic.title,
          kind: 'phrases',
        });
      });
      units.push({
        id: `${topic.id}-review`,
        title: `${topic.title} · закрепление`,
        icon: '✓',
        intro: 'Новых слов нет. Проверяем только то, что уже встречалось в этой теме.',
        words: [],
        phrases: [],
        rules: [],
        sectionId: topic.id,
        sectionTitle: topic.title,
        kind: 'review',
      });
    }
    return units;
  }

  const UNITS = buildUnits();
  const SECTIONS = (() => {
    const map = new Map();
    UNITS.forEach((unit, index) => {
      if (!map.has(unit.sectionId)) map.set(unit.sectionId, { id: unit.sectionId, title: unit.sectionTitle, icon: unit.icon, indexes: [] });
      map.get(unit.sectionId).indexes.push(index);
    });
    return [...map.values()];
  })();

  const DEFAULT = {
    version: 12,
    unitIndex: 0,
    completed: [],
    wordState: {},
    phraseState: {},
    sessions: 0,
    minutes: 0,
    duration: 7,
    createdAt: Date.now(),
    lastVisit: Date.now(),
  };

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      return {
        ...clone(DEFAULT),
        ...raw,
        completed: Array.isArray(raw.completed) ? raw.completed : [],
        wordState: raw.wordState && typeof raw.wordState === 'object' ? raw.wordState : {},
        phraseState: raw.phraseState && typeof raw.phraseState === 'object' ? raw.phraseState : {},
      };
    } catch {
      return clone(DEFAULT);
    }
  }

  let state = load();
  let view = 'home';
  let returnView = 'home';
  let quiz = null;
  let dictFilter = 'all';
  let dictSearch = '';
  let dictPage = 0;
  let toastTimer = null;

  function save() {
    state.lastVisit = Date.now();
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch {}
  }

  function esc(value = '') {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function attr(value = '') { return esc(value).replace(/'/g, '&#39;'); }
  function currentUnit() { return UNITS[Math.max(0, Math.min(state.unitIndex, UNITS.length - 1))]; }
  function completedSet() { return new Set(state.completed); }
  function unitDone(unit) { return state.completed.includes(unit.id); }
  function knownWordCount() { return Object.values(state.wordState).filter((x) => Number(x.level || 0) >= 2).length; }
  function seenWordCount() { return Object.keys(state.wordState).length; }
  function dueWordCount() { return Object.values(state.wordState).filter((x) => Number(x.due || 0) <= today()).length; }
  function progressPct() { return Math.round((state.completed.length / UNITS.length) * 100); }

  function interval(level) { return [0, 1, 3, 7, 14, 30][Math.max(0, Math.min(5, Number(level || 0)))] || 30; }
  function keyFor(item, phrase = false) { return `${phrase ? 'p' : 'w'}:${item.id || normalizeGerman(item.de)}`; }

  function markSeen(item, phrase = false, sectionTitle = '') {
    const bucket = phrase ? state.phraseState : state.wordState;
    const key = keyFor(item, phrase);
    if (!bucket[key]) {
      bucket[key] = {
        id: item.id || key,
        de: item.de,
        ru: item.ru,
        example: item.example || '',
        exampleRu: item.exampleRu || '',
        topic: sectionTitle,
        level: 0,
        seen: 0,
        errors: 0,
        due: today(),
        firstSeen: Date.now(),
        last: 0,
      };
    }
    bucket[key].seen = Math.max(1, Number(bucket[key].seen || 0));
    save();
    return key;
  }

  function markAnswer(item, good, phrase = false, sectionTitle = '') {
    const bucket = phrase ? state.phraseState : state.wordState;
    const key = markSeen(item, phrase, sectionTitle);
    const entry = bucket[key];
    entry.seen = Number(entry.seen || 0) + 1;
    entry.last = Date.now();
    if (good) entry.level = Math.min(5, Number(entry.level || 0) + 1);
    else {
      entry.errors = Number(entry.errors || 0) + 1;
      entry.level = Math.max(0, Number(entry.level || 0) - 1);
    }
    entry.due = today() + interval(entry.level);
    save();
  }

  function stripArticle(value = '') { return String(value).replace(/^(der|die|das)\s+/i, '').trim(); }

  function readingHint(item) {
    if (item.rule) return item.rule;
    const word = normalizeGerman(item.de);
    const hints = [];
    const add = (text) => { if (!hints.includes(text)) hints.push(text); };
    if (/^j/.test(word)) add('j в немецком читается как «й».');
    if (word.includes('sch')) add('sch читается примерно как «ш».');
    if (/^sp/.test(word)) add('sp в начале слова звучит примерно как «шп».');
    if (/^st/.test(word)) add('st в начале слова звучит примерно как «шт».');
    if (word.includes('ei')) add('ei читается примерно как «ай».');
    if (word.includes('ie')) add('ie обычно даёт долгое «и».');
    if (word.includes('eu') || word.includes('äu')) add('eu / äu читается примерно как «ой».');
    if (word.includes('ß')) add('ß передаёт звук «с».');
    if (/^z/.test(word)) add('z в немецком звучит как «ц».');
    if (/^w/.test(word)) add('w в немецком звучит как «в».');
    return hints.slice(0, 2).join(' ');
  }

  function topBar(subtitle = 'немецкий с абсолютного нуля') {
    return `<header class="v12-top"><div class="v12-brand"><img src="/otto/otto-home.webp" alt="Отто"><div><b>Otto Start</b><small>${esc(subtitle)}</small></div></div><button class="v12-icon-btn" type="button" data-action="nav-more" aria-label="Ещё">⋯</button></header>`;
  }

  function bottomNav(active = '') {
    const items = [
      ['home', '⌂', 'Главная'], ['route', '🧭', 'Путь'], ['dictionary', '📖', 'Слова'], ['profile', '◎', 'Прогресс'], ['more', '⋯', 'Ещё'],
    ];
    return `<nav class="v12-bottom">${items.map(([id, icon, label]) => `<button type="button" data-action="nav-${id}" class="${active === id ? 'active' : ''}"><span>${icon}</span>${label}</button>`).join('')}</nav>`;
  }

  function appShell(screen, main, active = '') {
    return `<div class="v12-app" data-v12-screen="${attr(screen)}">${topBar()}<main class="v12-main">${main}</main>${bottomNav(active)}</div><div class="v12-offline">Офлайн-режим</div>`;
  }

  function renderHome() {
    const unit = currentUnit();
    const starterDone = STARTER.filter(unitDone).length;
    const main = `<section class="v12-hero"><div><div class="v12-kicker">Начинаем спокойно</div><h1>Немецкий с нуля — маленькими шагами</h1><p>В одном занятии только 2–4 новых слова. Перевод всегда рядом, немецкое звучание — отдельной кнопкой.</p><div class="v12-pill-row"><span class="v12-pill">${seenWordCount()} слов встречалось</span><span class="v12-pill">${knownWordCount()} закреплено</span></div></div><img src="/otto/otto-guide.webp" alt="Отто"></section>
      <section class="v12-section"><div class="v12-section-head"><h2>Следующее занятие</h2><small>${state.unitIndex + 1} из ${UNITS.length}</small></div><div class="v12-card"><div class="v12-next"><div class="v12-next-icon">${unit.icon || '🌿'}</div><div><h3>${esc(unit.title)}</h3><p>${esc(unit.intro || 'Короткий учебный шаг.')}</p></div></div><div class="v12-progress"><i style="width:${Math.max(2, progressPct())}%"></i></div><button class="v12-btn primary block" type="button" data-action="start-unit">Начать занятие →</button></div></section>
      <section class="v12-section"><div class="v12-stat-grid"><div class="v12-stat"><strong>${starterDone}/${STARTER.length}</strong><span>шагов «с нуля»</span></div><div class="v12-stat"><strong>${dueWordCount()}</strong><span>на повторение</span></div><div class="v12-stat"><strong>${state.sessions}</strong><span>занятий</span></div></div></section>
      <section class="v12-section"><div class="v12-note"><b>Важно:</b> Otto не спрашивает слово до знакомства с ним. Когда вопрос звучит «Что означает немецкое слово?», варианты ответа всегда даются <b>по-русски</b>. Немецкие варианты появляются только в заданиях, где прямо написано «Как будет по-немецки?».</div></section>`;
    root.innerHTML = appShell('Главная', main, 'home');
  }

  function renderLesson() {
    const unit = currentUnit();
    const items = unit.kind === 'review' ? reviewItemsForSection(unit.sectionId) : unit.words;
    items.forEach((item) => markSeen(item, false, unit.sectionTitle));
    unit.phrases.forEach((item) => markSeen(item, true, unit.sectionTitle));

    const ruleCards = (unit.rules || []).map((rule) => `<div class="v12-reading-card"><b>${esc(rule.title)}</b><p>${esc(rule.text)}</p></div>`).join('');
    let body = `<div class="v12-screen-head"><button type="button" class="v12-back" data-action="back-home">←</button><div class="text"><b>${esc(unit.title)}</b><small>${esc(unit.sectionTitle)}</small></div></div><div class="v12-kicker">Короткое занятие</div><h1 class="v12-title">${esc(unit.title)}</h1><p class="v12-lead">${esc(unit.intro || 'Сначала смысл, затем звук, затем короткое закрепление.')}</p>${ruleCards}`;

    if (unit.kind === 'review') {
      body += `<div class="v12-note">Здесь нет новой лексики. Повторяем знакомые слова этой темы.</div>`;
    }

    if (items.length) {
      body += `<section class="v12-section"><div class="v12-word-list">${items.map((item) => {
        const hint = readingHint(item);
        return `<article class="v12-word-card"><div><h3>${esc(item.de)}</h3><div class="ru">${esc(item.ru)}</div></div><button class="v12-audio" type="button" data-action="audio" data-text="${attr(item.de)}" aria-label="Послушать ${attr(item.de)}">🔊</button>${item.example ? `<div class="v12-example"><b>${esc(item.example)}</b><span>${esc(item.exampleRu || '')}</span></div>` : ''}${hint ? `<div class="v12-rule"><b>Почему так читается?</b> ${esc(hint)}</div>` : ''}<div class="v12-actions" style="grid-column:1/-1"><button class="v12-btn secondary small" type="button" data-action="pronounce" data-text="${attr(stripArticle(item.de))}">🎤 Повторить</button></div></article>`;
      }).join('')}</div></section>`;
    }

    if (unit.phrases.length) {
      body += `<section class="v12-section"><div class="v12-section-head"><h2>Готовая фраза</h2><small>значение сразу по-русски</small></div><div class="v12-word-list">${unit.phrases.map((item) => `<article class="v12-word-card"><div><h3>${esc(item.de)}</h3><div class="ru">${esc(item.ru)}</div></div><button class="v12-audio" type="button" data-action="audio" data-text="${attr(item.de)}">🔊</button><div class="v12-actions" style="grid-column:1/-1"><button class="v12-btn secondary small" type="button" data-action="pronounce" data-text="${attr(item.de)}">🎤 Сказать</button></div></article>`).join('')}</div></section>`;
    }

    body += `<section class="v12-section"><button class="v12-btn primary block" type="button" data-action="start-quiz">Закрепить это занятие →</button></section>`;
    root.innerHTML = appShell('Занятие', body, '');
  }

  function reviewItemsForSection(sectionId) {
    const list = Object.values(state.wordState).filter((x) => x.topic && sectionTitleById(sectionId) === x.topic);
    return shuffle(list).slice(0, Math.min(8, list.length));
  }

  function sectionTitleById(id) { return SECTIONS.find((x) => x.id === id)?.title || ''; }

  function poolWords(extra = []) {
    const seen = Object.values(state.wordState).map((x) => ({ ...x }));
    const all = [...extra, ...seen];
    const map = new Map();
    all.forEach((x) => { if (x?.ru && x?.de) map.set(String(x.id || normalizeGerman(x.de)), x); });
    return [...map.values()];
  }

  function makeOptions(correctItem, pool, field) {
    const correct = String(correctItem[field] || '').trim();
    const values = shuffle(pool.map((x) => String(x[field] || '').trim()).filter((x) => x && x !== correct));
    const unique = [...new Set(values)].slice(0, 3);
    const fallbacks = field === 'ru' ? ['дом', 'вода', 'работа', 'семья', 'время', 'город', 'книга', 'день'] : ['Hallo', 'danke', 'ja', 'nein', 'heute', 'morgen'];
    for (const value of fallbacks) {
      if (unique.length >= 3) break;
      if (value !== correct && !unique.includes(value)) unique.push(value);
    }
    return shuffle([{ label: correct, correct: true }, ...unique.slice(0, 3).map((label) => ({ label, correct: false }))]);
  }

  function quizTasksFor(unit) {
    if (unit.kind === 'review') {
      const words = reviewItemsForSection(unit.sectionId);
      return words.flatMap((item, index) => {
        const pool = poolWords(words);
        return [
          { type: 'meaning', item, phrase: false, options: makeOptions(item, pool, 'ru') },
          ...(index < 3 ? [{ type: 'listen', item, phrase: false, options: makeOptions(item, pool, 'ru') }] : []),
        ];
      }).slice(0, 10);
    }
    if (unit.words.length) {
      const pool = poolWords(unit.words);
      const tasks = [];
      unit.words.forEach((item) => tasks.push({ type: 'meaning', item, phrase: false, options: makeOptions(item, pool, 'ru') }));
      unit.words.slice(0, Math.min(2, unit.words.length)).forEach((item) => tasks.push({ type: 'listen', item, phrase: false, options: makeOptions(item, pool, 'ru') }));
      if (unit.phrases.length) unit.phrases.slice(0, 2).forEach((item) => tasks.push({ type: 'phrase', item, phrase: true, options: makeOptions(item, unit.phrases, 'ru') }));
      return tasks;
    }
    if (unit.phrases.length) {
      return unit.phrases.flatMap((item, index) => [
        { type: 'phrase', item, phrase: true, options: makeOptions(item, unit.phrases, 'ru') },
        ...(index < 2 ? [{ type: 'phrase-listen', item, phrase: true, options: makeOptions(item, unit.phrases, 'ru') }] : []),
      ]).slice(0, 8);
    }
    return [];
  }

  function startQuiz() {
    const unit = currentUnit();
    const tasks = quizTasksFor(unit);
    if (!tasks.length) {
      completeUnit();
      return;
    }
    quiz = { unitId: unit.id, tasks, index: 0, good: 0, bad: 0, answered: false, selected: -1 };
    view = 'quiz';
    render();
  }

  function renderQuiz() {
    const unit = currentUnit();
    if (!quiz || quiz.unitId !== unit.id) { startQuiz(); return; }
    if (quiz.index >= quiz.tasks.length) { renderQuizDone(); return; }
    const task = quiz.tasks[quiz.index];
    const listening = task.type.includes('listen');
    const phrase = task.phrase;
    const prompt = listening ? 'Что вы услышали?' : phrase ? `Что означает фраза «${task.item.de}»?` : `Что означает «${stripArticle(task.item.de)}»?`;
    const body = `<div class="v12-screen-head"><button type="button" class="v12-back" data-action="back-lesson">←</button><div class="text"><b>${esc(unit.title)}</b><small>Закрепление · ${quiz.index + 1}/${quiz.tasks.length}</small></div></div><div class="v12-progress"><i style="width:${Math.max(3, Math.round((quiz.index / quiz.tasks.length) * 100))}%"></i></div><section class="v12-quiz"><div class="v12-quiz-card"><div class="v12-quiz-icon">${listening ? '🔊' : '🌿'}</div>${listening ? `<button class="v12-btn secondary small" type="button" data-action="audio" data-text="${attr(task.item.de)}">🔊 Послушать ещё раз</button>` : ''}<h1>${esc(prompt)}</h1><p>${listening ? 'Немецкое слово заранее не показываем. Все варианты — перевод на русский.' : 'Выберите значение на русском языке.'}</p><div class="v12-options">${task.options.map((option, index) => `<button type="button" class="v12-option ${quiz.answered && option.correct ? 'correct' : ''} ${quiz.answered && quiz.selected === index && !option.correct ? 'wrong' : ''}" data-action="answer" data-index="${index}" ${quiz.answered ? 'disabled' : ''}>${esc(option.label)}</button>`).join('')}</div>${quiz.answered ? `<div class="v12-feedback ${task.options[quiz.selected]?.correct ? 'good' : 'bad'}">${task.options[quiz.selected]?.correct ? 'Верно.' : 'Правильный перевод показан зелёным.'}<br><b>${esc(task.item.de)}</b> — ${esc(task.item.ru)}</div><button class="v12-btn primary block" style="margin-top:10px" type="button" data-action="quiz-next">Дальше →</button>` : '<div class="v12-feedback">Выберите один русский перевод.</div>'}</div></section>`;
    root.innerHTML = appShell('Закрепление', body, '');
    if (listening && !quiz.answered) setTimeout(() => window.OttoSpeechV12?.play?.(task.item.de, { mode: 'slow' }), 60);
  }

  function answerQuiz(index) {
    if (!quiz || quiz.answered) return;
    const task = quiz.tasks[quiz.index];
    const option = task.options[index];
    if (!option) return;
    quiz.answered = true;
    quiz.selected = index;
    if (option.correct) quiz.good += 1; else quiz.bad += 1;
    markAnswer(task.item, Boolean(option.correct), Boolean(task.phrase), currentUnit().sectionTitle);
    render();
  }

  function nextQuiz() {
    if (!quiz?.answered) return;
    quiz.index += 1;
    quiz.answered = false;
    quiz.selected = -1;
    render();
  }

  function renderQuizDone() {
    const unit = currentUnit();
    const body = `<div class="v12-screen-head"><button type="button" class="v12-back" data-action="back-home">←</button><div class="text"><b>${esc(unit.title)}</b><small>Результат</small></div></div><section class="v12-quiz"><div class="v12-quiz-card"><div class="v12-quiz-icon">${quiz.bad ? '🌿' : '✓'}</div><div class="v12-kicker">Занятие закончено</div><h1>${quiz.bad ? 'Хорошо. Ошибки вернутся в повторение.' : 'Отлично. Этот маленький шаг закреплён.'}</h1><p>Верно: ${quiz.good} · Ошибок: ${quiz.bad}</p><div class="v12-lesson-proof"><div><strong>${seenWordCount()}</strong><span>слов встречалось</span></div><div><strong>${knownWordCount()}</strong><span>уже закреплено</span></div></div><button class="v12-btn primary block" style="margin-top:12px" type="button" data-action="complete-unit">Завершить и продолжить →</button></div></section>`;
    root.innerHTML = appShell('Результат', body, '');
  }

  function completeUnit() {
    const unit = currentUnit();
    if (!state.completed.includes(unit.id)) state.completed.push(unit.id);
    state.sessions += 1;
    state.minutes += Number(state.duration || 7);
    let next = state.unitIndex + 1;
    while (next < UNITS.length && state.completed.includes(UNITS[next].id)) next += 1;
    state.unitIndex = Math.min(next, UNITS.length - 1);
    save();
    quiz = null;
    view = 'home';
    render();
  }

  function sectionProgress(section) {
    const done = section.indexes.filter((index) => unitDone(UNITS[index])).length;
    return { done, total: section.indexes.length, pct: Math.round((done / section.indexes.length) * 100) };
  }

  function sectionUnlocked(sectionIndex) {
    if (sectionIndex === 0) return true;
    return SECTIONS.slice(0, sectionIndex).every((section) => sectionProgress(section).done === section.indexes.length);
  }

  function renderRoute() {
    const main = `<div class="v12-kicker">Большой путь · короткие занятия</div><h1 class="v12-title">Путь от нуля к базе A1</h1><p class="v12-lead">Каждая тема разбита на мини-занятия по 2–4 новых слова. Следующая тема открывается после предыдущей, чтобы не перегружать новичка.</p><div class="v12-route">${SECTIONS.map((section, index) => {
      const p = sectionProgress(section); const unlocked = sectionUnlocked(index); const current = section.indexes.includes(state.unitIndex); const done = p.done === p.total;
      return `<button type="button" class="v12-topic ${current ? 'current' : ''} ${done ? 'done' : ''} ${!unlocked ? 'locked' : ''}" data-action="open-section" data-section="${attr(section.id)}" ${!unlocked ? 'disabled' : ''}><span class="ico">${section.icon || '🌿'}</span><span><b>${esc(section.title)}</b><small>${p.total} коротких занятий · ${p.done} завершено</small></span><span class="pct">${done ? '✓' : `${p.pct}%`}</span></button>`;
    }).join('')}</div>`;
    root.innerHTML = appShell('Путь', main, 'route');
  }

  function openSection(id) {
    const sectionIndex = SECTIONS.findIndex((x) => x.id === id);
    if (sectionIndex < 0 || !sectionUnlocked(sectionIndex)) return;
    const section = SECTIONS[sectionIndex];
    const target = section.indexes.find((index) => !unitDone(UNITS[index])) ?? section.indexes[0];
    state.unitIndex = target;
    save();
    view = 'lesson';
    render();
  }

  function dictionaryItems() {
    let list = Object.values(state.wordState);
    if (dictFilter === 'new') list = list.filter((x) => Number(x.level || 0) < 2);
    if (dictFilter === 'review') list = list.filter((x) => Number(x.due || 0) <= today() || Number(x.errors || 0) > 0);
    if (dictFilter === 'known') list = list.filter((x) => Number(x.level || 0) >= 2);
    const q = dictSearch.trim().toLocaleLowerCase('ru-RU');
    if (q) list = list.filter((x) => `${x.de} ${x.ru}`.toLocaleLowerCase('ru-RU').includes(q));
    return list.sort((a, b) => Number(a.firstSeen || 0) - Number(b.firstSeen || 0));
  }

  function renderDictionary() {
    const list = dictionaryItems();
    const pageSize = 20;
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    dictPage = Math.max(0, Math.min(dictPage, pages - 1));
    const page = list.slice(dictPage * pageSize, dictPage * pageSize + pageSize);
    const main = `<div class="v12-kicker">Мои слова</div><h1 class="v12-title">Словарь</h1><p class="v12-lead">Здесь только слова, которые уже встречались в занятиях. Максимум 20 карточек на странице — словарь не строит сотни элементов сразу.</p><div class="v12-dict-toolbar"><input class="v12-search" type="search" data-v12-dict-search value="${attr(dictSearch)}" placeholder="Найти немецкое или русское слово"><div class="v12-tabs">${[['all','Все'],['new','Новые'],['review','Повторить'],['known','Знаю']].map(([id,label]) => `<button type="button" data-action="dict-filter" data-filter="${id}" class="${dictFilter === id ? 'active' : ''}">${label}</button>`).join('')}</div></div>${page.length ? `<div class="v12-dict-list">${page.map((item) => `<article class="v12-dict-card"><h3>${esc(item.de)}</h3><div class="ru">${esc(item.ru)}</div>${item.example ? `<div class="v12-example"><b>${esc(item.example)}</b><span>${esc(item.exampleRu || '')}</span></div>` : ''}<div class="v12-dict-card-actions"><button class="v12-btn secondary small" type="button" data-action="audio" data-text="${attr(item.de)}">🔊 Слушать</button><button class="v12-btn secondary small" type="button" data-action="pronounce" data-text="${attr(stripArticle(item.de))}">🎤 Сказать</button></div></article>`).join('')}</div><div class="v12-pager"><button class="v12-btn secondary small" type="button" data-action="dict-prev" ${dictPage <= 0 ? 'disabled' : ''}>←</button><span>${dictPage + 1} / ${pages}</span><button class="v12-btn secondary small" type="button" data-action="dict-next" ${dictPage >= pages - 1 ? 'disabled' : ''}>→</button></div>` : '<div class="v12-empty">Пока здесь пусто. Пройдите первое занятие — слова появятся автоматически.</div>'}`;
    root.innerHTML = appShell('Словарь', main, 'dictionary');
    const input = root.querySelector('[data-v12-dict-search]');
    input?.addEventListener('input', (event) => {
      dictSearch = event.target.value;
      dictPage = 0;
      clearTimeout(input.__timer);
      input.__timer = setTimeout(render, 180);
    });
  }

  function renderProfile() {
    const main = `<div class="v12-kicker">Прогресс</div><h1 class="v12-title">Ваш путь</h1><div class="v12-stat-grid"><div class="v12-stat"><strong>${state.sessions}</strong><span>занятий</span></div><div class="v12-stat"><strong>${state.minutes}</strong><span>минут</span></div><div class="v12-stat"><strong>${knownWordCount()}</strong><span>слов закреплено</span></div></div><section class="v12-section"><div class="v12-card"><div class="v12-profile-row"><div><b>Пройдено программы</b><br><small>Не равно «владению A1»</small></div><strong>${progressPct()}%</strong></div><div class="v12-profile-row"><div><b>Слов встречалось</b><br><small>пассивный и активный словарь</small></div><strong>${seenWordCount()}</strong></div><div class="v12-profile-row"><div><b>Нужно повторить</b><br><small>интервальное повторение</small></div><strong>${dueWordCount()}</strong></div></div></section><section class="v12-section"><div class="v12-card"><b>Длина короткого занятия</b><div class="v12-grid-2" style="margin-top:9px">${[5,7,10].map((n) => `<button class="v12-btn ${state.duration === n ? 'primary' : 'secondary'} small" type="button" data-action="duration" data-value="${n}">${n} минут</button>`).join('')}</div></div></section><section class="v12-section"><button class="v12-btn ghost block" type="button" data-action="reset-progress">Сбросить тестовый прогресс</button></section>`;
    root.innerHTML = appShell('Прогресс', main, 'profile');
  }

  function renderMore() {
    const main = `<div class="v12-kicker">Otto Start</div><h1 class="v12-title">Ещё</h1><div class="v12-grid-2"><button class="v12-card" style="text-align:left" type="button" data-action="share"><div style="font-size:28px">↗</div><b>Поделиться Otto</b><p class="v12-muted">Отправить ссылку знакомому</p></button><button class="v12-card" style="text-align:left" type="button" data-action="support"><div style="font-size:28px">?</div><b>Помощь / Поддержка</b><p class="v12-muted">Сообщить об ошибке</p></button></div><section class="v12-section"><div class="v12-note">Текущая версия специально собрана без цепочки старых DOM-наблюдателей. Главный экран, уроки и словарь работают через одну предсказуемую систему рендера и один обработчик действий.</div></section>`;
    root.innerHTML = appShell('Ещё', main, 'more');
  }

  function openSupport() {
    const wrap = document.createElement('div');
    wrap.className = 'v12-modal-backdrop';
    wrap.dataset.v12Support = '1';
    wrap.innerHTML = `<section class="v12-modal"><div class="v12-modal-head"><b>Помощь / Поддержка</b><button type="button" data-v12-support-close>×</button></div><div class="v12-modal-body"><form class="v12-support"><select name="category"><option>Ошибка в приложении</option><option>Ошибка в переводе</option><option>Проблема со звуком</option><option>Проблема с микрофоном</option><option>Вопрос по обучению</option></select><textarea name="message" maxlength="3000" required placeholder="Опишите, что произошло"></textarea><button class="v12-btn primary block" type="submit" style="margin-top:8px">Отправить</button></form><div data-v12-support-result></div></div></section>`;
    wrap.querySelector('[data-v12-support-close]')?.addEventListener('click', () => wrap.remove());
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
    wrap.querySelector('form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const btn = form.querySelector('button[type=submit]');
      const result = wrap.querySelector('[data-v12-support-result]');
      const fd = new FormData(form);
      btn.disabled = true;
      btn.textContent = 'Отправляю…';
      try {
        const response = await fetch('/api/otto-start-support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: fd.get('category'), message: fd.get('message'), page: location.href, device: navigator.userAgent, lesson: currentUnit()?.id }) });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Не удалось отправить сообщение');
        result.innerHTML = `<div class="v12-feedback good">Сообщение отправлено${payload.ticket ? `. Номер: ${esc(payload.ticket)}` : '.'}</div>`;
        form.reset();
      } catch (error) {
        result.innerHTML = `<div class="v12-feedback bad">${esc(error?.message || 'Не удалось отправить сообщение')}</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Отправить';
      }
    });
    document.body.appendChild(wrap);
  }

  async function share() {
    const data = { title: 'Otto Start', text: 'Немецкий с абсолютного нуля — короткими занятиями.', url: location.origin + '/' };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        showToast('Ссылка скопирована.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Не удалось открыть меню «Поделиться».');
    }
  }

  function shuffle(items) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function showToast(message) {
    document.querySelector('.v12-toast')?.remove();
    const el = document.createElement('div');
    el.className = 'v12-toast';
    el.textContent = String(message || '');
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 3800);
  }

  function render() {
    const started = performance.now();
    if (view === 'home') renderHome();
    else if (view === 'lesson') renderLesson();
    else if (view === 'quiz') renderQuiz();
    else if (view === 'route') renderRoute();
    else if (view === 'dictionary') renderDictionary();
    else if (view === 'profile') renderProfile();
    else if (view === 'more') renderMore();
    else { view = 'home'; renderHome(); }
    const elapsed = performance.now() - started;
    if (elapsed > 120) window.OttoClientLogV12?.send?.('slow-render', { message: `Render ${view} took ${Math.round(elapsed)} ms`, details: { elapsedMs: Math.round(elapsed), count: root.querySelectorAll('*').length } }, 2500);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function resetProgress() {
    if (!confirm('Сбросить учебный прогресс Otto Start на этом устройстве?')) return;
    state = clone(DEFAULT);
    save();
    quiz = null;
    view = 'home';
    dictPage = 0;
    dictSearch = '';
    render();
  }

  root.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-action]');
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    if (action === 'nav-home') { view = 'home'; quiz = null; render(); return; }
    if (action === 'nav-route') { view = 'route'; quiz = null; render(); return; }
    if (action === 'nav-dictionary') { view = 'dictionary'; quiz = null; dictPage = 0; render(); return; }
    if (action === 'nav-profile') { view = 'profile'; quiz = null; render(); return; }
    if (action === 'nav-more') { view = 'more'; quiz = null; render(); return; }
    if (action === 'start-unit') { returnView = 'home'; view = 'lesson'; render(); return; }
    if (action === 'back-home') { view = returnView || 'home'; quiz = null; render(); return; }
    if (action === 'back-lesson') { view = 'lesson'; quiz = null; render(); return; }
    if (action === 'start-quiz') { startQuiz(); return; }
    if (action === 'answer') { answerQuiz(Number(target.dataset.index)); return; }
    if (action === 'quiz-next') { nextQuiz(); return; }
    if (action === 'complete-unit') { completeUnit(); return; }
    if (action === 'audio') { window.OttoSpeechV12?.play?.(target.dataset.text, { mode: 'slow', button: target }); return; }
    if (action === 'pronounce') { window.OttoSpeechV12?.checkPronunciation?.(target.dataset.text); return; }
    if (action === 'open-section') { openSection(target.dataset.section); return; }
    if (action === 'dict-filter') { dictFilter = target.dataset.filter || 'all'; dictPage = 0; render(); return; }
    if (action === 'dict-prev') { dictPage = Math.max(0, dictPage - 1); render(); return; }
    if (action === 'dict-next') { dictPage += 1; render(); return; }
    if (action === 'duration') { state.duration = Number(target.dataset.value) || 7; save(); render(); return; }
    if (action === 'reset-progress') { resetProgress(); return; }
    if (action === 'share') { void share(); return; }
    if (action === 'support') { openSupport(); return; }
  });

  window.addEventListener('otto:v12-toast', (event) => showToast(event.detail?.message || ''));
  window.addEventListener('online', () => showToast('Интернет снова доступен.'));

  function signature() {
    return `${view}|${state.unitIndex}|${state.completed.length}|${quiz?.index ?? -1}|${quiz?.answered ? 1 : 0}|${dictFilter}|${dictPage}|${root.textContent.slice(0, 120)}`;
  }

  window.OttoStartV12 = { render, signature, state: () => clone(state), units: () => UNITS.length };
  render();
})();
