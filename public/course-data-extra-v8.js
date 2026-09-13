(() => {
  'use strict';
  const D=window.OttoCourseDataV8;if(!D||D.__extraV8)return;D.__extraV8=true;
  const w=(id,de,ru,example,exampleRu,plural='')=>({id,de,ru,example,exampleRu,plural});
  const p=(id,de,ru)=>({id,de,ru});
  const extra=[
    {id:'daily-life',icon:'🌅',title:'Мой день',goal:'рассказать о простом распорядке дня и понять бытовые действия',words:[
      w('aufstehen','aufstehen','вставать','Ich stehe um sieben Uhr auf.','Я встаю в семь часов.'),
      w('schlafen','schlafen','спать','Ich schlafe acht Stunden.','Я сплю восемь часов.'),
      w('duschen','duschen','принимать душ','Am Morgen dusche ich.','Утром я принимаю душ.'),
      w('waschen','waschen','мыть / стирать','Ich wasche meine Hände.','Я мою руки.'),
      w('anziehen','sich anziehen','одеваться','Ich ziehe mich an.','Я одеваюсь.'),
      w('fruehstuecken','frühstücken','завтракать','Ich frühstücke um acht.','Я завтракаю в восемь.'),
      w('kochen','kochen','готовить','Am Abend koche ich.','Вечером я готовлю.'),
      w('einkaufen','einkaufen','делать покупки','Nach der Arbeit kaufe ich ein.','После работы я делаю покупки.'),
      w('beginnen','beginnen','начинаться / начинать','Der Kurs beginnt um neun.','Курс начинается в девять.'),
      w('enden','enden','заканчиваться','Die Arbeit endet um fünf.','Работа заканчивается в пять.'),
      w('frueh','früh','рано','Ich stehe früh auf.','Я встаю рано.'),
      w('spaet-daily','spät','поздно','Heute komme ich spät.','Сегодня я приду поздно.'),
      w('morgens','morgens','по утрам','Morgens trinke ich Kaffee.','По утрам я пью кофе.'),
      w('mittags','mittags','днём / в обед','Mittags esse ich in der Firma.','В обед я ем на работе.'),
      w('abends','abends','по вечерам','Abends lese ich.','По вечерам я читаю.'),
      w('taeglich','täglich','ежедневно','Ich lerne täglich Deutsch.','Я ежедневно учу немецкий.'),
      w('immer','immer','всегда','Ich frühstücke immer zu Hause.','Я всегда завтракаю дома.'),
      w('oft','oft','часто','Ich gehe oft spazieren.','Я часто гуляю.'),
      w('manchmal','manchmal','иногда','Manchmal fahre ich mit dem Bus.','Иногда я еду на автобусе.'),
      w('nie','nie','никогда','Ich trinke nie Kaffee am Abend.','Я никогда не пью кофе вечером.'),
      w('zuhause','zu Hause','дома','Am Sonntag bin ich zu Hause.','В воскресенье я дома.'),
      w('weg','weg','вне дома / прочь','Heute bin ich den ganzen Tag weg.','Сегодня меня весь день нет дома.'),
      w('alltag','der Alltag','повседневная жизнь','Mein Alltag ist einfach.','Моя повседневная жизнь простая.')
    ],phrases:[
      p('wann-stehen','Wann stehen Sie auf?','Когда Вы встаёте?'),p('ich-stehe-auf','Ich stehe um sieben Uhr auf.','Я встаю в семь часов.'),
      p('was-machen-morgen','Was machen Sie am Morgen?','Что Вы делаете утром?'),p('nach-arbeit','Nach der Arbeit kaufe ich ein.','После работы я делаю покупки.'),
      p('am-abend','Am Abend bin ich zu Hause.','Вечером я дома.')
    ]},
    {id:'services',icon:'🏤',title:'Услуги и связь',goal:'понять почту, банк, телефон и простую просьбу об услуге',words:[
      w('dienstleistung','die Dienstleistung','услуга','Diese Dienstleistung kostet fünf Euro.','Эта услуга стоит пять евро.','die Dienstleistungen'),
      w('post-service','die Post','почта','Die Post ist bis sechs Uhr offen.','Почта открыта до шести.'),
      w('briefmarke','die Briefmarke','почтовая марка','Ich brauche eine Briefmarke.','Мне нужна почтовая марка.','die Briefmarken'),
      w('paket','das Paket','посылка','Ich möchte ein Paket schicken.','Я хочу отправить посылку.','die Pakete'),
      w('brief-service','der Brief','письмо','Der Brief ist für Sie.','Письмо для Вас.','die Briefe'),
      w('schicken','schicken','отправлять','Ich schicke eine E-Mail.','Я отправляю e-mail.'),
      w('bekommen','bekommen','получать','Ich bekomme morgen das Paket.','Я получу посылку завтра.'),
      w('abholen','abholen','забирать','Ich hole das Paket ab.','Я забираю посылку.'),
      w('bank-service','die Bank','банк','Die Bank ist neben der Post.','Банк рядом с почтой.','die Banken'),
      w('konto','das Konto','банковский счёт','Ich habe ein Konto.','У меня есть счёт.','die Konten'),
      w('geldautomat','der Geldautomat','банкомат','Wo ist ein Geldautomat?','Где банкомат?','die Geldautomaten'),
      w('amt','das Amt','ведомство / учреждение','Ich habe einen Termin beim Amt.','У меня запись в ведомство.','die Ämter'),
      w('rathaus','das Rathaus','ратуша / городская администрация','Das Rathaus ist im Zentrum.','Ратуша находится в центре.','die Rathäuser'),
      w('information','die Information','информация / справочная','Fragen Sie an der Information.','Спросите в справочной.','die Informationen'),
      w('oeffnungszeit','die Öffnungszeit','время работы','Wie sind die Öffnungszeiten?','Какое время работы?','die Öffnungszeiten'),
      w('geoeffnet','geöffnet','открыто','Die Bank ist geöffnet.','Банк открыт.'),
      w('geschlossen','geschlossen','закрыто','Heute ist die Post geschlossen.','Сегодня почта закрыта.'),
      w('anrufen','anrufen','звонить','Ich rufe morgen an.','Я позвоню завтра.'),
      w('telefonieren','telefonieren','говорить по телефону','Ich telefoniere mit meiner Mutter.','Я разговариваю по телефону с мамой.'),
      w('nachricht','die Nachricht','сообщение','Ich habe eine Nachricht.','У меня сообщение.','die Nachrichten'),
      w('hilfe','die Hilfe','помощь','Danke für Ihre Hilfe.','Спасибо за Вашу помощь.'),
      w('warten','warten','ждать','Bitte warten Sie hier.','Пожалуйста, подождите здесь.'),
      w('brauchen','brauchen','нуждаться / нужно','Ich brauche Hilfe.','Мне нужна помощь.'),
      w('unterschreiben','unterschreiben','подписывать','Bitte unterschreiben Sie hier.','Пожалуйста, подпишите здесь.')
    ],phrases:[
      p('briefmarke-bitte','Eine Briefmarke, bitte.','Одну марку, пожалуйста.'),p('paket-schicken','Ich möchte dieses Paket schicken.','Я хочу отправить эту посылку.'),
      p('oeffnungszeiten','Wie sind die Öffnungszeiten?','Какое время работы?'),p('ich-rufe-an','Ich rufe morgen an.','Я позвоню завтра.'),
      p('ich-brauche-hilfe','Ich brauche Hilfe.','Мне нужна помощь.')
    ]},
    {id:'travel-hotel',icon:'🧳',title:'Поездка и отель',goal:'забронировать простой номер и понять основную информацию о поездке',words:[
      w('urlaub-travel','der Urlaub','отпуск','Im August habe ich Urlaub.','В августе у меня отпуск.'),
      w('ferien','die Ferien','каникулы / отпуск','Die Ferien beginnen im Juli.','Каникулы начинаются в июле.'),
      w('reisen','reisen','путешествовать','Ich reise gern.','Я люблю путешествовать.'),
      w('hotel-travel','das Hotel','отель','Unser Hotel ist im Zentrum.','Наш отель в центре.','die Hotels'),
      w('rezeption','die Rezeption','стойка регистрации','Die Rezeption ist dort.','Стойка регистрации там.','die Rezeptionen'),
      w('einzelzimmer','das Einzelzimmer','одноместный номер','Ich brauche ein Einzelzimmer.','Мне нужен одноместный номер.','die Einzelzimmer'),
      w('doppelzimmer','das Doppelzimmer','двухместный номер','Wir möchten ein Doppelzimmer.','Мы хотим двухместный номер.','die Doppelzimmer'),
      w('reservieren','reservieren','бронировать','Ich möchte ein Zimmer reservieren.','Я хочу забронировать номер.'),
      w('buchen','buchen','бронировать','Wir buchen das Hotel online.','Мы бронируем отель онлайн.'),
      w('bleiben','bleiben','оставаться','Wir bleiben drei Nächte.','Мы остаёмся на три ночи.'),
      w('nacht-travel','die Nacht','ночь','Das Zimmer kostet 80 Euro pro Nacht.','Номер стоит 80 евро за ночь.','die Nächte'),
      w('fruehstueck-travel','das Frühstück','завтрак','Ist das Frühstück inklusive?','Завтрак включён?'),
      w('schluessel-travel','der Schlüssel','ключ','Hier ist Ihr Schlüssel.','Вот Ваш ключ.','die Schlüssel'),
      w('zimmernummer','die Zimmernummer','номер комнаты','Meine Zimmernummer ist 214.','Номер моей комнаты 214.','die Zimmernummern'),
      w('gast','der Gast','гость','Der Gast wartet an der Rezeption.','Гость ждёт у стойки.','die Gäste'),
      w('frei-travel','frei','свободно','Ist noch ein Zimmer frei?','Есть ещё свободный номер?'),
      w('besetzt','besetzt','занято','Das Zimmer ist besetzt.','Номер занят.'),
      w('flugzeug','das Flugzeug','самолёт','Das Flugzeug fliegt um zehn.','Самолёт вылетает в десять.','die Flugzeuge'),
      w('flug','der Flug','рейс / полёт','Mein Flug ist um neun.','Мой рейс в девять.','die Flüge'),
      w('fliegen','fliegen','лететь','Wir fliegen nach Berlin.','Мы летим в Берлин.'),
      w('ticket-travel','das Ticket','билет','Ich habe mein Ticket.','У меня есть билет.','die Tickets'),
      w('koffer-travel','der Koffer','чемодан','Der Koffer ist schwer.','Чемодан тяжёлый.','die Koffer'),
      w('gepaeck-travel','das Gepäck','багаж','Wo ist mein Gepäck?','Где мой багаж?'),
      w('plan','der Plan','план / схема','Hier ist der Stadtplan.','Вот план города.','die Pläne')
    ],phrases:[
      p('zimmer-reservieren','Ich möchte ein Zimmer reservieren.','Я хочу забронировать номер.'),p('zimmer-frei','Haben Sie ein Zimmer frei?','У Вас есть свободный номер?'),
      p('drei-naechte','Wir bleiben drei Nächte.','Мы остаёмся на три ночи.'),p('fruehstueck-inklusive','Ist das Frühstück inklusive?','Завтрак включён?'),
      p('mein-flug','Mein Flug ist um neun Uhr.','Мой рейс в девять часов.')
    ]},
    {id:'environment',icon:'🌳',title:'Окружающий мир',goal:'понимать простые слова о природе, животных и месте вокруг себя',words:[
      w('umwelt','die Umwelt','окружающая среда','Die Umwelt ist wichtig.','Окружающая среда важна.'),
      w('natur','die Natur','природа','Ich bin gern in der Natur.','Я люблю бывать на природе.'),
      w('tier','das Tier','животное','Das Tier ist klein.','Животное маленькое.','die Tiere'),
      w('hund','der Hund','собака','Der Hund ist freundlich.','Собака дружелюбная.','die Hunde'),
      w('katze','die Katze','кошка','Die Katze schläft.','Кошка спит.','die Katzen'),
      w('vogel','der Vogel','птица','Der Vogel ist im Garten.','Птица в саду.','die Vögel'),
      w('baum','der Baum','дерево','Der Baum ist groß.','Дерево большое.','die Bäume'),
      w('blume','die Blume','цветок','Die Blume ist schön.','Цветок красивый.','die Blumen'),
      w('wald','der Wald','лес','Wir gehen in den Wald.','Мы идём в лес.','die Wälder'),
      w('meer','das Meer','море','Im Sommer fahren wir ans Meer.','Летом мы едем к морю.'),
      w('berg','der Berg','гора','Der Berg ist hoch.','Гора высокая.','die Berge'),
      w('see','der See','озеро','Der See ist hier.','Озеро здесь.','die Seen'),
      w('fluss','der Fluss','река','Der Fluss ist lang.','Река длинная.','die Flüsse'),
      w('draussen','draußen','на улице / снаружи','Heute sind wir draußen.','Сегодня мы на улице.'),
      w('luft','die Luft','воздух','Die Luft ist kalt.','Воздух холодный.'),
      w('hoch','hoch','высокий','Der Berg ist hoch.','Гора высокая.'),
      w('lang','lang','длинный','Der Weg ist lang.','Дорога длинная.'),
      w('kurz','kurz','короткий','Der Weg ist kurz.','Дорога короткая.'),
      w('alt-env','alt','старый / пожилой','Der Baum ist alt.','Дерево старое.'),
      w('jung','jung','молодой','Der Hund ist jung.','Собака молодая.'),
      w('freundlich','freundlich','дружелюбный','Der Nachbar ist freundlich.','Сосед дружелюбный.'),
      w('wichtig','wichtig','важный','Deutsch ist für mich wichtig.','Немецкий для меня важен.')
    ],phrases:[
      p('gern-natur','Ich bin gern in der Natur.','Я люблю бывать на природе.'),p('wetter-schoen','Das Wetter ist schön.','Погода хорошая.'),
      p('gehen-wald','Wir gehen in den Wald.','Мы идём в лес.'),p('fahren-meer','Wir fahren ans Meer.','Мы едем к морю.')
    ]}
  ];
  D.topics.push(...extra);
  D.topic=(id)=>D.topics.find(t=>t.id===id)||null;
  D.version='8.1.0';
})();
