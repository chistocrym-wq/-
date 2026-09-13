import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const MODEL = 'gpt-4o-mini-tts-2025-12-15';
const VOICE = 'marin';
const STORE = 'otto-tts-cache-de-v2';
const PRONUNCIATION_VERSION = 'de-DE-hochdeutsch-v2';
const MAX_TEXT_LENGTH = 420;

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
    ? 'Sprich nur etwas langsamer als normales Hochdeutsch. Dehne keine Laute künstlich und zerlege Wörter nicht unnatürlich.'
    : 'Sprich in ruhigem, natürlichem Tempo.';

  const letterRule = kind === 'letter'
    ? 'Der Text ist ein einzelner Buchstabe. Sprich ausschließlich den DEUTSCHEN Buchstabennamen, niemals den englischen. Beispiele zur Aussprache: J = Jot, V = Vau, W = Weh, Y = Ypsilon, Z = Zett, ß = Eszett. Füge keine Erklärung hinzu.'
    : 'Lies jedes Wort als deutsches Wort im Kontext der deutschen Standardsprache. Auch internationale Wörter und Lehnwörter müssen deutsch ausgesprochen werden, z. B. Ticket, Bus, Sport, Euro, Termin und Café — nicht englisch.';

  return [
    'Sprich ausschließlich den gelieferten Text.',
    'Sprache und Aussprache: Deutsch (Deutschland), Standarddeutsch/Hochdeutsch, de-DE.',
    'Kein englischer Akzent, keine englischen Buchstabennamen und keine englische Aussprache einzelner Wörter.',
    'Sprich wie eine muttersprachliche, ruhige Deutschlehrkraft aus Deutschland.',
    'Artikuliere natürlich und korrekt: ich-Laut [ç] in ich/mich/Milch, sch [ʃ], z [ts], w [v], j [j], ei [aɪ̯], ie [iː], eu/äu [ɔʏ̯], sp/st am Wortanfang [ʃp]/[ʃt], sowie ä/ö/ü und deutsches r.',
    'Bei Endungen -e und -er keine russische oder englische Überartikulation: schwaches deutsches Schwa bzw. reduzierte Endung verwenden.',
    letterRule,
    pace,
  ].join(' ');
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });

  const apiKey = Netlify.env.get('OPENAI_API_KEY');
  const baseUrl = (Netlify.env.get('OPENAI_BASE_URL') || 'https://api.openai.com').replace(/\/$/, '');
  if (!apiKey) return json({ fallback: true, error: 'Neural voice is not configured.' }, 503);

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || '').trim();
  const mode = body.mode === 'slow' ? 'slow' : 'normal';
  const kind = body.kind === 'letter' || isGermanLetter(text) ? 'letter' : 'text';

  if (!text) return json({ error: 'Text is required.' }, 400);
  if (text.length > MAX_TEXT_LENGTH) return json({ error: 'Text is too long.' }, 413);

  const speed = mode === 'slow' ? 0.92 : 1.0;
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
    const response = await fetch(`${baseUrl}/v1/audio/speech`, {
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
      console.error('otto-tts provider error', response.status, detail.slice(0, 500));
      return json({ fallback: true, error: 'Neural voice is temporarily unavailable.' }, 502);
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
    console.error('otto-tts error', error);
    return json({ fallback: true, error: 'Neural voice is temporarily unavailable.' }, 502);
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
