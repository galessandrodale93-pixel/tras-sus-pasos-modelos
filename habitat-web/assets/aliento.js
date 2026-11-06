/* Una palabra para empezar: versículo (NTV) o mensaje de aliento al abrir los paneles. */
(function () {
  var V = [
    ['Ustedes son la luz del mundo, como una ciudad en lo alto de una colina que no puede esconderse.', 'Mateo 5:14'],
    ['Pero otras semillas cayeron en tierra fértil, ¡y produjeron una cosecha que fue treinta, sesenta y hasta cien veces más numerosa de lo que se había sembrado!', 'Mateo 13:8'],
    ['De la misma manera, ¡hay más alegría en el cielo por un pecador perdido que se arrepiente y regresa a Dios que por noventa y nueve justos que no se extraviaron!', 'Lucas 15:7'],
    ['Lleno de amor y de compasión, corrió hacia su hijo, lo abrazó y lo besó.', 'Lucas 15:20'],
    ['Pues el Hijo del Hombre vino a buscar y a salvar a los que están perdidos.', 'Lucas 19:10'],
    ['Así que ahora les doy un nuevo mandamiento: ámense unos a otros. Tal como yo los he amado, ustedes deben amarse unos a otros.', 'Juan 13:34'],
    ['Entonces se dijeron el uno al otro: «¿No ardía nuestro corazón cuando nos hablaba en el camino y nos explicaba las Escrituras?».', 'Lucas 24:32'],
    ['Por lo tanto, vayan y hagan discípulos de todas las naciones, bautizándolos en el nombre del Padre y del Hijo y del Espíritu Santo.', 'Mateo 28:19'],
    ['El Espíritu del Señor está sobre mí, porque me ha ungido para llevar la Buena Noticia a los pobres.', 'Lucas 4:18'],
    ['Jesús crecía en sabiduría y en estatura, y en el favor de Dios y de toda la gente.', 'Lucas 2:52']
  ];
  var T = [
    'Cada mensaje que mandás puede ser el que alguien necesitaba para volver. Gracias por cuidar a los que Dios te confió.',
    'Acompañar también es formar. Lo que sembrás en una charla, un mensaje o una oración da fruto a su tiempo.',
    'Detrás de cada nombre de esta lista hay una historia que Dios está escribiendo. Gracias por ser parte.',
    'Una pregunta sincera a tiempo vale más que muchas palabras. Hoy también podés ser la voz que anima.'
  ];
  var S = [
    'Lo que hacés antes de que empiece la clase prepara el lugar para que otros se encuentren con Dios. Gracias por servir.',
    'Cada silla acomodada y cada cable conectado es parte de lo que Dios hace en Habitat. El Señor ve todo lo que hacés.',
    'Servir también es adorar. Gracias por hacerlo con alegría y con excelencia.',
    'Tu servicio sostiene lo que otros reciben. Gracias por tu tiempo y tu corazón dispuesto.'
  ];
  window.HabitatAliento = function (tipo) {
    var pool = V.map(function (v) { return { t: v[0], r: v[1] }; }).concat((tipo === 'vol' ? S : T).map(function (t) { return { t: t }; }));
    var i = Math.floor(Math.random() * pool.length);
    try { var last = +sessionStorage.getItem('aliento:' + tipo); if (i === last) i = (i + 1) % pool.length; sessionStorage.setItem('aliento:' + tipo, i); } catch (e) {}
    return pool[i];
  };
})();
