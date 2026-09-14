import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4173', '--directory', 'public'], { stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function silentWav(seconds = 1, sampleRate = 8000) {
  const samples = Math.floor(seconds * sampleRate);
  const dataSize = samples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataSize, 40);
  return buf;
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try { const r = await fetch('http://127.0.0.1:4173/'); if (r.ok) return; } catch {}
    await sleep(250);
  }
  throw new Error('Static server did not start');
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=user-gesture-required'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'] });
  const page = await context.newPage();
  let pronunciationPosts = 0;
  let lastAudioBytes = 0;

  await page.route('**/api/otto-tts**', async (route) => {
    const body = silentWav(1.2);
    lastAudioBytes = body.length;
    await route.fulfill({ status: 200, contentType: 'audio/wav', body });
  });
  await page.route('**/api/otto-start-pronunciation', async (route) => {
    const payload = JSON.parse(route.request().postData() || '{}');
    if (!payload.audioBase64 || payload.audioBase64.length < 100) throw new Error('Pronunciation POST did not contain recorded audio');
    if (!payload.expected) throw new Error('Pronunciation POST missing expected text');
    pronunciationPosts += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status:'good', transcript:payload.expected, feedbackRu:'Запись получена и проверена.', focus:'' }) });
  });
  await page.route('**/api/otto-start-client-log', async (route) => route.fulfill({ status: 200, contentType:'application/json', body:'{"ok":true}' }));
  await page.route('**/api/otto-start-support', async (route) => route.fulfill({ status: 200, contentType:'application/json', body:'{"ok":true}' }));

  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('[data-action="start-unit"]', { timeout: 8000 });
  const homeText = await page.locator('body').innerText();
  if (!homeText.includes('готовности открыть Otto A1')) throw new Error('A1 readiness goal disappeared from home');

  await page.click('[data-action="start-unit"]');
  await page.waitForSelector('[data-action="start-quiz"]');
  const lessonText = await page.locator('body').innerText();
  if (!lessonText.includes('Hallo') || !lessonText.includes('привет')) throw new Error('First lesson must teach Hallo = привет');
  for (const tooEarly of ['Entschuldigung','Familie','Bahnhof']) if (lessonText.includes(tooEarly)) throw new Error(`First lesson exposes ${tooEarly} too early`);

  // Real media-element path: click must start playback without waiting for a fetch promise.
  await page.click('[data-action="audio"]');
  await page.waitForFunction(() => {
    const s = window.OttoSpeechV15?.status?.();
    return s?.active && s.currentTime > 0.05 && !s.paused;
  }, { timeout: 4000 });
  if (lastAudioBytes < 1000) throw new Error('Audio fixture was not delivered');

  // Real browser recording flow with Chromium fake microphone.
  await page.click('[data-action="pronounce"]');
  await page.waitForSelector('[data-record]');
  await page.click('[data-record]');
  await page.waitForSelector('[data-stop]', { timeout: 5000 });
  await page.waitForTimeout(700);
  await page.click('[data-stop]');
  await page.waitForFunction(() => document.querySelector('[data-result]')?.textContent?.includes('Хорошо'), { timeout: 8000 });
  if (pronunciationPosts !== 1) throw new Error(`Expected one pronunciation POST, got ${pronunciationPosts}`);
  await page.click('[data-close]');

  await page.click('[data-action="start-quiz"]');
  await page.waitForSelector('[data-action="answer"]');
  for (let safety = 0; safety < 12; safety += 1) {
    if (await page.locator('[data-action="complete-unit"]').count()) break;
    const options = page.locator('[data-action="answer"]');
    const count = await options.count();
    if (!count) throw new Error('Quiz has no answer options');
    const labels = (await options.allInnerTexts()).map((x) => x.trim());
    const german = ['Hallo','Tschüss','danke','bitte','ja','nein','ich','du'];
    if (labels.some((label) => german.includes(label))) throw new Error(`Meaning quiz contains German answer option: ${labels.join(' | ')}`);
    const prompt = await page.locator('.v12-quiz-card').innerText();
    if (!prompt.includes('русск')) throw new Error('Meaning quiz does not ask for Russian meaning');
    await options.first().click();
    await page.waitForSelector('[data-action="quiz-next"]');
    await page.click('[data-action="quiz-next"]');
    await page.waitForTimeout(30);
  }
  await page.waitForSelector('[data-action="complete-unit"]', { timeout: 6000 });
  await page.click('[data-action="complete-unit"]');
  const afterFirst = await page.locator('body').innerText();
  if (!afterFirst.includes('Да и нет')) throw new Error('Second beginner step is not “Да и нет”');

  // Former freeze area.
  for (let i = 0; i < 40; i += 1) {
    const t0 = Date.now();
    await page.click('[data-action="nav-dictionary"]');
    await page.waitForSelector('.v12-dict-toolbar', { timeout: 1500 });
    const cards = await page.locator('.v12-dict-card').count();
    if (cards > 12) throw new Error(`Dictionary rendered too many cards: ${cards}`);
    const dictText = await page.locator('body').innerText();
    if (!dictText.includes('Hallo') || !dictText.includes('привет')) throw new Error('Dictionary lost German/Russian pair');
    await page.click('[data-action="nav-home"]');
    await page.waitForSelector('[data-action="start-unit"]', { timeout: 1500 });
    if (Date.now() - t0 > 2500) throw new Error(`Dictionary roundtrip too slow on iteration ${i + 1}`);
  }

  // Reading rules and alphabet must be permanently reachable from More.
  await page.click('[data-action="nav-more"]');
  await page.click('[data-action="reading-guide"]');
  const reading = await page.locator('body').innerText();
  for (const marker of ['ei','ie','sch','ch после i/e','sp в начале','st в начале','eu / äu','ß','ä / ö / ü']) if (!reading.includes(marker)) throw new Error(`Reading guide missing ${marker}`);
  await page.click('[data-action="nav-more"]');
  await page.click('[data-action="alphabet-guide"]');
  const alphabet = await page.locator('body').innerText();
  for (const marker of ['A','J','V','W','Y','Z','Ä','Ö','Ü','ß']) if (!alphabet.includes(marker)) throw new Error(`Alphabet guide missing ${marker}`);

  await page.click('[data-action="nav-route"]');
  const routeText = await page.locator('body').innerText();
  if (!routeText.includes('Готовность к тренажёру A1') || !routeText.includes('итоговая проверка')) throw new Error('Final A1 readiness section missing');

  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Otto Start V15 smoke passed: direct audio playback, microphone recording POST, beginner progression, Russian answers, 40 dictionary roundtrips, alphabet, reading rules, A1 readiness route.');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
