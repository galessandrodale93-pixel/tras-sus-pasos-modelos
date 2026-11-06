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
  nacimiento: { n: 1, t: 'Belén', open: ['{name}, sos aprendiz de pescador en Cafarnaúm. Tu papá está enfermo hace semanas y las redes ya no alcanzan para todos en casa.', 'Una noche, junto al fuego del puerto, Eleazar, un anciano escriba, te cuenta una historia de hace unos treinta años: un niño nacido en Belén, pastores que corrieron a verlo y unos magos que siguieron una estrella. Desde entonces te sigue una pregunta: ¿quién es este hombre?'],
    say: [['esc', 'Miqueas lo había escrito siglos antes: de Belén iba a salir el gobernante de Israel. Yo leí ese rollo cien veces.'], ['zel', '¿Un rey que nace en un establo? Los reyes que yo conozco viven en palacios y cobran impuestos.']],
    hook: 'En Jerusalén, un rey nervioso pregunta por un niño recién nacido. Y en Cafarnaúm, la fiebre de tu papá no baja.' },
  infancia: { n: 2, t: 'Nazaret', open: ['Eleazar sigue contando. Ese niño creció en Nazaret, un pueblo chico de Galilea. Lo conocían como el carpintero.', 'Vos también conocés lo que es trabajar desde chico: remendar redes, cargar canastas, levantarte antes del sol.'],
    say: [['esc', 'Lo vi una vez en el templo, con doce años, haciendo preguntas a los maestros. Nunca me olvidé de sus respuestas.'], ['zel', 'Un carpintero de Nazaret. ¿Qué puede salir de bueno de ahí?']],
    hook: 'Pasan los años. En el desierto de Judea, una voz empieza a llamar a la gente al río Jordán.' },
  bautismo: { n: 3, t: 'El Jordán', open: ['Ahora lo vivís con tus propios ojos. Viajás con Asher y Eleazar hasta el río Jordán, donde Juan bautiza a una multitud.', 'Entre la gente aparece un hombre de Galilea. Cuando sale del agua, algo cambia en el aire.'],
    say: [['zel', 'Vine por Juan, que habla fuerte contra los poderosos. Pero ese de Galilea… no sé qué pensar.'], ['esc', 'Juan lo llamó Cordero de Dios. Ese título pesa, muchacho. Isaías habló de un cordero.']],
    hook: 'Dicen que el hombre del Jordán ayunó cuarenta días en el desierto y que ahora vuelve a Galilea. A tu pueblo.' },
  galilea: { n: 4, t: 'Galilea', open: ['De vuelta en Cafarnaúm. Jesús enseña junto al mar de Galilea, a pocos pasos de tu barca.', 'En el puerto hay un soldado nuevo, Lucio, que vigila a los que se juntan a escuchar.'],
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
