import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['-m', 'http.server', '4173', '--directory', 'public'], { stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    args: ['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'] });
  const page = await context.newPage();

  await page.addInitScript(() => {
    class FakeUtterance {
      constructor(text) { this.text = text; this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; }
    }
    const maleGermanVoice = { name:'Microsoft Stefan - German (Germany)', lang:'de-DE', localService:true, default:false };
    const synth = {
      speaking: false,
      cancel() { this.speaking = false; },
      getVoices() { return [maleGermanVoice, { name:'Microsoft Katja - German (Germany)', lang:'de-DE', localService:true, default:true }]; },
      speak(utterance) {
        this.speaking = true;
        window.__ottoTestSpeakCount = (window.__ottoTestSpeakCount || 0) + 1;
        window.__ottoTestLastSpeech = utterance.text;
        window.__ottoTestLastVoice = utterance.voice?.name || '';
        window.__ottoTestLastLang = utterance.voice?.lang || utterance.lang || '';
        utterance.onstart?.();
        setTimeout(() => { this.speaking = false; utterance.onend?.(); }, 80);
      },
    };
    try { Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true }); } catch {}
    try { Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true }); } catch {}
  });

  let pronunciationPosts = 0;
  // Intentionally return 503 here: this proves the app refuses a broken server voice and falls back only to a verified de-DE male voice.
  await page.route('**/api/otto-tts**', async (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"server voice unavailable in local smoke"}' }));
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
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/Failed to load resource: the server responded with a status of 503/i.test(text)) return;
    errors.push(`console: ${text}`);
  });

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('[data-action="start-unit"]', { timeout: 8000 });
  await page.waitForSelector('[data-v16-a1-roadmap]', { timeout: 4000 });
  const homeText = await page.locator('body').innerText();
  for (const marker of ['От нуля — именно к тренажёру A1','Алфавит','Чтение','База A1','Мини‑тест','20 заданий']) {
    if (!homeText.includes(marker)) throw new Error(`Home A1 roadmap missing ${marker}`);
  }

  await page.click('[data-action="start-unit"]');
  await page.waitForSelector('[data-action="start-quiz"]');
  const lessonText = await page.locator('body').innerText();
  if (!lessonText.includes('Hallo') || !lessonText.includes('привет')) throw new Error('First lesson must teach Hallo = привет');
  for (const tooEarly of ['Entschuldigung','Familie','Bahnhof']) if (lessonText.includes(tooEarly)) throw new Error(`First lesson exposes ${tooEarly} too early`);

  await page.click('[data-action="audio"]');
  await page.waitForFunction(() => (window.__ottoTestSpeakCount || 0) >= 1, { timeout: 7000 });
  const spokenInfo = await page.evaluate(() => ({ text:window.__ottoTestLastSpeech || '', voice:window.__ottoTestLastVoice || '', lang:window.__ottoTestLastLang || '' }));
  if (!spokenInfo.text.toLowerCase().includes('hallo')) throw new Error(`German audio did not speak Hallo: ${spokenInfo.text}`);
  if (!/stefan/i.test(spokenInfo.voice)) throw new Error(`Wrong German voice selected: ${spokenInfo.voice}`);
  if (!/^de-DE$/i.test(spokenInfo.lang)) throw new Error(`Wrong language voice selected: ${spokenInfo.lang}`);

  await page.click('[data-action="pronounce"]');
  await page.waitForSelector('[data-record]');
  await page.click('[data-record]');
  await page.waitForSelector('[data-stop]', { timeout: 5000 });
  await page.waitForTimeout(900);
  await page.click('[data-stop]');
  await page.waitForSelector('[data-play-own]', { timeout: 7000 });
  if (!await page.locator('[data-own-audio][controls]').count()) throw new Error('Native controls for own recording are missing');
  await page.click('[data-play-own]');
  await page.waitForFunction(() => document.querySelector('[data-play-own]')?.textContent?.includes('Остановить'), { timeout: 4000 });
  await page.waitForFunction(() => document.querySelector('[data-result]')?.textContent?.includes('Хорошо'), { timeout: 9000 });
  if (pronunciationPosts !== 1) throw new Error(`Expected one pronunciation POST, got ${pronunciationPosts}`);
  const pronText = await page.locator('[data-result]').innerText();
  if (/автоматическое распознавание.*не.*работ/i.test(pronText)) throw new Error('Old browser-recognition failure message is still shown');
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
    await options.first().click();
    await page.waitForSelector('[data-action="quiz-next"]');
    await page.click('[data-action="quiz-next"]');
    await page.waitForTimeout(30);
  }
  await page.waitForSelector('[data-action="complete-unit"]', { timeout: 6000 });
  await page.click('[data-action="complete-unit"]');
  const afterFirst = await page.locator('body').innerText();
  if (!afterFirst.includes('Да и нет')) throw new Error('Second beginner step is not “Да и нет”');

  for (let i = 0; i < 4; i += 1) {
    await page.click('[data-action="nav-dictionary"]');
    await page.waitForSelector('.v12-dict-toolbar', { timeout: 1800 });
    const cards = await page.locator('.v12-dict-card').count();
    if (cards > 12) throw new Error(`Dictionary rendered too many cards: ${cards}`);
    const dictText = await page.locator('body').innerText();
    if (!dictText.includes('Hallo') || !dictText.includes('привет')) throw new Error('Dictionary lost German/Russian pair');
    await page.click('[data-action="nav-home"]');
    await page.waitForSelector('[data-action="start-unit"]', { timeout: 1800 });
  }

  await page.click('[data-action="alphabet-guide"]');
  const alphabet = await page.locator('body').innerText();
  for (const marker of ['A','J','V','W','Y','Z','Ä','Ö','Ü','ß']) if (!alphabet.includes(marker)) throw new Error(`Alphabet guide missing ${marker}`);
  await page.click('[data-action="nav-more"]');
  await page.click('[data-action="reading-guide"]');
  await page.waitForSelector('[data-v16-reading-extra]', { timeout: 3000 });
  const reading = await page.locator('body').innerText();
  for (const marker of ['ei','ie','sch','ch после i/e','sp в начале','st в начале','eu / äu','ß','ä / ö / ü','au','tsch','qu','ck','tz','pf','ng / nk','гласная + h','-ig в конце']) {
    if (!reading.includes(marker)) throw new Error(`Reading guide missing ${marker}`);
  }

  await page.click('[data-action="nav-route"]');
  const routeText = await page.locator('body').innerText();
  if (!routeText.includes('Готовность к тренажёру A1') || !routeText.includes('итоговая проверка')) throw new Error('Final A1 readiness section missing');
  const routeOrder = await page.evaluate(() => ({
    rendered: Array.from(document.querySelectorAll('[data-action="open-section"]')).map((el) => el.dataset.section),
    availableTopics: (window.OttoCourseDataV8?.topics || []).map((topic) => topic.id),
  }));
  const preferred = ['person','numbers','family','calendar','food','home','city','transport','shopping','daily-life','work','free-time','health','weather','course','countries-languages','documents','services','travel-hotel','questions-actions','personal-things','environment'];
  const expectedOrder = ['zero', ...preferred.filter((id) => routeOrder.availableTopics.includes(id)), 'ready'];
  let last = -1;
  for (const id of expectedOrder) {
    const pos = routeOrder.rendered.indexOf(id);
    if (pos < 0) throw new Error(`A1 route missing section ${id}; rendered: ${routeOrder.rendered.join(' > ')}`);
    if (pos <= last) throw new Error(`A1 route difficulty order is wrong near section ${id}: ${routeOrder.rendered.join(' > ')}`);
    last = pos;
  }

  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log('Otto Start V17 smoke passed: strict de-DE male fallback, correct lesson audio routing, microphone recording, playable own recording, pronunciation check pipeline, alphabet, reading rules and A1 route.');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}