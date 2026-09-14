import { createHash } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';

const MODEL = 'gemini-3.1-flash-tts-preview';
const VOICE = 'Kore';
const STORE = 'otto-tts-cache-de-v6';
const PRONUNCIATION_VERSION = 'de-DE-hochdeutsch-v6';
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

function isGermanLetter(text) {
  return /^[A-ZÄÖÜẞß]$/iu.test(String(text || '').trim());
}

const LETTER_NAMES = {
  A: 'A', B: 'Be', C: 'Ce', D: 'De', E: 'E', F: 'Ef', G: 'Ge', H: 'Ha', I: 'I',
  J: 'Jot', K: 'Ka', L: 'El', M: 'Em', N: 'En', O: 'O', P: 'Pe', Q: 'Ku', R: 'Er',
  S: 'Es', T: 'Te', U: 'U', V: 'Vau', W: 'Weh', X: 'Iks', Y: 'Ypsilon', Z: 'Zett',
  'Ä': 'Ä', 'Ö': 'Ö', 'Ü': 'Ü', 'ẞ': 'Eszett', 'ß': 'Eszett',
};

function spokenText(text, kind) {
  if (kind !== 'letter') return text;
  return LETTER_NAMES[String(text || '').trim()] || text;
}

function ttsPrompt(text, mode, kind) {
  const spoken = spokenText(text, kind);
  const pace = mode === 'slow'
    ? 'Sprich etwas langsamer als normales Gesprächstempo, sehr klar für einen absoluten Anfänger, aber natürlich. Zerlege Wörter nicht künstlich in Silben oder Buchstaben.'
    : 'Sprich ruhig, natürlich und deutlich.';
  const target = kind === 'letter'
    ? `Sprich ausschließlich den deutschen Buchstabennamen „${spoken}“. Keine Erklärung, kein Zusatz.`
    : `Sprich ausschließlich diesen deutschen Text und nichts zusätzlich: „${spoken}“`;
  return [
    'Deutsch (Deutschland). Standarddeutsch/Hochdeutsch. Aussprache wie bei einer muttersprachlichen Deutschlehrkraft aus Deutschland.',
    'Kein englischer oder russischer Akzent.',
    'Achte auf natürliche deutsche Vokallängen und Wortakzente.',
    'Wichtige Laute: ich-Laut [ç] in ich/mich/Milch; ach-Laut [x] nach a/o/u/au; sch [ʃ]; z [ts]; w [v]; j [j]; ei [aɪ̯]; ie [iː]; eu/äu [ɔʏ̯]; sp/st am Wortanfang [ʃp]/[ʃt]; ä, ö, ü; ß als stimmloses s; deutsches r.',
    'Endungen -e und -er natürlich reduzieren, aber nicht verschlucken.',
    pace,
    target,
  ].join(' ');
}

function pcmToWav(pcm, sampleRate = SAMPLE_RATE) {
  const data = Buffer.isBuffer(pcm) ? pcm : Buffer.from(pcm);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function isWav(buffer) {
  return buffer?.length > 44 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE';
}

async function synthesizeGerman(apiKey, text, mode, kind) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: ttsPrompt(text, mode, kind) }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: VOICE },
          },
        },
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    let code = '';
    try { code = String(JSON.parse(raw)?.error?.status || JSON.parse(raw)?.error?.code || ''); } catch {}
    console.error('otto-tts Gemini error', response.status, code);
    return { ok: false, status: response.status, code: code || 'gemini_tts_error' };
  }

  let payload;
  try { payload = JSON.parse(raw); }
  catch {
    console.error('otto-tts invalid JSON payload');
    return { ok: false, status: 502, code: 'invalid_json' };
  }

  const part = payload?.candidates?.[0]?.content?.parts?.find((item) => item?.inlineData?.data);
  const encoded = String(part?.inlineData?.data || '');
  const mime = String(part?.inlineData?.mimeType || part?.inlineData?.mime_type || '').toLowerCase();
  if (!encoded) {
    console.error('otto-tts missing audio data', payload?.candidates?.[0]?.finishReason || '');
    return { ok: false, status: 502, code: 'missing_audio' };
  }

  const decoded = Buffer.from(encoded, 'base64');
  if (decoded.length < 500) {
    console.error('otto-tts audio too small', decoded.length, mime);
    return { ok: false, status: 502, code: 'audio_too_small' };
  }

  const wav = isWav(decoded) ? decoded : pcmToWav(decoded, SAMPLE_RATE);
  if (!isWav(wav)) {
    console.error('otto-tts WAV validation failed', mime, decoded.length);
    return { ok: false, status: 502, code: 'invalid_audio' };
  }
  return { ok: true, audio: wav };
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
  if (!body) return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });

  const apiKey = Netlify.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'German voice is not configured.', providerCode: 'missing_gemini_api_key' }, 503);

  const text = String(body.text || '').trim();
  const mode = body.mode === 'slow' ? 'slow' : 'normal';
  const kind = body.kind === 'letter' || isGermanLetter(text) ? 'letter' : 'text';
  if (!text) return json({ error: 'Text is required.' }, 400);
  if (text.length > MAX_TEXT_LENGTH) return json({ error: 'Text is too long.' }, 413);

  const fingerprint = JSON.stringify({ pronunciationVersion: PRONUNCIATION_VERSION, model: MODEL, voice: VOICE, kind, mode, text });
  const key = createHash('sha256').update(fingerprint).digest('hex');
  const store = cacheStore();

  try {
    const cached = await store.get(key, { type: 'arrayBuffer' });
    if (cached) {
      const audio = Buffer.from(cached);
      if (isWav(audio)) {
        return new Response(audio, {
          headers: {
            'Content-Type': 'audio/wav',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Otto-TTS': 'cache',
            'X-Otto-Pronunciation': PRONUNCIATION_VERSION,
          },
        });
      }
      console.warn('otto-tts ignored invalid cached payload');
    }
  } catch (error) {
    console.warn('otto-tts cache read failed', error?.message || error);
  }

  let result;
  try {
    result = await synthesizeGerman(apiKey, text, mode, kind);
  } catch (error) {
    console.error('otto-tts network error', error?.name, error?.message);
    return json({ error: 'German voice is temporarily unavailable.', providerCode: 'network_error' }, 502);
  }
  if (!result.ok) return json({ error: 'German voice is temporarily unavailable.', providerCode: result.code, providerStatus: result.status }, 502);

  const audio = result.audio;
  try { await store.set(key, audio); }
  catch (error) { console.warn('otto-tts cache write failed', error?.message || error); }

  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Otto-TTS': 'generated',
      'X-Otto-Pronunciation': PRONUNCIATION_VERSION,
    },
  });
};

export const config = {
  path: '/api/otto-tts',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};