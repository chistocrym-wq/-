(() => {
  'use strict';
  if (window.OttoReadingRulesV15) return;
  window.OttoReadingRulesV15 = [
    {id:'j',pattern:'j',answer:'читается как «й»',text:'В обычных немецких словах j звучит как «й».',examples:['ja','Jahr']},
    {id:'ei',pattern:'ei',answer:'примерно «ай»',text:'Сочетание ei обычно звучит примерно как «ай».',examples:['nein','drei','heißen']},
    {id:'ie',pattern:'ie',answer:'долгое «и»',text:'Сочетание ie обычно даёт долгий звук «и».',examples:['vier','sieben','hier']},
    {id:'sch',pattern:'sch',answer:'читается как «ш»',text:'sch — один из самых частых способов передать звук «ш».',examples:['Schule','Schwester']},
    {id:'ichch',pattern:'ch после i/e',answer:'мягкий звук [ç]',text:'В ich, mich, nicht ch произносится мягко, не как русский твёрдый «х».',examples:['ich','mich','nicht']},
    {id:'achch',pattern:'ch после a/o/u/au',answer:'более твёрдый звук [x]',text:'После a, o, u и au ch звучит твёрже.',examples:['acht','auch','Buch']},
    {id:'z',pattern:'z',answer:'читается как «ц»',text:'Немецкая z в начале и середине слова обычно звучит как «ц».',examples:['zwei','zehn','Zeit']},
    {id:'w',pattern:'w',answer:'читается как «в»',text:'Немецкая w произносится как русский «в».',examples:['wo','Wasser']},
    {id:'v',pattern:'v',answer:'часто читается как «ф»',text:'В частых немецких словах Vater, vier, Vogel буква v звучит как «ф». В заимствованиях возможен звук «в».',examples:['Vater','vier','Vogel']},
    {id:'sp',pattern:'sp в начале',answer:'примерно «шп»',text:'В начале слова sp обычно звучит как «шп».',examples:['Sport','sprechen']},
    {id:'st',pattern:'st в начале',answer:'примерно «шт»',text:'В начале слова st обычно звучит как «шт».',examples:['Stadt','Straße']},
    {id:'eu',pattern:'eu / äu',answer:'примерно «ой»',text:'eu и äu обычно передают один и тот же дифтонг, примерно «ой».',examples:['heute','neun','Häuser']},
    {id:'ss',pattern:'ß',answer:'глухой звук «с»',text:'ß читается как глухой «с». Это не отдельный звук «бета».',examples:['heißen','Straße','groß']},
    {id:'umlaut',pattern:'ä / ö / ü',answer:'отдельные немецкие гласные',text:'Умлауты — самостоятельные немецкие гласные. Их лучше запоминать на слух, а не заменять русскими буквами.',examples:['Mädchen','schön','fünf']},
    {id:'ending',pattern:'-e / -er в конце',answer:'произносятся ослабленно, но не исчезают',text:'Конечные -e и -er часто звучат слабее, но правило «окончания не произносятся» неверно.',examples:['bitte','Name','Vater']},
  ];;
})();
