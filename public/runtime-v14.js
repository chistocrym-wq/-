(() => {
  'use strict';
  if (window.__ottoRuntimeV14) return;
  window.__ottoRuntimeV14 = true;

  const FLAG='ottoStartRuntimeV14Cleaned';
  async function cleanup(){
    try{
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r=>r.unregister().catch(()=>false)));
      }
      if('caches' in window){
        const names=await caches.keys();
        await Promise.all(names.filter(n=>n.startsWith('otto-start-')).map(n=>caches.delete(n)));
      }
      try{localStorage.setItem(FLAG,'1')}catch{}
    }catch(error){
      window.OttoClientLogV14?.send?.('runtime-cleanup-error',{message:error?.message||String(error)});
    }
  }
  void cleanup();
})();
