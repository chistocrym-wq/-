import { getStore } from '@netlify/blobs';

const STORE='otto-start-client-errors-v1';
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
export default async(req)=>{
  if(req.method!=='GET')return json({error:'Method not allowed'},405);
  try{
    const store=getStore(STORE,{consistency:'strong'});
    const listed=await store.list({prefix:'logs/'});
    const blobs=Array.isArray(listed?.blobs)?listed.blobs:[];
    const selected=blobs.slice(-80).reverse();
    const logs=[];
    for(const item of selected){
      const key=item.key||item.name;if(!key)continue;
      const v=await store.get(key,{type:'json'});if(!v)continue;
      logs.push({createdAt:String(v.createdAt||''),kind:String(v.kind||''),message:String(v.message||'').slice(0,500),target:String(v.target||'').slice(0,250),screen:String(v.screen||'').slice(0,180),details:v.details||null,session:String(v.session||'').slice(0,80)});
    }
    return json({count:logs.length,logs});
  }catch(e){return json({error:String(e?.message||e)},500)}
};
export const config={path:'/api/otto-start-client-log-summary-temp',rateLimit:{windowLimit:20,windowSize:3600,aggregateBy:['ip','domain']}};
