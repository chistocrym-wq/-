import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4173', '--directory', 'public'], { stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const r = await fetch('http://127.0.0.1:4173/');
      if (r.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('Static server did not start');
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // UI smoke only. Live neural audio is verified separately against production.
  await page.route('**/api/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('[data-action="start-unit"]', { timeout: 8000 });
  const homeText = await page.locator('body').innerText();
  if (!homeText.includes('немецкий с абсолютного нуля') && !homeText.includes('Немецкий с нуля')) throw new Error('Absolute-beginner home copy missing');

  // Lesson 1 must really contain one easy word only.
  await page.click('[data-action="start-unit"]');
  await page.waitForSelector('[data-action="start-quiz"]');
  const lessonText = await page.locator('body').innerText();
  if (!lessonText.includes('Hallo') || !lessonText.includes('привет')) throw new Error('First lesson must teach Hallo = привет');
  for (const tooEarly of ['Tschüss', 'Entschuldigung', 'Familie', 'Bahnhof']) {
    if (lessonText.includes(tooEarly)) throw new Error(`First lesson exposes ${tooEarly} too early`);
  }

  // Every answer to “what does it mean?” must be Russian.
  await page.click('[data-action="start-quiz"]');
  await page.waitForSelector('[data-action="answer"]');
  for (let safety = 0; safety < 12; safety += 1) {
    if (await page.locator('[data-action="complete-unit"]').count()) break;
    const options = page.locator('[data-action="answer"]');
    const count = await options.count();
    if (!count) throw new Error('Quiz has no answer options');
    const labels = (await options.allInnerTexts()).map(x => x.trim());
    const german = ['Hallo','Tschüss','danke','bitte','ja','nein','ich','du'];
    if (labels.some((label) => german.includes(label))) throw new Error(`Quiz contains German answer option: ${labels.join(' | ')}`);
    const promptBlock = await page.locator('.v12-quiz-card').innerText();
    if (!promptBlock.includes('по-русски') && !promptBlock.includes('русском языке')) throw new Error('Quiz does not explicitly ask for Russian meaning');
    await options.first().click();
    await page.waitForSelector('[data-action="quiz-next"]');
    const feedback = await page.locator('.v12-feedback').innerText();
    if (!feedback.includes('Hallo') || !feedback.includes('привет')) throw new Error(`Feedback must show German + Russian: ${feedback}`);
    await page.click('[data-action="quiz-next"]');
    await page.waitForTimeout(40);
  }
  await page.waitForSelector('[data-action="complete-unit"]', { timeout: 6000 });
  await page.click('[data-action="complete-unit"]');
  await page.waitForSelector('[data-action="nav-dictionary"]');

  // The next step must remain simple: ja / nein.
  const afterFirst = await page.locator('body').innerText();
  if (!afterFirst.includes('Да и нет')) throw new Error('Second beginner step is not “Да и нет”');

  // Exact former freeze area: open dictionary and return 40 times.
  for (let i = 0; i < 40; i += 1) {
    const t0 = Date.now();
    await page.click('[data-action="nav-dictionary"]');
    await page.waitForSelector('.v12-dict-toolbar', { timeout: 1500 });
    const cards = await page.locator('.v12-dict-card').count();
    if (cards > 12) throw new Error(`Dictionary rendered too many cards: ${cards}`);
    const dictText = await page.locator('body').innerText();
    if (!dictText.includes('Hallo') || !dictText.includes('привет')) throw new Error('Dictionary lost the learned German/Russian pair');
    await page.click('[data-action="nav-home"]');
    await page.waitForSelector('[data-action="start-unit"]', { timeout: 1500 });
    const elapsed = Date.now() - t0;
    if (elapsed > 2500) throw new Error(`Dictionary roundtrip too slow: ${elapsed}ms on iteration ${i + 1}`);
  }

  for (const action of ['nav-route', 'nav-profile', 'nav-more', 'nav-home']) {
    await page.click(`[data-action="${action}"]`);
    await page.waitForTimeout(80);
  }

  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Otto Start V14 browser smoke passed: absolute-zero lesson, Russian-only answers, 40 dictionary roundtrips, navigation, no JS errors.');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
