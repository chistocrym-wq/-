import { chromium } from 'playwright';
import fs from 'node:fs';

const base=String(process.env.BASE_URL||'').replace(/\/+$/,'');
if(!base) throw new Error('BASE_URL is required');
const url=base+'/base-preview';
const failures=[];
const remember=m=>{failures.push(m);console.error('SMOKE:',m)};
let browser;
fs.mkdirSync('test-artifacts',{recursive:true});

async function setState(page,patch){
  await page.evaluate(v=>window.__OTTO_BASE_PREVIEW_SET_STATE(v),patch);
  await page.waitForTimeout(100);
}
async function has(page,marker){
  const body=(await page.locator('body').innerText()).toLocaleLowerCase('ru-RU');
  if(!body.includes(String(marker).toLocaleLowerCase('ru-RU')))remember('Missing UI marker: '+marker);
}
async function expectAudioClick(page,locator,label){
  const before=await page.evaluate(()=>window.__ottoPlayCount||0);
  const responsePromise=page.waitForResponse(r=>r.url().includes('/api/otto-tts?')&&r.request().method()==='GET',{timeout:15000}).catch(()=>null);
  await locator.click({force:true});
  const response=await responsePromise;
  if(response){
    const ct=response.headers()['content-type']||'';
    console.log('TTS',label,response.status(),ct,response.url());
    if(response.status()!==200)remember(label+' TTS returned HTTP '+response.status());
    if(!ct.toLowerCase().startsWith('audio/'))remember(label+' TTS returned non-audio '+ct);
  }else{
    console.log('TTS',label,'no network response (may be cached)');
  }
  await page.waitForTimeout(250);
  const after=await page.evaluate(()=>window.__ottoPlayCount||0);
  if(after<=before)remember(label+' did not invoke real media playback');
}
async function imageCheck(page,selector,label){
  const r=await page.locator(selector).evaluate(el=>{
    const b=el.getBoundingClientRect(),p=el.parentElement?.getBoundingClientRect();
    const cs=getComputedStyle(el);
    return {vw:window.innerWidth,b:{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom},p:p?{x:p.x,y:p.y,width:p.width,height:p.height,right:p.right,bottom:p.bottom}:null,fit:cs.objectFit};
  }).catch(()=>null);
  if(!r)return remember(label+' image missing');
  if(r.fit!=='contain')remember(label+' must use object-fit: contain');
  if(r.b.x< -2||r.b.right>r.vw+2||r.b.y< -2)remember(label+' image is outside viewport: '+JSON.stringify(r));
}
async function layoutCheck(page,width){
  await page.setViewportSize({width,height:844});
  await page.waitForTimeout(120);
  const r=await page.evaluate(()=>{
    const vw=window.innerWidth, sw=document.documentElement.scrollWidth;
    const bad=[...document.querySelectorAll('input,button,.bp-modal,.bp-bottom,img')].filter(el=>{
      const x=el.getBoundingClientRect();
      return x.width>0 && (x.left < -2 || x.right > vw+2);
    }).slice(0,5).map(el=>({tag:el.tagName,cls:el.className,text:(el.textContent||'').slice(0,40),rect:el.getBoundingClientRect().toJSON?.()||{}}));
    return {vw,sw,bad};
  });
  if(r.sw>r.vw+2)remember('Horizontal overflow at '+width+'px: '+r.sw+' > '+r.vw);
  if(r.bad.length)remember('Elements outside viewport at '+width+'px: '+JSON.stringify(r.bad));
}


