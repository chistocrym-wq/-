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
  await page.waitForFunction(()=>/Привет! Я OTTO|Ваш прогресс|А это помнишь\?/.test(document.body.innerText),null,{timeout:12000});
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
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
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
  await page.getByText('Ваш прогресс',{exact:false}).waitFor({timeout:10000});
  s=await state(page);
  if(!s.onboardingCompleted)fail('onboardingCompleted not set');
  await saveCloud(page);

  // Make two actual mistakes so My Errors gets a server-persisted item.
  await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_SET_STATE({screen:'alphabet',alphaStep:8,errors:[],retryCounts:{}}));
  let wrong=page.locator('.bp-option').first();
  await wrong.click(); await page.waitForTimeout(550);
  if((await state(page)).errors.length)fail('First miss was stored too early');
  wrong=page.locator('.bp-option').first();
  await wrong.click(); await page.waitForTimeout(700);
  s=await state(page);
  if(!s.errors.some(e=>e.id==='alpha-W'&&!e.resolved))fail('Repeated miss not stored in My Errors');
  await saveCloud(page);
  const signature=JSON.stringify({onboarding:s.onboardingCompleted,alphaStep:s.alphaStep,errors:s.errors.map(e=>({id:e.id,count:e.count,resolved:e.resolved}))});

  await page.evaluate(()=>window.BP.errors());
  if(!(await page.getByText('W',{exact:true}).count()))fail('My Errors does not show W');

  // Logout -> same server test account -> no onboarding, progress restored.
  await logout(page);
  await previewLogin(page);
  await page.getByText('Ваш прогресс',{exact:false}).waitFor({timeout:10000});
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
