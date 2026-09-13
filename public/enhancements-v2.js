(() => {
  'use strict';
  const KEY='ottoStartLearningPathV2';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const write=s=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}};
  const style=document.createElement('style');
  style.textContent=`.return-plus{position:relative;display:grid;grid-template-columns:74px 1fr;gap:12px;align-items:center;padding:14px 42px 14px 12px;margin-bottom:12px;background:#fff9eb;border:1px solid #f1dfb6;border-radius:24px;box-shadow:0 8px 22px rgba(29,72,68,.08)}.return-plus img{width:70px;height:76px;object-fit:contain}.return-plus b{font-size:15px}.return-plus p{font-size:12px;line-height:1.4;margin:4px 0 6px;color:#766447}.return-plus .close-return{position:absolute;right:10px;top:8px;border:0;background:transparent;font-size:20px;color:#9b8a68}.supplement-rule{width:100%;display:flex;align-items:center;gap:13px;text-align:left;border:1px solid #e1eae7;background:#fff;border-radius:24px;padding:18px;box-shadow:0 8px 22px rgba(29,72,68,.08)}.supplement-rule+.supplement-rule{margin-top:10px}.supplement-rule .sym{flex:0 0 64px;height:64px;border-radius:20px;background:#e4f5f2;color:#0a6f69;display:grid;place-items:center;font-size:20px;font-weight:900}.supplement-rule b{display:block}.supplement-rule p{font-size:11px;color:#6f817f;margin:4px 0}`;
  document.head.appendChild(style);
  function enhance(){
    const state=read();
    const hero=document.querySelector('.home-hero');
    if(hero&&!document.querySelector('.return-plus')){
      const last=state.lastVisit||Date.now();
      const away=Math.floor((Date.now()-last)/86400000);
      if(away>=5&&!state.noticeDismissed){
        const box=document.createElement('div');box.className='return-plus';
        box.innerHTML=`<img src="/otto/otto-guide.webp" alt="Отто"><div><b>Рада тебя видеть.</b><p>Никаких потерянных серий. Быстро вспомним 3 вещи и продолжим.</p><button class="link-btn" data-go="review">Повторить 3 вещи</button></div><button class="close-return" data-dismiss-return-plus>×</button>`;
        hero.before(box);
      }
    }
    const list=document.querySelector('.rule-list');
    if(list&&!document.querySelector('[data-extra-reading]')){
      const wrap=document.createElement('div');wrap.setAttribute('data-extra-reading','1');wrap.style.display='grid';wrap.style.gap='10px';
      wrap.innerHTML=`<button class="supplement-rule" data-speak="Häuser. Bäume"><span class="sym">äu</span><span><b>äu → «ой»</b><p>Häuser · Bäume</p></span></button><button class="supplement-rule" data-speak="Miete. Mitte. Ofen. offen"><span class="sym">ˉ ˘</span><span><b>Долгие и короткие гласные</b><p>Miete / Mitte · Ofen / offen — слушаем разницу постепенно</p></span></button>`;
      list.appendChild(wrap);
    }
  }
  new MutationObserver(()=>queueMicrotask(enhance)).observe(document.querySelector('#app'),{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const dismiss=e.target.closest('[data-dismiss-return-plus]');
    if(dismiss){e.preventDefault();e.stopPropagation();const s=read();s.noticeDismissed=true;write(s);dismiss.closest('.return-plus')?.remove();return}
    if(e.target.closest('[data-main-a1]')){
      const s=read();
      const weakRules=Object.entries(s.ruleState||{}).filter(([,v])=>(v.level||0)<2&&(v.errors||0)>0).map(([k])=>k);
      const hardWords=Object.entries(s.wordState||{}).filter(([,v])=>v.hard).map(([k])=>k);
      localStorage.setItem('ottoA1StartBridge',JSON.stringify({from:'otto-start',savedAt:Date.now(),skills:s.skill||{},weakRules,hardWords,currentLesson:s.currentLesson||1}));
    }
  },true);
  enhance();
})();