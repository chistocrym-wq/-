import { getStore } from '@netlify/blobs';

const STORE = 'otto-start-client-errors-v1';
const MAX_LOGS = 30;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function safeDetails(value) {
  if (!value || typeof value !== 'object') return null;
  const out = {};
  for (const key of ['driftMs', 'mutations', 'elapsedMs', 'count']) {
    if (Number.isFinite(Number(value[key]))) out[key] = Number(value[key]);
  }
  return Object.keys(out).length ? out : null;
}

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  try {
    const store = getStore(STORE, { consistency: 'strong' });
    const listed = await store.list({ prefix: 'logs/' });
    const blobs = Array.isArray(listed?.blobs) ? listed.blobs : [];
    const selected = blobs.slice(-MAX_LOGS).reverse();
    const logs = [];
    for (const item of selected) {
      const key = item.key || item.name;
      if (!key) continue;
      const value = await store.get(key, { type: 'json' });
      if (!value) continue;
      logs.push({
        createdAt: String(value.createdAt || ''),
        kind: String(value.kind || '').slice(0, 80),
        message: String(value.message || '').slice(0, 300),
        target: String(value.target || '').slice(0, 220),
        screen: String(value.screen || '').slice(0, 160),
        details: safeDetails(value.details),
      });
    }
    return json({ count: logs.length, logs });
  } catch (error) {
    console.error('otto-start-client-log-summary GET', error);
    return json({ error: 'summary read failed' }, 500);
  }
};

export const config = {
  path: '/api/otto-start-client-log-summary',
  rateLimit: {
    windowLimit: 30,
    windowSize: 3600,
    aggregateBy: ['ip', 'domain'],
  },
};
