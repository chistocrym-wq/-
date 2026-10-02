import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const OPENAI_MODEL = 'gpt-4o-mini-tts';
const OPENAI_VOICE = 'cedar';
const GEMINI_MODEL = 'gemini-3.1-flash-tts-preview';
const GEMINI_VOICE = 'Charon';
const STORE = 'otto-tts-cache-de-v8-male';
const PRONUNCIATION_VERSION = 'de-DE-hochdeutsch-male-v8';
const MAX_TEXT_LENGTH = 420;
const SAMPLE_RATE = 24000;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
function cacheStore() {
  const isProduction = Netlify.context?.deploy?.context === 'production';
  return isProduction ? getStore(STORE) : getDeployStore(STORE);
}
function isGermanLetter(text) { return /^[A-ZÄÖÜẞß]$/iu.test(String(text || '').trim()); }

const LETTER_NAMES = {
  A:'A',B:'Be',C:'Ce',D:'De',E:'E',F:'Ef',G:'Ge',H:'Ha',I:'I',J:'Jot',K:'Ka',L:'El',M:'Em',N:'En',O:'O',P:'Pe',Q:'Ku',R:'Er',S:'Es',T:'Te',U:'U',V:'Vau',W:'Weh',X:'Iks',Y:'Ypsilon',Z:'Zett','Ä':'Ä','Ö':'Ö','Ü':'Ü','ẞ':'Eszett','ß':'Eszett',
};
function spokenText(text, kind) { return kind === 'letter' ? (LETTER_NAMES[String(text || '').trim()] || text) : text; }
function instructions(mode, kind) {
  const pace = mode === 'slow'
    ? 'Speak a little slower than normal conversation for an absolute beginner, but keep connected natural speech. Never spell a word unless the target itself is a letter.'
    : 'Speak at a calm, natural teaching pace.';
  const target = kind === 'letter'
    ? 'The input represents one German letter. Pronounce only its German letter name, never the English letter name.'
    : 'Pronounce the supplied target exactly as Standard German from Germany.';
  return [
    'You are a pleasant adult MALE native speaker from Germany teaching absolute beginners.',
    'Language and accent must be German (Germany), Standard German/Hochdeutsch, de-DE. Do not use an English, Russian, Dutch, Scandinavian, Swiss or Austrian accent.',
    'Use native German rhythm, stress, vowel length and consonants. Prioritize pedagogically correct pronunciation over dramatic expressiveness.',
    'Pay special attention to ich-Laut [ç], ach-Laut [x], sch [ʃ], z [ts], w [v], j [j], ei [aɪ̯], ie [iː], eu/äu [ɔʏ̯], au [aʊ̯], initial sp/st [ʃp]/[ʃt], umlauts ä/ö/ü, ß, final devoicing and German r.',
    'Final -e and -er may be naturally reduced but must not disappear artificially.',
    target,
    pace,
    'Speak only the supplied German target and nothing else.',
  ].join(' ');
}
function geminiPrompt(text, mode, kind) {
  const target = spokenText(text, kind);
  const style = mode === 'slow' ? 'etwas langsamer als normales Gespräch, sehr klar und trotzdem natürlich' : 'ruhig, natürlich und deutlich';
  return kind === 'letter'
    ? `Sprachsynthese. Erwachsener männlicher Muttersprachler aus Deutschland, Hochdeutsch. Sprich ${style}. Sprich ausschließlich den deutschen Buchstabennamen: „${target}“`
    : `Sprachsynthese. Erwachsener männlicher Muttersprachler aus Deutschland, Hochdeutsch (de-DE), ohne fremden Akzent. Sprich ${style}. Verwende natürliche deutsche Vokallängen, Betonung und Laute. Sprich ausschließlich: „${target}“`;
}
function pcmToWav(pcm, sampleRate = SAMPLE_RATE) {
  const data = Buffer.isBuffer(pcm) ? pcm : Buffer.from(pcm);
  const h = Buffer.alloc(44);
  h.write('RIFF',0);h.writeUInt32LE(36+data.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(sampleRate,24);h.writeUInt32LE(sampleRate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(data.length,40);
  return Buffer.concat([h,data]);
}
function isWav(buffer) {
  return buffer?.length > 1000 && buffer.subarray(0,4).toString('ascii') === 'RIFF' && buffer.subarray(8,12).toString('ascii') === 'WAVE';
}

async function synthesizeOpenAI(apiKey, text, mode, kind) {
  if (!apiKey) return { ok:false, code:'missing_openai_api_key' };
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method:'POST',
      headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' },
      body:JSON.stringify({
        model:OPENAI_MODEL,
        voice:OPENAI_VOICE,
        input:spokenText(text,kind),
        instructions:instructions(mode,kind),
        response_format:'wav',
        speed:mode === 'slow' ? 0.92 : 0.98,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      let code='';
      try{const p=JSON.parse(detail);code=String(p?.error?.code||p?.error?.type||'')}catch{}
      console.error('otto-tts OpenAI error',response.status,code);
      return {ok:false,status:response.status,code:code||'openai_tts_error'};
    }
    const bytes=Buffer.from(await response.arrayBuffer());
    if(!isWav(bytes)) return {ok:false,status:502,code:'openai_invalid_audio'};
    return {ok:true,audio:bytes,provider:'openai-cedar'};
  }catch(error){
    console.error('otto-tts OpenAI network error',error?.name,error?.message);
    return {ok:false,status:502,code:'openai_network_error'};
  }
}

async function synthesizeGemini(apiKey, text, mode, kind) {
  if (!apiKey) return { ok:false, code:'missing_gemini_api_key' };
  try {
    const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
      method:'POST',
      headers:{'x-goog-api-key':apiKey,'Content-Type':'application/json','Api-Revision':'2026-05-20'},
      body:JSON.stringify({
        model:GEMINI_MODEL,
        input:geminiPrompt(text,mode,kind),
        response_format:{type:'audio'},
        generation_config:{speech_config:[{voice:GEMINI_VOICE}]},
      }),
    });
    const raw=await response.text();
    if(!response.ok){
      let code='',message='';try{const p=JSON.parse(raw);code=String(p?.error?.status||p?.error?.code||'');message=String(p?.error?.message||'').slice(0,180)}catch{}
      console.error('otto-tts Gemini error',response.status,code,message);
      return {ok:false,status:response.status,code:code||'gemini_tts_error'};
    }
    let payload;try{payload=JSON.parse(raw)}catch{return {ok:false,status:502,code:'gemini_invalid_json'}}
    const audioBlock=payload?.output_audio||payload?.outputAudio||payload?.interaction?.output_audio||payload?.interaction?.outputAudio;
    const encoded=String(audioBlock?.data||'');
    if(!encoded)return {ok:false,status:502,code:'gemini_missing_audio'};
    const decoded=Buffer.from(encoded,'base64');
    const wav=isWav(decoded)?decoded:pcmToWav(decoded,SAMPLE_RATE);
    if(!isWav(wav))return {ok:false,status:502,code:'gemini_invalid_audio'};
    return {ok:true,audio:wav,provider:'gemini-charon'};
  }catch(error){
    console.error('otto-tts Gemini network error',error?.name,error?.message);
    return {ok:false,status:502,code:'gemini_network_error'};
  }
}

