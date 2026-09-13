(() => {
  'use strict';
  const speech=window.OttoStartSpeech;
  if(!speech?.preload||speech.__queuedV7)return;
  const original=speech.preload.bind(speech);
  const queue=[];
  const jobs=new Map();
  let active=0;
  const MAX=2;

  function keyFor(text,mode){return `${mode||'slow'}:${String(text||'').trim()}`}
  function drain(){
    while(active<MAX&&queue.length){
      const job=queue.shift();
      active++;
      Promise.resolve(original(job.text,job.mode)).then(()=>job.resolve(true)).catch(err=>job.reject(err)).finally(()=>{
        active--;
        jobs.delete(job.key);
        drain();
      });
    }
  }

  speech.preload=(text,mode)=>{
    const clean=String(text||'').trim();
    if(!clean)return Promise.resolve(false);
    const key=keyFor(clean,mode);
    if(jobs.has(key))return jobs.get(key);
    const promise=new Promise((resolve,reject)=>{queue.push({key,text:clean,mode,resolve,reject});drain()});
    jobs.set(key,promise);
    return promise;
  };
  speech.__queuedV7=true;
})();
