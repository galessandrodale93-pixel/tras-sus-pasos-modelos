/* El material del alumno de Hero (v2, 45 páginas) dentro del mundo: canales 1 y 2 del mapa de integración.
   - OBJS: objetos inspeccionables. Una sola idea por lugar, máximo dos oraciones.
   - GENTE: personas con dos charlas. La primera es la escena; si volvés a hablarle, cuenta un detalle de época.
   Todo sale de la sección indicada en src. Las citas textuales son solo las NTV que trae el material; el resto va parafraseado y sin comillas.
   r: índice de etapa (0 Nacimiento, 1 Infancia, 2 Bautismo…); near: tipo de lugar del mapa junto al que aparece. */
export const OBJS = [
  // I · Nacimiento
  { id: 'pesebre', r: 0, near: 'village', k: 'manger', name: 'Un pesebre de piedra', t: 'Es el comedero de piedra donde comían los animales. Ahí acostó María al bebé, envuelto en tiras de tela.', src: 'Etapa I · Camino a Belén' },
  { id: 'horno', r: 0, near: 'village', k: 'oven', name: 'El horno del pueblo', t: 'Belén significa casa del pan. El que después diría que es el pan de vida nació acá, en la casa del pan.', src: 'Etapa I · Camino a Belén' },
  { id: 'mojon', r: 0, near: 'pastores', k: 'milestone', name: 'Un mojón del camino', t: 'De Nazaret a Belén hay unos 150 kilómetros. Fueron varios días a pie por caminos de tierra y piedra, con María al final del embarazo.', src: 'Etapa I · Camino a Belén' },
  // II · Infancia
  { id: 'molino', r: 1, near: 'taller', k: 'mill', name: 'Un molino de mano', t: 'En Nazaret, cada mañana se escuchaba el molino moliendo el grano para el pan del día. Jesús creció en esa vida sencilla.', src: 'Etapa II · Una casa en Nazaret' },
  { id: 'palomas', r: 1, near: 'temple', k: 'doves', name: 'El puesto de palomas', t: 'Dos tórtolas o dos pichones: la ofrenda de las familias que no podían pagar un cordero. El dueño de todo llegó al templo con la ofrenda de los pobres.', src: 'Etapa II · Presentado en el templo' },
  { id: 'shema', r: 1, near: 'taller', k: 'mezuza', name: 'Una cajita en el marco de la puerta', t: 'Guarda el Shemá, la oración que se decía cada mañana y cada noche. Escuchá, Israel: el Señor nuestro Dios es el único Señor, y amalo con todo tu corazón.', src: 'Etapa II · Una casa en Nazaret (Deuteronomio 6:4-5)' },
  // III · Bautismo
  { id: 'cordero', r: 2, near: 'river', k: 'lamb', name: 'Un cordero junto al río', t: 'Junto a este río, Juan presentó a Jesús con una frase que resume el evangelio: «¡Miren! ¡El Cordero de Dios, que quita el pecado del mundo!».', src: 'Etapa III · Cuarenta días en el desierto (Juan 1:29, NTV)' },
  { id: 'cuarenta', r: 2, near: 'desert', k: 'cairn', name: 'Un montón de piedras', t: 'Cuarenta años de Israel en el desierto, cuarenta días de Moisés en el monte y de Elías en el camino. Donde Israel cayó en la prueba, Jesús se mantuvo fiel.', src: 'Etapa III · Una ventana al texto' },
  { id: 'piedras', r: 2, near: 'desert', k: 'loaves', name: 'Piedras con forma de pan', t: 'Débil y con hambre, Jesús escuchó la tentación de convertirlas en pan. Respondió con la Escritura: la gente vive de cada palabra que sale de la boca de Dios.', src: 'Etapa III · Cuarenta días en el desierto (Deuteronomio 8:3)' },
  // IV · Galilea
  { id: 'barca', r: 3, near: 'lake', k: 'boat', name: 'Una barca de pescadores', t: 'En 1986 apareció en el barro de esta orilla una barca de madera del siglo I, de unos 8 metros. Una barca así usaban Pedro y sus compañeros.', src: 'Etapa IV · Una ventana al texto' },
  { id: 'redes', r: 3, near: 'lake', k: 'nets', name: 'Redes tendidas', t: 'Pedro había pescado toda la noche sin sacar nada. Aun así echó las redes donde Jesús le dijo, y casi se hunden las dos barcas.', src: 'Etapa IV · Remá mar adentro' },
  { id: 'tinajas', r: 3, near: 'village', k: 'jars', name: 'Seis tinajas de piedra', t: 'Eran para el lavado ceremonial, de unos cien litros cada una. En la boda de Caná, Jesús las llenó de vino nuevo y abundante.', src: 'Etapa V · Una boda en Caná' },
  // V · Milagros
  { id: 'techo', r: 4, near: 'roofhouse', k: 'roof', name: 'Un techo con un agujero', t: 'Los techos eran planos, de ramas y barro. Cuatro amigos lo abrieron para bajar a su amigo paralítico delante de Jesús.', src: 'Etapa V · El techo abierto' },
  { id: 'canastas', r: 4, near: 'feeding', k: 'baskets', name: 'Doce canastas', t: 'Cinco panes de cebada y dos pescados, la comida de los pobres, alcanzaron para miles. Con lo que sobró llenaron doce canastas.', src: 'Etapa V · Panes, peces y un lago bajo los pies' },
  // VI · Parábolas
  { id: 'terrenos', r: 5, near: 'field', k: 'soils', name: 'Cuatro terrenos', t: 'Camino, piedras, espinos y tierra buena, uno al lado del otro. La semilla es la misma; lo que cambia es cómo se recibe.', src: 'Etapa VI · El sembrador' },
  { id: 'sicomoro', r: 5, near: 'inn', k: 'tree', name: 'Un sicómoro', t: 'Zaqueo no veía por la multitud, así que corrió y se trepó a un árbol así. Jesús se detuvo justo ahí y lo llamó por su nombre.', src: 'Etapa VII · Zaqueo' },
  // VII · Jerusalén
  { id: 'mesa', r: 6, near: 'upper', k: 'table', name: 'La mesa de la Pascua', t: 'Pan sin levadura por el apuro de la salida y hierbas amargas por la esclavitud. En esta cena, Jesús le dio un sentido nuevo al pan y a la copa.', src: 'Etapa VII · Una ventana al texto' },
  { id: 'prensa', r: 6, near: 'garden', k: 'press', name: 'Una prensa de aceite', t: 'Getsemaní significa prensa de aceite: ahí se aplastaban las aceitunas. Esa noche Jesús oró ahí, aplastado por la angustia.', src: 'Etapa VII · Getsemaní' },
  // VIII · La cruz
  { id: 'letrero', r: 7, near: 'golgota', k: 'sign', name: 'Un letrero en tres idiomas', t: 'En hebreo, latín y griego decía: Jesús de Nazaret, el Rey de los judíos. Todos los que pasaban podían leerlo.', src: 'Etapa VIII · La cruz' },
  { id: 'cortina', r: 7, near: 'golgota', k: 'curtain', name: 'Un trozo de cortina rasgada', t: 'Cuando Jesús murió, la cortina del templo se rasgó de arriba abajo. El camino a la presencia de Dios quedó abierto.', src: 'Etapa VIII · La cruz (Marcos 15:38)' },
  // IX · Resurrección
  { id: 'lienzos', r: 7, near: 'tomb', k: 'linens', name: 'Lienzos y un paño doblado', t: 'Los lienzos quedaron tirados y el paño de la cabeza, doblado aparte. Juan vio y creyó.', src: 'Etapa IX · La tumba vacía' },
  { id: 'brasas', r: 8, near: 'shore', k: 'embers', name: 'Un fuego de brasas', t: 'Al amanecer, en la playa, Jesús esperaba a sus amigos con pescado y pan sobre las brasas. Junto a un fuego así, Pedro lo había negado.', src: 'Etapa IX · El desayuno en la playa' }
];
export const GENTE = [
  // I · Nacimiento
  { id: 'pastor', r: 0, near: 'pastores', name: 'Un pastor de Belén', sub: 'cuida el rebaño de noche', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#7A6A4A' },
    t1: ['Esa noche cuidábamos las ovejas acá cuando la gloria del Señor nos rodeó. Fuimos corriendo y encontramos al bebé tal como nos habían dicho.'],
    t2: ['¿Sabés qué es lo más raro? A gente como nosotros ni siquiera le creen en un juicio.', 'Y aun así, Dios nos avisó primero a nosotros.'], src: 'Etapa I · Los pastores y Una ventana al texto' },
  { id: 'mago', r: 0, near: 'village', name: 'Un sabio del oriente', sub: 'llegó siguiendo una estrella', look: { g: 'chico', age: 18, skin: '#A8784E', hair: '#1A120C', outfit: '#5A2A6A' },
    t1: ['Venimos de muy lejos, de tierras donde se estudia el cielo. Seguimos una estrella para adorar al rey que nació.'],
    t2: ['Le trajimos tres regalos. El oro es para un rey, el incienso se quema para Dios, y la mirra se usa para preparar a los muertos.'], src: 'Etapa I · Los magos y Una ventana al texto' },
  { id: 'escriba', r: 0, near: 'village', name: 'Un maestro de la ley', sub: 'de visita desde Jerusalén', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#4A4A4A', outfit: '#3E4A6A' },
    t1: ['La respuesta la sabemos de memoria: el Mesías nace en Belén. Lo escribió el profeta Miqueas.'],
    t2: ['Belén está a una caminata de Jerusalén.', 'Y sin embargo, ninguno de nosotros vino a verlo.'], src: 'Etapa I · Los magos y la huida a Egipto' },
  // II · Infancia
  { id: 'vecino', r: 1, near: 'taller', name: 'Un vecino de Nazaret', sub: 'vive al lado del taller', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#3A2A1A', outfit: '#6A5038' },
    t1: ['¿Jesús? Es el carpintero, el hijo de María. El año pasado me arregló la puerta.'],
    t2: ['La palabra que usamos es tékton: un constructor que trabaja la madera y también la piedra.', 'Vigas para techos, arados, yugos para los bueyes. Todo lo hace bien.'], src: 'Etapa II · El carpintero de Nazaret' },
  { id: 'hermanos', r: 1, near: 'taller', name: 'Santiago, hermano de Jesús', sub: 'juega cerca de la casa', look: { g: 'chico', age: 13, skin: '#C99A72', hair: '#2A1B14', outfit: '#6E8A80' },
    t1: ['Somos varios hermanos: Santiago, José, Judas y Simón, y también tenemos hermanas. Jesús es el mayor.'],
    t2: ['Hay cosas de mi hermano que todavía no entiendo.', 'Pero lo veo trabajar todos los días, fiel en lo chico.'], src: 'Etapa II · Una casa en Nazaret' },
  { id: 'peregrino', r: 1, near: 'temple', name: 'Un peregrino de la Pascua', sub: 'viaja en caravana', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1A120C', outfit: '#8A6A44' },
    t1: ['Subimos a Jerusalén para la Pascua en una caravana enorme, cantando los salmos de subida.'],
    t2: ['Con tanta gente, los chicos van con primos, tíos y vecinos.', 'No es raro que un padre pase horas sin ver a su hijo.'], src: 'Etapa II · Una ventana al texto' },
  // III · Bautismo
  { id: 'bautista', r: 2, near: 'river', name: 'Juan el Bautista', sub: 'bautiza en el Jordán', look: { g: 'chico', age: 18, skin: '#A8784E', hair: '#2A1B14', outfit: '#8A6A3A' },
    t1: ['Arrepiéntanse y vuelvan a Dios, porque el reino del cielo está cerca. Detrás de mí viene uno mucho más poderoso que yo.'],
    t2: ['¿Qué tienen que hacer? El que tiene dos camisas, que comparta con el que no tiene.', 'Y el que tiene comida, que haga lo mismo.'], src: 'Etapa III · La voz en el desierto' },
  { id: 'soldado', r: 2, near: 'river', name: 'Un soldado', sub: 'vino a escuchar a Juan', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#3A2A1A', outfit: '#9A2418' },
    t1: ['Le pregunté a Juan qué tenía que hacer alguien como yo.'],
    t2: ['Me dijo que no use mi fuerza para sacarle plata a la gente.', 'El arrepentimiento se ve en lo de todos los días.'], src: 'Etapa III · La voz en el desierto' },
  { id: 'cobrador', r: 2, near: 'river', name: 'Un cobrador de impuestos', sub: 'espera su turno en la orilla', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#4A3A2A', outfit: '#3E5A6A' },
    t1: ['Todos me miran mal, pero vine igual a bautizarme.'],
    t2: ['Juan no me echó.', 'Me dijo que no cobre más de lo que corresponde.'], src: 'Etapa III · La voz en el desierto' },
  // IV · Galilea
  { id: 'mateo', r: 3, near: 'lake', name: 'Mateo', sub: 'cobraba impuestos para Roma', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#2A1B14', outfit: '#3E5A6A' },
    t1: ['Yo estaba en mi mesa de impuestos cuando me llamó. Dejé todo y lo seguí.'],
    t2: ['En el grupo también está Simón, que era zelote, enemigo jurado de Roma.', 'Imaginate las discusiones. Con nosotros Jesús empezó a cambiar el mundo.'], src: 'Etapa IV · Los doce' },
  { id: 'zelote', r: 3, near: 'lake', name: 'Simón el zelote', sub: 'uno de los doce', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1A120C', outfit: '#6E2F22' },
    t1: ['Yo quería echar a los romanos a la fuerza. Ahora camino al lado de un cobrador de impuestos.'],
    t2: ['Antes de elegirnos, Jesús pasó toda la noche orando en un monte.', 'Nos eligió para estar con él, y después para enviarnos.'], src: 'Etapa IV · Los doce' },
  { id: 'encargado', r: 3, near: 'village', name: 'El encargado de la fiesta', sub: 'en una boda de Caná', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#4A4A4A', outfit: '#8A5A2A' },
    t1: ['¡Probé el mejor vino de la boda al final! No sé de dónde salió.'],
    t2: ['Quedarse sin vino era una vergüenza enorme para la familia del novio.', 'Los sirvientes sí saben de dónde vino. Yo no.'], src: 'Etapa V · Una boda en Caná' },
  // V · Milagros
  { id: 'suegra', r: 4, near: 'roofhouse', name: 'La suegra de Pedro', sub: 'ya sanada, sirviendo', g: 'mujer', look: { g: 'chica', age: 18, skin: '#C99A72', hair: '#9A9A9A', outfit: '#6A5A7A' },
    t1: ['Estaba en cama con fiebre. Él me tomó de la mano, me levantó, y la fiebre se fue.'],
    t2: ['Esa misma tarde, cuando terminó el sábado, todo el pueblo trajo a sus enfermos a esta puerta.', 'Y a la madrugada, cuando todavía estaba oscuro, él se fue solo a orar.'], src: 'Etapa IV · Un día en Capernaum' },
  { id: 'jairo', r: 4, near: 'feeding', name: 'Jairo', sub: 'líder de la sinagoga', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#4A3A2A', outfit: '#3E4A6A' },
    t1: ['Mi hija de doce años se estaba muriendo. Jesús me dijo que no tuviera miedo, que solo creyera.'],
    t2: ['La tomó de la mano y le dijo en arameo Talita cum: niña, levántate.', 'Y después pidió que le dieran de comer.'], src: 'Etapa V · Tocar el manto y una niña que se levanta' },
  // VI · Parábolas
  { id: 'posadero', r: 5, near: 'inn', name: 'El posadero', sub: 'del camino a Jericó', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#3A2A1A', outfit: '#7A6A4A' },
    t1: ['Un samaritano me trajo a un herido en su propio burro. Me dejó dos monedas de plata para que lo cuidara.'],
    t2: ['Dos monedas eran el sueldo de dos días.', 'Y prometió pagar lo que faltara. ¿Quién hace eso por un desconocido?'], src: 'Etapa VI · El buen samaritano' },
  { id: 'mayor', r: 5, near: 'field', name: 'El hermano mayor', sub: 'no quiere entrar a la fiesta', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#5A6A4A' },
    t1: ['Yo trabajé siempre y nunca me hicieron una fiesta. Mi hermano vuelve y le matan el ternero más gordo.'],
    t2: ['Mi papá salió a buscarme también a mí.', 'Todavía no sé si voy a entrar.'], src: 'Etapa VI · El hijo pródigo' },
  { id: 'bartimeo', r: 5, near: 'inn', name: 'Bartimeo', sub: 'antes mendigaba en Jericó', look: { g: 'chico', age: 18, skin: '#A8784E', hair: '#2A1B14', outfit: '#8A7A5A' },
    t1: ['Me decían que me callara, pero grité más fuerte. Tiré mi manto y fui hacia él.'],
    t2: ['El manto era mi abrigo y mi lugar para recibir monedas.', 'Ahora veo, y sigo a Jesús por el camino.'], src: 'Etapa V · En primer plano · Bartimeo' },
  { id: 'zaqueo', r: 5, near: 'inn', name: 'Zaqueo', sub: 'jefe de cobradores de Jericó', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#3A2A1A', outfit: '#4A3A6A' },
    t1: ['Me trepé a un sicómoro para verlo pasar. Me llamó por mi nombre y se hospedó en mi casa.'],
    t2: ['Voy a devolver cuatro veces más a los que engañé.', 'Y la mitad de lo que tengo es para los pobres.'], src: 'Etapa VII · Zaqueo' },
  // VII · Jerusalén
  { id: 'viuda', r: 6, near: 'upper', name: 'Una viuda pobre', sub: 'viene de la ofrenda del templo', look: { g: 'chica', age: 18, skin: '#C99A72', hair: '#BDBDBD', outfit: '#5A4A6A' },
    t1: ['Eché dos moneditas en la ofrenda. Era todo lo que tenía.'],
    t2: ['Dicen que Jesús me vio y dijo que di más que todos.', 'Yo pensé que nadie se había dado cuenta.'], src: 'Etapa VII · El templo' },
  { id: 'diaspora', r: 6, near: 'upper', name: 'Un peregrino de lejos', sub: 'vino del mundo judío para la Pascua', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1A120C', outfit: '#8A6A44' },
    t1: ['Vine de muy lejos para la Pascua. La ciudad está llena de peregrinos de todo el mundo judío.'],
    t2: ['Cada familia come un cordero recordando la salida de Egipto.', 'Mientras se come, se cuenta la historia.'], src: 'Etapa VII · Una ventana al texto' },
  // VIII · La cruz
  { id: 'cirene', r: 7, near: 'golgota', name: 'Simón de Cirene', sub: 'venía del campo', look: { g: 'chico', age: 18, skin: '#8A5A3A', hair: '#1A120C', outfit: '#7A6A4A' },
    t1: ['Los soldados me obligaron a cargar la cruz detrás de él. Yo solo venía del campo.'],
    t2: ['Mis hijos se llaman Alejandro y Rufo.', 'Nunca me voy a olvidar de ese camino.'], src: 'Etapa VIII · El camino de la cruz' },
  { id: 'oficial', r: 7, near: 'golgota', name: 'El oficial romano', sub: 'estuvo frente a la cruz', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#3A2A1A', outfit: '#9A2418' },
    t1: ['Vi morir a muchos. Ninguno murió así.'],
    t2: ['Cuando la tierra tembló, lo dije en voz alta: «¡Este hombre era verdaderamente el Hijo de Dios!».'], src: 'Etapa VIII · La cruz (Marcos 15:39, NTV)' },
  { id: 'arimatea', r: 7, near: 'tomb', name: 'José de Arimatea', sub: 'miembro del concilio', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#BDBDBD', outfit: '#3E4A6A' },
    t1: ['Seguía a Jesús en secreto. Esa tarde me animé a pedirle el cuerpo a Pilato.'],
    t2: ['Nicodemo vino conmigo. Lo pusimos en una tumba nueva, cavada en la roca, en este huerto.'], src: 'Etapa VIII · La sepultura' },
  // IX · Resurrección
  { id: 'cleofas', r: 8, near: 'village', name: 'Cleofas', sub: 'volvió de Emaús', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#2A1B14', outfit: '#6E5A3A' },
    t1: ['Caminábamos tristes hacia Emaús y un viajero se nos unió. Recién lo reconocimos cuando partió el pan.'],
    t2: ['Le contamos todo con desilusión: habíamos esperado que él fuera el que iba a liberar a Israel.', 'No sabíamos que lo teníamos al lado.'], src: 'Etapa IX · Emaús' },
  { id: 'tomas', r: 8, near: 'shore', name: 'Tomás', sub: 'uno de los doce', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#4A6A6A' },
    t1: ['Dije que no creería hasta ver las marcas de los clavos. Ocho días después, él volvió.'],
    t2: ['Me mostró sus manos y su costado, y me dijo que no siguiera dudando.', 'Yo, el que más dudaba, le dije: «¡Mi Señor y mi Dios!».'], src: 'Etapa IX · Tomás' }
];
/* Teófilo (canal 8): un griego curioso, el destinatario de Lucas 1:3, aparece una vez por etapa con la pregunta difícil.
   o: tres respuestas; la marcada con ok es la del material. e: la explicación, en globos de dos oraciones como máximo. */
