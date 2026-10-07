import { chromium } from 'playwright';

const base=String(process.env.BASE_URL||'').replace(/\/+$/,'');
if(!base) throw new Error('BASE_URL is required');
const url=base+'/base-preview';
const failures=[];
const fail=m=>{failures.push(m);console.error('SMOKE:',m)};
let browser;

async function state(page){return page.evaluate(()=>window.__OTTO_BASE_PREVIEW_GET_STATE())}
async function saveCloud(page){const ok=await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_SAVE_CLOUD());if(!ok)fail('save-progress failed')}
async function previewLogin(page){
  await page.getByRole('button',{name:/Войти в тестовый аккаунт/}).click();
  await page.waitForFunction(()=>/Привет! Я OTTO|Где я сейчас\?|Учебная дорожка|А это помнишь\?/.test(document.body.innerText),null,{timeout:12000});
}
async function logout(page){
  if(!(await page.getByText('Профиль',{exact:true}).count())){
    const settings=page.getByRole('button',{name:'Настройки'}).last();
    if(await settings.count())await settings.click();
    else await page.evaluate(()=>window.BP.settings());
  }
  await page.getByRole('button',{name:'Выйти'}).click();
  await page.waitForFunction(()=>document.body.innerText.includes('Войти в тестовый аккаунт'),null,{timeout:10000});
}
async function resetThroughUi(page){
  if(!(await page.getByText('Сбросить тестовый прогресс',{exact:false}).count()))await page.evaluate(()=>window.BP.settings());
  await page.getByText('Сбросить тестовый прогресс',{exact:false}).waitFor({timeout:5000});
  await page.getByRole('button',{name:'Сбросить'}).click();
  await page.waitForTimeout(600);
}

