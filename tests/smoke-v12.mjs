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
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('[data-action="start-unit"]', { timeout: 8000 });
  const homeText = await page.locator('body').innerText();
  if (!homeText.includes('Немецкий с нуля')) throw new Error('Beginner home copy missing');

  await page.click('[data-action="start-unit"]');
  await page.waitForSelector('[data-action="start-quiz"]');
  const lessonText = await page.locator('body').innerText();
  for (const expected of ['Hallo', 'привет', 'Tschüss', 'пока']) {
    if (!lessonText.includes(expected)) throw new Error(`First lesson missing ${expected}`);
  }
  if (lessonText.includes('Entschuldigung')) throw new Error('First lesson exposes advanced vocabulary too early');

  await page.click('[data-action="start-quiz"]');
  await page.waitForSelector('[data-action="answer"]');
  for (let safety = 0; safety < 12; safety += 1) {
    const resultVisible = await page.locator('[data-action="complete-unit"]').count();
    if (resultVisible) break;
    const options = page.locator('[data-action="answer"]');
    const count = await options.count();
    if (!count) throw new Error('Quiz has no answer options');
    const labels = await options.allInnerTexts();
    const forbidden = ['Hallo', 'Tschüss', 'danke', 'bitte', 'ja', 'nein'];
    if (labels.some((label) => forbidden.includes(label.trim()))) {
      throw new Error(`Meaning/listening quiz contains German answer option: ${labels.join(' | ')}`);
    }
    await options.first().click();
    await page.waitForSelector('[data-action="quiz-next"]');
    const feedback = await page.locator('.v12-feedback').innerText();
    if (!feedback.includes('Hallo') && !feedback.includes('Tschüss')) {
      throw new Error(`Feedback does not expose German + Russian meaning: ${feedback}`);
    }
    await page.click('[data-action="quiz-next"]');
    await page.waitForTimeout(40);
  }
  await page.waitForSelector('[data-action="complete-unit"]', { timeout: 6000 });
  await page.click('[data-action="complete-unit"]');
  await page.waitForSelector('[data-action="nav-dictionary"]');

  // Repeatedly open the dictionary and return home. This is the exact area that froze before.
  for (let i = 0; i < 25; i += 1) {
    const t0 = Date.now();
    await page.click('[data-action="nav-dictionary"]');
    await page.waitForSelector('.v12-dict-toolbar', { timeout: 1500 });
    const cards = await page.locator('.v12-dict-card').count();
    if (cards > 20) throw new Error(`Dictionary rendered too many cards: ${cards}`);
    await page.click('[data-action="nav-home"]');
    await page.waitForSelector('[data-action="start-unit"]', { timeout: 1500 });
    const elapsed = Date.now() - t0;
    if (elapsed > 2500) throw new Error(`Dictionary roundtrip too slow: ${elapsed}ms on iteration ${i + 1}`);
  }

  // Route/profile/more navigation must also stay responsive.
  for (const action of ['nav-route', 'nav-profile', 'nav-more', 'nav-home']) {
    await page.click(`[data-action="${action}"]`);
    await page.waitForTimeout(80);
  }

  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Otto Start v12 browser smoke passed: lesson, Russian quiz answers, 25 dictionary roundtrips, navigation, no JS errors.');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
