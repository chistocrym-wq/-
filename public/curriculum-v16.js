(() => {
  'use strict';
  if (window.__ottoCurriculumV16) return;
  window.__ottoCurriculumV16 = true;
  const root = document.getElementById('app');
  if (!root) return;
  const rules = [
    ['r','не русское раскатистое «р»','Для A1 важно узнавать немецкое r на слух и не раскатывать его по-русски.',['rot','Bruder','Mutter']],
    ['au','примерно «ау»','Сочетание au обычно читается как единый дифтонг — примерно «ау».',['Haus','kaufen','Frau']],
    ['tsch','читается как «ч»','tsch передаёт один звук, близкий к русскому «ч».',['Deutsch','Tschüss']],
    ['qu','обычно «кв»','Сочетание qu обычно звучит как «кв».',['Quelle','Quittung']],
    ['ck','один звук «к»','ck не читается как два отдельных звука; перед ним гласная обычно короткая.',['backen','Jacke']],
    ['tz','«ц»','Сочетание tz передаёт звук «ц».',['Katze','Platz']],
    ['pf','оба звука: «пф»','Стараемся произнести p и f вместе, без лишней гласной.',['Pferd','Apfel']],
    ['ng / nk','[ŋ] / [ŋk]','В ng не произносим отдельное «н-г»; в nk к носовому звуку добавляется k.',['lang','singen','danke']],
    ['s + гласная в начале','часто звонкий [z]','В начале обычного немецкого слова s перед гласной часто звучит звонко, ближе к «з». Правила sp и st изучаем отдельно.',['Sonne','sieben']],
    ['гласная + h','h часто удлиняет гласную','После гласной h часто не слышится отдельно, а показывает долготу. В начале слова h произносится.',['wohnen','sehen','Haus']],
    ['-ig в конце','в стандартном произношении часто [ɪç]','В стандартном немецком конечное -ig часто звучит мягко, примерно как в ich. В некоторых регионах можно услышать вариант с [k].',['richtig','zwanzig']],
    ['b / d / g в конце','оглушаются','В конце слова звонкие b, d, g обычно оглушаются: звучат ближе к p, t, k. Написание при этом не меняется.',['lieb','Kind','Tag']],
    ['двойная согласная','гласная перед ней обычно короткая','Две одинаковые согласные не нужно произносить вдвое дольше. Они часто показывают, что предыдущая гласная короткая.',['Mutter','kommen','bitte']]
  ];
  const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const plain = (s='') => String(s).toLocaleLowerCase('de-DE').replace(/^(der|die|das)\s+/i,'').trim();

  function readingTipsFor(source='') {
    const w = plain(source);
    const tips = [];
    const add = (x) => { if (x && !tips.includes(x)) tips.push(x); };
    if (w.includes('tsch')) add('tsch → один звук, близкий к «ч».');
    if (w.includes('au') && !w.includes('äu')) add('au → примерно «ау».');
    if (w.includes('qu')) add('qu → обычно «кв».');
    if (w.includes('ck')) add('ck → один «к»; гласная перед ним обычно короткая.');
    if (w.includes('tz')) add('tz → «ц».');
    if (w.includes('pf')) add('pf → произносим «п» и «ф» вместе.');
    if (w.includes('ng')) add('ng → носовой [ŋ], без отдельного «н-г».');
    else if (w.includes('nk')) add('nk → носовой [ŋ] + k.');
    if (/^s[aeiouäöü]/.test(w)) add('s перед гласной в начале часто звучит звонко, ближе к «з».');
    if (/[aeiouäöü]h/.test(w)) add('h после гласной часто показывает, что гласная долгая.');
    if (/ig$/.test(w)) add('конечное -ig в стандартном произношении часто звучит как [ɪç].');
    if (/[bdg]$/.test(w)) add('b / d / g в конце слова обычно оглушаются.');
    if (/(bb|dd|ff|gg|kk|ll|mm|nn|pp|rr|ss|tt)/.test(w)) add('двойная согласная часто показывает короткую гласную перед ней.');
    return tips.slice(0,2);
  }

  function addHome() {
    const app = root.querySelector('[data-v15-screen="Главная"]');
    if (!app || app.querySelector('[data-v16-a1-roadmap]')) return;
    const main = app.querySelector('.v12-main');
    const api = window.OttoStartV15;
    if (!main || !api?.state) return;
    const state = api.state();
    const total = Math.max(1, Number(api.readinessIndex || 1));
    const done = (state.completed || []).filter(x => x !== 'readiness-a1').length;
    const pct = Math.min(100, Math.round(done / total * 100));
    const starter = Number(api.starter?.() || 0);
    let stage = 'Основы';
    if (state.readiness?.ready) stage = 'Готов к Otto A1';
    else if (Number(state.unitIndex || 0) >= total) stage = 'Финальная проверка';
    else if (Number(state.unitIndex || 0) >= starter) stage = 'Лексика и фразы A1';
    const section = document.createElement('section');
    section.className = 'v16-a1-roadmap';
    section.dataset.v16A1Roadmap = '1';
    section.innerHTML = `<div class="v16-a1-head"><div><div class="v12-kicker">Куда мы идём</div><h2>От нуля — именно к тренажёру A1</h2><p>Сначала учимся читать и слышать, затем набираем практическую лексику A1 и в конце проверяем готовность.</p></div><span class="v16-a1-badge">${esc(stage)}</span></div><div class="v16-a1-steps"><div class="v16-a1-step"><span>1</span><b>Алфавит</b><small>A–Z, Ä Ö Ü ß</small></div><div class="v16-a1-step"><span>2</span><b>Чтение</b><small>сочетания и особенности</small></div><div class="v16-a1-step"><span>3</span><b>База A1</b><small>слова → фразы → ситуации</small></div><div class="v16-a1-step"><span>4</span><b>Мини‑тест</b><small>20 заданий</small></div></div><div class="v16-a1-actions"><button type="button" data-action="alphabet-guide">🔤 Открыть алфавит</button><button type="button" data-action="reading-guide">📖 Правила чтения</button><button type="button" data-action="nav-route">🧭 Весь путь до A1</button></div><div class="v16-a1-progress"><i style="width:${pct}%"></i></div><div class="v16-a1-foot"><span>Пройдено: <strong>${done}/${total}</strong></span><span>Финал: <strong>словарь, слух, чтение, фразы</strong></span></div>`;
    const anchor = main.querySelector('.v15-stage') || main.querySelector('.v12-hero');
    if (anchor) anchor.insertAdjacentElement('afterend', section); else main.prepend(section);
  }

  function addReading() {
    const app = root.querySelector('[data-v15-screen="Правила чтения"]');
    if (!app || app.querySelector('[data-v16-reading-extra]')) return;
    const main = app.querySelector('.v12-main');
    if (!main) return;
    const box = document.createElement('section');
    box.className = 'v16-reading-extra';
    box.dataset.v16ReadingExtra = '1';
    box.innerHTML = `<h2>Ещё важные особенности для A1</h2><p>Они встречаются в обычной лексике A1. Не зубрите русскую транскрипцию: слушайте примеры и постепенно узнавайте сочетания в новых словах.</p>${rules.map(r=>`<article class="v15-rule-card"><div class="v15-rule-pattern">${esc(r[0])}</div><div class="v15-rule-answer">${esc(r[1])}</div><p class="v12-muted">${esc(r[2])}</p><div class="v15-examples">${r[3].map(x=>`<button class="v15-example-chip" type="button" data-action="audio" data-text="${esc(x)}">🔊 ${esc(x)}</button>`).join('')}</div></article>`).join('')}`;
    main.appendChild(box);
  }

  function addContextReadingTips() {
    root.querySelectorAll('.v12-word-card, .v12-dict-card').forEach((card) => {
      if (card.querySelector('[data-v16-context-rule]')) return;
      const word = card.querySelector('h3')?.textContent?.trim() || '';
      const tips = readingTipsFor(word);
      if (!tips.length) return;
      const existing = card.querySelector('.v12-rule')?.textContent || '';
      const fresh = tips.filter((tip) => !existing.includes(tip.split('→')[0].trim()));
      if (!fresh.length) return;
      const el = document.createElement('div');
      el.className = 'v12-rule v16-auto-rule';
      el.dataset.v16ContextRule = '1';
      el.innerHTML = `<b>Заметьте при чтении:</b> ${esc(fresh.join(' '))}`;
      const actions = card.querySelector('.v12-actions, .v12-dict-card-actions');
      if (actions) card.insertBefore(el, actions); else card.appendChild(el);
    });
  }

  function enhance(){ addHome(); addReading(); addContextReadingTips(); }
  let pending=false;
  const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;try{enhance()}catch{}})};
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  schedule();
})();