async function readInput(req) {
  if (req.method === 'GET') {
    const url=new URL(req.url);
    return {text:url.searchParams.get('text')||'',mode:url.searchParams.get('mode')||'normal',kind:url.searchParams.get('kind')||'text'};
  }
  if(req.method==='POST')return req.json().catch(()=>({}));
  return null;
}

export default async(req)=>{
  const body=await readInput(req);
  if(!body)return json({error:'Method not allowed'},405,{Allow:'GET, POST'});
  const text=String(body.text||'').trim();
  const mode=body.mode==='slow'?'slow':'normal';
  const kind=body.kind==='letter'||isGermanLetter(text)?'letter':'text';
  if(!text)return json({error:'Text is required.'},400);
  if(text.length>MAX_TEXT_LENGTH)return json({error:'Text is too long.'},413);

  const fingerprint=JSON.stringify({version:PRONUNCIATION_VERSION,openai:OPENAI_MODEL,gemini:GEMINI_MODEL,openaiVoice:OPENAI_VOICE,geminiVoice:GEMINI_VOICE,kind,mode,text});
  const key=createHash('sha256').update(fingerprint).digest('hex');
  const store=cacheStore();
  try{
    const cached=await store.get(key,{type:'arrayBuffer'});
    if(cached){const audio=Buffer.from(cached);if(isWav(audio))return new Response(audio,{headers:{'Content-Type':'audio/wav','Cache-Control':'public, max-age=31536000, immutable','X-Otto-TTS':'cache','X-Otto-Pronunciation':PRONUNCIATION_VERSION,'X-Otto-Voice':'male'}})}
  }catch(error){console.warn('otto-tts cache read failed',error?.message||error)}

  let result=await synthesizeOpenAI(Netlify.env.get('OPENAI_API_KEY'),text,mode,kind);
  if(!result.ok)result=await synthesizeGemini(Netlify.env.get('GEMINI_API_KEY'),text,mode,kind);
  if(!result.ok)return json({error:'High-quality German male voice is not configured on the server.',providerCode:result.code||'tts_failed',providerStatus:result.status||503},503);

  try{await store.set(key,result.audio)}catch(error){console.warn('otto-tts cache write failed',error?.message||error)}
  return new Response(result.audio,{headers:{'Content-Type':'audio/wav','Cache-Control':'public, max-age=31536000, immutable','X-Otto-TTS':'generated','X-Otto-Provider':result.provider,'X-Otto-Pronunciation':PRONUNCIATION_VERSION,'X-Otto-Voice':'male'}});
};

export const config={path:'/api/otto-tts',rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};