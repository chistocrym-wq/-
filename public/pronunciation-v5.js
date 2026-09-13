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
      request.onblocked = () => {
        console.warn('Otto pronunciation cache reset is waiting for an old audio connection to close');
      };
    } catch (_) {}
  }

  function text(el) {
    return String(el?.textContent || '').trim();
  }

  function fixChRuleCard(card) {
    const symbol = card.querySelector('.rule-symbol');
    if (text(symbol).toLowerCase() !== 'ch') return;
    const title = card.querySelector('h1, b');
    if (title) title.textContent = 'мягкий немецкий звук [ç], ближе к «хь»';
  }

  function fixWordSheet(sheet) {
    const word = text(sheet.querySelector('.otto-sheet-title h2')).toLocaleLowerCase('de-DE');
    sheet.querySelectorAll('.otto-rule-line').forEach((line) => {
      const label = text(line.querySelector('strong')).toLowerCase();
      const explanation = line.querySelector('span');
      if (!explanation) return;
      if (label === 'ch') {
        explanation.textContent = 'В ich / mich / Milch это немецкий ich-Laut [ç]: мягкий звук, ближе к «хь», но не русский твёрдый «х».';
      }
      if (label === 'ie' && word === 'familie') {
        explanation.textContent = 'В Familie конечное -ie не читается как обычное долгое ie из Liebe. Здесь окончание звучит примерно как «и-е / иэ»; слушай слово целиком.';
      }
    });
  }

  function fixFamilieGate(gate) {
    const content = text(gate).toLowerCase();
    if (!content.includes('familie')) return;
    gate.querySelectorAll('.otto-rule-pill').forEach((pill) => {
      if (/\bie\b/i.test(text(pill)) && /долг|и/.test(text(pill).toLowerCase())) {
        pill.textContent = 'Familie: финальное -ie ≠ обычное ie';
      }
    });
    gate.querySelectorAll('p').forEach((p) => {
      if (/Familie/i.test(p.textContent || '') && /ie/i.test(p.textContent || '')) {
        p.innerHTML = '<b>Familie</b>: в конце слова буквы <b>i + e</b> не дают обычное долгое <b>ie</b> как в <i>Liebe</i>. Сначала послушай всё слово и повтори его целиком.';
      }
    });
  }

  function fixReadingHints() {
    document.querySelectorAll('#app .rule-card, #app .rule-focus').forEach(fixChRuleCard);
    document.querySelectorAll('.otto-word-sheet').forEach(fixWordSheet);
    document.querySelectorAll('.otto-reading-gate').forEach(fixFamilieGate);

    document.querySelectorAll('#app .rule-card').forEach((card) => {
      const symbol = text(card.querySelector('.rule-symbol')).toLowerCase();
      if (symbol === 'v') {
        const title = card.querySelector('b');
        if (title && /часто/.test(title.textContent || '')) title.textContent = 'v → в Vater / vier звучит как «ф»';
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

  window.OttoPronunciation = { version: VERSION };
})();