export const TEO_INTRO = ['Me llamo Teófilo. Soy griego y estoy investigando con cuidado todo lo que se cuenta de Jesús.', 'Cada vez que nos crucemos, te voy a hacer una pregunta difícil.'];
export const TEO = [
  { r: 0, q: '¿Cómo puede nacer alguien de una virgen? Eso suena imposible.', o: [['Es algo que solo Dios puede hacer: si creó el universo, formar una vida es una obra pequeña para él.', 1], ['Es solo una forma linda de decir que María era muy buena.', 0], ['Nadie lo creía en esa época, se agregó mucho después.', 0]],
    e: ['Mateo y Lucas escriben por separado y coinciden en que María concibió por obra del Espíritu Santo.', 'Muestra que Jesús es un regalo que viene de arriba, y que al nacer de una mujer es verdaderamente uno de nosotros.'], src: 'Etapa I · Pregunta difícil' },
  { r: 1, q: 'Si Jesús era Dios, ¿cómo puede ser que creciera en sabiduría?', o: [['Al hacerse hombre eligió vivir con nuestras limitaciones: aprendió a caminar, a leer y a trabajar.', 1], ['En realidad ya sabía todo y fingía aprender.', 0], ['Porque todavía no era Dios: lo fue recién en el bautismo.', 0]],
    e: ['Siguió siendo Dios y eligió recorrer el camino humano completo, sin usar sus privilegios como atajo.', 'Por eso puede acompañarte en cada etapa de tu crecimiento: él también fue adolescente.'], src: 'Etapa II · Pregunta difícil' },
  { r: 2, q: 'El bautismo de Juan era para arrepentirse. ¿Por qué se bautizó Jesús, si no tenía pecado?', o: [['Para identificarse con nosotros: se metió en la fila de los pecadores, como uno más.', 1], ['Porque también necesitaba que le perdonaran algo.', 0], ['Para que Juan se hiciera famoso.', 0]],
    e: ['Desde el primer día se puso en nuestro lugar, algo que llega a su punto máximo en la cruz.', 'Además, ahí el Padre lo presentó y el Espíritu lo ungió para su misión.'], src: 'Etapa III · Pregunta difícil' },
  { r: 3, q: 'Podía elegir a los mejores alumnos de Jerusalén. ¿Por qué eligió pescadores y un cobrador de impuestos?', o: [['Porque el poder del reino viene de Dios, y él puede usar a cualquiera que se deje formar.', 1], ['Porque los sabios no lo querían escuchar.', 0], ['Porque los pescadores eran más fuertes para viajar.', 0]],
    e: ['Más tarde los líderes se sorprendieron de ver a gente común sin estudios, y se dieron cuenta de que habían estado con Jesús.', 'Eso incluye a un adolescente de hoy: lo que busca es disposición a seguirlo.'], src: 'Etapa IV · Pregunta difícil' },
  { r: 4, q: 'Los milagros van contra las leyes de la naturaleza. ¿Cómo pueden ser posibles?', o: [['Las leyes describen cómo funciona normalmente el mundo, y su Creador sigue siendo libre de actuar en él.', 1], ['Son solo cuentos para enseñar algo.', 0], ['Eran trucos que la gente de esa época no entendía.', 0]],
    e: ['Los evangelios los cuentan con nombres, lugares y detalles, y hasta los enemigos de Jesús los reconocían.', 'La pregunta más honesta es otra: ¿qué hago con lo que estas señales dicen de Jesús?'], src: 'Etapa V · Pregunta difícil' },
  { r: 5, q: '¿Por qué Jesús enseñaba con parábolas en vez de explicar las cosas directamente?', o: [['Porque abren y cierran a la vez: al que busca le quedan grabadas y lo llevan a preguntar más.', 1], ['Porque la gente de esa época no sabía leer.', 0], ['Para que nadie entendiera lo que decía.', 0]],
    e: ['Una historia entra por donde las discusiones no entran.', 'Las parábolas te invitan a ser buscador.'], src: 'Etapa VI · Pregunta difícil' },
  { r: 6, q: 'Judas estuvo tres años con Jesús. ¿Cómo pudo traicionarlo?', o: [['Fue su propia decisión: el amor por el dinero le fue endureciendo el corazón.', 1], ['No tuvo opción, estaba obligado a hacerlo.', 0], ['Jesús nunca lo quiso como a los demás.', 0]],
    e: ['Jesús lo sabía y aun así le lavó los pies y compartió el pan con él.', 'Judas y Pedro fallaron la misma noche; la diferencia está en hacia dónde fueron con su culpa.'], src: 'Etapa VII · Pregunta difícil' },
  { r: 7, q: '¿No podía Dios simplemente perdonar? ¿Por qué tenía que morir Jesús?', o: [['Perdonar algo grande tiene un costo, y en la cruz Dios mismo, en su Hijo, absorbió ese costo.', 1], ['Porque Dios estaba enojado y necesitaba descargarse.', 0], ['Fue un accidente: las autoridades le ganaron.', 0]],
    e: ['Dios es amor y también es justo: toma en serio el mal, porque destruye a las personas que ama.', 'Jesús entregó su vida voluntariamente. En la cruz se encuentran la justicia y el amor de Dios.'], src: 'Etapa VIII · Pregunta difícil' },
  { r: 8, q: 'Decime la verdad: ¿la resurrección pasó de verdad?', o: [['Hay pistas fuertes: la tumba vacía, las apariciones, las primeras testigos y el cambio de los discípulos.', 1], ['Es imposible saberlo, así que da igual.', 0], ['Fue una forma de decir que sus ideas siguieron vivas.', 0]],
    e: ['Hombres asustados se volvieron valientes y dieron la vida por anunciarlo: nadie muere por algo que sabe que es mentira.', 'Se recibe con fe, y es una fe con buenas razones.'], src: 'Etapa IX · Pregunta difícil' }
];
export const TEO_END = ['Voy a seguir investigando. Me dijeron que Lucas está escribiendo una segunda parte.', 'Gracias por caminar conmigo estas preguntas.'];
/* Fogata de reflexión (canal 7): una pregunta por etapa para pensar a solas con Dios. Se escribe en un diario privado,
   que queda solo en este aparato y nadie lee, o se puede quedar en silencio. */
