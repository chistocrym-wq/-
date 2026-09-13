import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

const STORE = 'otto-start-client-errors-v1';
const MAX_LOGS = 30;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function clean(value, max = 500) {
  return String(value ?? '').slice(0, max);
}

export default async (req) => {
  const store = getStore(STORE);

  if (req.method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      const createdAt = new Date().toISOString();
      const id = randomUUID();
      const record = {
        id,
        createdAt,
        kind: clean(body.kind, 80),
        message: clean(body.message, 1200),
        stack: clean(body.stack, 3000),
        target: clean(body.target, 500),
        screen: clean(body.screen, 300),
        href: clean(body.href, 500),
        userAgent: clean(body.userAgent, 700),
        session: clean(body.session, 100),
        details: body.details && typeof body.details === 'object' ? body.details : null,
      };
      await store.setJSON(`logs/${createdAt}/${id}`, record);
      return json({ ok: true });
    } catch (error) {
      console.error('otto-start-client-log POST', error);
      return json({ error: 'log write failed' }, 500);
    }
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const expected = Netlify.env.get('OTTO_LOG_READ_TOKEN') || '';
    if (!expected || token !== expected) return json({ error: 'Unauthorized' }, 401);
    try {
      const listed = await store.list({ prefix: 'logs/' });
      const blobs = Array.isArray(listed?.blobs) ? listed.blobs : [];
      const selected = blobs.slice(-MAX_LOGS).reverse();
      const logs = [];
      for (const item of selected) {
        const key = item.key || item.name;
        if (!key) continue;
        const value = await store.get(key, { type: 'json' });
        if (value) logs.push(value);
      }
      return json({ logs });
    } catch (error) {
      console.error('otto-start-client-log GET', error);
      return json({ error: 'log read failed' }, 500);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config = {
  path: '/api/otto-start-client-log',
  rateLimit: {
    windowLimit: 120,
    windowSize: 3600,
    aggregateBy: ['ip', 'domain'],
  },
};
