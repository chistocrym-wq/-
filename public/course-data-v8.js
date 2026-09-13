(() => {
  'use strict';

  const w=(id,de,ru,example,exampleRu,plural='',tags=[])=>({id,de,ru,example,exampleRu,plural,tags});
  const p=(id,de,ru)=>({id,de,ru});

  const numbers=[
    ['0','null'],['1','eins'],['2','zwei'],['3','drei'],['4','vier'],['5','fünf'],['6','sechs'],['7','sieben'],['8','acht'],['9','neun'],['10','zehn'],
    ['11','elf'],['12','zwölf'],['13','dreizehn'],['14','vierzehn'],['15','fünfzehn'],['16','sechzehn'],['17','siebzehn'],['18','achtzehn'],['19','neunzehn'],['20','zwanzig'],
    ['21','einundzwanzig'],['30','dreißig'],['40','vierzig'],['50','fünfzig'],['60','sechzig'],['70','siebzig'],['80','achtzig'],['90','neunzig'],['100','hundert']
  ].map(([n,de])=>w(`num-${n}`,de,n,`${de}.`,`${n}.`,'',['number']));

  const days=[
    ['montag','der Montag','понедельник'],['dienstag','der Dienstag','вторник'],['mittwoch','der Mittwoch','среда'],['donnerstag','der Donnerstag','четверг'],['freitag','der Freitag','пятница'],['samstag','der Samstag','суббота'],['sonntag','der Sonntag','воскресенье']
  ].map(([id,de,ru])=>w(id,de,ru,`Am ${de.replace(/^der /,'')} habe ich Zeit.`,`В ${ru} у меня есть время.`));

  const months=[
    ['januar','der Januar','январь'],['februar','der Februar','февраль'],['maerz','der März','март'],['april','der April','апрель'],['mai','der Mai','май'],['juni','der Juni','июнь'],['juli','der Juli','июль'],['august','der August','август'],['september','der September','сентябрь'],['oktober','der Oktober','октябрь'],['november','der November','ноябрь'],['dezember','der Dezember','декабрь']
  ].map(([id,de,ru])=>w(id,de,ru,`Im ${de.replace(/^der /,'')} habe ich Urlaub.`,`В ${ru} у меня отпуск.`));

  const TOPICS=[
    {
      id:'start', icon:'👋', title:'Первые слова и знакомство', goal:'поздороваться, попрощаться и начать короткий разговор',
      words:[
        w('hallo','Hallo','привет','Hallo! Ich bin Anna.','Привет! Я Анна.'),
        w('danke','danke','спасибо','Danke für Ihre Hilfe.','Спасибо за вашу помощь.'),
        w('bitte','bitte','пожалуйста / не за что','Ein Kaffee, bitte.','Один кофе, пожалуйста.'),
        w('ja','ja','да','Ja, gern.','Да, с удовольствием.'),
        w('nein','nein','нет','Nein, danke.','Нет, спасибо.'),
        w('gern','gern','охотно / с удовольствием','Ich komme gern.','Я с удовольствием приду.'),
        w('entschuldigung','Entschuldigung','извините','Entschuldigung, wo ist der Bahnhof?','Извините, где вокзал?'),
        w('gut','gut','хорошо','Sehr gut!','Очень хорошо.'),
        w('auch','auch','тоже','Ich komme auch.','Я тоже приду.'),
        w('heute','heute','сегодня','Heute habe ich Zeit.','Сегодня у меня есть время.')
      ],
      phrases:[
        p('guten-morgen','Guten Morgen.','Доброе утро.'),p('guten-tag','Guten Tag.','Добрый день.'),p('guten-abend','Guten Abend.','Добрый вечер.'),
        p('tschues','Tschüss!','Пока!'),p('auf-wiedersehen','Auf Wiedersehen.','До свидания.'),p('wie-gehts','Wie geht es Ihnen?','Как Вы?'),
        p('mir-gehts-gut','Mir geht es gut, danke.','У меня всё хорошо, спасибо.')
      ]
    },
    {
      id:'person', icon:'🪪', title:'Я и мои данные', goal:'назвать себя, возраст, адрес, страну и профессию',
      words:[
        w('name','der Name','имя / фамилия','Mein Name ist Anna.','Меня зовут Анна.','die Namen'),
        w('vorname','der Vorname','имя','Mein Vorname ist Anna.','Моё имя Анна.','die Vornamen'),
        w('nachname','der Nachname','фамилия','Mein Nachname ist Becker.','Моя фамилия Беккер.','die Nachnamen'),
        w('adresse','die Adresse','адрес','Wie ist Ihre Adresse?','Какой у Вас адрес?','die Adressen'),
        w('telefon','das Telefon','телефон','Das Telefon ist hier.','Телефон здесь.','die Telefone'),
        w('handy','das Handy','мобильный телефон','Meine Handynummer ist ...','Мой мобильный номер ...','die Handys'),
        w('handynummer','die Handynummer','номер мобильного','Meine Handynummer ist 0176 ...','Мой номер мобильного 0176 ...','die Handynummern'),
        w('email','die E-Mail','электронная почта','Meine E-Mail ist ...','Моя электронная почта ...','die E-Mails'),
        w('land','das Land','страна','Aus welchem Land kommen Sie?','Из какой страны Вы приехали?','die Länder'),
        w('stadt','die Stadt','город','Berlin ist eine große Stadt.','Берлин — большой город.','die Städte'),
        w('sprache','die Sprache','язык','Welche Sprachen sprechen Sie?','На каких языках Вы говорите?','die Sprachen'),
        w('beruf','der Beruf','профессия','Was sind Sie von Beruf?','Кто Вы по профессии?','die Berufe'),
        w('alter','das Alter','возраст','Alter: 26 Jahre.','Возраст: 26 лет.'),
        w('geburtsdatum','das Geburtsdatum','дата рождения','Mein Geburtsdatum ist der 12. März.','Моя дата рождения — 12 марта.','die Geburtsdaten'),
        w('geburtsort','der Geburtsort','место рождения','Mein Geburtsort ist Almaty.','Место моего рождения — Алматы.','die Geburtsorte'),
        w('wohnen','wohnen','жить / проживать','Ich wohne in Berlin.','Я живу в Берлине.'),
        w('kommen','kommen','приходить / быть родом','Ich komme aus Kasachstan.','Я из Казахстана.'),
        w('heissen','heißen','называться','Ich heiße Anna.','Меня зовут Анна.')
      ],
      phrases:[
        p('wie-heissen-sie','Wie heißen Sie?','Как Вас зовут?'),p('ich-heisse','Ich heiße ...','Меня зовут ...'),p('wo-wohnen-sie','Wo wohnen Sie?','Где Вы живёте?'),
        p('ich-wohne','Ich wohne in ...','Я живу в ...'),p('woher-kommen','Woher kommen Sie?','Откуда Вы?'),p('ich-komme-aus','Ich komme aus ...','Я из ...'),
        p('wie-alt','Wie alt sind Sie?','Сколько Вам лет?'),p('ich-bin-jahre','Ich bin ... Jahre alt.','Мне ... лет.'),p('beruflich','Was machen Sie beruflich?','Кем Вы работаете?')
      ]
    },
    {
      id:'alphabet', icon:'🔤', title:'Алфавит и Buchstabieren', goal:'продиктовать имя, фамилию, город, email и адрес по буквам',
      alphabet:['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','Ä','Ö','Ü','ß'],
      words:[
        w('alphabet','das Alphabet','алфавит','Das deutsche Alphabet hat besondere Buchstaben.','В немецком алфавите есть особые буквы.'),
        w('buchstabe','der Buchstabe','буква','Diesen Buchstaben kenne ich.','Я знаю эту букву.','die Buchstaben'),
        w('buchstabieren','buchstabieren','произносить по буквам','Bitte buchstabieren Sie Ihren Namen.','Пожалуйста, продиктуйте Ваше имя по буквам.'),
        w('punkt','der Punkt','точка','Punkt de.','Точка de.','die Punkte'),
        w('strich','der Strich','черта / дефис','Mit einem Strich.','С чертой.','die Striche'),
        w('at','das @-Zeichen','знак @','Bei E-Mail sagt man oft „at“.','В e-mail часто говорят «at».')
      ],
      phrases:[
        p('bitte-buchstabieren','Bitte buchstabieren Sie.','Пожалуйста, продиктуйте по буквам.'),
        p('wie-schreibt-man','Wie schreibt man das?','Как это пишется?'),
        p('mein-name-buchstaben','Mein Name ist ...: A – R – ...','Моё имя ...: А – Р – ...')
      ]
    },
    {
      id:'numbers', icon:'🔢', title:'Числа, телефон и цена', goal:'понимать числа, возраст, телефон, адрес и простые цены',
      words:numbers.concat([
        w('nummer','die Nummer','номер','Welche Nummer haben Sie?','Какой у Вас номер?','die Nummern'),
        w('euro','der Euro','евро','Das kostet zehn Euro.','Это стоит десять евро.'),
        w('cent','der Cent','цент','Das kostet neunzig Cent.','Это стоит девяносто центов.'),
        w('preis','der Preis','цена','Wie hoch ist der Preis?','Какова цена?','die Preise'),
        w('kosten','kosten','стоить','Was kostet das?','Сколько это стоит?')
      ]),
      phrases:[
        p('telefonnummer','Meine Telefonnummer ist ...','Мой номер телефона ...'),p('was-kostet','Was kostet das?','Сколько это стоит?'),
        p('wie-viel','Wie viel kostet das?','Сколько это стоит?'),p('hausnummer','Meine Hausnummer ist ...','Номер моего дома ...')
      ]
    },
    {
      id:'family', icon:'👨‍👩‍👧', title:'Семья и люди', goal:'рассказать, кто входит в семью, и понять простые фразы о родственниках',
      words:[
        w('familie','die Familie','семья','Meine Familie ist hier.','Моя семья здесь.','die Familien'),
        w('mutter','die Mutter','мама','Das ist meine Mutter.','Это моя мама.','die Mütter'),
        w('vater','der Vater','папа','Das ist mein Vater.','Это мой папа.','die Väter'),
        w('eltern','die Eltern','родители','Meine Eltern wohnen hier.','Мои родители живут здесь.'),
        w('kind','das Kind','ребёнок','Das ist mein Kind.','Это мой ребёнок.','die Kinder'),
        w('kinder','die Kinder','дети','Ich habe zwei Kinder.','У меня двое детей.'),
        w('sohn','der Sohn','сын','Ich habe einen Sohn.','У меня есть сын.','die Söhne'),
        w('tochter','die Tochter','дочь','Das ist meine Tochter.','Это моя дочь.','die Töchter'),
        w('bruder','der Bruder','брат','Mein Bruder arbeitet hier.','Мой брат работает здесь.','die Brüder'),
        w('schwester','die Schwester','сестра','Meine Schwester wohnt in Köln.','Моя сестра живёт в Кёльне.','die Schwestern'),
        w('mann','der Mann','мужчина / муж','Das ist mein Mann.','Это мой муж.','die Männer'),
        w('frau','die Frau','женщина / жена','Das ist meine Frau.','Это моя жена.','die Frauen'),
        w('freund','der Freund','друг / партнёр','Mein Freund heißt Tom.','Моего друга зовут Том.','die Freunde'),
        w('freundin','die Freundin','подруга / партнёрша','Meine Freundin kommt morgen.','Моя подруга придёт завтра.','die Freundinnen'),
        w('oma','die Oma / Großmutter','бабушка','Meine Oma wohnt in Bonn.','Моя бабушка живёт в Бонне.','die Omas / Großmütter'),
        w('opa','der Opa / Großvater','дедушка','Mein Opa ist 70 Jahre alt.','Моему дедушке 70 лет.','die Opas / Großväter'),
        w('tante','die Tante','тётя','Meine Tante kommt heute.','Моя тётя придёт сегодня.','die Tanten'),
        w('onkel','der Onkel','дядя','Mein Onkel heißt Peter.','Моего дядю зовут Петер.','die Onkel'),
        w('verheiratet','verheiratet','женат / замужем','Ich bin verheiratet.','Я женат / замужем.'),
        w('ledig','ledig','не женат / не замужем','Ich bin ledig.','Я не женат / не замужем.')
      ],
      phrases:[
        p('das-ist-meine','Das ist meine Mutter.','Это моя мама.'),p('das-ist-mein','Das ist mein Vater.','Это мой папа.'),
        p('ich-habe-sohn','Ich habe einen Sohn.','У меня есть сын.'),p('ich-habe-kinder','Ich habe zwei Kinder.','У меня двое детей.'),
        p('haben-sie-kinder','Haben Sie Kinder?','У Вас есть дети?')
      ]
    },
    {
      id:'time', icon:'🕒', title:'Время и календарь', goal:'понимать время, день, дату и договариваться о встрече',
      words:[
        w('uhr','die Uhr','часы / время','Es ist drei Uhr.','Сейчас три часа.','die Uhren'),
        w('minute','die Minute','минута','Fünf Minuten, bitte.','Пять минут, пожалуйста.','die Minuten'),
        w('stunde','die Stunde','час','Der Kurs dauert eine Stunde.','Курс длится один час.','die Stunden'),
        w('tag','der Tag','день','Guten Tag!','Добрый день!','die Tage'),
        w('woche','die Woche','неделя','Eine Woche hat sieben Tage.','В неделе семь дней.','die Wochen'),
        w('wochenende','das Wochenende','выходные','Am Wochenende habe ich frei.','На выходных я свободен.','die Wochenenden'),
        ...days,...months,
        w('gestern','gestern','вчера','Gestern war Montag.','Вчера был понедельник.'),
        w('morgen-time','morgen','завтра / утром','Bis morgen!','До завтра!'),
        w('vormittag','der Vormittag','первая половина дня','Am Vormittag arbeite ich.','До обеда я работаю.','die Vormittage'),
        w('mittag','der Mittag','полдень','Am Mittag esse ich.','В полдень я ем.'),
        w('nachmittag','der Nachmittag','послеобеденное время','Am Nachmittag habe ich Zeit.','После обеда у меня есть время.','die Nachmittage'),
        w('abend','der Abend','вечер','Guten Abend!','Добрый вечер.','die Abende'),
        w('nacht','die Nacht','ночь','Gute Nacht!','Спокойной ночи.','die Nächte'),
        w('datum','das Datum','дата','Bitte schreiben Sie das Datum.','Пожалуйста, напишите дату.','die Daten'),
        w('termin','der Termin','встреча / приём','Ich habe einen Termin.','У меня назначена встреча.','die Termine'),
        w('fruehling','der Frühling','весна','Im Frühling ist es wärmer.','Весной становится теплее.'),
        w('sommer','der Sommer','лето','Im Sommer ist es warm.','Летом тепло.'),
        w('herbst','der Herbst','осень','Im Herbst regnet es oft.','Осенью часто идёт дождь.'),
        w('winter','der Winter','зима','Im Winter ist es kalt.','Зимой холодно.')
      ],
      phrases:[
        p('wie-spaet','Wie spät ist es?','Который час?'),p('es-ist-uhr','Es ist ... Uhr.','Сейчас ... часов.'),
        p('wann-termin','Wann ist der Termin?','Когда встреча / приём?'),p('am-montag','Am Montag um zehn Uhr.','В понедельник в десять часов.'),
        p('haben-sie-zeit','Haben Sie morgen Zeit?','У Вас завтра есть время?')
      ]
    },
    {
      id:'food', icon:'☕', title:'Еда и напитки', goal:'понять базовые продукты и сделать простой заказ',
      words:[
        w('wasser','das Wasser','вода','Ich möchte Wasser.','Я хотел(а) бы воду.'),w('kaffee','der Kaffee','кофе','Einen Kaffee, bitte.','Один кофе, пожалуйста.'),
        w('tee','der Tee','чай','Einen Tee, bitte.','Один чай, пожалуйста.'),w('milch','die Milch','молоко','Ich brauche Milch.','Мне нужно молоко.'),
        w('saft','der Saft','сок','Ein Glas Saft, bitte.','Стакан сока, пожалуйста.','die Säfte'),w('brot','das Brot','хлеб','Ich kaufe Brot.','Я покупаю хлеб.','die Brote'),
        w('broetchen','das Brötchen','булочка','Ein Brötchen mit Käse.','Булочка с сыром.','die Brötchen'),w('butter','die Butter','сливочное масло','Brot mit Butter.','Хлеб с маслом.'),
        w('kaese','der Käse','сыр','Ich esse gern Käse.','Я люблю есть сыр.'),w('fleisch','das Fleisch','мясо','Ich esse kein Fleisch.','Я не ем мясо.'),
        w('fisch','der Fisch','рыба','Heute gibt es Fisch.','Сегодня есть рыба.','die Fische'),w('ei','das Ei','яйцо','Ein Ei, bitte.','Одно яйцо, пожалуйста.','die Eier'),
        w('obst','das Obst','фрукты','Ich kaufe Obst.','Я покупаю фрукты.'),w('gemuese','das Gemüse','овощи','Gemüse ist gesund.','Овощи полезны.'),
        w('apfel','der Apfel','яблоко','Ein Apfel, bitte.','Одно яблоко, пожалуйста.','die Äpfel'),w('banane','die Banane','банан','Drei Bananen, bitte.','Три банана, пожалуйста.','die Bananen'),
        w('kartoffel','die Kartoffel','картофель','Ein Kilo Kartoffeln.','Килограмм картофеля.','die Kartoffeln'),w('reis','der Reis','рис','Ich nehme Reis.','Я возьму рис.'),
        w('suppe','die Suppe','суп','Eine Suppe, bitte.','Один суп, пожалуйста.','die Suppen'),w('salat','der Salat','салат','Ich nehme einen Salat.','Я возьму салат.','die Salate'),
        w('kuchen','der Kuchen','пирог / торт','Ein Stück Kuchen, bitte.','Кусок пирога, пожалуйста.','die Kuchen'),w('fruehstueck','das Frühstück','завтрак','Das Frühstück ist um acht.','Завтрак в восемь.'),
        w('mittagessen','das Mittagessen','обед','Das Mittagessen ist fertig.','Обед готов.'),w('abendessen','das Abendessen','ужин','Wir essen Abendessen.','Мы ужинаем.'),
        w('essen','essen','есть','Was möchten Sie essen?','Что Вы хотите поесть?'),w('trinken','trinken','пить','Was möchten Sie trinken?','Что Вы хотите выпить?'),
        w('bestellen','bestellen','заказывать','Wir möchten bestellen.','Мы хотим сделать заказ.'),w('restaurant','das Restaurant','ресторан','Das Restaurant ist offen.','Ресторан открыт.','die Restaurants'),
        w('cafe','das Café','кафе','Wir treffen uns im Café.','Мы встретимся в кафе.','die Cafés')
      ],
      phrases:[
        p('ich-moechte','Ich möchte ...','Я хотел(а) бы ...'),p('ich-haette-gern','Ich hätte gern ...','Я бы хотел(а) ...'),
        p('einen-kaffee','Einen Kaffee, bitte.','Один кофе, пожалуйста.'),p('was-moechten-trinken','Was möchten Sie trinken?','Что Вы хотите выпить?'),
        p('guten-appetit','Guten Appetit!','Приятного аппетита!')
      ]
    },
    {
      id:'shopping', icon:'🛍️', title:'Покупки и одежда', goal:'спросить цену, понять размер и оплатить покупку',
      words:[
        w('preis-shop','der Preis','цена','Der Preis ist zehn Euro.','Цена — десять евро.','die Preise'),w('geld','das Geld','деньги','Ich habe kein Bargeld.','У меня нет наличных.'),
        w('karte','die Karte','карта','Kann ich mit Karte bezahlen?','Можно оплатить картой?','die Karten'),w('bar','bar','наличными','Ich bezahle bar.','Я плачу наличными.'),
        w('teuer','teuer','дорогой','Die Jacke ist teuer.','Куртка дорогая.'),w('billig','billig','дешёвый','Die Schuhe sind billig.','Обувь дешёвая.'),
        w('kaufen','kaufen','покупать','Ich möchte das kaufen.','Я хочу это купить.'),w('bezahlen','bezahlen','оплачивать','Wo muss ich bezahlen?','Где нужно платить?'),
        w('kasse','die Kasse','касса','Die Kasse ist dort.','Касса там.','die Kassen'),w('geschaeft','das Geschäft','магазин','Das Geschäft ist offen.','Магазин открыт.','die Geschäfte'),
        w('supermarkt','der Supermarkt','супермаркет','Der Supermarkt ist hier.','Супермаркет здесь.','die Supermärkte'),w('baeckerei','die Bäckerei','пекарня','Ich gehe zur Bäckerei.','Я иду в пекарню.','die Bäckereien'),
        w('kleidung','die Kleidung','одежда','Die Kleidung ist neu.','Одежда новая.'),w('jacke','die Jacke','куртка','Die Jacke ist blau.','Куртка синяя.','die Jacken'),
        w('hose','die Hose','брюки','Die Hose ist zu groß.','Брюки слишком большие.','die Hosen'),w('hemd','das Hemd','рубашка','Das Hemd ist weiß.','Рубашка белая.','die Hemden'),
        w('kleid','das Kleid','платье','Das Kleid ist schön.','Платье красивое.','die Kleider'),w('schuh','der Schuh','ботинок / туфля','Der Schuh ist neu.','Обувь новая.','die Schuhe'),
        w('groesse','die Größe','размер','Welche Größe brauchen Sie?','Какой размер Вам нужен?','die Größen'),w('farbe','die Farbe','цвет','Welche Farbe möchten Sie?','Какой цвет Вы хотите?','die Farben'),
        w('schwarz','schwarz','чёрный','Die Jacke ist schwarz.','Куртка чёрная.'),w('weiss','weiß','белый','Das Hemd ist weiß.','Рубашка белая.'),
        w('rot','rot','красный','Das Kleid ist rot.','Платье красное.'),w('blau','blau','синий','Die Hose ist blau.','Брюки синие.'),
        w('gruen','grün','зелёный','Der Pullover ist grün.','Свитер зелёный.'),w('gelb','gelb','жёлтый','Die Tasche ist gelb.','Сумка жёлтая.'),
        w('braun','braun','коричневый','Die Schuhe sind braun.','Обувь коричневая.')
      ],
      phrases:[
        p('wie-viel-kostet-shop','Wie viel kostet das?','Сколько это стоит?'),p('zu-teuer','Das ist zu teuer.','Это слишком дорого.'),
        p('mit-karte','Kann ich mit Karte bezahlen?','Можно оплатить картой?'),p('welche-groesse','Welche Größe haben Sie?','Какой у Вас размер?'),
        p('ich-nehme-das','Ich nehme das.','Я беру это.')
      ]
    },
    {
      id:'home', icon:'🏠', title:'Дом и жильё', goal:'понимать базовую лексику квартиры и простые бытовые фразы',
      words:[
        w('haus','das Haus','дом','Das ist mein Haus.','Это мой дом.','die Häuser'),w('wohnung','die Wohnung','квартира','Die Wohnung ist klein.','Квартира маленькая.','die Wohnungen'),
        w('zimmer','das Zimmer','комната','Das Zimmer ist groß.','Комната большая.','die Zimmer'),w('kueche','die Küche','кухня','Die Küche ist neu.','Кухня новая.','die Küchen'),
        w('bad','das Bad','ванная','Das Bad ist hier.','Ванная здесь.','die Bäder'),w('toilette','die Toilette','туалет','Wo ist die Toilette?','Где туалет?','die Toiletten'),
        w('tuer','die Tür','дверь','Die Tür ist offen.','Дверь открыта.','die Türen'),w('fenster','das Fenster','окно','Das Fenster ist zu.','Окно закрыто.','die Fenster'),
        w('tisch','der Tisch','стол','Der Tisch ist in der Küche.','Стол на кухне.','die Tische'),w('stuhl','der Stuhl','стул','Der Stuhl ist neu.','Стул новый.','die Stühle'),
        w('bett','das Bett','кровать','Das Bett ist im Zimmer.','Кровать в комнате.','die Betten'),w('schrank','der Schrank','шкаф','Der Schrank ist groß.','Шкаф большой.','die Schränke'),
        w('sofa','das Sofa','диван','Das Sofa ist bequem.','Диван удобный.','die Sofas'),w('balkon','der Balkon','балкон','Die Wohnung hat einen Balkon.','В квартире есть балкон.','die Balkone'),
        w('garten','der Garten','сад','Der Garten ist schön.','Сад красивый.','die Gärten'),w('schluessel','der Schlüssel','ключ','Wo ist mein Schlüssel?','Где мой ключ?','die Schlüssel'),
        w('licht','das Licht','свет','Mach bitte das Licht an.','Включи, пожалуйста, свет.','die Lichter'),w('miete','die Miete','арендная плата','Die Miete ist hoch.','Аренда дорогая.','die Mieten'),
        w('mieten','mieten','снимать / арендовать','Wir möchten eine Wohnung mieten.','Мы хотим снять квартиру.'),w('offen','offen','открытый','Die Tür ist offen.','Дверь открыта.'),
        w('zu','zu','закрытый','Das Fenster ist zu.','Окно закрыто.'),w('gross','groß','большой','Das Haus ist groß.','Дом большой.'),
        w('klein-home','klein','маленький','Das Zimmer ist klein.','Комната маленькая.')
      ],
      phrases:[
        p('wo-ist-toilette','Wo ist die Toilette?','Где туалет?'),p('ich-wohne-wohnung','Ich wohne in einer Wohnung.','Я живу в квартире.'),
        p('wohnung-hat','Die Wohnung hat zwei Zimmer.','В квартире две комнаты.'),p('miete-kostet','Die Miete kostet ... Euro.','Аренда стоит ... евро.')
      ]
    },
    {
      id:'city', icon:'📍', title:'Город и нужные места', goal:'спросить дорогу и найти основные городские места',
      words:[
        w('strasse','die Straße','улица','Die Straße ist hier.','Улица здесь.','die Straßen'),w('bahnhof','der Bahnhof','вокзал','Wo ist der Bahnhof?','Где вокзал?','die Bahnhöfe'),
        w('schule','die Schule','школа','Die Schule ist dort.','Школа там.','die Schulen'),w('bank','die Bank','банк','Die Bank schließt um vier.','Банк закрывается в четыре.','die Banken'),
        w('post','die Post','почта','Ich gehe zur Post.','Я иду на почту.'),w('apotheke','die Apotheke','аптека','Die Apotheke ist neben der Bank.','Аптека рядом с банком.','die Apotheken'),
        w('restaurant-city','das Restaurant','ресторан','Das Restaurant ist im Zentrum.','Ресторан в центре.','die Restaurants'),w('hotel','das Hotel','отель','Das Hotel ist gegenüber.','Отель напротив.','die Hotels'),
        w('arzt-city','der Arzt','врач','Ich gehe zum Arzt.','Я иду к врачу.','die Ärzte'),w('krankenhaus','das Krankenhaus','больница','Das Krankenhaus ist groß.','Больница большая.','die Krankenhäuser'),
        w('polizei','die Polizei','полиция','Die Polizei ist dort.','Полиция там.'),w('park','der Park','парк','Der Park ist schön.','Парк красивый.','die Parks'),
        w('zentrum','das Zentrum','центр','Das Hotel ist im Zentrum.','Отель в центре.','die Zentren'),w('links','links','слева / налево','Gehen Sie links.','Идите налево.'),
        w('rechts','rechts','справа / направо','Gehen Sie rechts.','Идите направо.'),w('geradeaus','geradeaus','прямо','Gehen Sie geradeaus.','Идите прямо.'),
        w('hier','hier','здесь','Die Apotheke ist hier.','Аптека здесь.'),w('dort','dort','там','Der Bahnhof ist dort.','Вокзал там.'),
        w('neben','neben','рядом','Die Post ist neben der Bank.','Почта рядом с банком.'),w('gegenueber','gegenüber','напротив','Das Hotel ist gegenüber.','Отель напротив.'),
        w('ecke','die Ecke','угол','An der Ecke ist eine Apotheke.','На углу аптека.','die Ecken'),w('finden','finden','находить','Ich finde den Bahnhof nicht.','Я не могу найти вокзал.')
      ],
      phrases:[
        p('wo-ist','Wo ist ...?','Где ...?'),p('wie-komme-ich','Wie komme ich zum Bahnhof?','Как мне пройти к вокзалу?'),
        p('gehen-sie-geradeaus','Gehen Sie geradeaus.','Идите прямо.'),p('dann-links','Dann links.','Потом налево.'),p('koennen-helfen','Können Sie mir helfen?','Вы можете мне помочь?')
      ]
    },
    {
      id:'transport', icon:'🚆', title:'Транспорт и поездки', goal:'понять отправление, билет и простой маршрут',
      words:[
        w('bus','der Bus','автобус','Wann kommt der nächste Bus?','Когда придёт следующий автобус?','die Busse'),w('zug','der Zug','поезд','Der Zug fährt um neun.','Поезд отправляется в девять.','die Züge'),
        w('taxi','das Taxi','такси','Ich nehme ein Taxi.','Я возьму такси.','die Taxis'),w('auto','das Auto','автомобиль','Ich fahre mit dem Auto.','Я еду на машине.','die Autos'),
        w('fahrrad','das Fahrrad','велосипед','Ich fahre mit dem Fahrrad.','Я еду на велосипеде.','die Fahrräder'),w('bahn','die Bahn','поезд / городской транспорт','Ich nehme die nächste Bahn.','Я сяду на следующий поезд.','die Bahnen'),
        w('haltestelle','die Haltestelle','остановка','Wo ist die Haltestelle?','Где остановка?','die Haltestellen'),w('fahrkarte','die Fahrkarte','билет','Eine Fahrkarte nach Berlin, bitte.','Один билет до Берлина, пожалуйста.','die Fahrkarten'),
        w('bahnsteig','der Bahnsteig','платформа','Auf welchem Bahnsteig fährt der Zug?','С какой платформы отправляется поезд?','die Bahnsteige'),w('abfahrt','die Abfahrt','отправление','Die Abfahrt ist um zehn Uhr.','Отправление в десять часов.','die Abfahrten'),
        w('ankunft','die Ankunft','прибытие','Die Ankunft ist um elf Uhr.','Прибытие в одиннадцать.'),w('flughafen','der Flughafen','аэропорт','Der Flughafen ist weit.','Аэропорт далеко.','die Flughäfen'),
        w('reise','die Reise','поездка / путешествие','Die Reise ist lang.','Поездка долгая.','die Reisen'),w('gepaeck','das Gepäck','багаж','Wo ist mein Gepäck?','Где мой багаж?'),
        w('koffer','der Koffer','чемодан','Mein Koffer ist schwer.','Мой чемодан тяжёлый.','die Koffer'),w('fahren','fahren','ехать','Wir fahren nach Köln.','Мы едем в Кёльн.'),
        w('abfahren','abfahren','отправляться','Wann fährt der Zug ab?','Когда отправляется поезд?'),w('ankommen','ankommen','прибывать','Wann kommen wir an?','Когда мы прибываем?'),
        w('einsteigen','einsteigen','садиться в транспорт','Bitte hier einsteigen.','Садитесь здесь.'),w('aussteigen','aussteigen','выходить из транспорта','Wo muss ich aussteigen?','Где мне нужно выйти?'),
        w('umsteigen','umsteigen','делать пересадку','Muss ich umsteigen?','Мне нужно пересаживаться?')
      ],
      phrases:[
        p('fahrkarte-nach','Eine Fahrkarte nach Berlin, bitte.','Один билет до Берлина, пожалуйста.'),p('wann-faehrt','Wann fährt der Zug?','Когда отправляется поезд?'),
        p('welcher-bahnsteig','Auf welchem Bahnsteig?','На какой платформе?'),p('muss-umsteigen','Muss ich umsteigen?','Мне нужно делать пересадку?'),
        p('wo-aussteigen','Wo muss ich aussteigen?','Где мне нужно выйти?')
      ]
    },
    {
      id:'work', icon:'💼', title:'Работа и профессия', goal:'сказать, где и кем работаешь, и понять простую информацию о работе',
      words:[
        w('arbeit','die Arbeit','работа','Ich suche Arbeit.','Я ищу работу.','die Arbeiten'),w('arbeiten','arbeiten','работать','Ich arbeite in Berlin.','Я работаю в Берлине.'),
        w('beruf-work','der Beruf','профессия','Was ist Ihr Beruf?','Какая у Вас профессия?','die Berufe'),w('firma','die Firma','фирма','Ich arbeite bei einer Firma.','Я работаю в фирме.','die Firmen'),
        w('buero','das Büro','офис','Ich bin im Büro.','Я в офисе.','die Büros'),w('chef','der Chef','начальник','Mein Chef ist heute da.','Мой начальник сегодня здесь.','die Chefs'),
        w('chefin','die Chefin','начальница','Meine Chefin heißt Frau Klein.','Мою начальницу зовут фрау Кляйн.','die Chefinnen'),w('kollege','der Kollege','коллега','Mein Kollege kommt später.','Мой коллега придёт позже.','die Kollegen'),
        w('kollegin','die Kollegin','коллега (жен.)','Meine Kollegin arbeitet hier.','Моя коллега работает здесь.','die Kolleginnen'),w('pause','die Pause','перерыв','Die Pause ist um zwölf.','Перерыв в двенадцать.','die Pausen'),
        w('arbeitsplatz','der Arbeitsplatz','рабочее место','Mein Arbeitsplatz ist im Büro.','Моё рабочее место в офисе.','die Arbeitsplätze'),w('urlaub','der Urlaub','отпуск','Im August habe ich Urlaub.','В августе у меня отпуск.'),
        w('frei','frei','свободный / выходной','Am Sonntag habe ich frei.','В воскресенье у меня выходной.'),w('anfangen','anfangen','начинать','Die Arbeit fängt um acht an.','Работа начинается в восемь.'),
        w('aufhoeren','aufhören','заканчивать','Ich höre um fünf auf.','Я заканчиваю в пять.'),w('suchen','suchen','искать','Ich suche Arbeit.','Я ищу работу.')
      ],
      phrases:[
        p('was-beruf','Was sind Sie von Beruf?','Кто Вы по профессии?'),p('ich-arbeite-als','Ich arbeite als ...','Я работаю ...'),
        p('ich-arbeite-bei','Ich arbeite bei ...','Я работаю в ...'),p('wann-arbeiten','Wann arbeiten Sie?','Когда Вы работаете?'),p('heute-frei','Heute habe ich frei.','Сегодня у меня выходной.')
      ]
    },
    {
      id:'free-time', icon:'🎬', title:'Свободное время', goal:'рассказать о простых увлечениях и понять приглашение',
      words:[
        w('freizeit','die Freizeit','свободное время','Was machen Sie in Ihrer Freizeit?','Что Вы делаете в свободное время?'),w('sport','der Sport','спорт','Ich mache Sport.','Я занимаюсь спортом.'),
        w('musik','die Musik','музыка','Ich höre gern Musik.','Я люблю слушать музыку.'),w('lesen','lesen','читать','Ich lese gern.','Я люблю читать.'),
        w('schwimmen','schwimmen','плавать','Ich schwimme am Wochenende.','Я плаваю по выходным.'),w('kino','das Kino','кинотеатр','Wir gehen ins Kino.','Мы идём в кино.','die Kinos'),
        w('fernsehen','fernsehen','смотреть телевизор','Am Abend sehe ich fern.','Вечером я смотрю телевизор.'),w('radio','das Radio','радио','Ich höre Radio.','Я слушаю радио.','die Radios'),
        w('internet','das Internet','интернет','Ich bin oft im Internet.','Я часто бываю в интернете.'),w('zeitung','die Zeitung','газета','Ich lese die Zeitung.','Я читаю газету.','die Zeitungen'),
        w('buch','das Buch','книга','Das Buch ist interessant.','Книга интересная.','die Bücher'),w('spielen','spielen','играть','Ich spiele Fußball.','Я играю в футбол.'),
        w('fussball','der Fußball','футбол','Ich spiele gern Fußball.','Я люблю играть в футбол.'),w('tanzen','tanzen','танцевать','Wir tanzen gern.','Мы любим танцевать.'),
        w('spazieren','spazieren gehen','гулять','Wir gehen spazieren.','Мы идём гулять.'),w('treffen','treffen','встречать(ся)','Ich treffe Freunde.','Я встречаюсь с друзьями.'),
        w('freund-plural','die Freunde','друзья','Am Wochenende treffe ich Freunde.','На выходных я встречаюсь с друзьями.'),w('interesse','das Interesse','интерес','Ich habe Interesse an Musik.','Я интересуюсь музыкой.','die Interessen')
      ],
      phrases:[
        p('was-machen-freizeit','Was machen Sie in Ihrer Freizeit?','Что Вы делаете в свободное время?'),p('ich-mag','Ich mag Musik.','Мне нравится музыка.'),
        p('ich-spiele','Ich spiele Fußball.','Я играю в футбол.'),p('am-wochenende','Am Wochenende ...','На выходных ...'),p('kommst-du-mit','Kommst du mit?','Ты пойдёшь со мной?')
      ]
    },
    {
      id:'health', icon:'🩺', title:'Здоровье', goal:'объяснить простую проблему и договориться о приёме у врача',
      words:[
        w('arzt-health','der Arzt','врач','Ich brauche einen Arzt.','Мне нужен врач.','die Ärzte'),w('aerztin','die Ärztin','врач (жен.)','Ich habe einen Termin bei der Ärztin.','У меня приём у врача.','die Ärztinnen'),
        w('apotheke-health','die Apotheke','аптека','Das Medikament gibt es in der Apotheke.','Лекарство есть в аптеке.','die Apotheken'),w('krank','krank','больной','Ich bin krank.','Я болен / больна.'),
        w('gesund','gesund','здоровый','Obst ist gesund.','Фрукты полезны.'),w('schmerz','der Schmerz','боль','Ich habe Schmerzen.','У меня боли.','die Schmerzen'),
        w('kopf','der Kopf','голова','Mein Kopf tut weh.','У меня болит голова.','die Köpfe'),w('bauch','der Bauch','живот','Mein Bauch tut weh.','У меня болит живот.','die Bäuche'),
        w('arm','der Arm','рука','Mein Arm tut weh.','У меня болит рука.','die Arme'),w('bein','das Bein','нога','Mein Bein tut weh.','У меня болит нога.','die Beine'),
        w('medikament','das Medikament','лекарство','Ich brauche ein Medikament.','Мне нужно лекарство.','die Medikamente'),w('tablette','die Tablette','таблетка','Nehmen Sie eine Tablette.','Примите одну таблетку.','die Tabletten'),
        w('helfen','helfen','помогать','Können Sie mir helfen?','Вы можете мне помочь?'),w('wehtun','wehtun','болеть','Der Kopf tut weh.','Голова болит.'),
        w('termin-health','der Termin','приём / встреча','Ich brauche einen Termin.','Мне нужна запись на приём.','die Termine'),w('krankenhaus-health','das Krankenhaus','больница','Er ist im Krankenhaus.','Он в больнице.','die Krankenhäuser')
      ],
      phrases:[
        p('ich-bin-krank','Ich bin krank.','Я болен / больна.'),p('kopf-tut-weh','Mein Kopf tut weh.','У меня болит голова.'),
        p('ich-habe-schmerzen','Ich habe Schmerzen.','У меня боли.'),p('termin-arzt','Ich brauche einen Termin beim Arzt.','Мне нужна запись к врачу.'),
        p('koennen-helfen-health','Können Sie mir helfen?','Вы можете мне помочь?')
      ]
    },
    {
      id:'weather', icon:'🌦️', title:'Погода и одежда', goal:'понимать простое описание погоды и выбирать базовую одежду',
      words:[
        w('wetter','das Wetter','погода','Wie ist das Wetter?','Какая погода?'),w('warm','warm','тепло / тёплый','Heute ist es warm.','Сегодня тепло.'),
        w('kalt','kalt','холодно / холодный','Heute ist es kalt.','Сегодня холодно.'),w('regen','der Regen','дождь','Heute gibt es Regen.','Сегодня дождь.'),
        w('sonne','die Sonne','солнце','Die Sonne scheint.','Светит солнце.'),w('schnee','der Schnee','снег','Im Winter gibt es Schnee.','Зимой бывает снег.'),
        w('wind','der Wind','ветер','Der Wind ist stark.','Ветер сильный.','die Winde'),w('grad','das Grad','градус','Heute sind es zehn Grad.','Сегодня десять градусов.'),
        w('mantel','der Mantel','пальто','Der Mantel ist warm.','Пальто тёплое.','die Mäntel'),w('pullover','der Pullover','свитер','Der Pullover ist warm.','Свитер тёплый.','die Pullover'),
        w('muetze','die Mütze','шапка','Ich brauche eine Mütze.','Мне нужна шапка.','die Mützen'),w('schal','der Schal','шарф','Der Schal ist blau.','Шарф синий.','die Schals'),
        w('regenschirm','der Regenschirm','зонт','Ich brauche einen Regenschirm.','Мне нужен зонт.','die Regenschirme')
      ],
      phrases:[
        p('wie-wetter','Wie ist das Wetter?','Какая погода?'),p('es-ist-kalt','Es ist kalt.','Холодно.'),p('es-regnet','Es regnet.','Идёт дождь.'),
        p('sonne-scheint','Die Sonne scheint.','Светит солнце.'),p('zehn-grad','Es sind zehn Grad.','Десять градусов.')
      ]
    },
    {
      id:'german', icon:'📚', title:'Учёба и немецкий язык', goal:'понимать базовые инструкции и говорить о занятиях немецким',
      words:[
        w('deutsch','Deutsch','немецкий язык','Ich lerne Deutsch.','Я учу немецкий.'),w('kurs','der Kurs','курс','Der Deutschkurs beginnt heute.','Курс немецкого начинается сегодня.','die Kurse'),
        w('lehrer','der Lehrer','учитель','Der Lehrer spricht langsam.','Учитель говорит медленно.','die Lehrer'),w('lehrerin','die Lehrerin','учительница','Die Lehrerin hilft mir.','Учительница мне помогает.','die Lehrerinnen'),
        w('aufgabe','die Aufgabe','задание','Das ist eine Aufgabe.','Это задание.','die Aufgaben'),w('buch-german','das Buch','книга','Öffnen Sie das Buch.','Откройте книгу.','die Bücher'),
        w('lesen-german','lesen','читать','Lesen Sie den Text.','Прочитайте текст.'),w('schreiben','schreiben','писать','Schreiben Sie Ihren Namen.','Напишите Ваше имя.'),
        w('sprechen','sprechen','говорить','Sprechen Sie langsam.','Говорите медленно.'),w('hoeren','hören','слушать','Hören Sie bitte.','Послушайте, пожалуйста.'),
        w('lernen','lernen','учить','Ich lerne jeden Tag.','Я учусь каждый день.'),w('verstehen','verstehen','понимать','Ich verstehe das.','Я это понимаю.'),
        w('wort','das Wort','слово','Was bedeutet das Wort?','Что означает это слово?','die Wörter'),w('satz','der Satz','предложение','Lesen Sie den Satz.','Прочитайте предложение.','die Sätze'),
        w('frage','die Frage','вопрос','Ich habe eine Frage.','У меня вопрос.','die Fragen'),w('antwort','die Antwort','ответ','Welche Antwort ist richtig?','Какой ответ правильный?','die Antworten'),
        w('richtig','richtig','правильно','Das ist richtig.','Это правильно.'),w('falsch','falsch','неправильно','Das ist falsch.','Это неправильно.'),
        w('beispiel','das Beispiel','пример','Zum Beispiel ...','Например ...','die Beispiele'),w('pruefung','die Prüfung','экзамен','Die Prüfung ist morgen.','Экзамен завтра.','die Prüfungen'),
        w('loesung','die Lösung','решение / ответ','Vergleichen Sie die Lösung.','Сравните ответ.','die Lösungen'),w('ankreuzen','ankreuzen','отмечать крестиком','Kreuzen Sie an.','Отметьте крестиком.'),
        w('ergaenzen','ergänzen','дополнять','Ergänzen Sie das Formular.','Дополните формуляр.')
      ],
      phrases:[
        p('wie-heisst-auf-deutsch','Wie heißt das auf Deutsch?','Как это по-немецки?'),p('was-bedeutet','Was bedeutet das?','Что это значит?'),
        p('bitte-langsam','Bitte sprechen Sie langsam.','Пожалуйста, говорите медленно.'),p('noch-einmal','Noch einmal, bitte.','Ещё раз, пожалуйста.'),p('ich-verstehe-nicht','Ich verstehe nicht.','Я не понимаю.')
      ]
    },
    {
      id:'documents', icon:'📝', title:'Документы и формы', goal:'понять простую форму и заполнить основные личные данные',
      words:[
        w('formular','das Formular','формуляр / анкета','Bitte füllen Sie das Formular aus.','Пожалуйста, заполните формуляр.','die Formulare'),
        w('datum-doc','das Datum','дата','Schreiben Sie das Datum.','Напишите дату.','die Daten'),w('unterschrift','die Unterschrift','подпись','Hier fehlt Ihre Unterschrift.','Здесь не хватает Вашей подписи.','die Unterschriften'),
        w('pass','der Pass','паспорт','Hier ist mein Pass.','Вот мой паспорт.','die Pässe'),w('ausweis','der Ausweis','удостоверение личности','Hier ist mein Ausweis.','Вот моё удостоверение.','die Ausweise'),
        w('nummer-doc','die Nummer','номер','Schreiben Sie die Nummer.','Напишите номер.','die Nummern'),w('anmeldung','die Anmeldung','регистрация / запись','Die Anmeldung ist hier.','Регистрация здесь.','die Anmeldungen'),
        w('anmelden','sich anmelden','регистрироваться','Wo kann ich mich anmelden?','Где я могу зарегистрироваться?'),w('ausfuellen','ausfüllen','заполнять','Füllen Sie das Formular aus.','Заполните формуляр.'),
        w('ankreuzen-doc','ankreuzen','отмечать','Kreuzen Sie bitte an.','Отметьте, пожалуйста.'),w('brief','der Brief','письмо','Ich schreibe einen Brief.','Я пишу письмо.','die Briefe'),
        w('absender','der Absender','отправитель','Der Absender steht oben.','Отправитель указан сверху.','die Absender'),w('antwortbogen','der Antwortbogen','бланк ответов','Schreiben Sie auf den Antwortbogen.','Пишите на бланке ответов.','die Antwortbögen'),
        w('anrede','die Anrede','обращение','Schreiben Sie eine Anrede.','Напишите обращение.','die Anreden'),w('gruss','der Gruß','приветствие / заключительная формула','Schreiben Sie einen Gruß.','Напишите заключительную формулу.','die Grüße')
      ],
      phrases:[
        p('fuellen-sie','Füllen Sie bitte das Formular aus.','Пожалуйста, заполните формуляр.'),p('hier-unterschrift','Bitte hier unterschreiben.','Пожалуйста, подпишите здесь.'),
        p('welche-nummer','Welche Nummer haben Sie?','Какой у Вас номер?'),p('hier-pass','Hier ist mein Pass.','Вот мой паспорт.'),p('adresse-eintragen','Bitte tragen Sie Ihre Adresse ein.','Пожалуйста, впишите Ваш адрес.')
      ]
    }
  ];

  // Keep the public API small and immutable enough for the learning engine.
  const byId=new Map(TOPICS.map(t=>[t.id,t]));
  window.OttoCourseDataV8={
    version:'8.0.0',
    sourceNote:'Curriculum aligned to Goethe-Zertifikat A1 Start Deutsch 1 themes and Wortliste; Otto lessons are didactically regrouped, not a copy of the list.',
    topics:TOPICS,
    topic(id){return byId.get(id)||null;},
    allWords(){return TOPICS.flatMap(t=>t.words.map(x=>({...x,topicId:t.id,topicTitle:t.title})));},
    allPhrases(){return TOPICS.flatMap(t=>t.phrases.map(x=>({...x,topicId:t.id,topicTitle:t.title})));}
  };
})();