export const FOGATA = [
  { r: 0, q: 'María aceptó que se cumpliera en ella la palabra de Dios. ¿Qué te cuesta entregarle a Dios con esa confianza?', src: 'Etapa I · Para entrar en intimidad' },
  { r: 1, q: 'Jesús creció en sabiduría, en estatura, en el favor de Dios y en el de la gente. ¿En cuál te gustaría pedirle ayuda esta semana?', src: 'Etapa II · Para entrar en intimidad' },
  { r: 2, q: 'Antes de hacer un solo milagro, Jesús escuchó al Padre llamarlo su Hijo amado. ¿Qué voces intentan decirte quién sos?', src: 'Etapa III · Para entrar en intimidad' },
  { r: 3, q: 'Pedro obedeció cuando la orden no tenía lógica. ¿Hay algo que Dios te está pidiendo que todavía no entendés?', src: 'Etapa IV · Para entrar en intimidad' },
  { r: 4, q: 'Jesús le preguntó a Bartimeo qué quería que hiciera por él. Si te lo preguntara hoy, ¿qué le responderías?', src: 'Etapa V · Para entrar en intimidad' },
  { r: 5, q: 'En la historia del hijo pródigo, ¿te sentís más el que se fue o el que se quedó enojado? El Padre corre hacia los dos.', src: 'Etapa VI · Para entrar en intimidad' },
  { r: 6, q: 'En Getsemaní, Jesús le contó al Padre lo que sentía. ¿Qué te gustaría contarle hoy, con la misma sinceridad?', src: 'Etapa VII · Para entrar en intimidad' },
  { r: 7, q: 'Leé despacio Isaías 53:5 y poné tu nombre. ¿Qué le querés decir a Jesús después de esto?', src: 'Etapa VIII · Para entrar en intimidad' },
  { r: 8, q: 'Jesús resucitado te conoce por tu nombre. Si te preguntara si lo amás, ¿qué le responderías?', src: 'Etapa IX · Para entrar en intimidad' }
];
/* Pergaminos del Antiguo Testamento (canal 6): coleccionables escondidos que unen un texto antiguo con la escena.
   Completar los de una etapa enciende un brillo de Resplandor. */
