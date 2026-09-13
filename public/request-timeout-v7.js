(() => {
  'use strict';
  if(window.__ottoFetchTimeoutV7)return;
  window.__ottoFetchTimeoutV7=true;

  const nativeFetch=window.fetch.bind(window);
  const ttsInflight=new Map();
  const timeouts={
    '/api/otto-tts':12000,
    '/api/otto-start-pronunciation':22000,
    '/api/otto-start-support':15000,
    '/api/translate-task':12000
  };

  function pathFor(input){
    try{
      const raw=typeof input==='string'?input:input?.url;
      return new URL(raw,location.href).pathname;
    }catch{return''}
  }

  function withTimeout(input,init,timeout){
    const controller=new AbortController();
    const upstream=init?.signal;
    if(upstream){
      if(upstream.aborted)controller.abort(upstream.reason);
      else upstream.addEventListener('abort',()=>controller.abort(upstream.reason),{once:true});
    }
    const timer=setTimeout(()=>{
      try{controller.abort(new DOMException('Otto request timed out','TimeoutError'))}
      catch{controller.abort()}
    },timeout);
    return nativeFetch(input,{...init,signal:controller.signal}).finally(()=>clearTimeout(timer));
  }

  async function sharedTts(input,init,timeout){
    const key=typeof init?.body==='string'?init.body:'';
    if(!key)return withTimeout(input,init,timeout);
    if(!ttsInflight.has(key)){
      const job=(async()=>{
        const response=await withTimeout(input,init,timeout);
        const body=await response.arrayBuffer();
        return {
          body,
          status:response.status,
          statusText:response.statusText,
          headers:[...response.headers.entries()]
        };
      })();
      ttsInflight.set(key,job);
      job.finally(()=>ttsInflight.delete(key)).catch(()=>{});
    }
    const result=await ttsInflight.get(key);
    return new Response(result.body.slice(0),{status:result.status,statusText:result.statusText,headers:result.headers});
  }

  window.fetch=(input,init={})=>{
    const path=pathFor(input);
    const timeout=timeouts[path];
    if(!timeout)return nativeFetch(input,init);
    if(path==='/api/otto-tts'&&String(init?.method||'GET').toUpperCase()==='POST')return sharedTts(input,init,timeout);
    return withTimeout(input,init,timeout);
  };
})();
