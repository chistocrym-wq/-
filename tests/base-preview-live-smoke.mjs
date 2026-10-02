import { chromium } from 'playwright';

const base=String(process.env.BASE_URL||'').replace(/\/+$/,'');
if(!base) throw new Error('BASE_URL is required');
const url=base+'/base-preview';
const failures=[];
const remember=m=>{failures.push(m);console.error('SMOKE:',m)};
let browser;

async function setState(page,patch){
  await page.evaluate(v=>window.__OTTO_BASE_PREVIEW_SET_STATE(v),patch);
  await page.waitForTimeout(100);
}
async function has(page,marker){
  const body=(await page.locator('body').innerText()).toLocaleLowerCase('ru-RU');
  if(!body.includes(String(marker).toLocaleLowerCase('ru-RU')))remember('Missing UI marker: '+marker);
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

try{
 browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone']});
 const page=await context.newPage();
 page.on('pageerror',e=>remember('pageerror: '+e.message));

 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.evaluate(()=>localStorage.clear());
 await page.reload({waitUntil:'domcontentloaded'});

 await page.getByRole('button',{name:/Telegram/}).click();
 await page.getByRole('button',{name:/Начинаю с нуля/}).click();
 await has(page,'Ваш прогресс');
 await page.getByRole('button',{name:/Продолжить занятие/}).click();
 await has(page,'Сначала увидим порядок');
 for(const m of ['A','B','C','Z','Ä','Ö','Ü','ß']) await has(page,m);

 await setState(page,{screen:'alphabet',alphaStep:1});
 await has(page,'A');
 await has(page,'Anna');

 const ttsResp=page.waitForResponse(r=>r.url().includes('/api/otto-tts?')&&r.request().method()==='GET',{timeout:15000}).catch(()=>null);
 await page.getByRole('button',{name:/🔊 Буква/}).click();
 const tts=await ttsResp;
 if(!tts)remember('No TTS request after letter click');
 else console.log('TTS LETTER',tts.status(),tts.headers()['content-type']||'');

 await setState(page,{screen:'reading',readingRule:0,readingPhase:0});
 await has(page,'sch → «ш»');
 await has(page,'Schule');
 await setState(page,{screen:'reading',readingRule:0,readingPhase:1}); await has(page,'Какое слово');
 await setState(page,{screen:'reading',readingRule:0,readingPhase:2}); await has(page,'Где здесь sch');
 await setState(page,{screen:'reading',readingRule:0,readingPhase:3}); await has(page,'Schrank');
 await setState(page,{screen:'reading',readingRule:0,readingPhase:4}); await has(page,'Напиши то, что услышал');

 await setState(page,{screen:'readingTest',readingTestStep:0}); await has(page,'Уже умеешь читать?');
 await setState(page,{screen:'readingPraise'}); await has(page,'ты уже читаешь первые слова');
 const otto=await page.locator('.bp-praise img').boundingBox();
 if(!otto||otto.y<0||otto.x<0||otto.x+otto.width>390+2)remember('Praise OTTO is cropped/offscreen at 390px');

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
 for(const width of [320,330,360,375,390,430,520]) await layoutCheck(page,width);
 await setState(page,{screen:'settings'}); for(const width of [320,330,360,390,430,520]) await layoutCheck(page,width);
 await setState(page,{screen:'reading',readingRule:0,readingPhase:3}); for(const width of [320,330,360,390,430,520]) await layoutCheck(page,width);

 // Existing microphone pipeline: record -> stop -> own playback -> pronunciation endpoint.
 await page.setViewportSize({width:390,height:844});
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

 if(failures.length)throw new Error(failures.join('\n'));
 console.log('OTTO Start revised preview UI/mobile/microphone smoke passed.');
}finally{if(browser)await browser.close();}
