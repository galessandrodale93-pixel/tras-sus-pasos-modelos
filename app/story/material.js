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
  { id: 'piedras', r: 2, near: 'desert', k: 'loaves', name: 'Piedras con forma de pan', t: 'Débil y con hambre, Jesús escuchó la tentación de convertirlas en pan. Respondió con la Escritura: la gente vive de cada palabra que sale de la boca de Dios.', src: 'Etapa III · Cuarenta días en el desierto (Deuteronomio 8:3)' }
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
    t2: ['Juan no me echó.', 'Me dijo que no cobre más de lo que corresponde.'], src: 'Etapa III · La voz en el desierto' }
];