export const PERG = [
  { id: 'g315', r: 0, ref: 'Génesis 3:15', t: 'Dios promete que un descendiente de la mujer va a aplastar la cabeza de la serpiente. Es la primera promesa de un Salvador.' },
  { id: 'g123', r: 0, ref: 'Génesis 12:3', t: 'Por la descendencia de Abraham iban a ser bendecidas todas las naciones. Los magos extranjeros que llegan a Belén son el primer anticipo.' },
  { id: '2s7', r: 0, ref: '2 Samuel 7:12-16', t: 'Dios le promete a David un hijo con un trono que no tendrá fin. Jesús nace en Belén, la ciudad de David.' },
  { id: 'is96', r: 0, ref: 'Isaías 9:6', t: 'Un niño llamado Consejero Admirable, Dios Poderoso, Padre Eterno y Príncipe de Paz. En Belén, esa promesa duerme en un pesebre.' },
  { id: '1s226', r: 1, ref: '1 Samuel 2:26', t: 'El niño Samuel crecía en estatura y en el favor del Señor y de la gente. Lucas usa casi las mismas palabras para Jesús.' },
  { id: 'os111', r: 1, ref: 'Oseas 11:1', t: 'De Egipto llamé a mi hijo, dice Dios por medio de Oseas. La huida a Egipto y el regreso repiten la historia de Israel.' },
  { id: 'dt64', r: 1, ref: 'Deuteronomio 6:4-5', t: 'El Shemá: el Señor nuestro Dios es el único Señor, y hay que amarlo con todo el corazón. Jesús lo rezó cada mañana y cada noche.' },
  { id: 'g12', r: 2, ref: 'Génesis 1:2', t: 'En la creación, el Espíritu de Dios se movía sobre las aguas. En el Jordán el Espíritu vuelve sobre las aguas: empieza una nueva creación.' },
  { id: 'arca', r: 2, ref: 'Génesis 8:11', t: 'La paloma volvió al arca de Noé con una ramita de olivo, señal de un mundo nuevo. En el bautismo, el Espíritu baja como una paloma.' },
  { id: 'desierto', r: 2, ref: 'Deuteronomio 8:2-3', t: 'Israel anduvo cuarenta años por el desierto y cayó en la prueba. Jesús pasa cuarenta días ahí y vence con las mismas palabras de Deuteronomio.' },
  { id: 'sinai', r: 3, ref: 'Éxodo 19–20', t: 'Moisés subió al monte Sinaí y bajó con la ley. Jesús sube a un monte y enseña la ley del reino con autoridad propia.' },
  { id: 'tribus', r: 3, ref: 'Génesis 49', t: 'Israel tenía doce tribus. Jesús elige doce apóstoles: está formando un pueblo nuevo.' },
  { id: 'jubileo', r: 3, ref: 'Levítico 25', t: 'Cada cincuenta años se perdonaban las deudas y se liberaba a los esclavos. En Nazaret, Jesús anuncia que con él llega el gran jubileo de Dios.' },
  { id: 'mana', r: 4, ref: 'Éxodo 16', t: 'Dios alimentó a su pueblo con maná en el desierto. Jesús da de comer a miles y dice que él es el pan verdadero bajado del cielo.' },
  { id: 'eliseo', r: 4, ref: '2 Reyes 4:42-44', t: 'Eliseo multiplicó veinte panes para cien hombres. Jesús multiplica cinco panes para miles.' },
  { id: 's107', r: 4, ref: 'Salmo 107', t: 'El salmo describe a Dios calmando la tormenta y llevando a los marineros al puerto. En la barca, Jesús hace lo que solo Dios hace.' },
  { id: 'is35', r: 4, ref: 'Isaías 35:5-6', t: 'Cuando Dios viniera a salvar, los ciegos verían y los cojos saltarían. Los milagros de Jesús muestran que ese día llegó.' },
  { id: 'natan', r: 5, ref: '2 Samuel 12:1-7', t: 'Natán le contó a David la historia de un rico que le robó la única ovejita a un pobre. David se enojó y terminó reconociendo su propio pecado.' },
  { id: 'ez34', r: 5, ref: 'Ezequiel 34', t: 'Dios promete que él mismo va a buscar a sus ovejas perdidas. Jesús, al contar la oveja perdida, se presenta como ese pastor.' },
  { id: '2s1530', r: 6, ref: '2 Samuel 15:30', t: 'David subió llorando el monte de los Olivos cuando su hijo lo traicionó. Jesús, el Hijo de David, sube el mismo monte traicionado por un amigo.' },
  { id: 's11822', r: 6, ref: 'Salmo 118:22', t: 'La piedra que los constructores rechazaron se convirtió en la piedra principal. Jesús lo citó esa misma semana en el templo.' },
  { id: 'jer31', r: 6, ref: 'Jeremías 31:31-34', t: 'Dios promete un pacto nuevo, escrito en el corazón. En la última cena, Jesús le da un sentido nuevo al pan y a la copa.' },
  { id: 'g22', r: 7, ref: 'Génesis 22', t: 'Isaac pregunta dónde está el cordero, y Abraham responde que Dios lo va a proveer. Según la tradición, Jerusalén está sobre esos montes.' },
  { id: 's22', r: 7, ref: 'Salmo 22', t: 'Siglos antes, el salmo describe las burlas, las manos y los pies traspasados y la ropa sorteada. Termina con una victoria: los confines de la tierra se vuelven al Señor.' },
  { id: 'is53', r: 7, ref: 'Isaías 53', t: 'El siervo de Dios fue herido por nuestras rebeliones y cargó con nuestro pecado. Es la cruz, anunciada siglos antes.' },
  { id: 'jonas', r: 8, ref: 'Jonás 1:17', t: 'Jonás estuvo tres días en el vientre del gran pez. Jesús lo usó como señal de su propia resurrección.' },
  { id: 'os62', r: 8, ref: 'Oseas 6:2', t: 'Oseas habla de un pueblo que Dios levanta al tercer día. Jesús resucita al tercer día.' },
  { id: 'is258', r: 8, ref: 'Isaías 25:8', t: 'Dios va a destruir la muerte para siempre y va a secar las lágrimas de todos los rostros. La resurrección de Jesús es el comienzo de eso.' },
  { id: 'ez37', r: 8, ref: 'Ezequiel 37', t: 'Ezequiel ve un valle de huesos secos que vuelven a la vida por el Espíritu de Dios. La tumba vacía anuncia esa vida nueva.' }
];
/* Misiones de la vida real (canal 4): el «Desafío de la semana» de cada etapa. Son opcionales: el jugador las marca como hechas
   con una reflexión corta, y quedan en su perfil para que su tutor las vea. */
