/* Aldeas de Hero: gente para saludar, charlas, pequeñas ayudas, testigos y decisiones.
   Los testigos cuentan en primera persona con palabras propias (sin citas textuales ni palabras puestas en boca de Jesús). */
export const VNAMES = ['Miriam', 'Rut', 'Débora', 'Noemí', 'Rebeca', 'Ana', 'Jonatán', 'Eliseo', 'Tobías', 'Leví', 'Benjamín', 'Ezequías', 'Sara', 'Abigail', 'Josías', 'Natán'];
export const STARS_TXT = ['Te miran con desconfianza', 'Te reciben con frialdad', 'Te reciben con amabilidad', 'Te reciben con cariño', 'Te reciben como a uno de la familia'];
// charla larga de una anciana: escucharla hasta el final, apurarla o seguir de largo
export const TALKS = [
  ['Cuando era chica, mi papá me llevaba al pozo antes del amanecer. Decía que el agua más fresca es la que se busca temprano. Después supe que el salmista hablaba de buscar a Dios así, de madrugada.', 'Gracias por escucharme hasta el final. Hoy casi nadie se queda.'],
  ['Mi esposo era pastor. Una noche de invierno salió a buscar una sola oveja que faltaba y volvió al amanecer, empapado y feliz, con ella sobre los hombros. Nunca me olvidé de su cara.', 'Me hiciste bien, hijo. Que Dios te bendiga el camino.'],
  ['Tuve siete hijos. Cada uno se fue por su camino, pero los sábados vuelven a mi mesa. Yo siempre pongo un plato de más, por si llega alguien que no tiene adónde ir.', 'Si un sábado no tenés dónde comer, acá hay un plato para vos.'],
  ['Dicen que en Galilea anda un maestro que se sienta a la mesa con cobradores y pescadores. Yo ya soy vieja, pero me gustaría verlo una vez antes de irme.', 'Si lo ves, contame cómo es. Te voy a estar esperando.'],
  ['Antes había un leproso en las afueras al que nadie se le acercaba. Yo le dejaba pan sobre una piedra. Nunca supe su nombre, pero él siempre me saludaba con la mano.', 'Escuchar también es una forma de dar pan, ¿sabías?']
];
export const HELPS = {
  aguatera: ['Ayudar con el cántaro', 'Le cargaste el cántaro hasta su casa.', 'El cántaro pesaba menos con tu ayuda. ¡Gracias!'],
  pescador: ['Ayudar con la red', 'Desenredaste la red con él.', 'Con dos manos más la red quedó lista en un momento.'],
  vendedor: ['Levantar lo que se cayó', 'Juntaste las granadas que se le cayeron.', 'No se perdió ninguna. ¡Sos un buen vecino!']
};
export const MARGINAL = {
  leproso: { name: 'Un hombre con lepra', note: 'Vive en las afueras. Según la ley, nadie se le acerca.', greet: 'Hace años que nadie me saluda. Gracias.' },
  cobrador: { name: 'Un cobrador de impuestos', note: 'Trabaja para Roma. La gente lo evita.', greet: 'Nadie me dice shalom. Me hiciste el día.' },
  mendiga: { name: 'Una viuda pobre', note: 'Pide limosna junto al camino.', greet: 'El Señor ve a los que nadie ve. Gracias por verme.' }
};
// decisiones con consecuencias (la historia bíblica no cambia; cambian los compañeros, el Resplandor y la reputación)
export const DECIDE = {
  leproso: { q: 'El hombre con lepra tiene hambre. ¿Qué hacés?', o: [['Le das de tu pan y te sentás a escucharlo', 'kind'], ['Le dejás una moneda a la distancia', 'mid'], ['Seguís de largo', 'cold']] },
  cobrador: { q: 'El cobrador está solo comiendo. Te invita a sentarte.', o: [['Te sentás a comer con él', 'kind'], ['Le agradecés y seguís', 'mid'], ['Te alejás para que no te vean con él', 'cold']] },
  mendiga: { q: 'La viuda junta ramas para el fuego y no puede con el atado.', o: [['Le cargás el atado hasta su casa', 'kind'], ['Le das unas ramas que tenés', 'mid'], ['Seguís tu camino', 'cold']] }
};
// testigos: cuentan lo que vivieron (paráfrasis de los evangelios)
export const WITNESS = {
  nacimiento: [{ name: 'Un pastor de Belén', look: 'pastor', t: ['Yo estaba esa noche con las ovejas, en los campos de Belén. De golpe, una luz nos rodeó y un ángel nos habló. Tuvimos muchísimo miedo.', 'Fuimos corriendo y encontramos al bebé acostado en un pesebre, tal como nos habían dicho. Volví a mi rebaño alabando a Dios. Esa noche no dormí.'] }],
  infancia: [{ name: 'Una vecina de Nazaret', look: 'mujer', t: ['Yo conocí al hijo de María desde chico. Trabajaba con José en el taller: madera, piedra, lo que hiciera falta.', 'Una vez, volviendo de la Pascua, sus padres lo buscaron tres días. Lo encontraron en el templo, conversando con los maestros. María nunca se olvidó de eso.'] }],
  bautismo: [{ name: 'Un hombre bautizado por Juan', look: 'hombre', t: ['Caminé dos días hasta el Jordán para escuchar a Juan. Confesé mis pecados y me bautizó en el río.', 'Después vi llegar a uno de Galilea. Juan no quería bautizarlo; decía que él necesitaba ser bautizado por ese hombre. Cuando salió del agua, sentí que el cielo se abría.'] }],
  galilea: [{ name: 'Un pescador amigo de Pedro', look: 'pescador', t: ['Esa noche no sacamos nada. Al amanecer, el maestro le dijo a Pedro que volviera a tirar las redes, más adentro.', 'Sacamos tantos peces que las redes se rompían y las dos barcas casi se hunden. Pedro cayó de rodillas en la barca. Después dejó todo y lo siguió.'] }],
  milagros: [{ name: 'La mujer que tocó el manto', look: 'mujer', t: ['Doce años estuve enferma. Gasté todo en médicos y cada vez estaba peor. Pensé: si toco aunque sea su ropa, voy a quedar sana.', 'Me acerqué por detrás, entre la gente, y toqué el borde de su manto. En ese instante supe que estaba sana. Él se dio vuelta, me miró y me llamó hija.'] }],
  parabolas: [{ name: 'La mujer del pozo de Sicar', look: 'mujer', t: ['Yo iba a buscar agua al mediodía, cuando no había nadie, para que no me miraran. Ese día había un judío sentado junto al pozo, cansado del camino.', 'Me pidió de beber y después me habló de un agua que quita la sed para siempre. Me dijo todo lo que yo había hecho. Dejé el cántaro y corrí al pueblo a contarlo (Juan 4).'] }],
  jerusalen: [{ name: 'Zaqueo de Jericó', look: 'rico', t: ['Yo era jefe de los cobradores de impuestos, y rico. Era bajo, así que me trepé a un sicómoro para verlo pasar.', 'Se detuvo justo debajo, me llamó por mi nombre y dijo que se iba a quedar en mi casa. Ese día repartí la mitad de lo que tenía con los pobres y devolví cuatro veces más a quien le había cobrado de más.'] }, { name: 'Bartimeo', look: 'hombre', t: ['Yo era ciego y pedía limosna en la entrada de Jericó. Cuando supe que pasaba Jesús, grité con todas mis fuerzas, aunque me mandaban callar.', 'Me llamó y me preguntó qué quería. Le pedí ver. Y vi. Desde ese día lo sigo por el camino.'] }],
  cruz: [{ name: 'Simón de Cirene', look: 'hombre', t: ['Yo volvía del campo y me cruzaron con un condenado. Los soldados me obligaron a cargar su cruz detrás de él.', 'Caminé a su lado hasta el Gólgota. Nunca vi a nadie sufrir así sin maldecir a nadie. Esa cruz cambió mi vida.'] }],
  resurreccion: [{ name: 'Cleofas, de Emaús', look: 'hombre', t: ['Volvíamos tristes a Emaús. Un hombre se nos acercó en el camino y nos explicó todo lo que decían las Escrituras sobre el Mesías.', 'En la mesa partió el pan y se nos abrieron los ojos: era él. Volvimos corriendo a Jerusalén esa misma noche. El corazón nos ardía.'] }]
};
export const SOLDIER_LINES = ['Circulá. No queremos alborotos antes de la fiesta.', 'Hay orden de vigilar a los galileos.', 'Dicen que el maestro de Nazaret está en la ciudad. Mantenete lejos de los problemas.'];
