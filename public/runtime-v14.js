(() => {
  'use strict';
  if (window.__ottoRuntimeV14) return;
  window.__ottoRuntimeV14 = true;

  const MIGRATION='ottoStartStableRuntimeV16';
  async function cleanup(){
    try{
      let first=false;
      try{first=localStorage.getItem(MIGRATION)!=='1'}catch{}
      if(first){
        try{
          ['ottoStartV12','ottoStartV14','ottoStartCourseV8','ottoStartLearningPathV2','ottoStartCurriculumV6'].forEach(k=>localStorage.removeItem(k));
          localStorage.setItem(MIGRATION,'1');
        }catch{}
      }
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r=>r.unregister().catch(()=>false)));
      }
      if('caches' in window){
        const names=await caches.keys();
        await Promise.all(names.filter(n=>n.startsWith('otto-start-')).map(n=>caches.delete(n)));
      }
    }catch(error){
      window.OttoClientLogV14?.send?.('runtime-cleanup-error',{message:error?.message||String(error)});
    }
  }
  void cleanup();
})();
