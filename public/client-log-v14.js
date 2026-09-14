(() => {
  'use strict';
  if (window.__ottoClientLogV14) return;
  window.__ottoClientLogV14 = true;
  const ENDPOINT='/api/otto-start-client-log';
  const session=(()=>{try{const k='ottoStartClientSessionV14';let v=sessionStorage.getItem(k);if(!v){v=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;sessionStorage.setItem(k,v)}return v}catch{return `anon-${Date.now().toString(36)}`}})();
  const sent=new Map();
  let lastInteraction=Date.now();
  let activeAction='';

  function screen(){return String(document.querySelector('[data-v14-screen]')?.getAttribute('data-v14-screen')||document.querySelector('h1')?.textContent||document.title||'').slice(0,180)}
  function send(kind,payload={},throttle=0){
    try{
      const now=Date.now();const sig=`${kind}:${payload.message||''}:${payload.target||''}`;const prev=sent.get(sig)||0;if(throttle&&now-prev<throttle)return;sent.set(sig,now);
      fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,message:String(payload.message||'').slice(0,1200),stack:String(payload.stack||'').slice(0,3000),target:String(payload.target||'').slice(0,500),details:payload.details&&typeof payload.details==='object'?payload.details:null,screen:screen(),href:location.href,userAgent:navigator.userAgent,session}),keepalive:true}).catch(()=>{});
    }catch{}
  }
  window.addEventListener('error',e=>send('error',{message:e.message||e.error?.message||'window error',stack:e.error?.stack||'',target:activeAction}));
  window.addEventListener('unhandledrejection',e=>{const r=e.reason;send('unhandledrejection',{message:r?.message||String(r||'promise rejection'),stack:r?.stack||'',target:activeAction})});
  ['pointerdown','touchstart','keydown'].forEach(name=>window.addEventListener(name,()=>{lastInteraction=Date.now()},{passive:true,capture:true}));

  let lastTick=performance.now();
  setInterval(()=>{
    const now=performance.now(),drift=now-lastTick-1000;lastTick=now;
    if(document.hidden||document.visibilityState!=='visible'||!document.hasFocus()||Date.now()-lastInteraction>15000)return;
    if(drift>1200)send('event-loop-stall',{message:`Active main thread stalled about ${Math.round(drift)} ms`,target:activeAction,details:{driftMs:Math.round(drift)}},3000);
  },1000);

  document.addEventListener('click',e=>{
    const el=e.target.closest?.('[data-action]');if(!el||el.disabled)return;
    lastInteraction=Date.now();
    const action=el.getAttribute('data-action')||'';const text=String(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,100);const target=`${action} ${text}`.trim();activeAction=target;
    const before=window.OttoStartV14?.signature?.()||'';const started=performance.now();
    send('action-start',{message:action,target},0);
    setTimeout(()=>{
      const elapsed=Math.round(performance.now()-started);const after=window.OttoStartV14?.signature?.()||'';
      send('action-settled',{message:action,target,details:{elapsedMs:elapsed}},0);
      if(before&&after&&before===after&&!['audio','pronounce','share','support'].includes(action))send('stuck-click',{message:'Action produced no state/view change',target,details:{elapsedMs:elapsed}},1500);
      if(activeAction===target)activeAction='';
    },350);
  },true);

  window.addEventListener('load',()=>send('page-ready',{message:'Otto Start client logger v14 ready'}),{once:true});
  window.OttoClientLogV14={send,session};
})();
