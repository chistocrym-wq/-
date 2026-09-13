const MAX_AUDIO_BASE64 = 3_000_000;
const MODEL = 'gemini-3.8-flash';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function normalizeMimeType(value) {
  const mime = String(value || 'audio/webm').toLowerCase().split(';')[0].trim();
  return mime.startsWith('audio/') ? mime : 'audio/webm';
}

function stripFences(value) {
  return String(value || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });

  const apiKey = Netlify.env.get('GEMINI_API_KEY');
  const baseUrl = (Netlify.env.get('GOOGLE_GEMINI_BASE_URL') || '').replace(/\/$/, '');
  if (!apiKey || !baseUrl) {
    return json({ error: 'Проверка произношения сейчас недоступна.', code: 'missing_ai' }, 503);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const audioBase64 = String(body.audioBase64 || '');
    const mimeType = normalizeMimeType(body.mimeType);
    const expected = String(body.expected || '').trim().slice(0, 240);
    const hints = Array.isArray(body.hints) ? body.hints.map(String).filter(Boolean).slice(0, 8) : [];

    if (!audioBase64) return json({ error: 'Аудиозапись не получена.', code: 'missing_audio' }, 400);
    if (audioBase64.length > MAX_AUDIO_BASE64) return json({ error: 'Запись слишком длинная. Скажите фразу короче.', code: 'audio_too_large' }, 413);
    if (!expected) return json({ error: 'Не указана фраза для проверки.', code: 'missing_expected' }, 400);

    const prompt = `Ты — доброжелательный преподаватель немецкого A1 в Otto Start.\n\nПрослушай аудио ученика и проверь именно произношение ожидаемого слова или фразы. Сначала распознай фактически сказанное по-немецки. Не ставь баллы и не показывай проценты. Не унижай за акцент.\n\nОжидается: ${expected}\n${hints.length ? `Полезные правила чтения: ${hints.join(' | ')}` : ''}\n\nВерни status:\n- good — сказанное достаточно похоже и понятно;\n- retry — заметно отличается, пропущено слово или есть конкретный звук, который стоит повторить;\n- slower — в целом похоже, но речь слишком быстрая/смазанная и лучше повторить медленнее.\n\nfeedbackRu — одно короткое понятное сообщение без числовой оценки. Если возможно, укажи один конкретный звук или сочетание (например sch, ch, ei, ie, ß), а не общую критику. focus — только короткий фрагмент для внимания, либо пустая строка.`;

    const response = await fetch(`${baseUrl}/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { text: prompt },
          { inlineData: { mimeType, data: audioBase64 } },
        ] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            required: ['transcript', 'status', 'feedbackRu', 'focus'],
            properties: {
              transcript: { type: 'STRING' },
              status: { type: 'STRING', enum: ['good', 'retry', 'slower'] },
              feedbackRu: { type: 'STRING' },
              focus: { type: 'STRING' },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('otto-start-pronunciation provider error', response.status, detail.slice(0, 1000));
      if (response.status === 429) return json({ error: 'Проверка речи сейчас занята. Попробуйте ещё раз через несколько секунд.', code: 'ai_limit' }, 429);
      return json({ error: 'Отто не смог разобрать запись. Попробуйте ещё раз.', code: 'ai_error' }, 502);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim();
    if (!text) throw new Error('Empty pronunciation response');
    const parsed = JSON.parse(stripFences(text));
    const status = ['good', 'retry', 'slower'].includes(parsed.status) ? parsed.status : 'retry';

    return json({
      transcript: String(parsed.transcript || '').trim(),
      status,
      feedbackRu: String(parsed.feedbackRu || '').trim() || (status === 'good' ? 'Отлично, звучит похоже.' : 'Попробуйте ещё раз чуть медленнее.'),
      focus: String(parsed.focus || '').trim().slice(0, 40),
    });
  } catch (error) {
    console.error('otto-start-pronunciation error', error);
    return json({ error: 'Не удалось проверить запись. Попробуйте ещё раз.', code: 'server_error' }, 500);
  }
};

export const config = {
  path: '/api/otto-start-pronunciation',
  method: ['POST'],
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
