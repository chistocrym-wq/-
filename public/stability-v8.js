(() => {
  'use strict';
  if(window.__ottoStabilityV8)return;
  window.__ottoStabilityV8=true;

  const ERR_KEY='ottoStartErrorsV8';
  const NAV_SELECTOR='[data-go],[data-onboard],[data-start-lesson],[data-open-lesson],[data-next-step],[data-complete],[data-mini-step],[data-mini-answer],[data-v8-open-course],[data-v8-topic]';
  let lastSignature='';
  let lastChange=Date.now();
  let clickWatch=null;

  function signature(){
    const app=document.getElementById('app');
    const layer=document.getElementById('otto-v8-layer');
    let state='';try{state=localStorage.getItem('ottoStartLearningPathV2')||''}catch{}
    let course='';try{course=localStorage.getItem('ottoStartCourseV8')||''}catch{}
    return `${app?.childElementCount||0}|${app?.textContent?.slice(0,180)||''}|${layer?.textContent?.slice(0,80)||''}|${state.slice(-160)}|${course.slice(-160)}`;
  }

  function markChange(){const sig=signature();if(sig!==lastSignature){lastSignature=sig;lastChange=Date.now()}}
  function record(kind,error){
    try{
      const list=JSON.parse(localStorage.getItem(ERR_KEY)||'[]');
      list.push({at:Date.now(),kind,message:String(error?.message||error||'unknown').slice(0,300),screen:(document.querySelector('#app .topbar b')?.textContent||document.querySelector('#app h1')?.textContent||'').slice(0,100)});
      localStorage.setItem(ERR_KEY,JSON.stringify(list.slice(-20)));
    }catch{}
  }

  function cleanupInteractionState(){
    const body=document.body,html=document.documentElement;
    if(!body)return;
    const liveModal=document.querySelector('#otto-v8-layer,.otto-sheet-backdrop,.v6-overlay,.otto-offline-overlay');
    if(!liveModal){
      if(body.style.pointerEvents==='none')body.style.pointerEvents='';
      if(html.style.pointerEvents==='none')html.style.pointerEvents='';
      if(html.style.overflow==='hidden')html.style.overflow='';
      body.classList.remove('modal-open','no-scroll','is-locked');
    }
    document.querySelectorAll('.v6-overlay,.otto-sheet-backdrop,.otto-offline-overlay').forEach(el=>{
      if(!el.isConnected)return;
      const style=getComputedStyle(el);
      if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0){el.remove()}
    });
    document.querySelectorAll('button').forEach(btn=>{
      if(!btn.disabled&&getComputedStyle(btn).pointerEvents==='none'&&!btn.closest('.is-locked,.otto-gated-content,.otto-gated-cta'))btn.style.pointerEvents='auto';
    });
  }

  function toast(message,showReload=false){
    let box=document.querySelector('.otto-v8-stability-toast');
    if(!box){box=document.createElement('div');box.className='otto-v8-stability-toast';box.setAttribute('data-no-word-tap','1');box.style.cssText='position:fixed;z-index:20000;left:12px;right:12px;bottom:max(84px,calc(env(safe-area-inset-bottom) + 70px));margin:auto;max-width:560px;background:#173f43;color:#fff;border-radius:16px;padding:12px 13px;box-shadow:0 14px 40px #0004;font:600 12px/1.4 system-ui;display:flex;align-items:center;gap:10px';document.body.appendChild(box)}
    box.innerHTML=`<span style="flex:1">${String(message).replace(/</g,'&lt;')}</span>${showReload?'<button type="button" data-v8-hard-reload style="border:0;border-radius:10px;padding:8px 10px;background:#fff;color:#173f43;font-weight:800">Обновить</button>':''}<button type="button" data-v8-toast-close style="border:0;background:transparent;color:#fff;font-size:18px">×</button>`;
  }

  function watchNavigation(button){
    clearTimeout(clickWatch);
    const before=signature();
    clickWatch=setTimeout(()=>{
      cleanupInteractionState();markChange();
      const after=signature();
      if(before===after&&document.body.contains(button)&&!button.disabled){
        record('stuck-click',new Error(`No UI/state change after ${button.outerHTML.slice(0,120)}`));
        toast('Otto заметил, что нажатие не сработало. Экран разблокирован; попробуйте ещё раз. Если повторится — обновите.',true);
      }
    },1500);
  }

  document.addEventListener('click',e=>{
    const reload=e.target.closest?.('[data-v8-hard-reload]');if(reload){e.preventDefault();location.reload();return}
    const close=e.target.closest?.('[data-v8-toast-close]');if(close){e.preventDefault();close.closest('.otto-v8-stability-toast')?.remove();return}
    const button=e.target.closest?.('button,a');
    if(button?.matches?.(NAV_SELECTOR)&&!button.disabled)watchNavigation(button);
    setTimeout(()=>{cleanupInteractionState();markChange()},0);
  },false);

  window.addEventListener('error',e=>{record('error',e.error||e.message);cleanupInteractionState()});
  window.addEventListener('unhandledrejection',e=>{record('promise',e.reason);cleanupInteractionState()});
  window.addEventListener('pageshow',()=>{cleanupInteractionState();markChange()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){cleanupInteractionState();markChange()}});
  window.addEventListener('online',cleanupInteractionState);
  window.addEventListener('offline',cleanupInteractionState);

  setInterval(()=>{
    const app=document.getElementById('app');
    if(app&&!app.children.length){record('empty-app',new Error('App root became empty'));toast('Экран приложения не загрузился. Прогресс сохранён — можно безопасно обновить.',true)}
    cleanupInteractionState();markChange();
  },5000);

  cleanupInteractionState();markChange();
  window.OttoStabilityV8={cleanup:cleanupInteractionState,errors(){try{return JSON.parse(localStorage.getItem(ERR_KEY)||'[]')}catch{return[]}}};
})();
