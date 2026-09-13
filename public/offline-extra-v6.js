(() => {
  'use strict';
  const AUDIO_DB='otto-start-audio-v1';
  const AUDIO_STORE='clips';
  let running=false;

  function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
  function extraAudio(){
    const topics=window.OttoStartV6?.topics||{};
    const out=[];
    for(const topic of Object.values(topics)){
      for(const item of topic.items||[]){
        const text=String(item.speak||item.de||'').trim();
        if(text&&!out.includes(text))out.push(text);
      }
    }
    return out;
  }
  function modeFrom(panel){return panel?.querySelector('[data-offline-mode]')?.value==='normal'?'normal':'slow'}
  function openDb(){return new Promise(resolve=>{if(!('indexedDB'in window))return resolve(null);try{const r=indexedDB.open(AUDIO_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(AUDIO_STORE))r.result.createObjectStore(AUDIO_STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)}catch{resolve(null)}})}
  async function hasAudio(key){const db=await openDb();if(!db)return false;return new Promise(resolve=>{try{const r=db.transaction(AUDIO_STORE,'readonly').objectStore(AUDIO_STORE).getKey(key);r.onsuccess=()=>resolve(r.result!==undefined);r.onerror=()=>resolve(false)}catch{resolve(false)}})}

  async function waitForBase(button){
    await sleep(160);
    const deadline=Date.now()+6*60*1000;
    while(button?.isConnected&&button.disabled&&Date.now()<deadline)await sleep(500);
  }

  async function downloadExpanded(button){
    if(running)return;
    running=true;
    try{
      await waitForBase(button);
      if(!navigator.onLine)return;
      const preload=window.OttoStartSpeech?.preload;
      if(typeof preload!=='function')return;
      const panel=button.closest('.otto-offline-panel');
      const label=panel?.querySelector('.otto-offline-progress-text');
      const texts=extraAudio();
      const mode=modeFrom(panel);
      let done=0,downloaded=0,failed=0;
      for(const text of texts){
        const key=`${mode}:${text}`;
        if(!(await hasAudio(key))){
          try{await preload(text,mode);if(await hasAudio(key))downloaded++;else failed++}catch{failed++}
          await sleep(1650);
        }
        done++;
        if(label)label.textContent=`Расширенные темы: ${done} из ${texts.length}`;
        if(!navigator.onLine)break;
      }
      if(label)label.textContent=failed?`Основной пакет готов. Расширенные темы: новых ${downloaded}, не удалось ${failed}.`:`Готово. Расширенные темы тоже сохранены (${texts.length}).`;
    }finally{running=false}
  }

  document.addEventListener('click',e=>{
    const button=e.target.closest?.('[data-offline-download]');
    if(button)void downloadExpanded(button);
  },true);
})();
