(() => {
  'use strict';
  if(window.__ottoFetchTimeoutV7)return;
  window.__ottoFetchTimeoutV7=true;

  const nativeFetch=window.fetch.bind(window);
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

  window.fetch=(input,init={})=>{
    const path=pathFor(input);
    const timeout=timeouts[path];
    if(!timeout)return nativeFetch(input,init);

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
  };
})();