async function mobileMetric(page,width,screen,selector){
  await page.setViewportSize({width,height: width===320?568:width===330?700:width===360?800:width===375?812:844});
  await page.waitForTimeout(120);
  const metric=await page.evaluate(({selector,screen})=>{
    const img=document.querySelector(selector);
    const nav=document.querySelector('.bp-bottom');
    const lesson=[...document.querySelectorAll('.bp-lesson-nav button')].map(b=>({text:(b.textContent||'').trim(),r:b.getBoundingClientRect()}));
    const r=img?.getBoundingClientRect();
    const nr=nav?.getBoundingClientRect();
    const vv={w:window.innerWidth,h:window.innerHeight,scrollW:document.documentElement.scrollWidth};
    return {
      screen,viewport:vv,
      otto:r?{w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y),bottom:Math.round(r.bottom)}:null,
      bottomNav:nr?{x:Math.round(nr.x),w:Math.round(nr.width),bottom:Math.round(nr.bottom),visible:nr.left>=-1&&nr.right<=window.innerWidth+1}:null,
      lessonNav:lesson.map(x=>({text:x.text,x:Math.round(x.r.x),w:Math.round(x.r.width),bottom:Math.round(x.r.bottom),visible:x.r.left>=-1&&x.r.right<=window.innerWidth+1}))
    };
  },{selector,screen});
  console.log('MOBILE_METRIC '+width+' '+screen+' '+JSON.stringify(metric));
  await page.screenshot({path:`test-artifacts/${width}-${screen}.png`,fullPage:true});
  if(metric.viewport.scrollW>metric.viewport.w+2)remember(`Horizontal overflow on ${screen} at ${width}px`);
  if(metric.otto && (metric.otto.x<0 || metric.otto.x+metric.otto.w>metric.viewport.w+1))remember(`OTTO outside viewport on ${screen} at ${width}px`);
  if(metric.bottomNav && !metric.bottomNav.visible)remember(`Bottom nav clipped on ${screen} at ${width}px`);
  for(const x of metric.lessonNav) if(!x.visible)remember(`Lesson nav clipped: ${x.text} on ${screen} at ${width}px`);
  return metric;
}

