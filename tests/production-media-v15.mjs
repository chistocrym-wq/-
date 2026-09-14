import { chromium } from 'playwright';

const url = process.env.OTTO_START_URL || 'https://otto-start.netlify.app/';
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

  await page.goto(`${url}?media-smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('[data-action="start-unit"]', { timeout: 12000 });
  await page.click('[data-action="start-unit"]');
  await page.waitForSelector('[data-action="audio"]', { timeout: 8000 });

  const responsePromise = page.waitForResponse((r) => r.url().includes('/api/otto-tts?') && r.status() === 200, { timeout: 30000 });
  await page.click('[data-action="audio"]');
  const response = await responsePromise;
  const type = String(response.headers()['content-type'] || '');
  if (!type.includes('audio/mpeg')) throw new Error(`Production TTS content type is ${type}`);

  // Headless Linux may not advance an audible playback clock because it has no real sound device.
  // We still require the browser media element to accept and decode the production MP3.
  await page.waitForFunction(() => {
    const s = window.OttoSpeechV15?.status?.();
    return s?.active && s.readyState >= 2 && s.networkState !== 3;
  }, { timeout: 12000 });

  const status = await page.evaluate(() => window.OttoSpeechV15?.status?.());
  console.log('Production audio status:', JSON.stringify(status));
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Production V15 browser fetched and decoded the German MP3 after a real click. Local browser smoke separately verifies playback time advances.');
} finally {
  if (browser) await browser.close();
}
