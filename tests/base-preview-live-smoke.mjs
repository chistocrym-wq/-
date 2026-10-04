import { chromium } from 'playwright';
import fs from 'node:fs';

const base=String(process.env.BASE_URL||'').replace(/\/+$/,'');
if(!base) throw new Error('BASE_URL is required');
const url=base+'/base-preview';
const failures=[];
const remember=m=>{failures.push(m);console.error('SMOKE:',m)};
const password='otto-preview-16';
const fixtureCandidates=[
  'smoke+54bccc77c0-37115957244-1@example.com',
  'smoke+b37562af8b-37115856456-1@example.com',
  'smoke+44a9abb2a1-37114395718-1@example.com'
];
let browser;
fs.mkdirSync('test-artifacts',{recursive:true});

async function textHas(page,marker){
  const body=(await page.locator('body').innerText()).toLocaleLowerCase('ru-RU');
  if(!body.includes(String(marker).toLocaleLowerCase('ru-RU')))remember('Missing: '+marker);
}
async function setState(page,patch){
  await page.evaluate(v=>window.__OTTO_BASE_PREVIEW_SET_STATE(v),patch);
  await page.waitForTimeout(120);
}
async function getState(page){return await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_GET_STATE())}
async function saveCloud(page){
  const ok=await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_SAVE_CLOUD());
  if(!ok)remember('Cloud progress save failed');
}
async function loginFixtureByApi(page){
  return await page.evaluate(async ({candidates,password})=>{
    for(const login of candidates){
      const r=await fetch('/api/otto-start-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',login,password})});
      const d=await r.json().catch(()=>({}));
      if(r.ok&&d.session?.token)return {login,token:d.session.token,user:d.user};
    }
    return null;
  },{candidates:fixtureCandidates,password});
}
async function loginFixtureByUi(page,login){
  await page.waitForSelector('#authLogin',{timeout:10000});
  await page.locator('#authLogin').fill(login);
  await page.locator('#authPassword').fill(password);
  await page.getByRole('button',{name:'Войти'}).click();
  await page.waitForFunction(()=>document.body.innerText.includes('Ваш прогресс')||document.body.innerText.includes('Привет! Я OTTO'),null,{timeout:12000});
}
async function logout(page){
  if((await page.getByRole('button',{name:'Настройки'}).count())>0)await page.getByRole('button',{name:'Настройки'}).last().click();
  await page.getByRole('button',{name:'Выйти'}).click();
  await page.waitForFunction(()=>document.body.innerText.includes('Создать аккаунт')||document.body.innerText.includes('С возвращением'),null,{timeout:10000});
}
async function layout(page,width,height,label){
  await page.setViewportSize({width,height}); await page.waitForTimeout(150);
  const r=await page.evaluate(()=>{
    const vw=innerWidth,sw=document.documentElement.scrollWidth,nav=document.querySelector('.bp-bottom')?.getBoundingClientRect();
    const bad=[...document.querySelectorAll('button,input,img,.bp-bottom,.bp-card')].filter(el=>{const b=el.getBoundingClientRect();return b.width>0&&(b.left<-2||b.right>vw+2)}).slice(0,10).map(el=>({tag:el.tagName,text:(el.textContent||'').slice(0,40),cls:el.className}));
    const ottos=[...document.querySelectorAll('.bp-onboard-hero img,.bp-hero img,.bp-tutorial-head img,.bp-praise img')].map(el=>({cls:el.parentElement?.className||'',h:el.getBoundingClientRect().height,w:el.getBoundingClientRect().width}));
    const lessonButtons=[...document.querySelectorAll('.bp-lesson-nav button')].map(el=>{const b=el.getBoundingClientRect();return {text:el.textContent.trim(),left:b.left,right:b.right,top:b.top,bottom:b.bottom,visible:b.width>0&&b.height>0}});
    return {vw,sw,nav:nav?{left:nav.left,right:nav.right}:null,bad,ottos,lessonButtons};
  });
  if(r.sw>r.vw+2)remember(label+' horizontal overflow '+r.sw+'>'+r.vw);
  if(r.bad.length)remember(label+' clipped '+JSON.stringify(r.bad));
  if(r.nav&&(r.nav.left<-2||r.nav.right>r.vw+2))remember(label+' bottom nav clipped');
  for(const o of r.ottos){
    const praise=String(o.cls).includes('bp-praise'),limit=praise?112:92;
    if(o.h>limit+1)remember(label+' OTTO too tall '+o.h+' limit '+limit);
  }
  for(const b of r.lessonButtons)if(!b.visible||b.left<-2||b.right>r.vw+2)remember(label+' lesson nav hidden '+b.text);
  await page.screenshot({path:'test-artifacts/'+label+'.png',fullPage:true});
}
async function pronunciationIntegration(page){
  await setState(page,{screen:'reading',readingStarted:true,readingRule:3,readingPhase:1});
  await page.getByRole('button',{name:/🎤 Повторить/}).click({force:true});
  await page.waitForSelector('[data-record]',{timeout:7000});
  await page.click('[data-record]',{force:true});
  await page.waitForSelector('[data-stop]',{timeout:7000});
  await page.waitForTimeout(700);
  const request=page.waitForRequest(r=>r.url().includes('/api/otto-start-pronunciation')&&r.method()==='POST',{timeout:20000}).catch(()=>null);
  await page.click('[data-stop]',{force:true});
  const req=await request;
  if(!req)remember('No real MediaRecorder pronunciation request reached existing backend');
  await page.locator('[data-close]').click({force:true}).catch(()=>{});
}