export const VIDA = [
  { id: 'v0a', r: 0, t: 'Contale a alguien una cosa concreta que Dios hizo en tu vida, aunque te parezca chica.' },
  { id: 'v0b', r: 0, t: 'Como María, anotá algo que estés viviendo con Dios, para guardarlo en el corazón.' },
  { id: 'v1a', r: 1, t: 'Hacé una tarea de tu casa que normalmente esquivás, sin que te la pidan y sin anunciarlo.' },
  { id: 'v1b', r: 1, t: 'Armate tu propio Shemá: un versículo corto para decir al despertarte y otro antes de dormir.' },
  { id: 'v2a', r: 2, t: 'Elegí una tentación concreta y buscá un versículo que le responda. Escribilo y memorizalo.' },
  { id: 'v2b', r: 2, t: 'Si todavía no te bautizaste, hablá con tu líder o tu tutor sobre qué significa dar ese paso.' },
  { id: 'v3a', r: 3, t: 'Leé un capítulo del Sermón del monte por día (Mateo 5, 6 y 7) y poné en práctica una sola frase.' },
  { id: 'v3b', r: 3, t: 'Levantate diez minutos antes para orar antes de agarrar el celular.' },
  { id: 'v4a', r: 4, t: 'Hacé una lista de tres amigos o familiares que necesitan a Jesús y orá por ellos cada día.' },
  { id: 'v4b', r: 4, t: 'Como el muchacho de los panes, ofrecé algo tuyo que parece poco para ayudar a alguien.' },
  { id: 'v5a', r: 5, t: 'Escribí tu propia parábola de diez líneas, en tu escuela o tu barrio, y compartila con tu grupo.' },
  { id: 'v5b', r: 5, t: 'Buscá a alguien que esté tirado al costado del camino esta semana y acercate.' },
  { id: 'v6a', r: 6, t: 'Hacé un lavado de pies moderno: un servicio humilde y escondido para alguien de tu familia o tu grupo.' },
  { id: 'v6b', r: 6, t: 'Si tenés algo que devolver o reparar, como Zaqueo, dá ese paso esta semana.' },
  { id: 'v7a', r: 7, t: 'Escribí una carta a Jesús agradeciéndole por la cruz, con tus palabras.' },
  { id: 'v7b', r: 7, t: 'Como Simón de Cirene, acompañá a alguien que está pasando un momento duro.' },
  { id: 'v8a', r: 8, t: 'Como María Magdalena, contale a alguien que Jesús está vivo y qué significa eso para vos.' },
  { id: 'v8b', r: 8, t: 'Como los de Emaús, leé la Biblia esta semana con alguien más.' }
];
/* Versículos de memoria (canal 3): cada uno queda atado a un lugar fijo del mapa, en una piedra grabada.
   Textos NTV tal como aparecen en el material. Los de Juan 6:35 y 8:12 no tienen texto en el material: se buscan en la Biblia. */
