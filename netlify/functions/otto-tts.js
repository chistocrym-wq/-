import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const MODEL = 'gpt-4o-mini-tts';
const VOICE = 'marin';
const STORE = 'otto-tts-cache-de-v5';
const PRONUNCIATION_VERSION = 'de-DE-hochdeutsch-v5';
const MAX_TEXT_LENGTH = 420;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}
function cacheStore() {
  const isProduction = Netlify.context?.deploy?.context === 'production';
  return isProduction ? getStore(STORE) : getDeployStore(STORE);
}
function isGermanLetter(text) { return /^[A-ZÄÖÜẞß]$/iu.test(String(text || '').trim()); }
function speechInstructions(mode, kind) {
  const pace = mode === 'slow'
    ? 'Sprich etwas langsamer als normales Gesprächstempo, sehr klar für einen absoluten Anfänger, aber vollkommen natürlich. Keine künstlichen Pausen innerhalb eines Wortes und keine Buchstaben-für-Buchstaben-Aussprache.'
    : 'Sprich ruhig, natürlich und deutlich wie eine muttersprachliche Deutschlehrkraft aus Deutschland.';
  const letterRule = kind === 'letter'
    ? 'Der Text ist ein einzelner Buchstabe. Sprich ausschließlich den deutschen Buchstabennamen. J=Jot, V=Vau, W=Weh, Y=Ypsilon, Z=Zett, ß=Eszett. Bei Ä, Ö und Ü sprich den deutschen Buchstabennamen mit Umlaut.'
    : 'Lies den gelieferten Text als Standarddeutsch aus Deutschland. Auch internationale Wörter wie Ticket, Bus, Sport, Euro, Termin und Café deutsch aussprechen.';
  return [
    'Sprich ausschließlich den gelieferten deutschen Text und nichts zusätzlich.',
    'Sprache und Akzent: Deutsch (Deutschland), Standarddeutsch/Hochdeutsch, de-DE.',
    'Keine englische oder russische Lautung. Keine englischen Buchstabennamen.',
    'Aussprache wie bei einer ruhigen muttersprachlichen Deutschlehrkraft aus Deutschland.',
    'Achte auf natürliche deutsche Vokallängen und Wortakzente sowie: ich-Laut [ç] in ich/mich/Milch; ach-Laut [x] nach a/o/u/au; sch [ʃ]; z [ts]; w [v]; j [j]; ei [aɪ̯]; ie [iː]; eu/äu [ɔʏ̯]; sp/st am Wortanfang [ʃp]/[ʃt]; ä, ö, ü; ß als stimmloses s; deutsches r.',
    'Endungen -e und -er natürlich reduzieren, aber nicht verschlucken.',
    letterRule, pace,
  ].join(' ');
}
function providerDiagnostic(status, detail) {
  let code = '', type = '';
  try { const parsed = JSON.parse(detail || '{}'); code = String(parsed?.error?.code || '').slice(0,100); type = String(parsed?.error?.type || '').slice(0,100); } catch {}
  return { providerStatus: Number(status) || 0, providerCode: code, providerType: type };
}
function speechUrls() {
  const configured = String(Netlify.env.get('OPENAI_BASE_URL') || '').trim().replace(/\/+$/, '');
  if (!configured) return ['https://api.openai.com/v1/audio/speech'];
  const urls = [`${configured}/audio/speech`];
  if (!/\/v1$/i.test(configured)) urls.push(`${configured}/v1/audio/speech`);
  return [...new Set(urls)];
}
async function requestSpeech(apiKey, payload) {
  let lastDiagnostic = { providerStatus: 0, providerCode: '', providerType: '' };
  for (const url of speechUrls()) {
    try {
      const response = await fetch(url, { method:'POST', headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' }, body:JSON.stringify(payload) });
      if (response.ok) return { response, url };
      const detail = await response.text();
      lastDiagnostic = providerDiagnostic(response.status, detail);
      console.error('otto-tts provider error', lastDiagnostic.providerStatus, lastDiagnostic.providerCode, lastDiagnostic.providerType, url);
      if (response.status !== 404) return { response:null, diagnostic:lastDiagnostic };
    } catch (error) {
      console.error('otto-tts network error', error?.name, error?.message, url);
      lastDiagnostic = { providerStatus:0, providerCode:'network_error', providerType:'' };
    }
  }
  return { response:null, diagnostic:lastDiagnostic };
}

async function readInput(req) {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    return {
      text: url.searchParams.get('text') || '',
      mode: url.searchParams.get('mode') || 'normal',
      kind: url.searchParams.get('kind') || 'text',
    };
  }
  if (req.method === 'POST') return req.json().catch(() => ({}));
  return null;
}

export default async (req) => {
  const body = await readInput(req);
  if (!body) return json({ error:'Method not allowed' }, 405, { Allow:'GET, POST' });
  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  if (!apiKey) return json({ error:'Neural German voice is not configured.', providerCode:'missing_openai_api_key' }, 503);

  const text = String(body.text || '').trim();
  const mode = body.mode === 'slow' ? 'slow' : 'normal';
  const kind = body.kind === 'letter' || isGermanLetter(text) ? 'letter' : 'text';
  if (!text) return json({ error:'Text is required.' }, 400);
  if (text.length > MAX_TEXT_LENGTH) return json({ error:'Text is too long.' }, 413);

  const speed = mode === 'slow' ? 0.94 : 1.0;
  const fingerprint = JSON.stringify({ pronunciationVersion:PRONUNCIATION_VERSION, model:MODEL, voice:VOICE, kind, mode, speed, text });
  const key = createHash('sha256').update(fingerprint).digest('hex');
  const store = cacheStore();

  try {
    const cached = await store.get(key, { type:'arrayBuffer' });
    if (cached) return new Response(cached, { headers:{ 'Content-Type':'audio/mpeg', 'Cache-Control':'public, max-age=31536000, immutable', 'X-Otto-TTS':'cache', 'X-Otto-Pronunciation':PRONUNCIATION_VERSION } });
  } catch (error) { console.warn('otto-tts cache read failed', error); }

  const payload = { model:MODEL, voice:VOICE, input:text, instructions:speechInstructions(mode,kind), response_format:'mp3', speed };
  const result = await requestSpeech(apiKey, payload);
  if (!result.response) return json({ error:'Neural German voice is temporarily unavailable.', ...(result.diagnostic || {}) }, 502);

  const audio = await result.response.arrayBuffer();
  try { await store.set(key, audio); } catch (error) { console.warn('otto-tts cache write failed', error); }
  return new Response(audio, { headers:{ 'Content-Type':'audio/mpeg', 'Cache-Control':'public, max-age=31536000, immutable', 'X-Otto-TTS':'generated', 'X-Otto-Pronunciation':PRONUNCIATION_VERSION } });
};

export const config = { path:'/api/otto-tts', rateLimit:{ windowLimit:60, windowSize:60, aggregateBy:['ip','domain'] } };