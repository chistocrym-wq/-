import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const MODEL = 'gpt-4o-mini-tts';
const VOICE = 'marin';
const STORE = 'otto-tts-cache-de-v3';
const PRONUNCIATION_VERSION = 'de-DE-hochdeutsch-v3';
const MAX_TEXT_LENGTH = 420;
const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function cacheStore() {
  const isProduction = Netlify.context?.deploy?.context === 'production';
  return isProduction ? getStore(STORE) : getDeployStore(STORE);
}

function isGermanLetter(text) {
  return /^[A-ZÄÖÜẞß]$/iu.test(String(text || '').trim());
}

function speechInstructions(mode, kind) {
  const pace = mode === 'slow'
    ? 'Sprich langsam und sehr klar für einen absoluten Anfänger, aber weiterhin natürlich. Behalte die normale deutsche Wortmelodie und korrekte Vokallängen bei. Zerlege Wörter nicht künstlich in Buchstaben oder Silben.'
    : 'Sprich in ruhigem, natürlichem Tempo einer muttersprachlichen Deutschlehrkraft.';

  const letterRule = kind === 'letter'
    ? 'Der Text ist ein einzelner Buchstabe. Sprich ausschließlich den deutschen Buchstabennamen, niemals den englischen. J = Jot, V = Vau, W = Weh, Y = Ypsilon, Z = Zett, ß = Eszett. Füge keine Erklärung hinzu.'
    : 'Lies den gelieferten Text ausschließlich als Standarddeutsch aus Deutschland. Internationale Wörter wie Ticket, Bus, Sport, Euro, Termin oder Café werden mit deutscher Aussprache gesprochen, nicht englisch.';

  return [
    'Sprich ausschließlich den gelieferten Text und nichts zusätzlich.',
    'Sprache: Deutsch (Deutschland), Standarddeutsch/Hochdeutsch, de-DE.',
    'Kein englischer oder russischer Akzent. Keine englischen Buchstabennamen.',
    'Aussprache wie bei einer ruhigen muttersprachlichen Deutschlehrkraft aus Deutschland.',
    'Achte besonders auf: ich-Laut [ç] in ich/mich/Milch; ach-Laut [x] nach a/o/u/au; sch [ʃ]; z [ts]; w [v]; j [j]; ei [aɪ̯]; ie [iː]; eu/äu [ɔʏ̯]; sp/st am Wortanfang [ʃp]/[ʃt]; ä, ö, ü; ß als stimmloses s; deutsches r.',
    'Endungen -e und -er natürlich reduziert sprechen, aber nicht künstlich verschlucken.',
    letterRule,
    pace,
  ].join(' ');
}

function providerDiagnostic(status, detail) {
  let code = '';
  let type = '';
  try {
    const parsed = JSON.parse(detail || '{}');
    code = String(parsed?.error?.code || '').slice(0, 100);
    type = String(parsed?.error?.type || '').slice(0, 100);
  } catch {}
  return { providerStatus: Number(status) || 0, providerCode: code, providerType: type };
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });

  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  if (!apiKey) return json({ error: 'Neural German voice is not configured.', providerCode: 'missing_openai_api_key' }, 503);

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || '').trim();
  const mode = body.mode === 'normal' ? 'normal' : 'slow';
  const kind = body.kind === 'letter' || isGermanLetter(text) ? 'letter' : 'text';

  if (!text) return json({ error: 'Text is required.' }, 400);
  if (text.length > MAX_TEXT_LENGTH) return json({ error: 'Text is too long.' }, 413);

  const speed = mode === 'slow' ? 0.88 : 1.0;
  const fingerprint = JSON.stringify({ pronunciationVersion: PRONUNCIATION_VERSION, model: MODEL, voice: VOICE, kind, mode, speed, text });
  const key = createHash('sha256').update(fingerprint).digest('hex');
  const store = cacheStore();

  try {
    const cached = await store.get(key, { type: 'arrayBuffer' });
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Otto-TTS': 'cache',
          'X-Otto-Pronunciation': PRONUNCIATION_VERSION,
        },
      });
    }
  } catch (error) {
    console.warn('otto-tts cache read failed', error);
  }

  try {
    const response = await fetch(OPENAI_SPEECH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
        input: text,
        instructions: speechInstructions(mode, kind),
        response_format: 'mp3',
        speed,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      const diagnostic = providerDiagnostic(response.status, detail);
      console.error('otto-tts provider error', diagnostic.providerStatus, diagnostic.providerCode, diagnostic.providerType);
      return json({ error: 'Neural German voice is temporarily unavailable.', ...diagnostic }, 502);
    }

    const audio = await response.arrayBuffer();
    try {
      await store.set(key, audio);
    } catch (error) {
      console.warn('otto-tts cache write failed', error);
    }

    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Otto-TTS': 'generated',
        'X-Otto-Pronunciation': PRONUNCIATION_VERSION,
      },
    });
  } catch (error) {
    console.error('otto-tts network error', error?.name, error?.message);
    return json({ error: 'Neural German voice is temporarily unavailable.', providerCode: 'network_error' }, 502);
  }
};

export const config = {
  path: '/api/otto-tts',
  method: 'POST',
  rateLimit: {
    windowLimit: 40,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
