(() => {
  'use strict';

  const VERSION = 'de-DE-hochdeutsch-v2';
  const CACHE_MARK = 'ottoStartPronunciationCacheVersion';
  const OLD_AUDIO_DB = 'otto-start-audio-v1';

  function resetOldAudioCacheOnce() {
    try {
      if (localStorage.getItem(CACHE_MARK) === VERSION) return;
      if (!('indexedDB' in window)) {
        localStorage.setItem(CACHE_MARK, VERSION);
        return;
      }
      const request = indexedDB.deleteDatabase(OLD_AUDIO_DB);
      request.onsuccess = () => localStorage.setItem(CACHE_MARK, VERSION);
      request.onerror = () => console.warn('Otto pronunciation cache reset failed');
      request.onblocked = () => console.warn('Otto pronunciation cache reset is waiting for an old audio connection to close');
    } catch (_) {}
  }

  function text(el) {
    return String(el?.textContent || '').trim();
  }

  function setTextIfNeeded(el, value) {
    if (el && text(el) !== value) el.textContent = value;
  }

  function setHtmlIfNeeded(el, value) {
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }

  function fixChRuleCard(card) {
    const symbol = card.querySelector('.rule-symbol');
    if (text(symbol).toLowerCase() !== 'ch') return;
    const title = card.querySelector('h1, b');
    setTextIfNeeded(title, 'мягкий немецкий звук [ç], ближе к «хь»');
  }

  function appendZwanzigHint(sheet) {
    if (sheet.querySelector('[data-otto-pronunciation-ig]')) return;
    const details = sheet.querySelector('.otto-rule-explain');
    const list = details?.querySelector('.otto-rule-list');
    if (!list) return;
    const line = document.createElement('div');
    line.className = 'otto-rule-line';
    line.dataset.ottoPronunciationIg = '1';
    line.innerHTML = '<strong>-ig</strong><span>В стандартном произношении Германии окончание -ig обычно звучит как [ɪç], то есть с мягким ich-Laut, а не как твёрдое «иг».</span>';
    list.appendChild(line);
    details.hidden = false;
  }

  function fixWordSheet(sheet) {
    const word = text(sheet.querySelector('.otto-sheet-title h2')).toLocaleLowerCase('de-DE');
    sheet.querySelectorAll('.otto-rule-line').forEach((line) => {
      const label = text(line.querySelector('strong')).toLowerCase();
      const explanation = line.querySelector('span');
      if (!explanation) return;
      if (label === 'ch') {
        setTextIfNeeded(explanation, 'В ich / mich / Milch это немецкий ich-Laut [ç]: мягкий звук, ближе к «хь», но не русский твёрдый «х».');
      }
      if (label === 'ie' && word === 'familie') {
        setTextIfNeeded(explanation, 'В Familie конечное -ie не читается как обычное долгое ie из Liebe. Здесь i и e принадлежат разным слоговым частям; слушай слово целиком.');
      }
    });
    if (word === 'zwanzig') appendZwanzigHint(sheet);
  }

  function fixFamilieGate(gate) {
    const content = text(gate).toLowerCase();
    if (!content.includes('familie')) return;
    gate.querySelectorAll('.otto-rule-pill').forEach((pill) => {
      if (/\bie\b/i.test(text(pill)) && /долг|и/.test(text(pill).toLowerCase())) {
        setTextIfNeeded(pill, 'Familie: финальное -ie ≠ обычное ie');
      }
    });
    gate.querySelectorAll('p').forEach((p) => {
      if (/Familie/i.test(p.textContent || '') && /ie/i.test(p.textContent || '')) {
        setHtmlIfNeeded(p, '<b>Familie</b>: здесь финальные <b>i + e</b> не образуют обычное долгое <b>ie</b> как в <i>Liebe</i>. Сначала послушай всё слово и повтори его целиком.');
      }
    });
  }

  function fixFamilieSyllables() {
    document.querySelectorAll('#app .syllable-demo').forEach((card) => {
      if (text(card.querySelector('strong')).toLowerCase() !== 'familie') return;
      const row = card.querySelector('div');
      const wanted = '<span>Fa</span><i>–</i><span>mi</span><i>–</i><span>li</span><i>–</i><span>e</span>';
      setHtmlIfNeeded(row, wanted);
    });
    document.querySelectorAll('#app .exercise-card h2').forEach((h2) => {
      if (/^Fa\s*[–-]\s*mi\s*[–-]\s*lie$/i.test(text(h2))) setTextIfNeeded(h2, 'Fa – mi – li – e');
    });
  }

  function addBraucheHint() {
    document.querySelectorAll('#app .phrase-focus').forEach((card) => {
      const phrase = text(card.querySelector('h2'));
      if (!/\bbrauche\b/i.test(phrase) || card.querySelector('[data-otto-brauche-hint]')) return;
      const note = document.createElement('div');
      note.dataset.ottoBraucheHint = '1';
      note.className = 'soft-note';
      note.innerHTML = '<b>brauche:</b> после <b>au</b> сочетание <b>ch</b> звучит твёрже — это немецкий ach-Laut [x], не мягкий [ç] из <i>ich</i>.';
      const audio = card.querySelector('.audio-orb');
      if (audio) audio.before(note); else card.appendChild(note);
    });
  }

  function fixReadingHints() {
    document.querySelectorAll('#app .rule-card, #app .rule-focus').forEach(fixChRuleCard);
    document.querySelectorAll('.otto-word-sheet').forEach(fixWordSheet);
    document.querySelectorAll('.otto-reading-gate').forEach(fixFamilieGate);
    fixFamilieSyllables();
    addBraucheHint();

    document.querySelectorAll('#app .rule-card').forEach((card) => {
      const symbol = text(card.querySelector('.rule-symbol')).toLowerCase();
      if (symbol === 'v') {
        const title = card.querySelector('b');
        if (title && /часто/.test(title.textContent || '')) setTextIfNeeded(title, 'v → в Vater / vier звучит как «ф»');
      }
    });
  }

  resetOldAudioCacheOnce();
  fixReadingHints();

  const root = document.querySelector('#app');
  if (root) {
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        fixReadingHints();
      });
    }).observe(root, { childList: true, subtree: true });
  }

  window.OttoPronunciation = { version: VERSION, locale: 'de-DE', standard: 'Hochdeutsch' };
})();
