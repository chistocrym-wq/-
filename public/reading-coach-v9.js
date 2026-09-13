(() => {
  'use strict';
  if (window.__ottoReadingCoachV9) return;
  window.__ottoReadingCoachV9 = true;

  const KEY='ottoStartReadingV9';
  const RULES=[
    {id:'sch',test:w=>w.includes('sch'),label:'sch',hint:'sch читается примерно как «ш».',example:'Schule'},
    {id:'soft-ch',test:w=>/(?:i|e|ä|ö|ü|ei|eu|äu)ch/.test(w)||/\bich\b/.test(w),label:'ch после передних гласных',hint:'В ich / mich / Milch это мягкий немецкий ich-Laut [ç], ближе к очень мягкому «хь», не твёрдому русскому «х».',example:'ich'},
    {id:'hard-ch',test:w=>/(?:a|o|u|au)ch/.test(w),label:'ch после a/o/u/au',hint:'После a, o, u, au сочетание ch обычно звучит более твёрдо [x], например в brauchen.',example:'brauchen'},
    {id:'ei',test:w=>w.includes('ei'),label:'ei',hint:'ei читается примерно как «ай».',example:'mein'},
    {id:'ie',test:w=>w.includes('ie')&&!/familie/.test(w),label:'ie',hint:'ie обычно передаёт долгое «и».',example:'Liebe'},
    {id:'eu',test:w=>w.includes('eu')||w.includes('äu'),label:'eu / äu',hint:'eu и äu обычно звучат примерно как «ой».',example:'heute'},
    {id:'sp',test:w=>/^sp/.test(w),label:'sp в начале',hint:'sp в начале слова обычно звучит примерно как «шп».',example:'Sport'},
    {id:'st',test:w=>/^st/.test(w),label:'st в начале',hint:'st в начале слова обычно звучит примерно как «шт».',example:'Straße'},
    {id:'z',test:w=>w.includes('z'),label:'z',hint:'z обычно читается как «ц».',example:'zehn'},
    {id:'w',test:w=>w.includes('w'),label:'w',hint:'немецкая w звучит как русский «в».',example:'Wasser'},
    {id:'j',test:w=>w.includes('j'),label:'j',hint:'немецкая j звучит как «й».',example:'ja'},
    {id:'v-f',test:w=>/^v/.test(w)&&/^(vater|vier|vogel|vor)/.test(w),label:'v в частых немецких словах',hint:'В Vater, vier и ряде частых немецких слов v звучит как «ф». В заимствованных словах возможен звук «в», поэтому слушаем образец.',example:'Vater'},
    {id:'ss',test:w=>w.includes('ß'),label:'ß',hint:'ß передаёт глухой звук «с»; это не английская B.',example:'Straße'},
    {id:'umlaut-a',test:w=>w.includes('ä'),label:'ä',hint:'ä — отдельный немецкий гласный. Не заменяй его автоматически русским «а»; сначала слушай образец.',example:'März'},
    {id:'umlaut-o',test:w=>w.includes('ö'),label:'ö',hint:'ö произносится с округлёнными губами и не равно русскому «о». Сначала слушай образец.',example:'schön'},
    {id:'umlaut-u',test:w=>w.includes('ü'),label:'ü',hint:'ü — отдельный немецкий звук: губы как для «у», язык ближе к «и».',example:'fünf'},
    {id:'final-e',test:w=>/e$/.test(w)&&w.length>3,label:'-e в конце',hint:'Конечное -e обычно звучит слабо и без ударения, но не исчезает.',example:'bitte'},
    {id:'final-er',test:w=>/er$/.test(w)&&w.length>4,label:'-er в конце',hint:'Конечное -er в обычной немецкой речи редуцируется и не звучит как отчётливое русское «эр».',example:'Vater'}
  ];

  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{"seen":{}}')}catch{return{seen:{}}}}
  function write(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}}
  function norm(v=''){return String(v).toLocaleLowerCase('de-DE').replace(/^(der|die|das)\s+/,'').replace(/[^a-zäöüß]/g,'')}
  function rulesFor(text){const n=norm(text);return RULES.filter(r=>r.test(n))}
  function seen(id){return Boolean(read().seen?.[id])}
  function mark(id){const s=read();s.seen=s.seen||{};s.seen[id]={at:Date.now(),level:Math.max(1,Number(s.seen[id]?.level||0))};write(s);window.dispatchEvent(new CustomEvent('otto:reading-rule',{detail:{id}}))}
  function esc(v=''){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function attr(v=''){return esc(v).replace(/'/g,'&#39;')}

  function addStyles(){if(document.getElementById('otto-reading-v9-style'))return;const s=document.createElement('style');s.id='otto-reading-v9-style';s.textContent=`
    .v9-reading-gate{background:#fff8e8;border:1px solid #eedcab;border-radius:19px;padding:14px;margin:10px 0 14px}.v9-reading-gate .tag{font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#88701d}.v9-reading-gate h3{margin:5px 0 6px;font-size:18px;color:#173f43}.v9-reading-gate p{font-size:13px;line-height:1.48;color:#5e654e;margin:0}.v9-reading-actions{display:flex;gap:7px;margin-top:11px}.v9-reading-actions button{flex:1;border:0;border-radius:12px;padding:10px;background:#f1e3b7;color:#624f10;font-weight:850}.v9-reading-actions button.primary{background:#173f43;color:white}.v9-reading-lock{opacity:.44;pointer-events:none}.v9-read-detail{margin-top:8px;font-size:11px}.v9-read-detail summary{cursor:pointer;font-weight:800;color:#0b716a}.v9-read-detail div{margin-top:5px;color:#677c7d;line-height:1.4}.v9-rule-status{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;color:#0a756e;background:#e4f3f0;border-radius:99px;padding:4px 7px;margin:2px 3px 2px 0}
  `;document.head.appendChild(s)}

  function detailsFor(word){const rules=rulesFor(word);if(!rules.length)return'';return `<details class="v9-read-detail"><summary>Почему так читается?</summary>${rules.map(r=>`<div><b>${esc(r.label)}:</b> ${esc(r.hint)}</div>`).join('')}</details>`}

  function decorateWords(layer){
    layer.querySelectorAll('.v8-word').forEach(card=>{
      if(card.dataset.v9Reading==='1')return;card.dataset.v9Reading='1';const h=card.querySelector('h3');if(!h)return;const rules=rulesFor(h.textContent);if(!rules.length)return;const ex=card.querySelector('.v8-example');(ex||h.parentElement)?.insertAdjacentHTML('beforeend',detailsFor(h.textContent));
    });
    layer.querySelectorAll('.v8-expression').forEach(card=>{
      if(card.dataset.v9Reading==='1')return;card.dataset.v9Reading='1';const h=card.querySelector('h3');if(!h)return;const rules=rulesFor(h.textContent);if(!rules.length)return;card.insertAdjacentHTML('beforeend',detailsFor(h.textContent));
    });
  }

  function gateLayer(layer){
    if(!layer||layer.querySelector('[data-v9-reading-gate]'))return;
    const wordCards=[...layer.querySelectorAll('.v8-word')];if(!wordCards.length)return;
    let target=null,rule=null;
    for(const card of wordCards){const text=card.querySelector('h3')?.textContent||'';const unseen=rulesFor(text).find(r=>!seen(r.id));if(unseen){target=card;rule=unseen;break}}
    if(!rule)return;
    const button=layer.querySelector('[data-v8-practice="new"]');wordCards.forEach(c=>c.classList.add('v9-reading-lock'));if(button)button.classList.add('v9-reading-lock');
    const box=document.createElement('div');box.className='v9-reading-gate';box.dataset.v9ReadingGate=rule.id;box.innerHTML=`<div class="tag">Новый секрет чтения</div><h3>${esc(rule.label)}</h3><p>${esc(rule.hint)}</p><div class="v9-reading-actions"><button type="button" data-start-audio="${attr(rule.example)}">🔊 ${esc(rule.example)}</button><button type="button" class="primary" data-v9-rule-ok="${attr(rule.id)}">Понятно →</button></div>`;
    target.before(box);
  }

  function unlock(layer){layer.querySelectorAll('.v9-reading-lock').forEach(el=>el.classList.remove('v9-reading-lock'));setTimeout(()=>{gateLayer(layer)},0)}
  function patch(){const layer=document.getElementById('otto-v8-layer');if(!layer)return;decorateWords(layer);gateLayer(layer)}

  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-v9-rule-ok]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();mark(b.dataset.v9RuleOk);const layer=document.getElementById('otto-v8-layer');b.closest('[data-v9-reading-gate]')?.remove();if(layer)unlock(layer)},true);
  const observer=new MutationObserver(()=>requestAnimationFrame(patch));observer.observe(document.body,{childList:true,subtree:true});
  addStyles();patch();
  window.OttoReadingV9={rulesFor,seenRules:()=>read().seen||{}};
})();
