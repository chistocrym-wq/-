import { getDeployStore, getStore } from '@netlify/blobs';
import { randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const STORE = 'otto-start-accounts-v1';
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_PROGRESS_BYTES = 450_000;

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

function env(name) {
  try { return Netlify.env.get(name) || ''; } catch { return ''; }
}

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function normalize(channel, raw) {
  const value = String(raw || '').trim();
  if (channel === 'email') {
    const email = value.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) return null;
    return email;
  }
  if (channel === 'phone') {
    const cleaned = value.replace(/[\s()\-.]/g, '');
    const phone = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return null;
    return phone;
  }
  return null;
}

function accountKey(channel, login) { return `account/${sha(`${channel}:${login}`)}`; }
function otpKey(channel, login, purpose) { return `otp/${sha(`${channel}:${login}:${purpose}`)}`; }
function sessionKey(token) { return `session/${sha(token)}`; }
function progressKey(userId) { return `progress/${userId}`; }

async function getJSON(key) {
  try { return await store().get(key, { type: 'json' }); } catch { return null; }
}

async function derive(secret, salt) {
  const key = await scryptAsync(String(secret), salt, 64, { N: 16384, r: 8, p: 1 });
  return Buffer.from(key).toString('hex');
}

async function verifyDerived(secret, salt, expectedHex) {
  try {
    const actual = Buffer.from(await derive(secret, salt), 'hex');
    const expected = Buffer.from(String(expectedHex || ''), 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

function providerStatus() {
  return {
    email: Boolean(env('RESEND_API_KEY') && env('OTTO_AUTH_FROM_EMAIL')),
    phone: Boolean(env('TWILIO_ACCOUNT_SID') && env('TWILIO_AUTH_TOKEN') && env('TWILIO_FROM_NUMBER')),
  };
}

async function sendEmail(to, code) {
  const key = env('RESEND_API_KEY');
  const from = env('OTTO_AUTH_FROM_EMAIL');
  if (!key || !from) throw new Error('email_delivery_unconfigured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Код подтверждения Otto Start',
      text: `Ваш код Otto Start: ${code}. Код действует 10 минут. Если вы не запрашивали код, просто проигнорируйте письмо.`,
    }),
  });
  if (!response.ok) throw new Error(`email_delivery_${response.status}`);
}

