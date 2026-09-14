const MAX_AUDIO_BASE64 = 3_000_000;
const GEMINI_MODEL = 'gemini-3.8-flash';
const OPENAI_TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control':'no-store', ...headers },
  });
}
function normalizeMimeType(value) {
  const mime = String(value || 'audio/webm').toLowerCase().split(';')[0].trim();
  return mime.startsWith('audio/') ? mime : 'audio/webm';
}
function stripFences(value) {
  return String(value || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}
function normalize(value='') {
  return String(value).toLocaleLowerCase('de-DE').replace(/[.,!?;:„“"'()]/g,' ').replace(/\b(der|die|das)\b/g,' ').replace(/\s+/g,' ').trim();
}
function levenshtein(a,b) {
  const x=[...a],y=[...b],row=Array(y.length+1).fill(0).map((_,i)=>i);
  for(let i=1;i<=x.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=y.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(x[i-1]===y[j-1]?0:1));prev=old;}}
  return row[y.length];
}
function similarity(expected, heard) {
  const a=normalize(expected),b=normalize(heard);if(!a||!b)return 0;if(a===b)return 1;return Math.max(0,1-levenshtein(a,b)/Math.max(a.length,b.length));
}
function extensionForMime(mime) {
  if(mime.includes('mp4'))return 'm4a';
  if(mime.includes('ogg'))return 'ogg';
  if(mime.includes('wav'))return 'wav';
  return 'webm';
}

async function assessWithGemini(apiKey, baseUrl, audioBase64, mimeType, expected, hints) {
  if(!apiKey)return null;
  const prompt = `Ты — доброжелательный преподаватель немецкого A1 в Otto Start. Прослушай запись ученика и оцени именно произношение ожидаемого немецкого слова или фразы. Ожидается: ${expected}. ${hints.length?`Правила чтения: ${hints.join(' | ')}.`:''} Сначала распознай фактически сказанное по-немецки. status: good — понятно и достаточно близко; retry — заметно отличается; slower — похоже, но нужно сказать медленнее/чётче. feedbackRu — одно короткое сообщение по-русски без процентов. focus — короткий проблемный звук/фрагмент либо пустая строка.`;
  const response = await fetch(`${baseUrl}/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
    body:JSON.stringify({
      contents:[{role:'user',parts:[{text:prompt},{inlineData:{mimeType,data:audioBase64}}]}],
      generationConfig:{temperature:0.1,responseMimeType:'application/json',responseSchema:{type:'OBJECT',required:['transcript','status','feedbackRu','focus'],properties:{transcript:{type:'STRING'},status:{type:'STRING',enum:['good','retry','slower']},feedbackRu:{type:'STRING'},focus:{type:'STRING'}}}},
    }),
  });
  if(!response.ok){
    const detail=await response.text();console.error('otto-start-pronunciation Gemini error',response.status,detail.slice(0,500));return null;
  }
  const payload=await response.json();
  const text=payload?.candidates?.[0]?.content?.parts?.map((part)=>part?.text||'').join('').trim();
  if(!text)return null;
  const parsed=JSON.parse(stripFences(text));
  const status=['good','retry','slower'].includes(parsed.status)?parsed.status:'retry';
  return {transcript:String(parsed.transcript||'').trim(),status,feedbackRu:String(parsed.feedbackRu||'').trim()||(status==='good'?'Хорошо, звучит понятно.':'Прослушайте образец и повторите ещё раз.'),focus:String(parsed.focus||'').trim().slice(0,40),provider:'gemini'};
}

async function transcribeWithOpenAI(apiKey, audioBase64, mimeType, expected) {
  if(!apiKey)return null;
  const bytes=Buffer.from(audioBase64,'base64');
  const form=new FormData();
  form.append('file',new Blob([bytes],{type:mimeType}),`otto-recording.${extensionForMime(mimeType)}`);
  form.append('model',OPENAI_TRANSCRIBE_MODEL);
  form.append('language','de');
  form.append('response_format','json');
  form.append('prompt',`German A1 learner. Expected target: ${expected}`);
  const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form});
  if(!response.ok){const detail=await response.text();console.error('otto-start-pronunciation OpenAI transcription error',response.status,detail.slice(0,500));return null;}
  const payload=await response.json();
  const transcript=String(payload?.text||'').trim();
  if(!transcript)return null;
  const score=similarity(expected,transcript);
  if(score>=0.84)return {transcript,status:'good',feedbackRu:'Фраза распознана близко к образцу. Произношение достаточно понятно для этого шага.',focus:'',provider:'openai-transcribe'};
  if(score>=0.58)return {transcript,status:'slower',feedbackRu:'Очень близко. Повторите ещё раз чуть медленнее и чётче.',focus:'',provider:'openai-transcribe'};
  return {transcript,status:'retry',feedbackRu:'Распознанная фраза отличается от образца. Послушайте образец и повторите ещё раз.',focus:'',provider:'openai-transcribe'};
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  try {
    const body = await req.json().catch(() => ({}));
    const audioBase64 = String(body.audioBase64 || '');
    const mimeType = normalizeMimeType(body.mimeType);
    const expected = String(body.expected || '').trim().slice(0, 240);
    const hints = Array.isArray(body.hints) ? body.hints.map(String).filter(Boolean).slice(0, 8) : [];
    if (!audioBase64) return json({ error: 'Аудиозапись не получена.', code: 'missing_audio' }, 400);
    if (audioBase64.length > MAX_AUDIO_BASE64) return json({ error: 'Запись слишком длинная. Скажите фразу короче.', code: 'audio_too_large' }, 413);
    if (!expected) return json({ error: 'Не указана фраза для проверки.', code: 'missing_expected' }, 400);

    const geminiKey=Netlify.env.get('GEMINI_API_KEY');
    const geminiBase=(Netlify.env.get('GOOGLE_GEMINI_BASE_URL')||'https://generativelanguage.googleapis.com').replace(/\/$/,'');
    const openaiKey=Netlify.env.get('OPENAI_API_KEY');

    let result=null;
    try{result=await assessWithGemini(geminiKey,geminiBase,audioBase64,mimeType,expected,hints)}catch(error){console.error('Gemini pronunciation parse error',error?.message||error)}
    if(!result){try{result=await transcribeWithOpenAI(openaiKey,audioBase64,mimeType,expected)}catch(error){console.error('OpenAI pronunciation fallback error',error?.message||error)}}
    if(!result)return json({error:'Автоматическая оценка произношения не настроена, но запись и её прослушивание работают независимо.',code:'assessment_not_configured'},503);
    return json(result);
  } catch (error) {
    console.error('otto-start-pronunciation error', error);
    return json({ error: 'Не удалось автоматически оценить запись.', code: 'server_error' }, 500);
  }
};

export const config = {
  path: '/api/otto-start-pronunciation',
  method: ['POST'],
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip','domain'] },
};