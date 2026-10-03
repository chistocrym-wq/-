import { chromium } from 'playwright';
import fs from 'node:fs';

const base=String(process.env.BASE_URL||'').replace(/\/+$/,'');
if(!base) throw new Error('BASE_URL is required');
const url=base+'/base-preview';
const failures=[];
const remember=m=>{failures.push(m);console.error('SMOKE:',m)};
const email='smoke+'+String(process.env.GITHUB_SHA||Date.now()).slice(0,12)+'@example.com';
const password='otto-preview-16';
let browser;
fs.mkdirSync('test-artifacts',{recursive:true});

async function textHas(page,marker){
  const body=(await page.locator('body').innerText()).toLocaleLowerCase('ru-RU');
  if(!body.includes(String(marker).toLocaleLowerCase('ru-RU')))remember('Missing: '+marker);
}
async function setState(page,patch){
  await page.evaluate(v=>window.__OTTO_BASE_PREVIEW_SET_STATE(v),patch);
  await page.waitForTimeout(100);
}
async function getState(page){return await page.evaluate(()=>window.__OTTO_BASE_PREVIEW_GET_STATE())}
async function layout(page,width,height,label){
  await page.setViewportSize({width,height}); await page.waitForTimeout(120);
  const r=await page.evaluate(()=>{
    const vw=innerWidth,sw=document.documentElement.scrollWidth,nav=document.querySelector('.bp-bottom')?.getBoundingClientRect();
    const bad=[...document.querySelectorAll('button,input,img,.bp-bottom,.bp-card')].filter(el=>{const b=el.getBoundingClientRect();return b.width>0&&(b.left<-2||b.right>vw+2)}).slice(0,8).map(el=>({tag:el.tagName,text:(el.textContent||'').slice(0,40),cls:el.className}));
    return {vw,sw,nav:nav?{left:nav.left,right:nav.right}:null,bad};
  });
  if(r.sw>r.vw+2)remember(label+' horizontal overflow');
  if(r.bad.length)remember(label+' clipped '+JSON.stringify(r.bad));
  if(r.nav&&(r.nav.left<-2||r.nav.right>r.vw+2))remember(label+' bottom nav clipped');
  await page.screenshot({path:'test-artifacts/'+label+'.png',fullPage:true});
}
async function realPronunciation(page){
  await setState(page,{screen:'reading',readingStarted:true,readingRule:4,readingPhase:1});
  await page.getByRole('button',{name:/🎤 Повторить/}).click({force:true});
  await page.waitForSelector('[data-record]',{timeout:7000});
  await page.click('[data-record]',{force:true});
  await page.waitForSelector('[data-stop]',{timeout:7000});
  await page.waitForTimeout(700);
  const response=page.waitForResponse(r=>r.url().includes('/api/otto-start-pronunciation')&&r.request().method()==='POST',{timeout:20000}).catch(()=>null);
  await page.click('[data-stop]',{force:true});
  const pron=await response;
  if(!pron)remember('No pronunciation request'); else if(pron.status()!==200)remember('Pronunciation HTTP '+pron.status());
  await page.locator('[data-close]').click({force:true}).catch(()=>{});
}

