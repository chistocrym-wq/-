import { getDeployStore, getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

const STORE = 'otto-start-support-v1';
const MAX_MESSAGE = 3000;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function store() {
  return Netlify.context?.deploy?.context === 'production'
    ? getStore(STORE)
    : getDeployStore(STORE);
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });

  try {
    const body = await req.json().catch(() => ({}));
    const category = String(body.category || 'Другое').trim().slice(0, 80);
    const message = String(body.message || '').trim();
    const page = String(body.page || '').trim().slice(0, 300);
    const device = String(body.device || '').trim().slice(0, 700);
    const lesson = Number.isFinite(Number(body.lesson)) ? Number(body.lesson) : null;

    if (!message) return json({ error: 'Напишите вопрос или описание проблемы.' }, 400);
    if (message.length > MAX_MESSAGE) return json({ error: 'Сообщение слишком длинное.' }, 413);

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await store().setJSON(`${createdAt.slice(0, 10)}/${id}`, {
      id,
      createdAt,
      category,
      message,
      page,
      device,
      lesson,
      source: 'otto-start',
    });

    return json({ ok: true, ticket: id.slice(0, 8).toUpperCase() });
  } catch (error) {
    console.error('otto-start-support error', error);
    return json({ error: 'Не удалось отправить сообщение. Скопируйте текст и попробуйте позже.' }, 500);
  }
};

export const config = {
  path: '/api/otto-start-support',
  method: ['POST'],
  rateLimit: {
    windowLimit: 8,
    windowSize: 3600,
    aggregateBy: ['ip', 'domain'],
  },
};
