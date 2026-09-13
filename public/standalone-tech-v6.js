(() => {
  'use strict';

  function toast(text) {
    let el=document.querySelector('.v6-tech-toast');
    if(!el){el=document.createElement('div');el.className='v6-tech-toast';el.style.cssText='position:fixed;z-index:13000;left:50%;bottom:90px;transform:translateX(-50%);background:#173f43;color:white;padding:10px 13px;border-radius:12px;font:700 12px/1.3 system-ui;box-shadow:0 10px 30px #0003';document.body.appendChild(el)}
    el.textContent=text; clearTimeout(el._t); el._t=setTimeout(()=>el.remove(),2200);
  }

  async function shareStandalone() {
    const data={title:'Otto Start',text:'Я учу немецкий с нуля в Otto Start.',url:`${location.origin}/`};
    try{
      if(navigator.share){await navigator.share(data);return}
      await navigator.clipboard.writeText(`${data.text} ${data.url}`);toast('Ссылка на Otto Start скопирована');
    }catch(err){if(err?.name!=='AbortError')toast('Не удалось открыть меню «Поделиться»')}
  }

  function patchShareButton(){
    const grid=document.querySelector('#app .menu-grid');
    if(!grid)return;
    const share=grid.querySelector('.otto-share-card[data-otto-share]');
    if(share){
      share.removeAttribute('data-otto-share');
      share.setAttribute('data-v6-share','1');
      share.setAttribute('data-no-word-tap','1');
      if(!grid.querySelector('[data-otto-share][data-v6-marker]')){
        const marker=document.createElement('span');marker.hidden=true;marker.dataset.ottoShare='1';marker.dataset.v6Marker='1';marker.setAttribute('data-no-word-tap','1');grid.appendChild(marker);
      }
    }
  }

  async function patchOfflineStatus(){
    const label=document.querySelector('[data-offline-shell]');
    if(!label||!('caches'in window))return;
    try{
      const names=await caches.keys();
      const ready=names.some(name=>/^otto-start-offline-v\d+-shell$/.test(name));
      if(ready&&/сохраня/i.test(label.textContent||''))label.innerHTML='<span class="otto-offline-ok">сохранены</span>';
    }catch(_){ }
  }

  function patchRouteCopy(){
    const replacements=[
      ['5 мин · назвать близких','5 мин · основные родственники'],
      ['5 мин · узнавать и произносить основные числа','5 мин · все числа от 1 до 10'],
      ['5 мин · услышать цену до 20','5 мин · все числа от 11 до 20'],
      ['5 мин · понять Montag и Freitag','5 мин · все 7 дней недели']
    ];
    document.querySelectorAll('#app .lesson-row small').forEach(el=>{
      let text=el.textContent||'';
      for(const [from,to] of replacements){if(text.includes(from))text=text.replace(from,to)}
      if(el.textContent!==text)el.textContent=text;
    });
  }

  function patchRecoveryExclusions(){
    document.querySelectorAll('#app .nav-item').forEach(el=>{
      if(el.classList.contains('active'))el.dataset.v6Bypass='1';
      else delete el.dataset.v6Bypass;
    });
    const repeatedMore=document.querySelector('#app .menu-grid')?.closest('.screen')?.querySelector('[data-go="more"]');
    if(repeatedMore)repeatedMore.dataset.v6Bypass='1';
  }

  function patch(){patchShareButton();patchRouteCopy();patchRecoveryExclusions();void patchOfflineStatus()}
  let scheduled=false;
  function schedulePatch(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;patch()});
  }

  document.addEventListener('click',e=>{
    const share=e.target.closest?.('[data-v6-share]');
    if(share){e.preventDefault();e.stopImmediatePropagation();void shareStandalone();return}
    schedulePatch();
  },true);

  const app=document.getElementById('app');
  if(app)new MutationObserver(schedulePatch).observe(app,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedulePatch()});
  patch();
})();