try{
  browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
  const context=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone']});
  const page=await context.newPage();
  page.on('pageerror',e=>remember('pageerror '+e.message));

  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#authLogin',{timeout:10000});
  await textHas(page,'Получить код подтверждения');
  const registerPassword=page.locator('#authPassword');
  if((await registerPassword.getAttribute('minlength'))!=='8')remember('Registration password minlength is not 8');
  const jsText=await (await page.request.get(base+'/base-preview-v3.js?v=19')).text();
  if(jsText.includes('preview-register')||jsText.includes('preview-login'))remember('Preview-only auth API action still present');

  const providers=await page.evaluate(async()=>{const r=await fetch('/api/otto-start-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status'})});return await r.json()});
  if(!providers||typeof providers.providers!=='object')remember('Existing auth status endpoint unavailable');

  await page.getByRole('button',{name:/Уже есть аккаунт/}).click();
  await textHas(page,'С возвращением');
  const fixture=await loginFixtureByApi(page);
  let st;
  if(fixture){
    await page.evaluate(({token})=>localStorage.setItem('ottoStartSessionV8',token),fixture);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.innerText.includes('Ваш прогресс')||document.body.innerText.includes('Привет! Я OTTO'),null,{timeout:10000});

    // Verify the real unchanged main API can persist onboardingCompleted in preview profile progress.
    await setState(page,{onboardingCompleted:false,onboardingCompletedAt:'',lastStudyDate:'',reviewSkippedDate:'',screen:'home'});
    await saveCloud(page);
    await logout(page);
    if(!(await page.locator('#authLogin').count()))await page.getByRole('button',{name:/Уже есть аккаунт/}).click();
    await loginFixtureByUi(page,fixture.login);
    await textHas(page,'Привет! Я OTTO');
    await textHas(page,'Алфавит и чтение');
    await page.getByRole('button',{name:'Пропустить инструкцию'}).click();
    await page.waitForFunction(()=>document.body.innerText.includes('Ваш прогресс'),null,{timeout:10000});
    st=await getState(page);
    if(!st.onboardingCompleted)remember('onboardingCompleted was not set after skip');
    await saveCloud(page);

    await logout(page);
    if(!(await page.locator('#authLogin').count()))await page.getByRole('button',{name:/Уже есть аккаунт/}).click();
    await loginFixtureByUi(page,fixture.login);
    await textHas(page,'Ваш прогресс');
    st=await getState(page);
    if(!st.onboardingCompleted)remember('onboardingCompleted not restored from server');
    if(st.screen==='onboarding')remember('Onboarding auto-opened on second login');
  }else{
    console.log('NOTE: no persisted Deploy Preview account exists in this deploy-scoped Blob store; OTP second-login browser check is skipped rather than bypassing the unchanged auth API.');
    const appSource=await (await page.request.get(base+'/base-preview-v3.js?v=19')).text();
    for(const needle of ["profile:{onboardingCompleted:Boolean(state.onboardingCompleted)","api('save-progress'","api('load-progress'","state.onboardingCompleted?'home':'onboarding'"]){
      if(!appSource.includes(needle))remember('Server onboarding persistence code missing: '+needle);
    }
    await setState(page,{screen:'onboarding',onboardingCompleted:false,onboardingStep:0,onboardingManual:false});
    await textHas(page,'Привет! Я OTTO');
    await page.getByRole('button',{name:'Пропустить инструкцию'}).click();
    await textHas(page,'Ваш прогресс');
    st=await getState(page);
    if(!st.onboardingCompleted)remember('onboardingCompleted was not set by onboarding skip');
  }

  // Manual replay: all 5 screens, no progress reset.
  st=await getState(page);
  const beforeManual=JSON.stringify({completed:st.completed,alphaStep:st.alphaStep,readingRule:st.readingRule,numberStep:st.numberStep});
  await page.getByRole('button',{name:'Настройки'}).last().click();
  await textHas(page,'Как заниматься в OTTO Start');
  await page.getByRole('button',{name:'Открыть'}).first().click();
  for(let screen=1;screen<=5;screen++){
    await textHas(page,'Экран '+screen+' из 5');
    if(screen<5)await page.getByRole('button',{name:'Дальше'}).click();
  }
  await textHas(page,'Начать с самого начала');
  await textHas(page,'Выбрать тему самому');
  await page.getByRole('button',{name:/Выбрать тему самому/}).click();
  const afterManual=await getState(page);
  const afterKey=JSON.stringify({completed:afterManual.completed,alphaStep:afterManual.alphaStep,readingRule:afterManual.readingRule,numberStep:afterManual.numberStep});
  if(beforeManual!==afterKey)remember('Manual onboarding replay changed learning progress');

  // Alphabet: real personal spelling flow, Cyrillic guard, tricky letters, 8-task control.
  await setState(page,{screen:'alphabet',alphaStep:0,errors:[],retryCounts:{}});
  await textHas(page,'A–Z · Ä Ö Ü ß');
  await setState(page,{screen:'alphabet',alphaStep:1});
  await page.locator('#firstNameInput').fill('Юлия');
  await page.getByRole('button',{name:'Продолжить'}).click();
  await textHas(page,'не переводятся');
  await page.locator('#firstNameInput').fill('Julia');
  await page.getByRole('button',{name:'Продолжить'}).click();
  for(const m of ['J','U','L','I','A'])await textHas(page,m);
  await setState(page,{screen:'alphabet',alphaStep:3,firstName:'Julia'});
  await page.locator('#lastNameInput').fill('Petrova');
  await page.getByRole('button',{name:'Продолжить'}).click();
  await textHas(page,'Petrova');
  await setState(page,{screen:'alphabet',alphaStep:7});
  for(const m of ['J','V','W','Y','Z','Ä','Ö','Ü','ß'])await textHas(page,m);
  await setState(page,{screen:'alphaControl',alphaControlIndex:0,alphaControlResults:[]});
  await textHas(page,'1 / 8');

  // A lesson mistake is explained once and saved only after the repeated miss.
  await setState(page,{screen:'alphabet',alphaStep:8,errors:[],retryCounts:{}});
  let opts=page.locator('.bp-option');
  await opts.nth(0).click(); await page.waitForTimeout(600);
  if((await getState(page)).errors.length)remember('Alphabet error was stored after first miss');
  opts=page.locator('.bp-option');
  await opts.nth(0).click(); await page.waitForTimeout(600);
  if(!(await getState(page)).errors.some(e=>e.id==='alpha-W'))remember('Alphabet repeated miss was not stored');

  // My Errors: successful later practice moves the item to resolved history instead of deleting it.
  await setState(page,{screen:'errors',errors:[{id:'alpha-W',item:'W',topic:'alphabet',skill:'название буквы',detail:'W стоит повторить.',count:2,practiceCount:0,successes:0,resolved:false}]});
  await page.getByRole('button',{name:'Потренировать'}).last().click();
  await page.locator('.bp-option').nth(1).click(); await page.waitForTimeout(550);
  await textHas(page,'Уже отработано');
  const resolved=await getState(page);
  if(!resolved.errors.find(e=>e.id==='alpha-W')?.resolved)remember('Resolved error disappeared instead of being marked successful');

  // Reading comes from the same shared main rule source and OTTO course vocabulary.
  const ruleIds=await page.evaluate(()=>window.OttoReadingRulesV15?.map(x=>x.id)||[]);
  for(const id of ['j','ei','ie','sch','ichch','achch','z','w','v','sp','st','eu','ss','umlaut','ending'])if(!ruleIds.includes(id))remember('Shared main reading rule missing '+id);
  const extraLabels=await page.evaluate(()=>window.OttoReadingExtraRulesV16?.map(x=>x[0])||[]);
  for(const label of ['au','tsch','qu','ck','tz','pf','ng / nk','гласная + h','-ig в конце'])if(!extraLabels.includes(label))remember('Shared extra main reading feature missing '+label);
  await setState(page,{screen:'reading',readingStarted:false,readingRule:-1,readingPhase:0,readingControlItems:[]});
  await textHas(page,'Не пытайся сейчас всё запомнить');
  await setState(page,{screen:'reading',readingStarted:true,readingRule:3,readingPhase:0});
  await textHas(page,'sch');
  await textHas(page,'Schule');
  await setState(page,{screen:'reading',readingStarted:true,readingRule:3,readingPhase:4});
  await textHas(page,'Прочитай сам');
  await setState(page,{screen:'reading',readingStarted:true,readingRule:3,readingPhase:9});
  await textHas(page,'проверка переноса');
  await setState(page,{screen:'readingControl',readingControlIndex:0,readingControlResults:[],readingControlItems:[]});
  await textHas(page,'1 / 30');
  const controlState=await getState(page);
  if(controlState.readingControlItems.length!==30)remember('Reading control is not 30 words');
  if(controlState.readingControlItems.filter(x=>x.familiar).length!==20)remember('Reading control familiar count is not 20');
  if(controlState.readingControlItems.filter(x=>!x.familiar).length!==10)remember('Reading control new count is not 10');
  const corpusOk=await page.evaluate(items=>{
    const norm=x=>String(x||'').replace(/^(der|die|das)\s+/i,'').trim().toLocaleLowerCase('de-DE');
    const corpus=new Set((window.OttoCourseDataV8?.allWords?.()||[]).map(x=>norm(x.de)));
    return items.every(x=>corpus.has(norm(x.word)));
  },controlState.readingControlItems);
  if(!corpusOk)remember('Reading control contains a word outside loaded OTTO course vocabulary');

  // Numbers: all required blocks + 18-task mixed control.
  await setState(page,{screen:'numbers',numberStep:0}); await textHas(page,'0–10');
  await setState(page,{screen:'numbers',numberStep:3}); await textHas(page,'11–20');
  await setState(page,{screen:'numbers',numberStep:6}); await textHas(page,'20 · 30 · 40');
  await setState(page,{screen:'numbers',numberStep:10}); await textHas(page,'ein + und + zwanzig');
  await setState(page,{screen:'numbers',numberStep:12}); await textHas(page,'Возраст · дом · телефон · индекс · цена · время');
  await setState(page,{screen:'numbers',numberStep:13}); await textHas(page,'Как произнести число?');
  await page.locator('#numberInput').fill('127');
  await page.getByRole('button',{name:'Показать'}).click();
  await textHas(page,'einhundertsiebenundzwanzig');
  await setState(page,{screen:'numberControl',numberControlIndex:0,numberControlResults:[]}); await textHas(page,'1 / 18');

  // Progress and next-day review.
  await setState(page,{screen:'settings',completed:['alphabet'],tests:{alphabet:{score:6,total:8}},learnedElements:['a','b','c'],sessions:2,errors:[]});
  await textHas(page,'Контрольные');
  await textHas(page,'6 из 8');
  await setState(page,{screen:'review',completed:['alphabet'],lastStudyDate:'2026-10-01',reviewStep:0,errors:[]});
  await textHas(page,'А это помнишь?');
  await textHas(page,'Пропустить повторение');

  // Microphone: use the existing real MediaRecorder route; fake device only supplies CI audio and is never treated as success.
  await pronunciationIntegration(page);

  // Desktop and every mobile width required by the spec.
  const sizes=[[320,568],[330,700],[360,800],[375,812],[390,844],[430,860],[520,900]];
  await setState(page,{screen:'home',onboardingCompleted:true});
  await layout(page,1280,900,'desktop-home');
  for(const [w,h] of sizes)await layout(page,w,h,w+'-home');
  await setState(page,{screen:'onboarding',onboardingManual:true,onboardingStep:2});
  for(const [w,h] of [[320,568],[390,844],[520,900]])await layout(page,w,h,w+'-onboarding');
  await setState(page,{screen:'reading',readingStarted:true,readingRule:3,readingPhase:4});
  for(const [w,h] of [[320,568],[360,800],[390,844]])await layout(page,w,h,w+'-lesson');
  await setState(page,{screen:'readingResult',readingControlResults:Array(30).fill(true),readingControlItems:controlState.readingControlItems});
  await layout(page,390,844,'390-praise');

  if(failures.length)throw new Error(failures.join('\n'));
  console.log('OTTO Start v19 authoritative-TZ smoke passed.');
}finally{
  if(browser)await browser.close();
}