try{
 browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone']});
 const page=await context.newPage(); page.on('pageerror',e=>remember('pageerror '+e.message));

 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.evaluate(()=>localStorage.clear()); await page.reload({waitUntil:'domcontentloaded'});
 await textHas(page,'Создайте профиль');
 await page.locator('#authName').fill('Smoke'); await page.locator('#authEmail').fill(email); await page.locator('#authPassword').fill(password);
 await page.getByRole('button',{name:'Создать профиль'}).click(); await page.waitForTimeout(700);
 await textHas(page,'Привет! Я OTTO');
 for(let i=0;i<4;i++){await page.getByRole('button',{name:'Дальше'}).click();await page.waitForTimeout(80)}
 await textHas(page,'Начать с самого начала');
 await page.getByRole('button',{name:/Начать с самого начала/}).click(); await page.waitForTimeout(700);
 await textHas(page,'Ваш прогресс');

 await page.getByRole('button',{name:'Настройки'}).last().click(); await textHas(page,'Как заниматься в OTTO Start');
 await page.getByRole('button',{name:'Открыть'}).first().click(); await textHas(page,'Экран 1 из 5');
 await page.getByRole('button',{name:'Пропустить инструкцию'}).click(); await textHas(page,'Настройки');

 await page.getByRole('button',{name:'Выйти'}).click(); await textHas(page,'Создайте профиль');
 await page.getByRole('button',{name:/Уже есть профиль/}).click();
 await page.locator('#authEmail').fill(email); await page.locator('#authPassword').fill(password); await page.getByRole('button',{name:'Войти'}).click(); await page.waitForTimeout(900);
 await textHas(page,'Ваш прогресс');
 const afterLogin=await getState(page);
 if(!afterLogin.onboardingCompleted)remember('onboardingCompleted not restored from server');
 if(afterLogin.screen==='onboarding')remember('Onboarding auto-opened on second login');

 await setState(page,{screen:'alphabet',alphaStep:0}); await textHas(page,'A–Z · Ä Ö Ü ß');
 await setState(page,{screen:'alphabet',alphaStep:1}); await page.locator('#firstNameInput').fill('Юлия'); await page.getByRole('button',{name:'Продолжить'}).click(); await textHas(page,'не переводятся');
 await page.locator('#firstNameInput').fill('Julia'); await page.getByRole('button',{name:'Продолжить'}).click(); for(const m of ['J','U','L','I','A'])await textHas(page,m);
 await setState(page,{screen:'alphabet',alphaStep:3,firstName:'Julia'}); await page.locator('#lastNameInput').fill('Petrova'); await page.getByRole('button',{name:'Продолжить'}).click(); await textHas(page,'Petrova');
 await setState(page,{screen:'alphabet',alphaStep:7}); for(const m of ['J','V','W','Y','Z','Ä','Ö','Ü','ß'])await textHas(page,m);
 await setState(page,{screen:'alphaControl',alphaControlIndex:0,alphaControlResults:[]}); await textHas(page,'Контрольная по алфавиту');

 await setState(page,{screen:'reading',readingStarted:false,readingRule:-1,readingPhase:0});
 for(const m of ['w','v','z','j','sch','ch','ei','ie','eu / äu','sp','st','ß','ä / ö / ü','-e / -er'])await textHas(page,m);
 await setState(page,{screen:'reading',readingStarted:true,readingRule:4,readingPhase:0}); await textHas(page,'Schule');
 await setState(page,{screen:'reading',readingStarted:true,readingRule:4,readingPhase:3}); await textHas(page,'Schuhe');
 await setState(page,{screen:'readingControl',readingControlIndex:0,readingControlResults:[]}); await textHas(page,'1 / 30'); await textHas(page,'Wasser');

 await setState(page,{screen:'numbers',numberStep:0}); await textHas(page,'0–10');
 await setState(page,{screen:'numbers',numberStep:3}); await textHas(page,'11–20');
 await setState(page,{screen:'numbers',numberStep:5}); await textHas(page,'20 · 30 · 40');
 await setState(page,{screen:'numbers',numberStep:7}); await textHas(page,'ein + und + zwanzig');
 await setState(page,{screen:'numbers',numberStep:10}); await textHas(page,'Как произнести число?');
 await setState(page,{screen:'numberControl',numberControlIndex:0,numberControlResults:[]}); await textHas(page,'1 / 18');

 await setState(page,{screen:'errors',errors:[{id:'reading-sch',item:'sch',topic:'reading',skill:'произношение',detail:'Правило sch стоит повторить.',rule:'sch',count:2,resolved:false}]}); await textHas(page,'Потренировать мои ошибки');
 await setState(page,{screen:'settings',completed:['alphabet'],tests:{alphabet:{score:6,total:8}},learnedElements:['a','b','c'],sessions:2}); await textHas(page,'Контрольные');
 await setState(page,{screen:'review',completed:['alphabet'],lastStudyDate:'2026-10-01',reviewStep:0}); await textHas(page,'А это помнишь?'); await textHas(page,'Пропустить задание');

 await realPronunciation(page);

 await setState(page,{screen:'home',onboardingCompleted:true}); await layout(page,1280,900,'desktop-home'); await layout(page,390,844,'390-home');
 await setState(page,{screen:'onboarding',onboardingManual:true,onboardingStep:2}); await layout(page,390,844,'390-onboarding');
 await setState(page,{screen:'readingControl',readingControlIndex:0}); await layout(page,360,800,'360-reading-control');
 await setState(page,{screen:'numbers',numberStep:10}); await layout(page,320,568,'320-numbers');

 if(failures.length)throw new Error(failures.join('\n'));
 console.log('OTTO Start v17 first-entry/onboarding/three-topic smoke passed.');
}finally{if(browser)await browser.close();}