try{
  browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.grantPermissions(['microphone'],{origin:base});
  const page=await context.newPage();
  page.on('pageerror',e=>fail('pageerror '+e.message));

  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Войти в тестовый аккаунт/}).waitFor({timeout:10000});

  // Ordinary OTP UI is still present.
  for(const marker of ['Email','Телефон','Уже есть аккаунт? Войти','Только для Deploy Preview']){
    if(!(await page.getByText(marker,{exact:false}).count()))fail('Missing auth UI: '+marker);
  }

  // Production must not accept preview-login.
  const prod=await page.request.post('https://otto-start.netlify.app/api/otto-start-auth',{data:{action:'preview-login'}});
  if(![401,403,404].includes(prod.status()))fail('Production accepted preview-login: '+prod.status());

  // Real preview server session.
  await previewLogin(page);
  let s=await state(page);
  const me=await page.evaluate(async()=>{
    const token=localStorage.getItem('ottoStartSessionV8')||'';
    const r=await fetch('/api/otto-start-auth',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({action:'me'})});
    return {status:r.status,data:await r.json().catch(()=>({})),hasToken:Boolean(token)};
  });
  if(!me.hasToken||me.status!==200||me.data?.user?.login!=='preview-test-user')fail('Preview test login is not a valid server session');

  // Deterministically reset any state left by an earlier tester.
  if(s.onboardingCompleted||s.screen!=='onboarding'){
    await resetThroughUi(page);
    await logout(page);
    await previewLogin(page);
    s=await state(page);
  }
  if(s.screen!=='onboarding'||s.onboardingCompleted)fail('Fresh test profile did not open first onboarding');
  if(!(await page.getByText('Привет! Я OTTO',{exact:false}).count()))fail('First onboarding not visible');

  // Skip onboarding -> save flag to server.
  await page.getByRole('button',{name:'Пропустить инструкцию'}).click();
  await page.waitForFunction(()=>/Где я сейчас\?|Учебная дорожка/.test(document.body.innerText),null,{timeout:10000});
  s=await state(page);
  if(!s.onboardingCompleted)fail('onboardingCompleted not set');
  await saveCloud(page);

  // Real TTS click: require the actual Deploy Preview backend response.
  await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_SET_STATE({screen:'alphabet',alphaStep:0}));
  const ttsWait=page.waitForResponse(r=>r.url().includes('/api/otto-tts')&&r.request().method()==='GET',{timeout:35000});
  await page.locator('.bp-alphabet-map .bp-token').first().click();
  const ttsResponse=await ttsWait;
  const ttsType=String(ttsResponse.headers()['content-type']||'');
  if(ttsResponse.status()!==200||!ttsType.toLowerCase().includes('audio'))console.warn('BLOCKER: real TTS click returned '+ttsResponse.status()+' '+ttsType);

  // Real MediaRecorder path: synthetic browser microphone -> actual pronunciation POST.
  await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_SET_STATE({screen:'numbers',numberStep:2}));
  await page.getByRole('button',{name:/Произнеси/}).click();
  await page.locator('[data-v17-speech-modal]').waitFor({timeout:5000});
  const pronWait=page.waitForResponse(r=>r.url().includes('/api/otto-start-pronunciation')&&r.request().method()==='POST',{timeout:30000});
  await page.locator('[data-record]').click();
  await page.locator('[data-stop]').waitFor({timeout:8000});
  await page.waitForTimeout(900);
  await page.locator('[data-stop]').click();
  const pronResponse=await pronWait;
  const pronRequest=pronResponse.request();
  const pronPayload=JSON.parse(pronRequest.postData()||'{}');
  if(String(pronPayload.audioBase64||'').length<300)fail('Pronunciation request did not contain a real recorded audio payload');
  if(pronResponse.status()!==200)console.warn('BLOCKER: pronunciation backend returned HTTP '+pronResponse.status());
  await page.locator('[data-v17-speech-modal] [data-close]').click().catch(()=>{});

  // Make two actual mistakes in the same numbers exercise.
  await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_SET_STATE({screen:'numbers',numberStep:1,errors:[],retryCounts:{}}));
  let wrong=page.locator('.bp-option').nth(1);
  await wrong.click(); await page.waitForTimeout(550);
  if((await state(page)).errors.length)fail('First miss was stored too early');
  await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_SET_STATE({screen:'numbers',numberStep:1}));
  wrong=page.locator('.bp-option').nth(1);
  await wrong.click(); await page.waitForTimeout(700);
  s=await state(page);
  if(!s.errors.some(e=>e.id==='number-1'&&!e.resolved))fail('Repeated miss not stored in My Errors');
  await saveCloud(page);
  const signature=JSON.stringify({onboarding:s.onboardingCompleted,alphaStep:s.alphaStep,errors:s.errors.map(e=>({id:e.id,count:e.count,resolved:e.resolved}))});

  await page.evaluate(()=>window.BP.errors());
  if(!(await page.getByText('Числа',{exact:true}).count()))fail('My Errors is not grouped by skill');

  // Logout -> same server test account -> no onboarding, progress restored.
  await logout(page);
  await previewLogin(page);
  await page.waitForFunction(()=>/Где я сейчас\?|Учебная дорожка/.test(document.body.innerText),null,{timeout:10000});
  s=await state(page);
  if(s.screen==='onboarding'||!s.onboardingCompleted)fail('Onboarding returned automatically on second login');
  const restored=JSON.stringify({onboarding:s.onboardingCompleted,alphaStep:s.alphaStep,errors:s.errors.map(e=>({id:e.id,count:e.count,resolved:e.resolved}))});
  if(restored!==signature)fail('Server progress/errors were not restored');

  // Manual tutorial replay must not reset progress.
  const before=JSON.stringify({alphaStep:s.alphaStep,errors:s.errors,completed:s.completed,learned:s.learnedElements});
  await page.evaluate(()=>window.BP.settings());
  await page.getByText('Как заниматься в OTTO Start',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Открыть'}).first().click();
  await page.getByText('Экран 1 из 5',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Пропустить инструкцию'}).click();
  await page.getByText('Настройки',{exact:true}).waitFor();
  s=await state(page);
  const after=JSON.stringify({alphaStep:s.alphaStep,errors:s.errors,completed:s.completed,learned:s.learnedElements});
  if(after!==before)fail('Manual tutorial replay reset progress');

  // The new path must expose micro-lessons and remain mobile-safe.
  await page.evaluate(()=>window.BP.learn());
  for(const marker of ['Моё имя','Моя фамилия','Другие слова по буквам','Проверка Buchstabieren','Числа 0–10','Составные числа','Checkpoint по числам']){
    if(!(await page.getByText(marker,{exact:false}).count()))fail('Missing micro-lesson: '+marker);
  }
  for(const width of [320,330,360,375,390,430,520]){
    await page.setViewportSize({width,height:844});
    await page.waitForTimeout(80);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    if(overflow)fail('Horizontal overflow at '+width+'px');
    await page.screenshot({path:'test-artifacts/base-preview-'+width+'.png',fullPage:true});
  }
  await page.setViewportSize({width:1280,height:900});
  await page.waitForTimeout(80);
  const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  if(desktopOverflow)fail('Horizontal overflow at desktop 1280px');
  await page.screenshot({path:'test-artifacts/base-preview-desktop.png',fullPage:true});

  // Preview-only reset -> next login behaves as a new user again.
  await resetThroughUi(page);
  s=await state(page);
  if(s.onboardingCompleted||s.errors.length||s.completed.length||s.learnedElements.length)fail('Test-profile reset did not clear profile state');
  await logout(page);
  await previewLogin(page);
  s=await state(page);
  if(s.screen!=='onboarding'||s.onboardingCompleted)fail('Onboarding did not return after test-profile reset');
  if(!(await page.getByText('Привет! Я OTTO',{exact:false}).count()))fail('Fresh onboarding not visible after reset');

  if(failures.length)throw new Error(failures.join('\n'));
  console.log('Secure Deploy Preview test-account scenario passed.');
}finally{
  if(browser)await browser.close();
}
