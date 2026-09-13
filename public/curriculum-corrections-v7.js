(() => {
  'use strict';
  const STORAGE='ottoStartLearningPathV2';
  const NUM_1_10=[['1','eins'],['2','zwei'],['3','drei'],['4','vier'],['5','fünf'],['6','sechs'],['7','sieben'],['8','acht'],['9','neun'],['10','zehn']];
  const NUM_11_20=[['11','elf'],['12','zwölf'],['13','dreizehn'],['14','vierzehn'],['15','fünfzehn'],['16','sechzehn'],['17','siebzehn'],['18','achtzehn'],['19','neunzehn'],['20','zwanzig']];

  function state(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return{}}}
  function current(){const s=state();return{id:Number(s.currentLesson||1),step:Number(s.lessonStep||0)}}
  function escape(v=''){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

  function addReadingNote(screen,id,html){
    if(!screen||screen.querySelector(`[data-v7-reading-note="${id}"]`))return;
    const topic=screen.querySelector('[data-v6-topic-card]');
    if(!topic)return;
    const note=document.createElement('div');
    note.className='hint card v7-reading-note';
    note.dataset.v7ReadingNote=String(id);
    note.setAttribute('data-no-word-tap','1');
    note.innerHTML=`<b>Как не прочитать это по-русски</b><p>${html}</p>`;
    topic.after(note);
  }

  function patchNumbers(id){
    if(id!==17&&id!==18)return;
    const list=id===17?NUM_1_10:NUM_11_20;
    const strip=document.querySelector('#app .number-strip');
    if(strip&&!strip.dataset.v7Full){
      strip.dataset.v7Full='1';
      strip.innerHTML=list.map(([n,w])=>`<span>${n}<br><b>${escape(w)}</b></span>`).join('');
      strip.style.gridTemplateColumns='repeat(5,minmax(0,1fr))';
      strip.style.gap='6px';
      strip.style.flexWrap='wrap';
    }
    const screen=strip?.closest('.screen')||document.querySelector('#app .screen');
    const audio=screen?.querySelector('.audio-orb[data-speak]');
    if(audio&&!audio.dataset.v7Full){
      audio.dataset.v7Full='1';
      audio.dataset.speak=list.map(([,w])=>w).join('. ');
    }
    const h=screen?.querySelector('.h2');
    if(h&&/Сначала услышишь/.test(h.textContent||''))h.textContent=id===17?'Все числа от 1 до 10':'Все числа от 11 до 20';
    if(id===17)addReadingNote(screen,id,'<b>sechs</b>: сочетание <b>chs</b> здесь звучит как «кс». <b>acht</b>: ch после a — более твёрдый немецкий звук [x]. <b>zwölf</b>: z → «ц», w → «в», ö — отдельный немецкий гласный. Сначала слушай слово целиком.');
    if(id===18)addReadingNote(screen,id,'<b>sechzehn</b> и <b>siebzehn</b> лучше запоминать на слух как целые числа: формы немного сокращаются. В <b>zwanzig</b> стандартное окончание -ig звучит с мягким немецким ich-Laut.');
  }

  function patchTopicIntro(id){
    const screen=document.querySelector('#app .screen');
    if(!screen)return;
    if(id===15){
      const h=screen.querySelector('.h2');
      const lead=screen.querySelector('.lead');
      if(h&&h.textContent==='Новые слова — совсем немного')h.textContent='Семья — сначала самые близкие, потом остальные';
      if(lead&&/Посмотри, послушай/.test(lead.textContent||''))lead.textContent='Сначала четыре опорных слова, ниже — полный базовый набор родственников. Слушай и узнавай, зубрить всё за один раз не нужно.';
      const count=screen.querySelector('[data-v6-topic-card] .v6-topic-head>span');
      if(count&&count.textContent!=='15 слов')count.textContent='15 слов';
      addReadingNote(screen,id,'<b>Schwester</b>: sch → «ш». <b>Großmutter / Großvater</b>: ß → «с». <b>Tochter</b>: ch после o звучит твёрже, как немецкий [x]. Нажимай 🔊 и сравнивай со своим чтением.');
    }
    if(id===19){
      const h=screen.querySelector('.h2');
      const lead=screen.querySelector('.lead');
      if(h&&h.textContent==='Новые слова — совсем немного')h.textContent='Все семь дней недели';
      if(lead&&/Посмотри, послушай/.test(lead.textContent||''))lead.textContent='Сначала знакомые опорные слова, затем полный ряд от Montag до Sonntag. После этого будет отдельная практика на все семь дней.';
      addReadingNote(screen,id,'<b>Dienstag</b>: ie → долгое «и». <b>Mittwoch</b>: ch после o звучит твёрже [x]. Остальные дни сначала слушай целиком, затем повторяй.');
    }
  }

  function patch(){
    const {id,step}=current();
    if(step!==1)return;
    patchNumbers(id);
    patchTopicIntro(id);
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;patch()});
  }
  const root=document.getElementById('app');
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(patch,30));
  patch();
})();
