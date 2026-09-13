(() => {
  'use strict';
  const D=window.OttoCourseDataV8;if(!D||D.__coreV8)return;D.__coreV8=true;
  const w=(id,de,ru,example,exampleRu,plural='')=>({id,de,ru,example,exampleRu,plural});
  const p=(id,de,ru)=>({id,de,ru});
  const topics=[
    {id:'questions-actions',icon:'❓',title:'Вопросы и базовые действия',goal:'понимать основные вопросительные слова и строить простые повседневные фразы',words:[
      w('wer','wer','кто','Wer ist das?','Кто это?'),
      w('was-core','was','что','Was machen Sie?','Что Вы делаете?'),
      w('wo-core','wo','где','Wo wohnen Sie?','Где Вы живёте?'),
      w('wohin','wohin','куда','Wohin fahren Sie?','Куда Вы едете?'),
      w('woher','woher','откуда','Woher kommen Sie?','Откуда Вы?'),
      w('wann-core','wann','когда','Wann beginnt der Kurs?','Когда начинается курс?'),
      w('wie-core','wie','как','Wie heißen Sie?','Как Вас зовут?'),
      w('warum','warum','почему','Warum lernen Sie Deutsch?','Почему Вы учите немецкий?'),
      w('welcher','welcher / welche / welches','какой / какая / какое','Welcher Bus fährt ins Zentrum?','Какой автобус едет в центр?'),
      w('wieviel','wie viel','сколько','Wie viel kostet das?','Сколько это стоит?'),
      w('sein','sein','быть','Ich bin heute zu Hause.','Сегодня я дома.'),
      w('haben','haben','иметь','Ich habe zwei Kinder.','У меня двое детей.'),
      w('koennen','können','мочь / уметь','Können Sie mir helfen?','Вы можете мне помочь?'),
      w('muessen','müssen','быть должным / нужно','Ich muss heute arbeiten.','Мне нужно сегодня работать.'),
      w('wollen','wollen','хотеть','Wir wollen nach Berlin fahren.','Мы хотим поехать в Берлин.'),
      w('moechten-core','möchten','хотеть (вежливо)','Ich möchte einen Kaffee.','Я хотел(а) бы кофе.'),
      w('duerfen','dürfen','можно / иметь разрешение','Darf ich hier warten?','Можно мне здесь подождать?'),
      w('machen','machen','делать','Was machen Sie heute?','Что Вы делаете сегодня?'),
      w('gehen','gehen','идти','Ich gehe zur Arbeit.','Я иду на работу.'),
      w('kommen-core','kommen','приходить / приезжать','Wann kommen Sie?','Когда Вы придёте?'),
      w('geben','geben','давать / иметься','Gibt es hier eine Apotheke?','Здесь есть аптека?'),
      w('nehmen','nehmen','брать','Ich nehme den Bus.','Я поеду на автобусе.'),
      w('bringen','bringen','приносить / привозить','Bitte bringen Sie Ihren Pass.','Пожалуйста, принесите паспорт.'),
      w('zeigen','zeigen','показывать','Zeigen Sie bitte Ihren Pass.','Покажите, пожалуйста, паспорт.'),
      w('sagen','sagen','сказать','Sagen Sie das bitte noch einmal.','Скажите это ещё раз, пожалуйста.'),
      w('fragen','fragen','спрашивать','Ich möchte etwas fragen.','Я хотел(а) бы кое-что спросить.'),
      w('antworten','antworten','отвечать','Bitte antworten Sie.','Пожалуйста, ответьте.'),
      w('kennen','kennen','знать / быть знакомым','Kennen Sie Berlin?','Вы знаете Берлин?'),
      w('wissen','wissen','знать (информацию)','Ich weiß es nicht.','Я не знаю.'),
      w('finden-core','finden','находить / считать','Wie finden Sie den Kurs?','Как Вам курс?'),
      w('moegen','mögen','любить / нравиться','Ich mag Kaffee.','Мне нравится кофе.'),
      w('brauchen-core','brauchen','нуждаться','Ich brauche einen Termin.','Мне нужна запись.'),
      w('oeffnen','öffnen','открывать','Öffnen Sie bitte das Fenster.','Откройте, пожалуйста, окно.'),
      w('schliessen','schließen','закрывать','Schließen Sie bitte die Tür.','Закройте, пожалуйста, дверь.'),
      w('sitzen','sitzen','сидеть','Ich sitze hier.','Я сижу здесь.'),
      w('stehen-core','stehen','стоять','Der Bus steht dort.','Автобус стоит там.'),
      w('liegen','liegen','лежать / находиться','Das Buch liegt auf dem Tisch.','Книга лежит на столе.')
    ],phrases:[
      p('gibt-es','Gibt es hier ...?','Здесь есть ...?'),p('ich-weiss-nicht','Ich weiß es nicht.','Я не знаю.'),
      p('noch-einmal-core','Sagen Sie das bitte noch einmal.','Скажите это ещё раз, пожалуйста.'),p('darf-ich','Darf ich ...?','Можно мне ...?'),
      p('ich-muss','Ich muss ...','Мне нужно ...'),p('koennen-sie','Können Sie ...?','Вы можете ...?')
    ]},
    {id:'countries-languages',icon:'🌍',title:'Страны и языки',goal:'назвать страну, язык и понять простые вопросы о происхождении',words:[
      w('deutschland-core','Deutschland','Германия','Ich wohne in Deutschland.','Я живу в Германии.'),
      w('oesterreich','Österreich','Австрия','Wien liegt in Österreich.','Вена находится в Австрии.'),
      w('schweiz','die Schweiz','Швейцария','Ich fahre in die Schweiz.','Я еду в Швейцарию.'),
      w('frankreich','Frankreich','Франция','Paris liegt in Frankreich.','Париж находится во Франции.'),
      w('italien','Italien','Италия','Rom liegt in Italien.','Рим находится в Италии.'),
      w('spanien','Spanien','Испания','Madrid liegt in Spanien.','Мадрид находится в Испании.'),
      w('polen','Polen','Польша','Warschau liegt in Polen.','Варшава находится в Польше.'),
      w('tuerkei','die Türkei','Турция','Ich komme aus der Türkei.','Я из Турции.'),
      w('grossbritannien','Großbritannien','Великобритания','London liegt in Großbritannien.','Лондон находится в Великобритании.'),
      w('usa','die USA','США','Er kommt aus den USA.','Он из США.'),
      w('russland-core','Russland','Россия','Ich komme aus Russland.','Я из России.'),
      w('kasachstan-core','Kasachstan','Казахстан','Ich komme aus Kasachstan.','Я из Казахстана.'),
      w('ukraine','die Ukraine','Украина','Sie kommt aus der Ukraine.','Она из Украины.'),
      w('deutsch-core','Deutsch','немецкий язык','Ich spreche ein bisschen Deutsch.','Я немного говорю по-немецки.'),
      w('englisch','Englisch','английский язык','Sprechen Sie Englisch?','Вы говорите по-английски?'),
      w('franzoesisch','Französisch','французский язык','Sie spricht Französisch.','Она говорит по-французски.'),
      w('italienisch','Italienisch','итальянский язык','Er lernt Italienisch.','Он учит итальянский.'),
      w('spanisch','Spanisch','испанский язык','Ich verstehe etwas Spanisch.','Я немного понимаю испанский.'),
      w('polnisch','Polnisch','польский язык','Sie spricht Polnisch.','Она говорит по-польски.'),
      w('tuerkisch','Türkisch','турецкий язык','Er spricht Türkisch.','Он говорит по-турецки.'),
      w('russisch','Russisch','русский язык','Meine Muttersprache ist Russisch.','Мой родной язык — русский.'),
      w('sprache-core','die Sprache','язык','Welche Sprache sprechen Sie?','На каком языке Вы говорите?','die Sprachen'),
      w('muttersprache','die Muttersprache','родной язык','Deutsch ist nicht meine Muttersprache.','Немецкий не мой родной язык.','die Muttersprachen'),
      w('land-core','das Land','страна','Aus welchem Land kommen Sie?','Из какой страны Вы?','die Länder'),
      w('ausland','das Ausland','заграница','Ich arbeite im Ausland.','Я работаю за границей.'),
      w('deutsch-core-adj','deutsch','немецкий','Ich habe einen deutschen Freund.','У меня есть немецкий друг.'),
      w('international','international','международный','Das ist ein internationaler Kurs.','Это международный курс.')
    ],phrases:[
      p('welches-land','Aus welchem Land kommen Sie?','Из какой страны Вы?'),p('welche-sprachen','Welche Sprachen sprechen Sie?','На каких языках Вы говорите?'),
      p('ein-bisschen-deutsch','Ich spreche ein bisschen Deutsch.','Я немного говорю по-немецки.'),p('meine-muttersprache','Meine Muttersprache ist ...','Мой родной язык ...'),
      p('ich-komme-land','Ich komme aus ...','Я из ...')
    ]},
    {id:'personal-things',icon:'🎒',title:'Человек и личные вещи',goal:'понимать простое описание человека и названия повседневных вещей',words:[
      w('person','die Person','человек / персона','Eine Person wartet draußen.','Один человек ждёт снаружи.','die Personen'),
      w('mensch','der Mensch','человек','Viele Menschen sind hier.','Здесь много людей.','die Menschen'),
      w('nachbar','der Nachbar','сосед','Mein Nachbar ist freundlich.','Мой сосед дружелюбный.','die Nachbarn'),
      w('nachbarin','die Nachbarin','соседка','Meine Nachbarin heißt Anna.','Мою соседку зовут Анна.','die Nachbarinnen'),
      w('alt-core','alt','старый / пожилой','Mein Vater ist 60 Jahre alt.','Моему папе 60 лет.'),
      w('jung-core','jung','молодой','Die Frau ist jung.','Женщина молодая.'),
      w('nett','nett','приятный / милый','Der Kollege ist sehr nett.','Коллега очень приятный.'),
      w('freundlich-core','freundlich','дружелюбный','Die Verkäuferin ist freundlich.','Продавщица дружелюбная.'),
      w('neu','neu','новый','Mein Handy ist neu.','Мой телефон новый.'),
      w('kaputt','kaputt','сломанный','Mein Handy ist kaputt.','Мой телефон сломан.'),
      w('tasche','die Tasche','сумка','Meine Tasche ist schwarz.','Моя сумка чёрная.','die Taschen'),
      w('rucksack','der Rucksack','рюкзак','Der Rucksack ist schwer.','Рюкзак тяжёлый.','die Rucksäcke'),
      w('brille','die Brille','очки','Wo ist meine Brille?','Где мои очки?','die Brillen'),
      w('uhr-thing','die Uhr','часы','Meine Uhr ist neu.','Мои часы новые.','die Uhren'),
      w('telefon-thing','das Telefon','телефон','Das Telefon klingelt.','Телефон звонит.','die Telefone'),
      w('handy-thing','das Handy','мобильный телефон','Mein Handy ist in der Tasche.','Мой телефон в сумке.','die Handys'),
      w('computer','der Computer','компьютер','Ich arbeite am Computer.','Я работаю за компьютером.','die Computer'),
      w('laptop','der Laptop','ноутбук','Der Laptop ist auf dem Tisch.','Ноутбук на столе.','die Laptops'),
      w('papier','das Papier','бумага','Ich brauche ein Blatt Papier.','Мне нужен лист бумаги.','die Papiere'),
      w('stift','der Stift','ручка / карандаш','Haben Sie einen Stift?','У Вас есть ручка?','die Stifte'),
      w('foto','das Foto','фотография','Das ist ein Foto von meiner Familie.','Это фотография моей семьи.','die Fotos'),
      w('bild','das Bild','картина / изображение','Auf dem Bild ist ein Haus.','На картинке дом.','die Bilder'),
      w('sache','die Sache','вещь / дело','Meine Sachen sind hier.','Мои вещи здесь.','die Sachen'),
      w('schwer','schwer','тяжёлый / трудный','Der Koffer ist schwer.','Чемодан тяжёлый.'),
      w('leicht','leicht','лёгкий / несложный','Die Tasche ist leicht.','Сумка лёгкая.'),
      w('sauber','sauber','чистый','Das Zimmer ist sauber.','Комната чистая.'),
      w('schmutzig','schmutzig','грязный','Die Schuhe sind schmutzig.','Обувь грязная.'),
      w('richtig-core','richtig','правильный','Ist diese Adresse richtig?','Этот адрес правильный?'),
      w('falsch-core','falsch','неправильный','Die Nummer ist falsch.','Номер неправильный.')
    ],phrases:[
      p('wo-meine-tasche','Wo ist meine Tasche?','Где моя сумка?'),p('haben-stift','Haben Sie einen Stift?','У Вас есть ручка?'),
      p('handy-kaputt','Mein Handy ist kaputt.','Мой телефон сломан.'),p('ist-richtig','Ist das richtig?','Это правильно?'),
      p('auf-bild','Auf dem Bild ist ...','На картинке ...')
    ]}
  ];
  D.topics.push(...topics);
  D.topic=(id)=>D.topics.find(t=>t.id===id)||null;
  D.version='8.2.0';
})();
