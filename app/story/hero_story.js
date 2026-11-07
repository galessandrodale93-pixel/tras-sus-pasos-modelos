/* Trama de Hero: protagonista, compañeros, capítulos, ganchos y rollo de Isaías.
   Reglas: Jesús solo dice palabras de los evangelios (acá no habla); citas textuales solo NTV verificadas
   (las del material del alumno); el resto se cuenta con paráfrasis, sin comillas. */
export const HCOMP = {
  esc: { name: 'Eleazar', who: 'anciano escriba', ico: '📜' },
  zel: { name: 'Asher', who: 'tu amigo zelote', ico: '🔥' },
  rom: { name: 'Lucio', who: 'soldado romano', ico: '🛡️' }
};
// fragmentos del rollo de Isaías 53, uno por etapa (paráfrasis; el 53:5 va textual, como figura en el material)
export const HSCROLL = {
  nacimiento: { ref: 'Isaías 53:1', t: 'El profeta pregunta quién creyó el mensaje y a quién se le mostró el poder del Señor.' },
  infancia: { ref: 'Isaías 53:2', t: 'El siervo crece delante de Dios como un brote tierno, como una raíz en tierra seca. No tiene nada llamativo que haga que la gente se fije en él.' },
  bautismo: { ref: 'Isaías 53:7', t: 'Lo maltratan y él no se defiende. Como un cordero que llevan al matadero, se queda en silencio.' },
  galilea: { ref: 'Isaías 53:3', t: 'Es despreciado y rechazado por la gente; conoce de cerca el dolor y el sufrimiento.' },
  milagros: { ref: 'Isaías 53:4', t: 'Carga con nuestras enfermedades y se hace cargo de nuestros dolores. Mateo 8:17 lo relaciona con las sanidades de Jesús.' },
  parabolas: { ref: 'Isaías 53:6', t: 'Todos nos perdimos como ovejas; cada uno se fue por su propio camino. Y el Señor puso sobre él el pecado de todos nosotros.' },
  jerusalen: { ref: 'Isaías 53:8-9', t: 'Lo arrestan y lo condenan injustamente, aunque nunca hizo violencia ni engañó a nadie. Lo entierran junto a un rico.' },
  cruz: { ref: 'Isaías 53:5 y 53:12', q: 'Pero él fue traspasado por nuestras rebeliones y aplastado por nuestros pecados.', t: 'Entrega su vida hasta la muerte, lo cuentan entre los rebeldes, carga con el pecado de muchos e intercede por los que se rebelaron.' },
  resurreccion: { ref: 'Isaías 53:10-11', t: 'Después de su sufrimiento verá la luz y quedará satisfecho; su vida se prolonga, y por lo que él hizo muchos son declarados justos.' }
};
// orden del capítulo 53 para la lectura completa frente a la cruz
export const HSCROLL_ORDER = ['nacimiento', 'infancia', 'galilea', 'milagros', 'cruz', 'parabolas', 'bautismo', 'jerusalen', 'resurreccion'];
export const HCHAP = {
  nacimiento: { n: 1, t: 'Belén', open: ['{name}, sos aprendiz de pescador en Capernaúm. Tu papá está enfermo hace semanas y las redes ya no alcanzan para todos en casa.', 'Una noche, junto al fuego del puerto, Eleazar, un anciano escriba, te cuenta una historia de hace unos treinta años: un niño nacido en Belén, pastores que corrieron a verlo y unos magos que siguieron una estrella. Desde entonces te sigue una pregunta: ¿quién es este hombre?'],
    say: [['esc', 'Miqueas lo había escrito siglos antes: de Belén iba a salir el gobernante de Israel. Yo leí ese rollo cien veces.'], ['zel', '¿Un rey que nace en un establo? Los reyes que yo conozco viven en palacios y cobran impuestos.']],
    hook: 'En Jerusalén, un rey nervioso pregunta por un niño recién nacido. Y en Capernaúm, la fiebre de tu papá no baja.' },
  infancia: { n: 2, t: 'Nazaret', open: ['Eleazar sigue contando. Ese niño creció en Nazaret, un pueblo chico de Galilea. Lo conocían como el carpintero.', 'Vos también conocés lo que es trabajar desde chico: remendar redes, cargar canastas, levantarte antes del sol.'],
    say: [['esc', 'Lo vi una vez en el templo, con doce años, haciendo preguntas a los maestros. Nunca me olvidé de sus respuestas.'], ['zel', 'Un carpintero de Nazaret. ¿Qué puede salir de bueno de ahí?']],
    hook: 'Pasan los años. En el desierto de Judea, una voz empieza a llamar a la gente al río Jordán.' },
  bautismo: { n: 3, t: 'El Jordán', open: ['Ahora lo vivís con tus propios ojos. Viajás con Asher y Eleazar hasta el río Jordán, donde Juan bautiza a una multitud.', 'Entre la gente aparece un hombre de Galilea. Cuando sale del agua, algo cambia en el aire.'],
    say: [['zel', 'Vine por Juan, que habla fuerte contra los poderosos. Pero ese de Galilea… no sé qué pensar.'], ['esc', 'Juan lo llamó Cordero de Dios. Ese título pesa, muchacho. Isaías habló de un cordero.']],
    hook: 'Dicen que el hombre del Jordán ayunó cuarenta días en el desierto y que ahora vuelve a Galilea. A tu pueblo.' },
  galilea: { n: 4, t: 'Galilea', open: ['De vuelta en Capernaúm. Jesús enseña junto al mar de Galilea, a pocos pasos de tu barca.', 'En el puerto hay un soldado nuevo, Lucio, que vigila a los que se juntan a escuchar.'],
    say: [['rom', 'Tengo orden de vigilar las multitudes. Este maestro no lleva armas, y aun así la gente lo sigue.'], ['zel', 'Si es el Mesías, que nos libre de Roma. Para eso tiene que pelear.'], ['esc', 'En la sinagoga leyó el rollo de Isaías y dijo que se cumplía ese mismo día. Ningún maestro se animó nunca a decir eso.']],
    hook: 'En la sinagoga hay un fariseo que anota cada palabra del maestro. Y tu papá sigue en cama.' },
  milagros: { n: 5, t: 'Señales', open: ['Las noticias corren por toda Galilea: agua que se vuelve vino, un paralítico que camina, ciegos que ven.', 'Pensás en tu papá. Si este hombre sana a otros, ¿por qué no a él?'],
    say: [['esc', 'Isaías dijo que el siervo iba a cargar con nuestras enfermedades. Mateo lo escribió al ver estas sanidades.'], ['zel', 'Vi al paralítico caminar con mis propios ojos. No lo puedo negar, aunque quiera.'], ['rom', 'Un oficial de mi cohorte dice que su sirviente sanó sin que este Jesús entrara a la casa.']],
    hook: 'Herodes Antipas escuchó hablar de las señales y quiere saber quién es este hombre.' },
  parabolas: { n: 6, t: 'Parábolas', open: ['Jesús enseña con historias: semillas, ovejas, monedas, un padre que corre hacia su hijo.', 'Vos entendés de redes y de peces. Él habla de cosas que conocés, y aun así te dejan pensando días enteros.'],
    say: [['esc', 'Cuenta historias simples para que el que tenga oídos escuche. Los sabios se quedan en la superficie.'], ['zel', 'La del samaritano me molestó. Un samaritano como el héroe… y un sacerdote que pasa de largo.']],
    hook: 'Los maestros de la ley se reúnen en secreto. Jesús anuncia que sube a Jerusalén para la Pascua.' },
  jerusalen: { n: 7, t: 'Jerusalén', open: ['Subís a Jerusalén con miles de peregrinos. Faltan pocos días para la Pascua.', 'La ciudad está llena de soldados. Entre ellos reconocés a Lucio.'],
    say: [['rom', 'Nos mandaron reforzar la guardia por la fiesta. Hay rumores de que van a arrestar al galileo.'], ['zel', 'Entró montado en un burro. ¡En un burro! Esperaba un caballo de guerra y espadas.'], ['esc', 'Zacarías lo anunció: tu rey viene a vos, humilde, montado en un burro. Asher, leé los profetas antes de enojarte.']],
    hook: 'La Pascua se acerca. Esta noche, en un huerto de olivos, todo va a cambiar.' },
  cruz: { n: 8, t: 'La cruz', open: ['Lo arrestaron de noche. Lo juzgaron. Lo condenaron.', 'Caminás detrás de la multitud hasta el Gólgota. Lucio está de guardia frente a la cruz.'],
    say: [['zel', 'No peleó. No llamó a nadie. Se dejó llevar… No entiendo nada.'], ['esc', 'Ahora entiendo el rollo, Asher. Cada palabra de Isaías estaba hablando de él.'], ['rom', '¡Este hombre era verdaderamente el Hijo de Dios! (Marcos 15:39)']],
    hook: 'Silencio. La piedra cierra la tumba. Mañana es sábado, y después llega el primer día de la semana.' },
  resurreccion: { n: 9, t: 'El tercer día', open: ['Amanece el primer día de la semana. Unas mujeres vuelven corriendo de la tumba con una noticia que nadie cree.', 'Asher, Eleazar y vos se miran sin saber qué decir.'],
    say: [['zel', 'Vi la tumba vacía. Vi los lienzos doblados. Yo… creo.'], ['esc', 'El siervo de Isaías iba a ver la luz después de su sufrimiento. Lo esperé toda mi vida.']],
    hook: 'La pregunta que te acompañó todo el camino tiene respuesta. Tomás la dijo al verlo: «¡Mi Señor y mi Dios!» (Juan 20:28).' }
};
// conversaciones cinemáticas: al abrir cada capítulo, un compañero te pregunta algo.
// Cada respuesta: [texto, inclinación (registro para dones), cambio de actitud {compañero: n}, [quién responde, respuesta]]
export const HASK = {
  nacimiento: { who: 'zel', q: '¿Y vos qué pensás? ¿Puede un rey nacer en un establo?', o: [
    ['Si Dios lo eligió así, quiero entender por qué. Eleazar, ¿qué más dice el rollo?', 'maestro', { esc: 1 }, ['esc', 'Esa pregunta es el comienzo de la sabiduría. Mañana te muestro el rollo de Miqueas.']],
    ['Los pastores fueron los primeros en saberlo. Me gusta que Dios avise primero a los de abajo.', 'misericordia', { zel: 1 }, ['zel', 'Pastores… gente como nosotros. Eso no me lo esperaba.']],
    ['Quiero contárselo a mi papá esta noche. Le va a dar esperanza.', 'evangelista', {}, ['esc', 'Contalo bien, sin agregarle nada. Las buenas noticias no necesitan adornos.']]] },
  infancia: { who: 'esc', q: 'Un carpintero que crece en un pueblo chico. ¿Qué te dice eso, muchacho?', o: [
    ['Que el trabajo de todos los días también le importa a Dios.', 'servicio', { esc: 1 }, ['esc', 'Bien dicho. Hasta el que remienda redes puede honrar a Dios con sus manos.']],
    ['Que Dios no mira de dónde venís. A Nazaret nadie la tenía en cuenta.', 'profeta', { zel: 1 }, ['zel', 'Mmm. Yo también soy de un pueblo que nadie tiene en cuenta.']],
    ['Me gustaría saber qué preguntas hacía en el templo a los doce años.', 'maestro', { esc: 1 }, ['esc', 'Preguntas que dejaban pensando a los maestros. Vos también seguí preguntando.']]] },
  bautismo: { who: 'zel', q: 'Juan grita contra los poderosos y la gente se mete al río. ¿Vos te bautizarías?', o: [
    ['Sí. Yo también tengo cosas que dejar atrás.', 'profeta', { zel: 1 }, ['zel', 'Sos más valiente que yo. Yo todavía tengo mucha bronca adentro.']],
    ['Primero quiero escuchar a Juan hasta el final y entender lo que pide.', 'maestro', { esc: 1 }, ['esc', 'Prudente. Juan pide frutos que muestren el cambio, y eso se aprende escuchando.']],
    ['Me voy a quedar a ayudar a los que llegan cansados del camino.', 'servicio', {}, ['zel', 'Siempre pensando en los demás. Te alcanzo agua para ellos.']]] },
  galilea: { who: 'rom', q: 'Galileo, vos lo escuchás todos los días. ¿Este maestro es peligroso para Roma?', o: [
    ['Vení a escucharlo vos mismo. Después me decís.', 'evangelista', { rom: 1 }, ['rom', 'Tal vez lo haga… sin el casco.']],
    ['Enseña a amar incluso a los enemigos. Juzgá vos si eso es peligroso.', 'profeta', { rom: 1, zel: -1 }, ['rom', 'A los enemigos… Entonces también a un soldado como yo.']],
    ['No sé. Pero cura a los enfermos de mi pueblo, y podría curar a los tuyos.', 'misericordia', { rom: 1 }, ['rom', 'Eso escuché. Un hombre de mi cohorte tiene un hijo enfermo.']]] },
  milagros: { who: 'esc', q: 'Estás pensando en tu papá, ¿verdad?', o: [
    ['Sí. Voy a pedirle a Jesús que venga a mi casa.', 'evangelista', { esc: 1 }, ['esc', 'Hay fe en lo que decís. Andá, muchacho.']],
    ['Voy a quedarme con él y cuidarlo, pase lo que pase.', 'pastor', {}, ['esc', 'Cuidar al que sufre también es obra de Dios.']],
    ['Quiero orar por él con ustedes, ahora.', 'misericordia', { zel: 1 }, ['zel', 'Yo no sé orar muy bien… pero me quedo con vos.']]] },
  parabolas: { who: 'zel', q: 'La del samaritano me sigue molestando. ¿Vos con cuál historia te quedás?', o: [
    ['Con la de la oveja perdida. Dejó las noventa y nueve para buscar una.', 'pastor', { esc: 1 }, ['esc', 'Ninguna oveja es poca cosa para Dios. Ese es su corazón.']],
    ['Con la del samaritano. Me hizo pensar a quién paso de largo yo.', 'misericordia', { zel: 1 }, ['zel', 'A mí también. Y no me gusta lo que encontré.']],
    ['Con la del sembrador. Quiero ser tierra buena.', 'maestro', { esc: 1 }, ['esc', 'Tierra buena: escuchar, entender y dar fruto. Mateo lo explica bien.']]] },
  jerusalen: { who: 'rom', q: 'Lo van a arrestar, galileo. Si fuera vos, me iría de la ciudad.', o: [
    ['Me quedo. Si él sube a Jerusalén, yo también.', 'apostol', { zel: 1 }, ['rom', 'Sos terco como tu maestro. Cuidate.']],
    ['Gracias por avisarme, Lucio. Vos también cuidate.', 'pastor', { rom: 1 }, ['rom', 'Nadie me dijo eso desde que llegué a Judea.']],
    ['Voy a avisarle a la gente que conozco para que estén atentos.', 'servicio', {}, ['zel', 'Voy con vos. Conozco a todos en la puerta de las ovejas.']]] },
  cruz: { who: 'nar', q: 'Nadie habla. ¿Qué hacés?', o: [
    ['Me quedo en silencio, cerca de la cruz.', 'misericordia', {}, ['esc', 'Isaías lo había escrito. Ahora lo vemos con nuestros ojos.']],
    ['Me acerco a Asher y le pongo la mano en el hombro.', 'pastor', { zel: 1 }, ['zel', '…Gracias por quedarte.']],
    ['Oro en voz baja con Eleazar.', 'profeta', { esc: 1 }, ['esc', 'Señor, ten misericordia de nosotros.']]] },
  resurreccion: { who: 'zel', q: 'Las mujeres dicen que está vivo. ¿Qué hacemos ahora?', o: [
    ['Volver a Capernaúm y contárselo a todos, empezando por mi papá.', 'evangelista', { zel: 1 }, ['zel', 'Te acompaño. Esta vez no voy a pelear: voy a contar.']],
    ['Buscar a los otros discípulos y estar con ellos.', 'apostol', { esc: 1 }, ['esc', 'Juntos. Así empezó todo, y así va a seguir.']],
    ['Abrir de nuevo el rollo y leerlo todo con Eleazar.', 'maestro', { esc: 1 }, ['esc', 'Desde el principio, muchacho. Ahora cada línea tiene nombre.']]] }
};
// respuestas para testigos (formato estándar de la parte 2)
export const WASK = [
  ['Gracias por contármelo. No me lo voy a olvidar.', 'maestro', 'Contarlo me hace bien. Que te acompañe en el camino.'],
  ['¿Puedo contarlo yo también en mi pueblo?', 'evangelista', 'Contalo. Para eso me pasó a mí: para que otros lo sepan.'],
  ['¿Y vos cómo estás ahora?', 'pastor', 'Nadie me había preguntado eso. Estoy en paz. Gracias por preguntar.']
];
// preguntas de la fogata: elecciones de rol (miden dones, no frutos). Una por día de juego, junto al fuego.
// [quién pregunta, pregunta, [[respuesta, don]...], respuesta del compañero]
export const FIREQ = [
  ['zel', 'Si Jesús nos mandara a un pueblo donde nadie lo conoce, ¿qué harías primero?', [['Contarles lo que vimos con nuestros ojos.', 'evangelista'], ['Buscar a los que están solos o enfermos y quedarme con ellos.', 'pastor'], ['Abrir las Escrituras y explicarles quién es.', 'maestro'], ['Ir adelante y preparar el lugar para los que vienen después.', 'apostol']], 'Con vos al lado, me animo a ir a cualquier pueblo.'],
  ['esc', 'Cuando el grupo discute y nadie se pone de acuerdo, ¿qué hacés vos?', [['Recuerdo lo que Dios dice y lo digo con claridad.', 'profeta'], ['Escucho a cada uno hasta que se calman.', 'pastor'], ['Busco algo práctico para hacer juntos.', 'servicio'], ['Explico con paciencia lo que cada uno no entendió.', 'maestro']], 'Cada uno tiene su lugar en el cuerpo. Me alegra ver el tuyo.'],
  ['rom', 'En mi cohorte cada uno tiene su puesto. En el grupo de ustedes, ¿cuál sería el tuyo?', [['El que cocina y carga lo que haga falta.', 'servicio'], ['El que acompaña al que se queda atrás.', 'misericordia'], ['El que habla con los desconocidos del camino.', 'evangelista'], ['El que propone ir a lugares nuevos.', 'apostol']], 'Un buen puesto. Ningún grupo camina lejos sin alguien así.'],
  ['zel', 'Hoy vi a un hombre llorando en el mercado y no supe qué hacer. ¿Vos qué hubieras hecho?', [['Sentarme con él, aunque no supiera qué decir.', 'misericordia'], ['Preguntarle qué necesita y conseguírselo.', 'servicio'], ['Orar con él y animarlo con una promesa de Dios.', 'profeta'], ['Invitarlo a venir con nosotros a escuchar al maestro.', 'evangelista']], 'La próxima vez no paso de largo. Te lo prometo.'],
  ['esc', 'Cuando leés las Escrituras, ¿qué es lo que más te gusta?', [['Entenderlas bien para poder enseñarlas.', 'maestro'], ['Encontrar palabras de ánimo para alguien que lo necesita.', 'pastor'], ['Ver lo que Dios le pide a su pueblo hoy.', 'profeta'], ['Encontrar historias para contarle a gente nueva.', 'evangelista']], 'La Palabra tiene algo para cada uno. Seguí leyendo, muchacho.'],
  ['zel', 'Si pudieras empezar algo nuevo para Dios en Capernaúm, ¿qué sería?', [['Un grupo nuevo en un barrio donde no hay ninguno.', 'apostol'], ['Una mesa abierta para los que no tienen qué comer.', 'misericordia'], ['Una escuela para chicos que quieren aprender las Escrituras.', 'maestro'], ['Un equipo que arregle las casas de las viudas.', 'servicio']], '¡Contá conmigo! Yo pongo las manos.']
];
// diario del protagonista al cerrar cada etapa (primera persona, palabras propias)
export const DIARY = {
  nacimiento: 'Hoy no pude dormir pensando en los pastores. Dios les avisó primero a ellos, gente que trabaja de noche, como yo. Me pregunto si mi papá también lo va a querer conocer.',
  infancia: 'Un carpintero de un pueblo chico. Eleazar dice que lo vio en el templo cuando era un chico. Me gusta pensar que Dios también ve el trabajo de todos los días.',
  bautismo: 'Hoy vi el río lleno de gente. Juan le dijo Cordero de Dios. Asher no sabe qué pensar y yo tampoco, pero algo cambió cuando salió del agua.',
  galilea: 'Enseña a pocos pasos de mi barca. Lucio vigila, Asher espera una pelea y Eleazar lee los profetas. Yo solo quiero escucharlo un poco más.',
  milagros: 'Vi caminar a un hombre que no podía moverse. Le pedí a Dios por mi papá. Todavía no sé qué va a pasar, pero ya no tengo miedo de pedir.',
  parabolas: 'Habla de semillas, de ovejas y de un padre que corre a abrazar a su hijo. Esta noche me di cuenta de que esas historias hablan de mí.',
  jerusalen: 'Entró en un burro y la gente tendió mantos en el camino. Lucio dice que lo quieren arrestar. Mañana es la Pascua y tengo el corazón apretado.',
  cruz: 'No tengo palabras. El cielo se oscureció y todos nos quedamos en silencio. Eleazar leyó el rollo de Isaías y entendí que todo era por nosotros. Por mí.',
  resurreccion: '¡Está vivo! Las mujeres corrían, la piedra estaba corrida y el campo amaneció lleno de flores. La pregunta que me acompañó todo el camino ya tiene respuesta.'
};
// la cruz: narración reverente (paráfrasis; Isaías 53:5 y Marcos 15:39 en NTV, como en el material)
export const CROSS = {
  hero: ['Al mediodía, una oscuridad cubrió toda la tierra hasta las tres de la tarde.', 'Lo clavaron en una cruz entre dos criminales. Le habían puesto una corona de espinas.', 'La gente que pasaba se quedaba en silencio. Algunas mujeres miraban desde lejos.', 'Pero él fue traspasado por nuestras rebeliones y aplastado por nuestros pecados.'],
  kids: ['Al mediodía, el cielo se puso oscuro.', 'Jesús dio su vida en la cruz por amor a nosotros.', 'Sus amigos y su mamá estaban cerca, muy tristes.'],
  dawn: ['El primer día de la semana, muy temprano, unas mujeres fueron a la tumba.', 'La piedra estaba corrida y la tumba, vacía.', 'Corrieron a contarlo. Todo el campo amanecía distinto.']
};