export const MEM = [
  { id: 'l211', r: 0, near: 'pastores', ref: 'Lucas 2:11', t: '¡El Salvador —sí, el Mesías, el Señor— ha nacido hoy en Belén, la ciudad de David!' },
  { id: 'j114', r: 0, near: 'village', ref: 'Juan 1:14', t: 'Entonces la Palabra se hizo hombre y vino a vivir entre nosotros.' },
  { id: 'l252', r: 1, near: 'taller', ref: 'Lucas 2:52', t: 'Jesús crecía en sabiduría y en estatura, y en el favor de Dios y de toda la gente.' },
  { id: 'j129', r: 2, near: 'river', ref: 'Juan 1:29', t: '¡Miren! ¡El Cordero de Dios, que quita el pecado del mundo!' },
  { id: 'h415', r: 2, near: 'desert', ref: 'Hebreos 4:15', t: 'Nuestro Sumo Sacerdote comprende nuestras debilidades, porque enfrentó todas y cada una de las pruebas que enfrentamos nosotros, sin embargo, él nunca pecó.' },
  { id: 'l418', r: 3, near: 'village', ref: 'Lucas 4:18', t: 'El Espíritu del Señor está sobre mí, porque me ha ungido para llevar la Buena Noticia a los pobres.' },
  { id: 'm514', r: 3, near: 'lake', ref: 'Mateo 5:14', t: 'Ustedes son la luz del mundo, como una ciudad en lo alto de una colina que no puede esconderse.' },
  { id: 'j635', r: 4, near: 'feeding', ref: 'Juan 6:35', t: '', look: 'Jesús dice que él es el pan de vida. Buscá el versículo en tu Biblia y leelo en voz alta.' },
  { id: 'j812', r: 4, near: 'roofhouse', ref: 'Juan 8:12', t: '', look: 'Jesús dice que él es la luz del mundo. Buscá el versículo en tu Biblia y leelo en voz alta.' },
  { id: 'm138', r: 5, near: 'field', ref: 'Mateo 13:8', t: 'Pero otras semillas cayeron en tierra fértil, ¡y produjeron una cosecha que fue treinta, sesenta y hasta cien veces más numerosa de lo que se había sembrado!' },
  { id: 'l157', r: 5, near: 'field', ref: 'Lucas 15:7', t: 'De la misma manera, ¡hay más alegría en el cielo por un pecador perdido que se arrepiente y regresa a Dios que por noventa y nueve justos que no se extraviaron!' },
  { id: 'l1520', r: 5, near: 'inn', ref: 'Lucas 15:20', t: 'Lleno de amor y de compasión, corrió hacia su hijo, lo abrazó y lo besó.' },
  { id: 'mc1045', r: 6, near: 'upper', ref: 'Marcos 10:45', t: 'Pues ni aun el Hijo del Hombre vino para que le sirvan, sino para servir a otros y para dar su vida en rescate por muchos.' },
  { id: 'l1910', r: 5, near: 'inn', ref: 'Lucas 19:10', t: 'Pues el Hijo del Hombre vino a buscar y a salvar a los que están perdidos.' },
  { id: 'm219', r: 6, near: 'upper', ref: 'Mateo 21:9', t: '¡Alaben a Dios por el Hijo de David! ¡Bendiciones al que viene en el nombre del Señor!' },
  { id: 'j1334', r: 6, near: 'upper', ref: 'Juan 13:34', t: 'Así que ahora les doy un nuevo mandamiento: ámense unos a otros. Tal como yo los he amado, ustedes deben amarse unos a otros.' },
  { id: 'l2242', r: 6, near: 'garden', ref: 'Lucas 22:42', t: 'Padre, si quieres, te pido que quites esta copa de sufrimiento de mí. Sin embargo, quiero que se haga tu voluntad, no la mía.' },
  { id: 'j1917', r: 7, near: 'golgota', ref: 'Juan 19:17', t: 'Él, cargando su propia cruz, fue al sitio llamado Lugar de la Calavera (en hebreo, Gólgota).' },
  { id: 'j1930', r: 7, near: 'golgota', ref: 'Juan 19:30', t: 'Después de probar el vino, Jesús dijo: «¡Todo está cumplido!». Entonces inclinó la cabeza y entregó su espíritu.' },
  { id: 'is535', r: 7, near: 'golgota', ref: 'Isaías 53:5', t: 'Pero él fue traspasado por nuestras rebeliones y aplastado por nuestros pecados.' },
  { id: 'mc1539', r: 7, near: 'golgota', ref: 'Marcos 15:39', t: '¡Este hombre era verdaderamente el Hijo de Dios!' },
  { id: 'ro58', r: 7, near: 'tomb', ref: 'Romanos 5:8', t: 'Pero Dios mostró el gran amor que nos tiene al enviar a Cristo a morir por nosotros cuando todavía éramos pecadores.' },
  { id: 'm286', r: 7, near: 'tomb', ref: 'Mateo 28:6', t: '¡No está aquí! Ha resucitado tal como dijo que sucedería. Vengan, vean el lugar donde estaba su cuerpo.' },
  { id: 'l2432', r: 8, near: 'village', ref: 'Lucas 24:32', t: 'Entonces se dijeron el uno al otro: «¿No ardía nuestro corazón cuando nos hablaba en el camino y nos explicaba las Escrituras?».' },
  { id: 'm2819', r: 8, near: 'shore', ref: 'Mateo 28:19', t: 'Por lo tanto, vayan y hagan discípulos de todas las naciones, bautizándolos en el nombre del Padre y del Hijo y del Espíritu Santo.' },
  { id: '1co1520', r: 8, near: 'shore', ref: '1 Corintios 15:20', t: 'Lo cierto es que Cristo sí resucitó de los muertos. Él es el primer fruto de una gran cosecha, el primero de todos los que murieron.' }
];
/* Misiones de escena con decisiones (canal 4): la historia bíblica no cambia; lo que cambia es cómo participás vos.
   Jesús no habla con palabras inventadas: lo que hace o dice se cuenta con el narrador, con las palabras del material. */
