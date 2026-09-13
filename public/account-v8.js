(() => {
  'use strict';
  if (window.__ottoAccountV8) return;
  window.__ottoAccountV8 = true;

  const SESSION_KEY='ottoStartSessionV8';
  const COURSE_KEY='ottoStartCourseV8';
  const LEGACY_KEY='ottoStartLearningPathV2';
  let user=null;
  let providers={email:false,phone:false};
  let syncTimer=null;

  function esc(v=''){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function attr(v=''){return esc(v).replace(/'/g,'&#39;')}
  function token(){try{return localStorage.getItem(SESSION_KEY)||''}catch{return''}}
  function setToken(value){try{if(value)localStorage.setItem(SESSION_KEY,value);else localStorage.removeItem(SESSION_KEY)}catch{}}
  function parse(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
  function toast(text){let el=document.querySelector('.v8-account-toast');if(!el){el=document.createElement('div');el.className='v8-account-toast';el.style.cssText='position:fixed;z-index:23000;left:50%;bottom:90px;transform:translateX(-50%);max-width:min(92vw,520px);background:#173f43;color:#fff;border-radius:14px;padding:11px 14px;font:700 12px/1.4 system-ui;box-shadow:0 12px 36px #0003';document.body.appendChild(el)}el.textContent=text;clearTimeout(el._t);el._t=setTimeout(()=>el.remove(),2600)}

  async function api(action,payload={},authenticated=false){
    const headers={'Content-Type':'application/json'};
    if(authenticated&&token())headers.Authorization=`Bearer ${token()}`;
    const response=await fetch('/api/otto-start-auth',{method:'POST',headers,body:JSON.stringify({action,...payload})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const err=new Error(data.error||'Сервис аккаунта недоступен.');err.code=data.code;err.providers=data.providers;throw err}
    return data;
  }

  async function checkProviders(){try{const d=await api('status');providers=d.providers||providers}catch{}return providers}
  function localProgress(){return{course:parse(COURSE_KEY),legacy:parse(LEGACY_KEY),clientSavedAt:new Date().toISOString()}}
  function courseTime(value){return Number(value?.lastVisit||0)}

  async function saveCloud(silent=true){
    if(!token())return false;
    try{await api('save-progress',{progress:localProgress()},true);if(!silent)toast('Прогресс сохранён в аккаунте.');return true}
    catch(err){if(err?.message?.includes('Сессия')){setToken('');user=null;patch()}else if(!silent)toast(err.message);return false}
  }

  async function mergeCloudAfterLogin(){
    try{
      const d=await api('load-progress',{},true);const cloud=d.progress;
      const localCourse=parse(COURSE_KEY);const cloudCourse=cloud?.course;
      if(cloudCourse&&courseTime(cloudCourse)>courseTime(localCourse)){
        localStorage.setItem(COURSE_KEY,JSON.stringify(cloudCourse));
        if(cloud.legacy)localStorage.setItem(LEGACY_KEY,JSON.stringify(cloud.legacy));
        return 'cloud';
      }
      await saveCloud(true);return 'local';
    }catch{return 'local'}
  }

  async function acceptSession(data){
    const t=data?.session?.token;if(!t)throw new Error('Сессия не создана.');setToken(t);user=data.user||null;
    if(user?.name){const course=parse(COURSE_KEY)||{};if(!course.profileName){course.profileName=user.name;course.lastVisit=Date.now();localStorage.setItem(COURSE_KEY,JSON.stringify(course))}}
    const source=await mergeCloudAfterLogin();closeModal();toast(source==='cloud'?'Прогресс восстановлен из аккаунта.':'Аккаунт подключён. Прогресс синхронизируется.');setTimeout(()=>location.reload(),450)
  }

  async function hydrate(){
    if(!token()){patch();return}
    try{const d=await api('me',{},true);user=d.user||null;await mergeCloudAfterLogin()}catch{setToken('');user=null}patch()
  }

  function styles(){if(document.getElementById('otto-account-v8-style'))return;const s=document.createElement('style');s.id='otto-account-v8-style';s.textContent=`
    .v8-account-card{margin:10px 0;padding:14px;border-radius:18px;background:#fff;border:1px solid #dbe8e6}.v8-account-card b{display:block;color:#173f43}.v8-account-card p{font-size:12px;line-height:1.45;color:#637b7d;margin:4px 0 10px}.v8-account-card button{border:0;border-radius:12px;padding:10px 12px;background:#173f43;color:#fff;font-weight:800}
    .v8-account-overlay{position:fixed;inset:0;z-index:22000;background:#12383c91;backdrop-filter:blur(7px);display:flex;align-items:flex-end;justify-content:center;padding:12px}.v8-account-panel{width:min(580px,100%);max-height:92vh;overflow:auto;background:#f7faf8;border-radius:26px 26px 18px 18px;padding:19px;color:#173f43;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 30px 80px #0004}.v8-account-head{display:flex;align-items:start;justify-content:space-between;gap:12px}.v8-account-head h2{margin:0;font-size:23px}.v8-account-head p{margin:4px 0 0;color:#657c7e;font-size:12px}.v8-account-close{border:0;background:#e8f0ef;width:38px;height:38px;border-radius:12px;font-size:20px}.v8-account-tabs{display:flex;gap:6px;margin:15px 0 11px;overflow:auto}.v8-account-tabs button{border:0;border-radius:99px;padding:8px 11px;background:#e4eeec;color:#50696b;font-weight:800;white-space:nowrap}.v8-account-tabs button.active{background:#173f43;color:white}.v8-account-form{display:grid;gap:9px}.v8-account-form label{font-size:11px;font-weight:850;color:#526d6f}.v8-account-form input,.v8-account-form select{width:100%;box-sizing:border-box;border:1px solid #ccdeda;background:white;border-radius:12px;padding:11px 12px;font:inherit;color:#173f43}.v8-account-form button{border:0;border-radius:13px;padding:12px;background:#158c87;color:white;font-weight:850}.v8-account-form button.secondary{background:#e4f1ef;color:#165c58}.v8-account-form button:disabled{opacity:.5}.v8-account-message{font-size:12px;line-height:1.45;padding:10px 11px;border-radius:12px;background:#edf5f4;color:#476669;margin:8px 0}.v8-account-message.warn{background:#fff5dc;color:#775b13}.v8-account-user{background:white;border:1px solid #dbe8e6;border-radius:18px;padding:15px;margin-top:14px}.v8-account-user strong{font-size:17px}.v8-account-user span{display:block;color:#6b8082;font-size:12px;margin-top:3px}.v8-account-actions{display:grid;gap:8px;margin-top:12px}.v8-account-actions button{border:0;border-radius:13px;padding:12px;font-weight:850;background:#e4f1ef;color:#155d59}.v8-account-actions button.danger{background:#fff0ed;color:#984338}.v8-channel{display:grid;grid-template-columns:1fr 1fr;gap:7px}.v8-channel button{border:1px solid #d5e3e0;background:white;color:#456466}.v8-channel button.active{background:#dff2ef;color:#0d6e68;border-color:#8ac5be}.v8-provider-note{font-size:11px;color:#75898b;margin-top:-3px}
  `;document.head.appendChild(s)}

  function modalShell(){let overlay=document.querySelector('.v8-account-overlay');if(overlay)return overlay;overlay=document.createElement('div');overlay.className='v8-account-overlay';overlay.setAttribute('data-no-word-tap','1');overlay.innerHTML='<section class="v8-account-panel" role="dialog" aria-modal="true"><div class="v8-account-head"><div><h2>Аккаунт Otto Start</h2><p>Прогресс можно продолжить после повторного входа на другом устройстве.</p></div><button class="v8-account-close" type="button" aria-label="Закрыть">×</button></div><div data-account-body></div></section>';document.body.appendChild(overlay);overlay.querySelector('.v8-account-close').addEventListener('click',closeModal);overlay.addEventListener('click',e=>{if(e.target===overlay)closeModal()});return overlay}
  function closeModal(){document.querySelector('.v8-account-overlay')?.remove()}
  function message(root,text,warn=false){const slot=root.querySelector('[data-account-message]');if(slot){slot.textContent=text;slot.className=`v8-account-message${warn?' warn':''}`}}

  function renderLoggedIn(){const overlay=modalShell(),body=overlay.querySelector('[data-account-body]');body.innerHTML=`<div class="v8-account-user"><strong>${esc(user?.name||'Пользователь Otto Start')}</strong><span>${esc(user?.login||'')}</span><div class="v8-account-actions"><button type="button" data-account-sync>☁ Сохранить прогресс сейчас</button><button type="button" class="danger" data-account-logout>Выйти из аккаунта</button></div></div><div class="v8-account-message">При обычном обучении прогресс синхронизируется автоматически. Офлайн можно продолжать заниматься; синхронизация выполнится после возвращения сети.</div>`}

  function registerForm(mode='register',channel='email'){const p=providers;const isReset=mode==='reset';return `<div class="v8-account-tabs"><button type="button" data-account-tab="login">Вход</button><button type="button" data-account-tab="register" class="${!isReset?'active':''}">Регистрация</button><button type="button" data-account-tab="reset" class="${isReset?'active':''}">Забыли пароль?</button></div><form class="v8-account-form" data-account-form="${mode}"><div class="v8-channel"><button type="button" data-account-channel="email" class="${channel==='email'?'active':''}">Email</button><button type="button" data-account-channel="phone" class="${channel==='phone'?'active':''}">Телефон</button></div><div class="v8-provider-note">${channel==='email'?(p.email?'Коды на email подключены.':'Отправка email-кодов пока не подключена.'):(p.phone?'SMS-коды подключены.':'Отправка SMS-кодов пока не подключена.')}</div>${!isReset?'<label>Имя</label><input name="name" autocomplete="name" placeholder="Как к вам обращаться">':''}<label>${channel==='email'?'Email':'Телефон'}</label><input name="login" type="${channel==='email'?'email':'tel'}" autocomplete="${channel==='email'?'email':'tel'}" placeholder="${channel==='email'?'name@example.com':'+49123456789'}" required><button type="button" class="secondary" data-account-request-code ${p[channel]?'':'disabled'}>Получить код</button><label>Код подтверждения</label><input name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 цифр" required><label>${isReset?'Новый пароль':'Создайте пароль'}</label><input name="password" type="password" minlength="8" autocomplete="${isReset?'new-password':'new-password'}" placeholder="Минимум 8 символов" required><button type="submit">${isReset?'Сохранить новый пароль':'Создать аккаунт'}</button><div data-account-message class="v8-account-message${p[channel]?'':' warn'}">${p[channel]?'Сначала запросите код подтверждения.':'Для реальной регистрации нужен подключённый провайдер доставки кода. Учиться без аккаунта можно уже сейчас.'}</div></form>`}

  function loginForm(){return `<div class="v8-account-tabs"><button type="button" data-account-tab="login" class="active">Вход</button><button type="button" data-account-tab="register">Регистрация</button><button type="button" data-account-tab="reset">Забыли пароль?</button></div><form class="v8-account-form" data-account-form="login"><label>Телефон или email</label><input name="login" autocomplete="username" placeholder="Email или +49123456789" required><label>Пароль</label><input name="password" type="password" autocomplete="current-password" required><button type="submit">Войти</button><div data-account-message class="v8-account-message">После входа Otto восстановит сохранённый прогресс.</div></form>`}

  async function renderAuth(mode='login',channel='email'){await checkProviders();const overlay=modalShell(),body=overlay.querySelector('[data-account-body]');body.innerHTML=mode==='login'?loginForm():registerForm(mode,channel)}
  async function openAccount(){if(token()&&user){renderLoggedIn();return}if(token()&&!user){try{const d=await api('me',{},true);user=d.user}catch{setToken('')}}if(user)renderLoggedIn();else await renderAuth('login')}

  async function requestCode(button){const form=button.closest('form');const channel=form.querySelector('[data-account-channel].active')?.dataset.accountChannel||'email';const login=form.elements.login.value.trim();const purpose=form.dataset.accountForm==='reset'?'reset':'register';button.disabled=true;button.textContent='Отправляю…';try{const d=await api('request-code',{channel,login,purpose});message(form,d.message||'Код отправлен.');}catch(err){if(err.providers)providers=err.providers;message(form,err.message,true)}finally{button.disabled=!providers[channel];button.textContent='Получить код'}}

  async function submit(form){const mode=form.dataset.accountForm;const button=form.querySelector('button[type=submit]');button.disabled=true;const fd=new FormData(form);try{if(mode==='login'){const d=await api('login',{login:fd.get('login'),password:fd.get('password')});await acceptSession(d);return}const channel=form.querySelector('[data-account-channel].active')?.dataset.accountChannel||'email';const payload={channel,login:fd.get('login'),code:fd.get('code'),password:fd.get('password')};if(mode==='register')payload.name=fd.get('name');const d=await api(mode==='reset'?'reset':'register',payload);await acceptSession(d)}catch(err){message(form,err.message,true);button.disabled=false}}

  async function logout(){try{await api('logout',{},true)}catch{}setToken('');user=null;closeModal();toast('Вы вышли из аккаунта. Локальный прогресс на этом устройстве сохранён.');patch()}

  function accountCardHtml(){return `<div class="v8-account-card" data-v8-account-card><b>${user?'Аккаунт подключён':'Сохранить прогресс в аккаунте'}</b><p>${user?`${esc(user.name||user.login)} · автоматическая синхронизация включена`:'Вход по телефону или email позволит продолжить с другого устройства.'}</p><button type="button" data-account-open>${user?'Управление аккаунтом':'Войти / зарегистрироваться'}</button></div>`}
  function patch(){
    const grid=document.querySelector('#app .menu-grid');if(grid&&!grid.querySelector('[data-account-open]'))grid.insertAdjacentHTML('beforeend',`<button class="menu-card" type="button" data-account-open><span>☁</span><b>${user?'Аккаунт':'Войти / регистрация'}</b><small>${user?'Прогресс синхронизируется':'Телефон или email'}</small></button>`);
    const layer=document.getElementById('otto-v8-layer');if(layer&&/Личный кабинет на устройстве|Ваш прогресс|ваш прогресс/i.test(layer.textContent||'')&&!layer.querySelector('[data-v8-account-card]')){const note=layer.querySelector('.v8-note');note?.insertAdjacentHTML('beforebegin',accountCardHtml())}
  }

  document.addEventListener('click',e=>{
    const open=e.target.closest?.('[data-account-open]');if(open){e.preventDefault();e.stopImmediatePropagation();void openAccount();return}
    const tab=e.target.closest?.('[data-account-tab]');if(tab){e.preventDefault();void renderAuth(tab.dataset.accountTab,'email');return}
    const channel=e.target.closest?.('[data-account-channel]');if(channel){e.preventDefault();const mode=channel.closest('form')?.dataset.accountForm||'register';void renderAuth(mode,channel.dataset.accountChannel);return}
    const code=e.target.closest?.('[data-account-request-code]');if(code){e.preventDefault();void requestCode(code);return}
    const sync=e.target.closest?.('[data-account-sync]');if(sync){e.preventDefault();void saveCloud(false);return}
    const out=e.target.closest?.('[data-account-logout]');if(out){e.preventDefault();void logout();return}
  },true);
  document.addEventListener('submit',e=>{const form=e.target.closest?.('[data-account-form]');if(!form)return;e.preventDefault();void submit(form)},true);

  window.addEventListener('otto:v8-progress',()=>{if(!token())return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>void saveCloud(true),2200)});
  window.addEventListener('online',()=>{if(token())void saveCloud(true)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&token())void saveCloud(true);else patch()});
  const app=document.getElementById('app');if(app)new MutationObserver(()=>requestAnimationFrame(patch)).observe(app,{childList:true,subtree:true});
  const bodyObserver=new MutationObserver(()=>requestAnimationFrame(patch));bodyObserver.observe(document.body,{childList:true,subtree:true});

  styles();patch();void hydrate();
  window.OttoAccountV8={open:openAccount,sync:()=>saveCloud(false),user:()=>user};
})();