async function sendSms(to, code) {
  const sid = env('TWILIO_ACCOUNT_SID');
  const token = env('TWILIO_AUTH_TOKEN');
  const from = env('TWILIO_FROM_NUMBER');
  if (!sid || !token || !from) throw new Error('sms_delivery_unconfigured');
  const form = new URLSearchParams({ To: to, From: from, Body: `Otto Start: код ${code}. Действует 10 минут.` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  if (!response.ok) throw new Error(`sms_delivery_${response.status}`);
}

async function issueSession(account) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await store().setJSON(sessionKey(token), { userId: account.userId, accountKey: account.key, expiresAt });
  return { token, expiresAt };
}

async function requireSession(req) {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  const session = await getJSON(sessionKey(token));
  if (!session || Number(session.expiresAt || 0) < Date.now()) {
    if (session) await store().delete(sessionKey(token)).catch(() => {});
    return null;
  }
  const account = await getJSON(session.accountKey);
  if (!account) return null;
  return { token, session, account };
}

async function verifyOtp(channel, login, purpose, code) {
  const key = otpKey(channel, login, purpose);
  const otp = await getJSON(key);
  if (!otp || Number(otp.expiresAt || 0) < Date.now()) return { ok: false, error: 'Код истёк. Запросите новый.' };
  if (Number(otp.attempts || 0) >= 6) return { ok: false, error: 'Слишком много попыток. Запросите новый код.' };
  const good = await verifyDerived(String(code || '').trim(), otp.salt, otp.hash);
  if (!good) {
    otp.attempts = Number(otp.attempts || 0) + 1;
    await store().setJSON(key, otp);
    return { ok: false, error: 'Неверный код.' };
  }
  await store().delete(key).catch(() => {});
  return { ok: true };
}

async function requestCode(body) {
  const channel = body.channel === 'phone' ? 'phone' : body.channel === 'email' ? 'email' : '';
  const purpose = body.purpose === 'reset' ? 'reset' : 'register';
  const login = normalize(channel, body.login);
  if (!login) return json({ error: channel === 'phone' ? 'Введите телефон в международном формате, например +49123456789.' : 'Введите корректный email.' }, 400);

  const providers = providerStatus();
  if (!providers[channel]) {
    return json({
      error: channel === 'phone'
        ? 'Отправка SMS-кодов ещё не подключена к этому проекту.'
        : 'Отправка кодов на email ещё не подключена к этому проекту.',
      code: 'delivery_unconfigured',
      providers,
    }, 503);
  }

  const aKey = accountKey(channel, login);
  const account = await getJSON(aKey);
  if (purpose === 'register' && account) return json({ error: 'Аккаунт с таким логином уже существует. Используйте вход.' }, 409);
  if (purpose === 'reset' && !account) {
    return json({ ok: true, message: 'Если такой аккаунт существует, код будет отправлен.' });
  }

  const key = otpKey(channel, login, purpose);
  const previous = await getJSON(key);
  if (previous && Date.now() - Number(previous.sentAt || 0) < OTP_COOLDOWN_MS) {
    return json({ error: 'Подождите минуту перед повторной отправкой кода.' }, 429);
  }

  const code = String(randomInt(100000, 1000000));
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(code, salt);
  const otp = { salt, hash, sentAt: Date.now(), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 };
  await store().setJSON(key, otp);
  try {
    if (channel === 'email') await sendEmail(login, code);
    else await sendSms(login, code);
  } catch (error) {
    await store().delete(key).catch(() => {});
    console.error('Otto auth delivery error', error);
    return json({ error: 'Не удалось отправить код. Попробуйте позже.', code: 'delivery_failed' }, 502);
  }
  return json({ ok: true, message: 'Код отправлен. Он действует 10 минут.' });
}

async function register(body) {
  const channel = body.channel === 'phone' ? 'phone' : body.channel === 'email' ? 'email' : '';
  const login = normalize(channel, body.login);
  const password = String(body.password || '');
  const name = String(body.name || '').trim().slice(0, 80);
  if (!login) return json({ error: 'Проверьте телефон или email.' }, 400);
  if (password.length < 8 || password.length > 200) return json({ error: 'Пароль должен содержать минимум 8 символов.' }, 400);
  const key = accountKey(channel, login);
  if (await getJSON(key)) return json({ error: 'Аккаунт уже существует.' }, 409);
  const otp = await verifyOtp(channel, login, 'register', body.code);
  if (!otp.ok) return json({ error: otp.error }, 400);

  const salt = randomBytes(16).toString('hex');
  const passwordHash = await derive(password, salt);
  const userId = randomUUID();
  const account = {
    key, userId, channel, login, name, salt, passwordHash,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  await store().setJSON(key, account);
  const session = await issueSession(account);
  return json({ ok: true, session, user: { userId, channel, login, name } }, 201);
}

async function login(body) {
  const raw = String(body.login || '').trim();
  const channel = raw.includes('@') ? 'email' : 'phone';
  const normalized = normalize(channel, raw);
  if (!normalized) return json({ error: 'Проверьте телефон или email.' }, 400);
  const key = accountKey(channel, normalized);
  const account = await getJSON(key);
  if (!account || !(await verifyDerived(String(body.password || ''), account.salt, account.passwordHash))) {
    return json({ error: 'Неверный телефон/email или пароль.' }, 401);
  }
  const session = await issueSession(account);
  return json({ ok: true, session, user: { userId: account.userId, channel: account.channel, login: account.login, name: account.name || '' } });
}

async function resetPassword(body) {
  const channel = body.channel === 'phone' ? 'phone' : body.channel === 'email' ? 'email' : '';
  const login = normalize(channel, body.login);
  const password = String(body.password || '');
  if (!login || password.length < 8 || password.length > 200) return json({ error: 'Проверьте данные и новый пароль.' }, 400);
  const key = accountKey(channel, login);
  const account = await getJSON(key);
  if (!account) return json({ error: 'Не удалось восстановить пароль.' }, 400);
  const otp = await verifyOtp(channel, login, 'reset', body.code);
  if (!otp.ok) return json({ error: otp.error }, 400);
  const salt = randomBytes(16).toString('hex');
  account.salt = salt;
  account.passwordHash = await derive(password, salt);
  account.updatedAt = new Date().toISOString();
  await store().setJSON(key, account);
  const session = await issueSession(account);
  return json({ ok: true, session, user: { userId: account.userId, channel, login, name: account.name || '' } });
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');
    if (action === 'status') return json({ ok: true, providers: providerStatus() });
    if (action === 'request-code') return await requestCode(body);
    if (action === 'register') return await register(body);
    if (action === 'login') return await login(body);
    if (action === 'reset') return await resetPassword(body);

    const auth = await requireSession(req);
    if (!auth) return json({ error: 'Сессия истекла. Войдите снова.' }, 401);

    if (action === 'me') {
      const a = auth.account;
      return json({ ok: true, user: { userId: a.userId, channel: a.channel, login: a.login, name: a.name || '' } });
    }
    if (action === 'load-progress') {
      const progress = await getJSON(progressKey(auth.account.userId));
      return json({ ok: true, progress: progress || null });
    }
    if (action === 'save-progress') {
      const payload = body.progress && typeof body.progress === 'object' ? body.progress : null;
      if (!payload) return json({ error: 'Нет данных прогресса.' }, 400);
      const record = { ...payload, savedAt: new Date().toISOString(), userId: auth.account.userId };
      if (Buffer.byteLength(JSON.stringify(record), 'utf8') > MAX_PROGRESS_BYTES) return json({ error: 'Данные прогресса слишком большие.' }, 413);
      await store().setJSON(progressKey(auth.account.userId), record);
      return json({ ok: true, savedAt: record.savedAt });
    }
    if (action === 'logout') {
      await store().delete(sessionKey(auth.token)).catch(() => {});
      return json({ ok: true });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('otto-start-auth error', error);
    return json({ error: 'Сервис аккаунта временно недоступен.' }, 500);
  }
};

export const config = {
  path: '/api/otto-start-auth',
  rateLimit: {
    windowLimit: 40,
    windowSize: 3600,
    aggregateBy: ['ip', 'domain'],
  },
};