export const ESC = [
  { id: 'posada', r: 0, near: 'village', name: 'José', sub: 'busca dónde quedarse', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#3A2412', outfit: '#6E5A3A' },
    pre: [['nar', 'Belén está llena por el censo. Un hombre y su esposa, a punto de dar a luz, buscan dónde quedarse.'], ['m', 'No hay lugar para nosotros en el alojamiento. Solo nos queda el rincón de los animales.']],
    ask: '¿Cómo los ayudás?', o: [['Acomodar el rincón con paja limpia', [['amor', 3]], [['m', 'Gracias. Que Dios te lo devuelva.'], ['nar', 'Esa noche, en un lugar humilde, María acuesta al bebé en un pesebre.']]],
      ['Llevarles agua y una lámpara', [['gent', 2]], [['m', 'Con esto vamos a estar mejor. Gracias.']]], ['Seguir de largo', [], [['nar', 'Ellos se acomodan solos donde comen los animales.']]]], src: 'Etapa I · Camino a Belén' },
  { id: 'busqueda', r: 1, near: 'temple', name: 'María', sub: 'busca a su hijo', g: 'mujer', look: { g: 'chica', age: 18, skin: '#C99A72', hair: '#2A1B14', outfit: '#3E5A7A' },
    pre: [['m', 'Pensábamos que venía en la caravana con los parientes. Hace un día de camino que no lo vemos.']],
    ask: '¿Dónde lo buscamos?', o: [['En el templo', [['sab', 2]], [['nar', 'Al tercer día lo encuentran en el templo, sentado entre los maestros, escuchándolos y haciéndoles preguntas.'], ['nar', 'Jesús les pregunta por qué lo buscaban, si tenía que estar en la casa de su Padre.']]],
      ['Entre los parientes de la caravana', [], [['m', 'Ya preguntamos a todos. Volvamos a Jerusalén.'], ['nar', 'Al tercer día lo encuentran en el templo, entre los maestros.']]], ['En el mercado', [], [['m', 'Tampoco está acá.'], ['nar', 'Al tercer día lo encuentran en el templo, entre los maestros.']]]], src: 'Etapa II · Doce años y una pregunta' },
  { id: 'andres', r: 2, near: 'river', name: 'Andrés', sub: 'discípulo de Juan', look: { g: 'chico', age: 17, skin: '#B98A62', hair: '#2A1B14', outfit: '#4A6A6A' },
    pre: [['m', '¡Encontramos al Mesías! Tengo que ir a contárselo a mi hermano Simón.']],
    ask: '¿Qué le decís?', o: [['Vamos juntos a buscarlo', [['amor', 2], ['fid', 1]], [['m', 'Juan lo presentó como el Cordero de Dios. Simón tiene que conocerlo.'], ['nar', 'Andrés lleva a su hermano Simón a Jesús.']]],
      ['¿Estás seguro?', [['sab', 1]], [['m', 'Juan mismo dijo que Jesús tiene que crecer y él, disminuir.']]], ['Andá vos, yo me quedo', [], [['m', 'Bueno. ¡Después te cuento!']]]], src: 'Etapa III · Cuarenta días en el desierto' },
  { id: 'mar', r: 3, near: 'lake', name: 'Simón Pedro', sub: 'pescador', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1A120C', outfit: '#5A6A4A' },
    pre: [['m', 'Pasamos toda la noche pescando y no sacamos nada.'], ['nar', 'El Maestro le pide que vaya mar adentro y eche las redes.']],
    ask: 'Pedro te mira. ¿Qué le decís?', o: [['Si él lo dice, hagámoslo', [['pac', 2], ['fid', 1]], [['nar', 'Sacan tantos peces que las redes empiezan a romperse y las dos barcas casi se hunden.']]],
      ['Es de día, no van a picar', [['sab', 1]], [['m', 'Yo pensaba igual. Pero si él lo dice, lo voy a hacer.'], ['nar', 'Sacan tantos peces que las redes empiezan a romperse.']]]], src: 'Etapa IV · Remá mar adentro' },
  { id: 'techo', r: 4, near: 'roofhouse', name: 'Un amigo', sub: 'trae a un paralítico en una camilla', look: { g: 'chico', age: 18, skin: '#C99A72', hair: '#3A2A1A', outfit: '#7A3A2A' },
    pre: [['m', 'La casa está tan llena que no se puede entrar. Nuestro amigo no puede caminar.']],
    ask: '¿Qué hacemos?', o: [['Subir al techo y abrirlo', [['amor', 3]], [['nar', 'Bajan la camilla delante de Jesús. Al ver la fe de ellos, le perdona los pecados y lo sana.']]],
      ['Esperar a que salga la gente', [], [['m', 'Puede que no vuelva a pasar por acá. ¡Subamos al techo!'], ['nar', 'Bajan la camilla delante de Jesús, y el hombre se va caminando.']]]], src: 'Etapa V · El techo abierto' },
  { id: 'padre', r: 5, near: 'field', name: 'Un vecino', sub: 'mira el camino', look: { g: 'chico', age: 18, skin: '#D6A57C', hair: '#BDBDBD', outfit: '#6A5038' },
    pre: [['nar', 'A lo lejos vuelve el hijo menor, flaco y con la ropa rota.'], ['m', 'Si los del pueblo lo ven primero, lo van a humillar.']],
    ask: '¿Qué hacés?', o: [['Correr con el padre a recibirlo', [['amor', 3], ['gent', 1]], [['nar', 'En esa cultura, un hombre mayor no corría en público. El padre deja de lado su dignidad y lo abraza antes de que nadie lo humille.'], ['nar', '«Lleno de amor y de compasión, corrió hacia su hijo, lo abrazó y lo besó» (Lucas 15:20).']]],
      ['Quedarme mirando', [], [['nar', 'El padre corre igual. Lo abraza antes de que llegue nadie.']]]], src: 'Etapa VI · Una ventana al texto' },
  { id: 'pies', r: 6, near: 'upper', name: 'Juan', sub: 'el discípulo', look: { g: 'chico', age: 17, skin: '#C99A72', hair: '#3A2412', outfit: '#4A5A7A' },
    pre: [['nar', 'En la última cena, Jesús se pone a lavar los pies de sus discípulos, un trabajo de los sirvientes de menor rango.'], ['m', 'Hay otra jarra y una toalla. ¿Ayudás a servir?']],
    ask: '¿A quién le acercás el agua?', o: [['A todos, también a Judas', [['amor', 3], ['gent', 2]], [['nar', 'Jesús sabía lo que Judas iba a hacer, y aun así le lavó los pies.']]],
      ['Solo a mis amigos', [], [['m', 'Él no se saltó a nadie.']]]], src: 'Etapa VII · La última cena' },
  { id: 'velar', r: 6, near: 'garden', name: 'Santiago', sub: 'uno de los doce', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#2A1B14', outfit: '#6E5A3A' },
    pre: [['nar', 'Jesús les pide que velen y oren para no caer en tentación. Se aleja un poco y ora con angustia.'], ['m', 'Es muy tarde. Me pesan los ojos.']],
    ask: '¿Qué hacés?', o: [['Quedarme orando despierto', [['paz', 2], ['fid', 1]], [['nar', 'La noche es larga. Te quedás velando cerca de él.']]],
      ['Dormirme un rato', [], [['nar', 'Los discípulos se durmieron. Jesús los encontró dormidos.']]]], src: 'Etapa VII · Getsemaní' },
  { id: 'cargar', r: 7, near: 'golgota', name: 'Una mujer de Jerusalén', sub: 'llora junto al camino', g: 'mujer', look: { g: 'chica', age: 18, skin: '#C99A72', hair: '#2A1B14', outfit: '#5A4A6A' },
    pre: [['nar', 'Los soldados obligan a Simón de Cirene, que venía del campo, a cargar la cruz detrás de Jesús.']],
    ask: '¿Qué hacés?', o: [['Caminar al lado de Simón', [['amor', 2]], [['nar', 'Caminás en silencio a su lado hasta el lugar llamado Gólgota.']]],
      ['Quedarme con María y Juan', [['fid', 2]], [['nar', 'Casi todos los discípulos habían huido. Las mujeres y Juan se quedaron al pie de la cruz.']]]], src: 'Etapa VIII · El camino de la cruz' },
  { id: 'meamas', r: 8, near: 'shore', name: 'Simón Pedro', sub: 'en la playa', look: { g: 'chico', age: 18, skin: '#B98A62', hair: '#1A120C', outfit: '#5A6A4A' },
    pre: [['nar', 'Al amanecer sacan 153 peces grandes, y la red no se rompe. En la playa los esperan un fuego de brasas, pescado y pan.'], ['nar', 'Después del desayuno, Jesús le pregunta a Pedro tres veces: «¿Me amas?».']],
    ask: 'Si te lo preguntara a vos, ¿qué le responderías?', o: [['Sí, te amo', [['fid', 1]], [['nar', 'Tres veces Pedro lo había negado junto a un fuego; ahora, junto a otro fuego, tres veces le dijo que lo amaba.']]],
      ['Quiero amarte más', [['fid', 1]], [['nar', 'Jesús no descartó a Pedro. Le volvió a encargar que cuidara de sus ovejas.']]], ['Todavía no sé', [], [['nar', 'Jesús esperó a Tomás en su duda y le dio a Pedro una nueva oportunidad. Te espera también a vos.']]]], src: 'Etapa IX · El desayuno en la playa' }
];