try{
 browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone']});
 const page=await context.newPage();
 page.on('pageerror',e=>remember('pageerror: '+e.message));

 await page.addInitScript(()=>{
   window.__ottoPlayCount=0;
   const original=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(){window.__ottoPlayCount=(window.__ottoPlayCount||0)+1;return original.apply(this,arguments)};
 });

 // Mobile-first walkthrough at 390x844 using real clicks.
 await page.setViewportSize({width:390,height:844});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.evaluate(()=>localStorage.clear());
 await page.reload({waitUntil:'domcontentloaded'});
 await mobileMetric(page,390,'onboarding','.bp-onboard-hero img');
 await page.getByRole('button',{name:/Telegram/}).click();
 await has(page,'Давайте определим ваш уровень');
 await page.getByRole('button',{name:/Начинаю с нуля/}).click();
 await mobileMetric(page,390,'home','.bp-hero img');
 await page.getByRole('button',{name:/Продолжить занятие/}).click();
 await has(page,'Сначала увидим порядок');
 await page.getByRole('button',{name:/Начать с A/}).click();
 await has(page,'Anna');
 await has(page,'← Назад');
 await has(page,'Пропустить задание');
 await has(page,'Вернуться к темам');
 await mobileMetric(page,390,'lesson','.bp-brand img');
 await page.getByRole('button',{name:/← Назад/}).click();
 await page.getByRole('button',{name:/Начать с A/}).click();
 await page.getByRole('button',{name:/Пропустить задание/}).click();
 await page.getByRole('button',{name:/Вернуться к темам/}).click();
 await page.getByRole('button',{name:/Настройки/}).last().click();
 await has(page,'Мой прогресс');

 // Required compact OTTO snapshots at 390 / 360 / 320.
 for(const width of [390,360,320]){
   await setState(page,{screen:'register',regStep:'welcome'});
   await mobileMetric(page,width,'onboarding','.bp-onboard-hero img');
   await setState(page,{screen:'home'});
   await mobileMetric(page,width,'home','.bp-hero img');
   await setState(page,{screen:'readingPraise',readingTestScore:5});
   await mobileMetric(page,width,'praise','.bp-praise img');
   await setState(page,{screen:'alphabet',alphaStep:1});
   await mobileMetric(page,width,'lesson','.bp-brand img');
 }

 await setState(page,{screen:'alphabet',alphaStep:23});
 await has(page,'W');
 await has(page,'Wasser');
 await expectAudioClick(page,page.getByRole('button',{name:/🔊 Буква/}),'W');
 await expectAudioClick(page,page.getByRole('button',{name:/🔊 Wasser/}),'Wasser');

 await setState(page,{screen:'verb',verbStep:5});
 await has(page,'Ich wohne in Berlin.');
 await expectAudioClick(page,page.getByRole('button',{name:/🔊 Послушать/}),'phrase');

 await setState(page,{screen:'numbers'});
 await expectAudioClick(page,page.getByRole('button',{name:/🔊 Послушать/}),'number');
 const beforeRepeat=await page.evaluate(()=>window.__ottoPlayCount||0);
 await page.getByRole('button',{name:/🔊 Послушать/}).click({force:true});
 await page.waitForTimeout(250);
 const afterRepeat=await page.evaluate(()=>window.__ottoPlayCount||0);
 if(afterRepeat<=beforeRepeat)remember('Repeated number listening did not replay audio');

 await setState(page,{screen:'reading',readingRule:3,readingPhase:0});
 await has(page,'sch → «ш»');
 await has(page,'Schule');
 await setState(page,{screen:'reading',readingRule:3,readingPhase:1}); await has(page,'Какое слово');
 await setState(page,{screen:'reading',readingRule:3,readingPhase:2}); await has(page,'Где здесь sch');
 await setState(page,{screen:'reading',readingRule:3,readingPhase:3}); await has(page,'Schrank');
 await setState(page,{screen:'reading',readingRule:3,readingPhase:4}); await has(page,'Напиши то, что услышал');

 await setState(page,{screen:'readingTest',readingTestStep:0}); await has(page,'Уже умеешь читать?');
 await setState(page,{screen:'readingPraise',readingTestScore:5}); await has(page,'ты уже читаешь первые слова');
 await imageCheck(page,'.bp-praise img','Praise OTTO');
 await setState(page,{screen:'home'}); await imageCheck(page,'.bp-hero img','Home OTTO');

 await setState(page,{screen:'pronouns',pronounStep:0});
 for(const m of ['ich','du','er','sie','es','wir','ihr','Sie']) await has(page,m);
 await setState(page,{screen:'pronouns',pronounStep:1}); await has(page,'Ich bin Anna.');
 await setState(page,{screen:'pronouns',pronounStep:3}); await has(page,'du — ты');
 await setState(page,{screen:'pronouns',pronounStep:5}); await has(page,'er — он');
 await setState(page,{screen:'pronouns',pronounStep:7}); await has(page,'sie — она');

 await setState(page,{screen:'verb',verbStep:0}); await has(page,'wohnen — жить');
 await setState(page,{screen:'verb',verbStep:5}); await has(page,'Пока просто посмотри');
 await setState(page,{screen:'verb',verbStep:6}); await has(page,'Ich'); await has(page,'wohne'); await has(page,'in Berlin');

 await setState(page,{screen:'home'});
 for(const width of [320,330,360,375,390,430,520]){await layoutCheck(page,width);await imageCheck(page,'.bp-hero img','Home OTTO '+width+'px')} 
 await setState(page,{screen:'settings'}); for(const width of [320,330,360,390,430,520]) await layoutCheck(page,width);
 await setState(page,{screen:'reading',readingRule:3,readingPhase:3}); for(const width of [320,330,360,390,430,520]) await layoutCheck(page,width);

 // Existing microphone pipeline: record -> stop -> own playback -> pronunciation endpoint.
 await page.setViewportSize({width:390,height:844});
 await setState(page,{screen:'reading',readingRule:3,readingPhase:3});
 await page.getByRole('button',{name:/🎤 Прочитать/}).click({force:true});
 await page.waitForSelector('[data-record]',{timeout:7000});
 await page.click('[data-record]',{force:true});
 await page.waitForSelector('[data-stop]',{timeout:7000});
 await page.waitForTimeout(700);
 const pronResp=page.waitForResponse(r=>r.url().includes('/api/otto-start-pronunciation')&&r.request().method()==='POST',{timeout:20000}).catch(()=>null);
 await page.click('[data-stop]',{force:true});
 await page.waitForSelector('[data-play-own]',{timeout:10000});
 if(!await page.locator('[data-own-audio][controls]').count())remember('Own recording playback missing');
 const pron=await pronResp;
 if(pron)console.log('PRONUNCIATION',pron.status(),(await pron.text().catch(()=>'' )).slice(0,220));
 else remember('No pronunciation response');
 await page.locator('[data-close]').click({force:true});

 await setState(page,{screen:'register',regStep:'welcome'});
 await page.setViewportSize({width:390,height:844});
 await imageCheck(page,'.bp-onboard-hero img','Onboarding OTTO');
 const bodyText=(await page.locator('body').innerText()).toLocaleLowerCase('ru-RU');
 if(bodyText.includes('preview:')||bodyText.includes('демонстрационная'))remember('Developer-facing preview text is visible to learner');

 if(failures.length)throw new Error(failures.join('\n'));
 console.log('OTTO Start revised preview UI/mobile/microphone smoke passed.');
}finally{if(browser)await browser.close();}
