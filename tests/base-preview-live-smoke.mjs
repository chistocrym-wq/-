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
  await page.setViewportSize({width,height:width===320?568:width===330?700:width===360?800:width===375?812:844});
  await page.waitForTimeout(100);
  const r=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth}));
  if(r.sw>r.vw+2)remember('Horizontal overflow at '+width+'px');
}

try{
  browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
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

  // Alphabet is compact and immediately practical.
  await has(page,'A–Z');
  await has(page,'Ä Ö Ü ß');
  await page.getByRole('button',{name:/Попробуем на имени/}).click();
  await has(page,'Как продиктовать имя Anna');
  await page.getByRole('button',{name:/Теперь своё имя/}).click();
  await page.locator('#firstNameInput').fill('Julia');
  await page.getByRole('button',{name:/Разобрать по буквам/}).click();
  for(const m of ['J','U','L','I','A']) await has(page,m);
  await page.getByRole('button',{name:/Дальше: фамилия/}).click();
  await page.locator('#lastNameInput').fill('Petrova');
  await page.getByRole('button',{name:/Разобрать по буквам/}).click();
  await has(page,'Petrova');

  await setState(page,{screen:'alphabet',alphaStep:6});
  for(const m of ['J','V','W','Y','Z','Ä','Ö','Ü','ß']) await has(page,m);
  await setState(page,{screen:'alphabet',alphaStep:8});
  await has(page,'Wasser');
  await has(page,'wohnen');
  await has(page,'wo');

  // Only four reading rules in this preview.
  for(const [idx,marker] of [[0,'Wasser'],[1,'heißen'],[2,'sieben'],[3,'Schule']]){
    await setState(page,{screen:'reading',readingRule:idx,readingPhase:0,readingRecallStep:0});
    await has(page,marker);
  }
  await setState(page,{screen:'reading',readingRule:4,readingPhase:0,readingRecallStep:0});
  await has(page,'А это помнишь?');
  await has(page,'wo');
  await setState(page,{screen:'reading',readingRule:4,readingPhase:0,readingRecallStep:1});
  await has(page,'Preis');

  await setState(page,{screen:'readingTest',readingTestStep:0,readingTestScore:0});
  await has(page,'Уже умеешь читать?');
  await setState(page,{screen:'readingPraise',readingTestScore:4});
  await has(page,'ты уже можешь читать первые немецкие слова');

  // Vocabulary order: nouns -> pronouns -> verbs.
  await setState(page,{screen:'noun',nounStep:0});
  await has(page,'die Familie');
  await has(page,'der Mann');
  await has(page,'die Frau');
  await has(page,'das Kind');
  await has(page,'der Freund');

  await setState(page,{screen:'pronouns',pronounStep:0});
  for(const m of ['ich','du','er','sie','es','wir','ihr','Sie']) await has(page,m);
  await setState(page,{screen:'pronouns',pronounStep:3}); await has(page,'Sie — Вы');

  await setState(page,{screen:'verb',verbStep:0});
  for(const m of ['heißen','kommen','wohnen','sprechen','lernen']) await has(page,m);
  await setState(page,{screen:'verb',verbStep:3}); await has(page,'Ich wohne in Berlin.');

  // First sentence appears immediately after verbs.
  await setState(page,{screen:'sentence',sentenceStep:0});
  await has(page,'КТО + ЧТО ДЕЛАЕТ + ОСТАЛЬНОЕ');
  await setState(page,{screen:'sentence',sentenceStep:1});
  await has(page,'Ich wohne in Berlin.');

  // Then one question word, one preposition chunk, one conjunction.
  await setState(page,{screen:'question',questionStep:0}); await has(page,'Wo? — где?');
  await setState(page,{screen:'question',questionStep:1}); await has(page,'Wo wohnen Sie?');
  await setState(page,{screen:'preposition',prepositionStep:0}); await has(page,'aus Russland');
  await setState(page,{screen:'conjunction',conjunctionStep:1}); await has(page,'Ich komme aus Russland und wohne in Berlin.');

  // Free navigation remains visible and layout is not regressed.
  await setState(page,{screen:'sentence',sentenceStep:1});
  await has(page,'← Назад');
  await has(page,'Пропустить задание');
  await has(page,'Вернуться к темам');
  for(const width of [320,330,360,375,390,430,520]) await layoutCheck(page,width);

  if(failures.length)throw new Error(failures.join('\n'));
  console.log('Merged OTTO Start methodology preview smoke passed.');
}finally{
  if(browser)await browser.close();
}
