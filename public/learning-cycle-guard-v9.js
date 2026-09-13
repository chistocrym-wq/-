(() => {
  'use strict';
  if (window.__ottoLearningCycleGuardV9) return;
  window.__ottoLearningCycleGuardV9 = true;

  const COURSE_KEY='ottoStartCourseV8';
  const CYCLE_KEY='ottoStartCycleV9';

  function read(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return JSON.parse(JSON.stringify(fallback))}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}

  function advanceUseSession(){
    const data=window.OttoCourseDataV8;
    const c=read(COURSE_KEY,{currentTopic:0,sessionByTopic:{},completedTopics:[],sessions:0,minutes:0,duration:7,lastVisit:Date.now()});
    if(!data?.topics?.length)return false;
    const t=data.topics[Math.min(Number(c.currentTopic||0),data.topics.length-1)];
    if(!t)return false;
    c.sessionByTopic=c.sessionByTopic||{};
    c.sessionByTopic[t.id]=Number(c.sessionByTopic[t.id]||0)+1;
    c.sessions=Number(c.sessions||0)+1;
    c.minutes=Number(c.minutes||0)+Number(c.duration||7);
    c.lastVisit=Date.now();
    write(COURSE_KEY,c);
    window.dispatchEvent(new CustomEvent('otto:v8-progress',{detail:{state:c}}));
    return true;
  }

  function closeLayer(){
    document.getElementById('otto-v8-layer')?.remove();
    document.documentElement.style.overflow='';
  }

  function patchSpeaking(){
    const button=document.querySelector('#otto-v8-layer [data-v9-final-speaking]');
    if(!button)return;
    button.removeAttribute('data-mini-speak');
    const card=button.closest('.v8-card');
    if(card){
      card.classList.add('word-card');
      if(!card.querySelector('.feedback-slot'))card.insertAdjacentHTML('beforeend','<div class="feedback-slot"></div>');
    }
    const good=card?.querySelector('.feedback.good');
    if(!good||button.dataset.v9SpeakingAccepted==='1')return;
    button.dataset.v9SpeakingAccepted='1';
    const s=read(CYCLE_KEY,{milestones:{},situations:{},final:{step:3,score:0,hearing:false,reading:false,writing:false,speaking:false,passed:false}});
    s.final=s.final||{};
    if(!s.final.speaking)s.final.score=Number(s.final.score||0)+1;
    s.final.speaking=true;
    s.final.step=4;
    s.final.passed=Boolean(s.final.hearing&&s.final.reading&&s.final.writing&&s.final.speaking);
    write(CYCLE_KEY,s);
    window.dispatchEvent(new CustomEvent('otto:v9-progress',{detail:s}));
    setTimeout(()=>window.OttoLearningCycleV9?.openFinal?.(),250);
  }

  document.addEventListener('click',e=>{
    const done=e.target.closest?.('[data-v9-situation-done]');
    if(!done)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    advanceUseSession();
    closeLayer();
    setTimeout(()=>window.OttoCourseV8?.open?.(),80);
  },true);

  const obs=new MutationObserver(()=>requestAnimationFrame(patchSpeaking));
  obs.observe(document.body,{childList:true,subtree:true});
  patchSpeaking();
})();