/* ---------- minijuegos por concepto (canal 5): uno por etapa, ninguna mecánica repetida; la V se juega caminando y la VIII no tiene puntaje ---------- */
const SKY = ['#FFE3C2', '#EEF5FF'];
export const JUEGOS = [
  { r: 0, near: 'village', type: 'tent', title: 'La carpa entre nosotros', how: 'Armá la carpa pieza por pieza, en orden. Con cada pieza se va completando Juan 1:14: Dios plantó su carpa en medio de nuestro barrio.', src: 'Etapa I · La Palabra se hizo hombre' },
  { r: 1, near: 'taller', type: 'roots', title: 'Cuatro raíces', how: 'Jesús crecía en sabiduría, en estatura, en el favor de Dios y en el de la gente. Tocá las tareas que aparecen para que ninguna de las cuatro se seque.', src: 'Etapa II · Lucas 2:52' },
  { r: 2, near: 'desert', type: 'voices', title: 'Tres voces en el desierto', how: 'A cada tentación, elegí la respuesta de la Escritura bien entendida. Cuidado: el diablo también cita un salmo, pero sacado de contexto.', src: 'Etapa III · Las tentaciones (Deuteronomio 6–8)' },
  { r: 3, near: 'village', type: 'mustard', title: 'Semilla de mostaza', how: 'Regá y sacá los yuyos. Tu semilla crece un poco cada vez que jugás y no vuelve a empezar: el reino ya llegó, pero todavía no del todo.', src: 'Etapa IV · El reino de Dios' },
  { r: 5, near: 'inn', type: 'surprise', title: 'La sorpresa', how: 'Escuchá la parábola línea por línea y tocá el botón justo en el momento que habría sorprendido a los que la oían.', src: 'Etapa VI · Cómo leer una parábola' },
  { r: 6, near: 'upper', type: 'seder', title: 'La mesa de la Pascua', how: 'Cada cosa de la mesa de la Pascua recordaba algo. Uní cada una con su significado.', src: 'Etapa VII · La última cena' },
  { r: 8, near: 'shore', type: 'clues', title: 'Investigación', how: 'Como Teófilo, juntá las cinco pistas de la resurrección: uní cada pista con lo que la respalda.', src: 'Etapa IX · Más profundo: las evidencias' }
].map(d => Object.assign({ sky: SKY }, d));
/* Etapa V · Señales del camino: las siete señales del evangelio de Juan, como carteles repartidos por la etapa */
export const SENALES = [
  { id: 'cana', t: 'El agua en vino', s: 'En una boda en Caná, el agua se convierte en vino, y del mejor.', ref: 'Juan 2:1-11' },
  { id: 'funcionario', t: 'El hijo del funcionario', s: 'Jesús sana al hijo de un funcionario que le pidió ayuda.', ref: 'Juan 4:46-54' },
  { id: 'betesda', t: 'El paralítico de Betesda', s: 'Un hombre que esperaba junto al estanque se levanta y camina.', ref: 'Juan 5:1-15' },
  { id: 'panes', t: 'Los panes', s: 'Cinco panes y dos pescados alcanzan para miles. Después Jesús dice: yo soy el pan de vida.', ref: 'Juan 6:1-14, 35' },
  { id: 'agua', t: 'Sobre el agua', s: 'En medio de la tormenta, Jesús llega a la barca caminando sobre el lago.', ref: 'Juan 6:16-21' },
  { id: 'ciego', t: 'El ciego de nacimiento', s: 'Un hombre ciego de nacimiento se lava en el estanque de Siloé y vuelve viendo. Jesús dice: yo soy la luz del mundo.', ref: 'Juan 9 · Juan 8:12' },
  { id: 'lazaro', t: 'Lázaro', s: 'Lázaro había muerto, y sale vivo de la tumba. Jesús dice: yo soy la resurrección y la vida.', ref: 'Juan 11' }
];
export const SENALES_FIN = ['Encontraste las siete señales. Cada una es como un cartel en el camino.', 'No te quedes mirando el cartel: seguí hacia donde apunta. Juan escribió estas señales para que creamos que Jesús es el Mesías, el Hijo de Dios, y tengamos vida (Juan 20:31).'];
/* Etapa VIII · Las siete palabras: sin puntaje, una pausa por palabra. Textos NTV del material, con su sentido en palabras del material */
export const SIETE = [
  ['Padre, perdónalos, porque no saben lo que hacen.', 'Lucas 23:34', 'Perdón para los que lo crucifican.'],
  ['Hoy estarás conmigo en el paraíso.', 'Lucas 23:43', 'Gracia para un criminal arrepentido a último momento.'],
  ['Mujer, ahí tienes a tu hijo. Ahí tienes a tu madre.', 'Juan 19:26-27', 'Cuidado de su mamá en medio del dolor.'],
  ['Dios mío, Dios mío, ¿por qué me has abandonado?', 'Mateo 27:46', 'El peso del pecado y la distancia. Es el comienzo del Salmo 22.'],
  ['Tengo sed.', 'Juan 19:28', 'Su humanidad real y su sufrimiento físico.'],
  ['¡Todo está cumplido!', 'Juan 19:30', 'La obra terminada: la deuda está pagada.'],
  ['Padre, encomiendo mi espíritu en tus manos.', 'Lucas 23:46', 'Confianza total en el Padre hasta el final.']
];
