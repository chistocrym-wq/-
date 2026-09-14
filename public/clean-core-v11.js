(() => {
  'use strict';
  if (window.__ottoCleanCoreV11) return;
  window.__ottoCleanCoreV11 = true;

  const DATA = window.OttoCourseDataV8;
  if (DATA?.topics?.length) {
    const start = DATA.topics.find(t => t.id === 'start');
    if (start) {
      const w = (id,de,ru,example,exampleRu,plural='') => ({id,de,ru,example,exampleRu,plural,tags:[]});
      start.title = 'Самые первые слова';
      start.goal = 'понять и уверенно использовать самые простые слова: привет, да, нет, спасибо, пожалуйста';
      start.words = [
        w('hallo','Hallo','привет','Hallo!','Привет!'),
        w('ja','ja','да','Ja.','Да.'),
        w('nein','nein','нет','Nein.','Нет.'),
        w('danke','danke','спасибо','Danke!','Спасибо!'),
        w('bitte','bitte','пожалуйста / не за что','Bitte.','Пожалуйста.'),
        w('gut','gut','хорошо','Gut.','Хорошо.'),
        w('tschues-word','Tschüss','пока','Tschüss!','Пока!'),
        w('morgen-basic','morgen','завтра','Bis morgen.','До завтра.'),
        w('heute','heute','сегодня','Heute.','Сегодня.'),
        w('auch','auch','тоже','Ich auch.','Я тоже.')
      ];
      start.phrases = [
        {id:'guten-morgen',de:'Guten Morgen.',ru:'Доброе утро.'},
        {id:'guten-tag',de:'Guten Tag.',ru:'Добрый день.'},
        {id:'tschues',de:'Tschüss!',ru:'Пока!'},
        {id:'auf-wiedersehen',de:'Auf Wiedersehen.',ru:'До свидания.'}
      ];
    }
  }

  let currentAudio = null;
  let currentObjectUrl = '';
  function stopAudio() {
    if (currentAudio) {
      try { currentAudio.pause(); currentAudio.currentTime = 0; } catch {}
      currentAudio = null;
    }
    if (currentObjectUrl) {
      try { URL.revokeObjectURL(currentObjectUrl); } catch {}
      currentObjectUrl = '';
    }
  }

  async function play(text, { mode = 'slow', button = null } = {}) {
    const value = String(text || '').trim();
    if (!value) return false;
    stopAudio();
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy','true');
    }
    try {
      const response = await fetch('/api/otto-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, mode })
      });
      if (!response.ok || !String(response.headers.get('content-type') || '').includes('audio/')) {
        throw new Error('tts unavailable');
      }
      const blob = await response.blob();
      currentObjectUrl = URL.createObjectURL(blob);
      currentAudio = new Audio(currentObjectUrl);
      currentAudio.preload = 'auto';
      await currentAudio.play();
      return true;
    } catch (error) {
      console.error('Otto TTS error', error);
      window.OttoClientLogV10?.send?.('tts-error', { message: error?.message || String(error), target: value });
      return false;
    } finally {
      if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }
  }

  window.OttoStartSpeech = { play, stop: stopAudio, preload: async () => true };

  function allMeaningMap() {
    const map = new Map();
    const topics = window.OttoCourseDataV8?.topics || [];
    for (const topic of topics) {
      for (const item of topic.words || []) map.set(String(item.de || '').trim(), item.ru || '');
      for (const item of topic.phrases || []) map.set(String(item.de || '').trim(), item.ru || '');
    }
    return map;
  }

  function fixMeaningOptions() {
    const layer = document.getElementById('otto-v8-layer');
    if (!layer) return;
    const heading = layer.querySelector('.v8-quiz-title h2')?.textContent || '';
    if (!/Что означает/.test(heading)) return;
    const map = allMeaningMap();
    layer.querySelectorAll('[data-v8-answer]').forEach(btn => {
      const raw = String(btn.textContent || '').trim();
      const ru = map.get(raw);
      if (ru) btn.textContent = ru;
    });
  }

  function scheduleQuizFix() {
    requestAnimationFrame(() => requestAnimationFrame(fixMeaningOptions));
  }

  document.addEventListener('click', (event) => {
    const audio = event.target.closest?.('[data-start-audio]');
    if (audio) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void play(audio.dataset.startAudio, { mode: 'slow', button: audio });
      return;
    }
    if (event.target.closest?.('[data-v8-practice],[data-v8-quiz-next]')) scheduleQuizFix();
  }, true);

  window.addEventListener('otto:v8-progress', scheduleQuizFix);
  window.OttoCleanCoreV11 = { fixMeaningOptions, play };
})();
