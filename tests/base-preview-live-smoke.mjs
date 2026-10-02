import { chromium } from 'playwright';

const base = String(process.env.BASE_URL || '').replace(/\/+$/,'');
if (!base) throw new Error('BASE_URL is required');
const url = base + '/base-preview';
const failures = [];
let browser;

function remember(message) { failures.push(message); console.error('SMOKE:', message); }
async function setState(page, patch) {
  await page.evaluate((value) => {
    if (typeof window.__OTTO_BASE_PREVIEW_SET_STATE !== 'function') throw new Error('Preview state hook missing');
    window.__OTTO_BASE_PREVIEW_SET_STATE(value);
  }, patch);
  await page.waitForTimeout(80);
}
async function text(page, marker) {
  const body = await page.locator('body').innerText();
  if (!body.includes(marker)) {
    const state = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('ottoStartBasePreviewV3') || '{}'); } catch { return {}; }
    });
    console.error('STATE DEBUG', JSON.stringify(state));
    console.error('BODY DEBUG', body.slice(0, 1400).replace(/\n/g,' | '));
    remember('Missing UI marker: ' + marker);
  }
}

try {
  browser = await chromium.launch({
    headless: true,
    args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({
    viewport:{width:390,height:844},
    permissions:['microphone'],
  });
  const page = await context.newPage();
  page.on('pageerror', e => remember('pageerror: '+e.message));

  await page.goto(url, { waitUntil:'domcontentloaded', timeout:30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil:'domcontentloaded' });

  // Registration -> level -> zero -> alphabet through visible user controls.
  await page.getByRole('button',{name:/Telegram/}).click();
  await page.getByRole('button',{name:/Начинаю с нуля/}).click();
  await page.getByRole('button',{name:'Начать'}).click();
  await text(page,'W · A · S');
  await page.getByRole('button',{name:'Начать'}).click();

  // Real Deploy Preview TTS request from a user click.
  const ttsResponse = page.waitForResponse(r => r.url().includes('/api/otto-tts?') && r.request().method()==='GET', {timeout:20000}).catch(()=>null);
  await page.getByRole('button',{name:/🔊 W$/}).click();
  const tts = await ttsResponse;
  if (!tts) remember('No /api/otto-tts request after clicking W');
  else {
    const ct = tts.headers()['content-type'] || '';
    console.log('TTS CLICK', tts.status(), ct, tts.url());
    if (tts.status() !== 200) remember('TTS click returned HTTP '+tts.status());
    if (!ct.startsWith('audio/')) remember('TTS click returned non-audio content-type '+ct);
  }

  // Spaced alphabet flow markers: W, then A, then S, then mixed/new, then old W.
  await setState(page,{screen:'alphabet',alphaStep:6});
  await text(page,'А это помнишь?');
  await setState(page,{screen:'alphabet',alphaStep:7});
  await text(page,'Schule');

  // Real microphone scenario via production speech-v17 pipeline.
  await page.getByRole('button',{name:/🎤 Произнести/}).click({force:true});
  await page.waitForSelector('[data-record]',{timeout:7000});
  const pronunciationResponse = page.waitForResponse(r => r.url().includes('/api/otto-start-pronunciation') && r.request().method()==='POST',{timeout:25000}).catch(()=>null);
  await page.click('[data-record]',{force:true});
  await page.waitForSelector('[data-stop]',{timeout:7000});
  await page.waitForTimeout(900);
  await page.click('[data-stop]',{force:true});
  await page.waitForSelector('[data-play-own]',{timeout:10000});
  if (!await page.locator('[data-own-audio][controls]').count()) remember('Own recording audio controls missing');
  await page.click('[data-play-own]',{force:true});
  await page.waitForTimeout(350);
  const ownText=await page.locator('[data-play-own]').innerText().catch(()=> '');
  if(!/Остановить|Прослушать/.test(ownText)) remember('Own recording playback button did not react');
  const pron=await pronunciationResponse;
  if(!pron) remember('No pronunciation POST response');
  else {
    const body=await pron.text().catch(()=> '');
    console.log('PRONUNCIATION',pron.status(),pron.headers()['content-type']||'',body.slice(0,260));
    if(pron.status()!==200) remember('Pronunciation endpoint returned HTTP '+pron.status());
  }
  await page.locator('[data-close]').click({force:true});

  // Verify the reworked methodology screens themselves.
  await setState(page,{screen:'pronouns',pronounStep:0});
  for (const marker of ['ich','du','er','sie']) await text(page,marker);
  await setState(page,{screen:'pronouns',pronounStep:2}); await text(page,'На слух');
  await setState(page,{screen:'pronouns',pronounStep:3}); await text(page,'Напиши: «я»');
  await setState(page,{screen:'pronouns',pronounStep:7}); await text(page,'Скажи: «Я»');
  await setState(page,{screen:'pronouns',pronounStep:12}); await text(page,'А это помнишь?');

  await setState(page,{screen:'verb',verbStep:0}); await text(page,'wohnen');
  await setState(page,{screen:'verb',verbStep:1}); await text(page,'kommen');
  await setState(page,{screen:'verb',verbStep:3}); await text(page,'heißen');
  await setState(page,{screen:'verb',verbStep:5}); await text(page,'sprechen');
  await setState(page,{screen:'verb',verbStep:7}); await text(page,'lernen');
  await setState(page,{screen:'verb',verbStep:8}); await text(page,'arbeiten');
  await setState(page,{screen:'verb',verbStep:9}); await text(page,'Напиши: wohnen');
  await setState(page,{screen:'verb',verbStep:10}); await text(page,'Меня зовут Анна');

  await setState(page,{screen:'noun',nounStep:0}); await text(page,'das Haus');
  await setState(page,{screen:'noun',nounStep:1}); await text(page,'der Bus');
  await setState(page,{screen:'noun',nounStep:2}); await text(page,'die Schule');
  await setState(page,{screen:'noun',nounStep:3}); await text(page,'der Bahnhof');
  await setState(page,{screen:'noun',nounStep:5}); await text(page,'das Hotel');

  await setState(page,{screen:'numbers'}); await text(page,'Как произнести число?');
  await setState(page,{screen:'sentence',sentenceStep:3}); await text(page,'Напиши: «Я живу в Берлине.»');
  await setState(page,{screen:'sentence',sentenceStep:4}); await text(page,'Скажи: «Я живу в Берлине.»');
  await setState(page,{screen:'sentence',sentenceStep:6}); await text(page,'А это помнишь?');

  if(failures.length) throw new Error(failures.join('\n'));
  console.log('OTTO Start live Deploy Preview smoke passed: TTS click, microphone/record/playback/pronunciation endpoint, and interleaved lesson screens.');
} finally {
  if(browser) await browser.close();
}