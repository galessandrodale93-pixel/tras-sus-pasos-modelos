// Tras Sus Pasos: lógica del juego (servida desde el repositorio; el sitio de Wix solo carga este archivo)
{ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('./walk3d.css', import.meta.url).href; document.head.appendChild(l); }
const { subscribeMember, getMemberState, login, register, verifyEmail, logout, refreshMember } = await import(location.origin + "/js/wix/member-store.js");
const { wixRequest, mintTokens, setTokens } = await import(location.origin + "/js/wix/client.js");
const { WIX_CLIENT_ID } = await import(location.origin + "/js/wix/config.js");
const { queryItems, insertItem, patchItemFields } = await import(location.origin + "/js/wix/items.js");
const REGIONS=[{id:'nacimiento',name:'Nacimiento'},{id:'infancia',name:'Infancia'},{id:'bautismo',name:'Bautismo'},{id:'galilea',name:'Galilea'},{id:'milagros',name:'Milagros'}];
const SOON=['Parábolas','Jerusalén','Cruz','Resurrección','Pentecostés'];
const LOCAL={n1:[96,180],n2:[262,276],n3:[152,376],fA:[66,486],fB:[292,486],n4:[180,596],n5:[92,690]};
const ORDER=['n1','n2','n3','fA','fB','n4','n5'];
const STORY={
nacimiento:{
 n1:{place:'Nazaret',title:'El anuncio',scene:'nac_n1',
  text:'{name}, llegás a Nazaret, un pueblito de Galilea. Una luz llena la casa de una joven llamada María: el ángel Gabriel le trae una noticia que cambia la historia.',
  game:{type:'catch',title:'La luz del anuncio',how:'Mové la canasta y atrapá las luces. Esquivá las nubes grises.',sky:['#FFD9C9','#E7EEFF'],good:'orb',bad:'gloom'},
  ch:{t:'who',quote:'Soy la sierva del Señor. Que se cumpla todo lo que has dicho acerca de mí.',options:['María','Elisabet','Ana','Zacarías'],answer:'María',exp:'María le responde al ángel Gabriel cuando le anuncia que será madre del Hijo del Altísimo. Con ese sí empieza toda la historia.',ref:'Lucas 1:38'}},
 n2:{place:'El camino',title:'El censo',scene:'nac_n2',
  text:'El emperador César Augusto ordenó un censo, y cada familia tenía que registrarse en su ciudad. Te sumás al camino junto a José y María, que esperan un bebé.',
  game:{type:'run',title:'Rumbo a Belén',how:'Tocá a la izquierda o a la derecha para cambiar de carril. Esquivá las piedras y juntá estrellas.',sky:['#FFD2B8','#FFEBD9'],road:'#EBCB98',side:'#B8CF8A',obs:'rock',item:'star'},
  ch:{t:'mc',q:'¿Por qué viajaron José y María a Belén?',options:['Por el censo de César Augusto','Para escapar de Herodes','Para la fiesta de la Pascua','Para visitar a Elisabet'],answer:'Por el censo de César Augusto',exp:'El censo obligaba a cada uno a ir a su ciudad. José descendía de David, y la ciudad de David era Belén.',ref:'Lucas 2:1-5'}},
 n3:{place:'Belén',title:'El pesebre',scene:'nac_n3',
  text:'Es de noche y el pueblo está repleto. Como en el mesón había lugar para nadie más, María acuesta a su bebé en un pesebre.',
  game:{type:'cross',title:'Las calles de Belén',how:'Tocá la flecha de arriba para avanzar y las de los costados para moverte. Cruzá las calles sin chocar con los carros. ¡Las nubes vienen detrás!',sky:['#2E3F86','#5266B0'],night:true,river:0,mover:'cart',land:'#E6CE9E',lane:'#CDB27F'},
  ch:{t:'map',q:'¿Dónde queda Belén?',target:'belen',exp:'Belén está a unos 9 km al sur de Jerusalén, en las colinas de Judea. Su nombre significa “casa del pan”.',ref:'Mateo 2:1 · Lucas 2:4'}},
 fA:{place:'Los campos',title:'Los pastores',fork:1,scene:'nac_fA',
  text:'En los campos cercanos, unos pastores cuidan sus ovejas. De repente el cielo se ilumina y un ángel les da la mejor noticia de todas.',
  game:{type:'herd',title:'Ovejas perdidas',how:'Arrastrá cada oveja hasta el corral antes de que se termine el tiempo.',sky:['#2B3C80','#4E67B2'],night:true,good:'sheep',bad:'thorn'},
  ch:{t:'verse',parts:['¡El ',0,' —sí, el Mesías, el Señor— ha nacido hoy en Belén, la ciudad de ',1,'!'],blanks:['Salvador','David'],bank:['Salvador','Abraham','David','Profeta','Moisés','Maestro'],exp:'Es el anuncio del ángel a los pastores. “La ciudad de David” es Belén, donde había nacido el rey David mil años antes.',ref:'Lucas 2:8-11'}},
 fB:{place:'El oriente',title:'Los magos',fork:1,scene:'nac_fB',
  text:'Desde el oriente llegan unos sabios siguiendo una estrella. Entran a Jerusalén preguntando por un rey recién nacido.',
  game:{type:'fly',title:'Seguí la estrella',how:'Tocá la pantalla para elevar la estrella. Pasá entre las nubes sin chocar.',sky:['#1F2E6E','#5A6FC0'],night:true,player:'star'},
  ch:{t:'who',quote:'¿Dónde está el rey de los judíos que acaba de nacer? Vimos su estrella mientras salía y hemos venido a adorarlo.',options:['Los magos','Los pastores','Herodes','Los sacerdotes'],answer:'Los magos',exp:'Con esa pregunta llegaron los magos a Jerusalén. Herodes se alarmó y reunió a los escribas para averiguar dónde tenía que nacer el Cristo.',ref:'Mateo 2:1-4'}},
 n4:{place:'Belén',title:'Los regalos',scene:'nac_n4',
  text:'La estrella se detiene sobre una casa de Belén. Los magos entran, se arrodillan ante el niño y abren sus cofres.',
  game:{type:'memo',title:'Los tesoros de los magos',how:'Dá vuelta las cartas y encontrá los pares antes de que se termine el tiempo.',pairs:['gift','star','lantern','scroll','dove','honey','sheep','orb'],sky:['#2E3F86','#7B8FD4'],night:true,good:'gift',bad:'gloom'},
  ch:{t:'mc',q:'¿Qué le ofrecieron los magos al niño?',options:['Oro, incienso y mirra','Oro, plata y perfume','Corderos, pan y vino','Telas finas y aceite'],answer:'Oro, incienso y mirra',exp:'Los magos encontraron al niño con María en una casa, lo adoraron y le ofrecieron sus tesoros. Tres regalos dignos de un rey.',ref:'Mateo 2:9-11'}},
 n5:{place:'Hito del camino',title:'Repasá la etapa',scene:'hito1',
  text:'Antes de seguir, mirá hacia atrás todo lo que viviste en esta etapa.',
  game:{type:'simon',title:'El coro de los ángeles',how:'Mirá qué luces se encienden y repetí la secuencia. Cada ronda suma una luz más.',pads:['star','orb','lantern','dove'],sky:['#F7B99A','#FFE6CF'],player:'lantern'},
  ch:{t:'order',q:'Ordená cómo sucedió',items:['Gabriel le anuncia a María que será madre','José y María viajan a Belén por el censo','Jesús nace y es acostado en un pesebre','Los ángeles les anuncian la noticia a los pastores'],exp:'Lucas lo cuenta en secuencia: el anuncio en Nazaret, el viaje por el censo, el nacimiento y la visita de los pastores esa misma noche.',ref:'Lucas 1:26-38; 2:1-20'}}
},
infancia:{
 n1:{place:'Jerusalén',title:'Simeón en el templo',scene:'inf_n1',
  text:'A los cuarenta días, José y María llevan al bebé al templo de Jerusalén. Un anciano lo toma en brazos con alegría y alaba a Dios.',
  game:{type:'pop',title:'Las dos palomas',how:'Tocá las palomas cuando se asoman. No toques los espinos.',sky:['#A9D2F7','#F2F8FF'],good:'dove',bad:'thorn'},
  ch:{t:'who',quote:'Soberano Señor, permite ahora que tu siervo muera en paz, como prometiste. He visto tu salvación.',options:['Simeón','Zacarías','José','Juan el Bautista'],answer:'Simeón',exp:'Simeón, un hombre justo de Jerusalén, esperaba con ansias que Dios rescatara a Israel. Al ver al niño, lo tomó en brazos y bendijo a Dios.',ref:'Lucas 2:25-32'}},
 n2:{place:'Rumbo al sur',title:'La huida',scene:'inf_n2',
  text:'Una noche, un ángel le avisa a José en sueños: Herodes quiere matar al niño. La familia sale enseguida, de madrugada.',
  game:{type:'maze',title:'Huida a Egipto',how:'Guiá a la familia por el laberinto hasta la estrella. Juntá las luces del camino.',goal:'star',item:'orb',sky:['#2B3C80','#6A72B8'],night:true,road:'#C9A77A',side:'#8C7A9E',obs:'storm',item:'star'},
  ch:{t:'mc',q:'Avisado en sueños, ¿a dónde huyó José con María y el niño?',options:['Egipto','Babilonia','Damasco','Samaria'],answer:'Egipto',exp:'La familia vivió en Egipto hasta la muerte de Herodes. Así se cumplió lo dicho por el profeta: “De Egipto llamé a mi Hijo”.',ref:'Mateo 2:13-15'}},
 n3:{place:'Nazaret',title:'El taller',scene:'inf_n3',
  text:'Herodes murió y la familia vuelve. Se instalan en un pueblo del norte, donde José trabaja como carpintero.',
  game:{type:'diff',title:'El taller de José',how:'Encontrá las cinco diferencias entre los dos dibujos del taller.',pairs:['plank','nail','scroll','lamb','dove','gift','honey','lantern'],sky:['#BFE0FF','#FFF3DD'],good:'plank',bad:'nail'},
  ch:{t:'map',q:'¿Dónde queda Nazaret?',target:'nazaret',exp:'Nazaret era un pueblo chico de Galilea, en el norte. Ahí creció Jesús, por eso lo llamaban “Jesús de Nazaret”.',ref:'Mateo 2:23 · Lucas 2:39'}},
 fA:{place:'Colinas de Galilea',title:'Crecer',fork:1,scene:'inf_fA',
  text:'Pasan los años entre el taller, la sinagoga y las colinas de Galilea. Lucas resume toda esta etapa en una sola frase.',
  game:{type:'stack',title:'Construyendo en Nazaret',how:'Tocá para soltar cada tabla justo encima de la anterior.',sky:['#9FD0FA','#EAF6FF'],player:'dove'},
  ch:{t:'verse',parts:['Jesús crecía en ',0,' y en estatura, y en el ',1,' de Dios y de toda la gente.'],blanks:['sabiduría','favor'],bank:['fuerza','sabiduría','fama','favor','riqueza','poder'],exp:'Jesús creció entero: en mente, en cuerpo, con Dios y con la gente.',ref:'Lucas 2:52'}},
 fB:{place:'Camino a Jerusalén',title:'La caravana',fork:1,scene:'inf_fB',
  text:'Cada año la familia sube a Jerusalén para la Pascua, en caravana con parientes y vecinos. Este viaje va a ser especial.',
  game:{type:'order',title:'El orden de la historia',how:'Tocá los momentos en el orden en que pasaron.',sky:['#F3B993','#FFE3CC'],road:'#E9C894',side:'#C7B98A',obs:'cart',item:'star'},
  ch:{t:'mc',q:'¿Qué edad tenía Jesús en ese viaje, cuando se quedó en el templo?',options:['12 años','7 años','15 años','30 años'],answer:'12 años',exp:'Tenía doce años. Sus padres lo buscaron tres días, y los maestros se asombraban de su inteligencia.',ref:'Lucas 2:42-47'}},
 n4:{place:'Jerusalén',title:'Entre maestros',scene:'inf_n4',
  text:'Después de tres días de búsqueda, José y María encuentran a Jesús sentado entre los maestros, escuchando y preguntando.',
  game:{type:'slide',title:'El templo en piezas',how:'Mové las piezas hasta armar la imagen del templo.',sky:['#BFE0FF','#FFF3DD'],river:0,mover:'cart',land:'#EFE2C6',lane:'#D9C59C'},
  ch:{t:'who',quote:'¿Pero por qué tuvieron que buscarme? ¿No sabían que tengo que estar en la casa de mi Padre?',options:['Jesús','Samuel','José','Juan'],answer:'Jesús',exp:'Son las primeras palabras de Jesús que registran los evangelios. Con doce años ya habla de Dios como su Padre.',ref:'Lucas 2:49'}},
 n5:{place:'Hito del camino',title:'Repasá la etapa',scene:'hito2',
  text:'Mirá todo lo que recorriste desde el templo hasta Nazaret.',
  game:{type:'verso',title:'Rollos de la Escritura',how:'Tocá las partes del versículo en orden para armarlo. Si te equivocás, perdés tiempo.',verses:[{text:'Jesús crecía en sabiduría y en estatura, y en el favor de Dios y de toda la gente.',ref:'Lucas 2:52'},{text:'¿Pero por qué tuvieron que buscarme? ¿No sabían que tengo que estar en la casa de mi Padre?',ref:'Lucas 2:49'},{text:'Soy la sierva del Señor. Que se cumpla todo lo que has dicho acerca de mí.',ref:'Lucas 1:38'},{text:'¡El Salvador —sí, el Mesías, el Señor— ha nacido hoy en Belén, la ciudad de David!',ref:'Lucas 2:11'}],sky:['#C9E3FF','#FFF1D6'],good:'scroll',bad:'gloom'},
  ch:{t:'order',q:'Ordená estos momentos de la infancia',items:['Huyen a Egipto por la amenaza de Herodes','Vuelven y se establecen en Nazaret','Viajan a Jerusalén para la Pascua','Lo encuentran en el templo entre los maestros'],exp:'Después de Egipto, la familia volvió a Galilea. Cada año subían a Jerusalén para la Pascua, y en uno de esos viajes Jesús se quedó en el templo.',ref:'Mateo 2:13-23 · Lucas 2:41-46'}}
},
bautismo:{
 n1:{place:'Desierto de Judea',title:'Una voz',scene:'bau_n1',
  text:'Una voz resuena en el desierto: Juan, hijo de Zacarías, llama a todos a volver a Dios. Vive con muy poco y se viste con pelo de camello.',
  game:{type:'swarm',title:'Miel silvestre',how:'Arrastrá a tu personaje para juntar panales. Esquivá las abejas.',sky:['#F6C58C','#FFEBCB'],good:'honey',bad:'bee'},
  ch:{t:'mc',q:'¿De qué se alimentaba Juan el Bautista?',options:['Langostas y miel silvestre','Pan y pescado','Higos y aceitunas','Maná del cielo'],answer:'Langostas y miel silvestre',exp:'Juan llevaba un cinto de cuero y comía langostas y miel silvestre. Su vida austera recordaba al profeta Elías.',ref:'Mateo 3:4'}},
 n2:{place:'Orillas del río',title:'Multitudes',scene:'bau_n2',
  text:'Multitudes bajan desde Jerusalén y Judea para escuchar a Juan y bautizarse. Te acercás a la orilla y ves el agua correr.',
  game:{type:'balance',title:'Cruzando el tronco',how:'Mantené el equilibrio sobre el tronco. Usá las flechas o tocá a los costados.',sky:['#A9D4F8','#EAF6FF'],river:.6,mover:'cart',land:'#C9DE9C',lane:'#E7D3A2'},
  ch:{t:'mc',q:'¿En qué río bautizaba Juan?',options:['Jordán','Nilo','Éufrates','Tigris'],answer:'Jordán',exp:'La gente de Jerusalén, de Judea y de toda la región del Jordán salía a escuchar a Juan, y se bautizaba confesando sus pecados.',ref:'Mateo 3:5-6'}},
 n3:{place:'Betábara',title:'Cerca de Jericó',scene:'bau_n3',
  text:'Juan bautiza en Betábara, del otro lado del río, cerca de Jericó.',
  game:{type:'words',title:'Sopa de letras del Jordán',how:'Encontrá las palabras deslizando el dedo sobre las letras.',sky:['#F3C0A0','#FFE9D6'],road:'#E3CB9A',side:'#9CC9E8',obs:'rock',item:'star'},
  ch:{t:'map',q:'¿Dónde bautizaba Juan?',target:'bautismo',exp:'La tradición ubica el bautismo cerca de Jericó, poco antes de que el Jordán desemboque en el Mar Muerto.',ref:'Juan 1:28'}},
 fA:{place:'La orilla',title:'El Cordero',fork:1,scene:'bau_fA',
  text:'Juan ve a Jesús que se acerca y lo señala frente a todos con una frase que nadie olvida.',
  game:{type:'connect',title:'Uní los puntos',how:'Tocá los puntos en orden para descubrir la figura.',verses:[{text:'¡Miren! ¡El Cordero de Dios, que quita el pecado del mundo!',ref:'Juan 1:29'},{text:'Este es mi Hijo amado, quien me da un gran gozo.',ref:'Mateo 3:17'},{text:'Jesús crecía en sabiduría y en estatura, y en el favor de Dios y de toda la gente.',ref:'Lucas 2:52'},{text:'¡El Salvador —sí, el Mesías, el Señor— ha nacido hoy en Belén, la ciudad de David!',ref:'Lucas 2:11'}],sky:['#FFD7C2','#EEF5FF'],good:'lamb',bad:'thorn'},
  ch:{t:'verse',parts:['¡Miren! ¡El ',0,' de Dios, que quita el ',1,' del mundo!'],blanks:['Cordero','pecado'],bank:['León','pecado','Hijo','Cordero','dolor','mal'],exp:'Juan usa una imagen que todo israelita entendía: el cordero de la Pascua y de los sacrificios. Jesús es quien carga con el pecado del mundo.',ref:'Juan 1:29'}},
 fB:{place:'El agua',title:'Juan se sorprende',fork:1,scene:'bau_fB',
  text:'Jesús llega desde Galilea y le pide a Juan que lo bautice. Juan se sorprende y le contesta algo inesperado.',
  game:{type:'tf',title:'Verdadero o falso',how:'Respondé rápido si cada frase es verdadera o falsa.',pairs:['dove','lamb','honey','bee','scroll','star','sheep','orb'],sky:['#A9D4F8','#EAF6FF'],river:.75,mover:'cart',land:'#C9DE9C',lane:'#E7D3A2'},
  ch:{t:'who',quote:'Yo soy el que necesita que tú me bautices, entonces, ¿por qué vienes tú a mí?',options:['Juan el Bautista','Pedro','Andrés','Nicodemo'],answer:'Juan el Bautista',exp:'Juan reconoce que Jesús es mayor que él. Jesús le responde que así conviene cumplir toda justicia, y Juan lo bautiza.',ref:'Mateo 3:13-15'}},
 n4:{place:'El Jordán',title:'Cielos abiertos',scene:'bau_n4',
  text:'Jesús sale del agua, el cielo se abre y el Espíritu de Dios desciende como una paloma. Entonces se escucha una voz.',
  game:{type:'rhythm',title:'Cantos de alegría',how:'Tocá cada carril cuando la luz llega al círculo.',pads:['dove','star','orb','lamb'],sky:['#8FC6F7','#FFF6DA'],player:'dove'},
  ch:{t:'mc',q:'¿Qué dijo la voz del cielo?',options:['Este es mi Hijo amado, quien me da un gran gozo','¡Preparen el camino para la venida del Señor!','No tengan miedo, les traigo buenas noticias','Soy la sierva del Señor'],answer:'Este es mi Hijo amado, quien me da un gran gozo',exp:'En el bautismo aparecen juntos el Padre que habla, el Hijo en el agua y el Espíritu como paloma.',ref:'Mateo 3:16-17'}},
 n5:{place:'El desierto',title:'Cuarenta días',scene:'bau_n5',
  text:'El Espíritu lleva a Jesús al desierto, donde ayuna cuarenta días.',
  game:{type:'lantern',title:'Noche en el desierto',how:'Arrastrá la luz y tocá los objetos escondidos en la oscuridad.',goal:'lantern',item:'star',sky:['#26357A','#5F6DB5'],night:true,road:'#BE9C6E',side:'#8A7A93',obs:'storm',item:'star'},
  ch:{t:'order',q:'Ordená lo que pasó en el Jordán',items:['Juan predica en el desierto de Judea','Jesús llega desde Galilea al Jordán','El Espíritu desciende como paloma y habla el Padre','Jesús ayuna cuarenta días en el desierto'],exp:'Mateo une todo en un mismo movimiento: la predicación de Juan, el bautismo, la voz del cielo y enseguida la prueba en el desierto.',ref:'Mateo 3:1 – 4:2'}}
},
galilea:{
 n1:{place:'Caná',title:'La boda',scene:'gal_n1',
  text:'{name}, llegás a Caná de Galilea: hay una fiesta de bodas y todo el pueblo celebra. De pronto, a los novios se les termina el vino. María se acerca a Jesús.',
  game:{type:'pour',title:'Las seis tinajas',how:'Mantené apretado para llenar cada tinaja con agua. Soltá cuando llegue a la franja dorada, sin que rebalse.',sky:['#F7C9A8','#FFF0DC']},
  ch:{t:'who',quote:'Hagan lo que él les diga.',options:['María','Marta','Elisabet','Ana'],answer:'María',exp:'María confía en Jesús y les pide a los sirvientes que lo obedezcan. Jesús convierte el agua en vino: es la primera de sus señales, y sus discípulos creyeron en él.',ref:'Juan 2:5, 11'}},
 n2:{place:'Nazaret',title:'La sinagoga',scene:'gal_n2',
  text:'Jesús vuelve a Nazaret, el pueblo donde creció. El día de descanso entra a la sinagoga, se pone de pie y le dan el rollo del profeta Isaías para que lea.',
  game:{type:'spell',title:'Palabras del rollo',how:'Tocá las letras en orden para formar cada palabra del rollo de Isaías.',sky:['#E9D7B4','#FFF6E4']},
  ch:{t:'verse',parts:['El ',0,' del Señor está sobre mí, porque me ha ungido para llevar la ',1,' a los pobres.'],blanks:['Espíritu','Buena Noticia'],bank:['Espíritu','ángel','Buena Noticia','ley','comida','corona'],exp:'Jesús leyó estas palabras de Isaías y dijo que se cumplían ese mismo día, delante de todos: él es el Ungido que trae la Buena Noticia.',ref:'Lucas 4:18, 21'}},
 n3:{place:'Capernaúm',title:'Junto al lago',scene:'gal_n3',
  text:'Jesús deja Nazaret y se va a vivir a Capernaúm, un pueblo de pescadores a la orilla del mar de Galilea. Desde ahí empieza a anunciar el reino de Dios.',
  game:{type:'net',title:'Redes en el lago',how:'Tocá la pantalla para tirar la red desde la barca. Atrapá todos los peces que puedas antes de quedarte sin redes.',sky:['#9FD3F2','#E6F6FF']},
  ch:{t:'map',q:'¿Dónde queda Capernaúm?',target:'capernaum',exp:'Capernaúm estaba en la orilla norte del mar de Galilea. Jesús se fue a vivir ahí y desde ese pueblo recorrió toda Galilea.',ref:'Mateo 4:13'}},
 fA:{place:'El lago',title:'Redes llenas',fork:1,scene:'gal_fA',
  text:'Simón pescó toda la noche y no sacó nada. Jesús le pide que vuelva al lago y tire las redes otra vez, en lo profundo.',
  game:{type:'row',title:'Remá mar adentro',how:'Tocá a la izquierda y a la derecha, alternando, para remar. Esquivá las piedras y llegá a lo profundo.',sky:['#7FB8E0','#D9EEFA']},
  ch:{t:'who',quote:'Maestro, hemos trabajado mucho durante toda la noche y no hemos pescado nada; pero si tú lo dices, echaré las redes nuevamente.',options:['Simón Pedro','Andrés','Juan','Mateo'],answer:'Simón Pedro',exp:'Simón obedeció aunque estaba cansado, y las redes se llenaron de tantos peces que comenzaron a romperse. Desde ese día dejó todo para seguir a Jesús.',ref:'Lucas 5:5-11'}},
 fB:{place:'El pozo de Jacob',title:'Agua viva',fork:1,scene:'gal_fB',
  text:'Camino a Galilea, Jesús pasa por Samaria. Cansado del viaje, se sienta junto al pozo de Jacob al mediodía y le habla a una mujer que viene a sacar agua.',
  game:{type:'pipes',title:'Agua para el pueblo',how:'Tocá los caños para girarlos y llevá el agua desde el pozo hasta el pueblo.',sky:['#F6D28E','#FFF2D6']},
  ch:{t:'who',quote:'Esa agua se convierte en un manantial que brota con frescura dentro de ellos y les da vida eterna.',options:['Jesús','Juan el Bautista','Moisés','Jacob'],answer:'Jesús',exp:'Jesús le ofrece a la mujer samaritana un agua que quita la sed para siempre: la vida eterna que él da. Ella corrió a contárselo a todo el pueblo.',ref:'Juan 4:14, 28-29'}},
 n4:{place:'El monte',title:'Las bienaventuranzas',scene:'gal_n4',
  text:'Una multitud lo sigue. Jesús sube a la ladera de un monte, se sienta y empieza a enseñarles cómo es la vida en el reino de Dios.',
  game:{type:'lights',title:'Luz del mundo',how:'Tocá una lámpara para cambiarla junto con las de al lado. Encendé todas las lámparas.',sky:['#2E3F86','#7B8FD4'],night:true},
  ch:{t:'verse',parts:['Ustedes son la ',0,' del mundo, como una ',1,' en lo alto de una colina que no puede esconderse.'],blanks:['luz','ciudad'],bank:['sal','luz','ciudad','casa','estrella','montaña'],exp:'Jesús dice que sus seguidores reflejan su luz. Así como una ciudad en la colina se ve desde lejos, tu vida puede mostrar a Dios.',ref:'Mateo 5:14'}},
 n5:{place:'Hito del camino',title:'Repasá la etapa',scene:'hito4',
  text:'Mirá todo lo que viviste en Galilea, desde la boda de Caná hasta el monte.',
  game:{type:'match',title:'Lugares y momentos',how:'Tocá un momento a la izquierda y después su pareja a la derecha. Uní todos los pares.',sky:['#BFE0FF','#FFF3DD']},
  ch:{t:'order',q:'Ordená estos momentos en Galilea',items:['Jesús convierte el agua en vino en Caná','Lee el rollo de Isaías en la sinagoga de Nazaret','Llama a los pescadores a la orilla del lago','Enseña a la multitud en el monte'],exp:'Juan cuenta la boda de Caná como la primera señal. Lucas sigue con la sinagoga de Nazaret y el llamado de los pescadores, y Mateo reúne sus grandes enseñanzas en el monte.',ref:'Juan 2 · Lucas 4–5 · Mateo 5'}}
},
milagros:{
 n1:{place:'El lago',title:'La tormenta',scene:'mil_n1',
  text:'{name}, al atardecer cruzás el lago con Jesús y sus discípulos. Se levanta una tormenta terrible y las olas empiezan a llenar la barca. Jesús duerme en la parte de atrás.',
  game:{type:'flood',title:'Calmá el mar',how:'Elegí colores para pintar el mar desde la esquina de arriba, hasta que quede todo de un solo color.',sky:['#5A6E8A','#A9BCD0']},
  ch:{t:'mc',q:'¿Qué pasó cuando Jesús le habló al viento y a las olas?',options:['El viento se detuvo y hubo una gran calma','La barca se hundió','Llovió todavía más fuerte','Los discípulos remaron hasta la orilla'],answer:'El viento se detuvo y hubo una gran calma',exp:'Los discípulos, asombrados, se preguntaban: «¿Quién es este hombre?». Hasta el viento y las olas le obedecen.',ref:'Marcos 4:37-41'}},
 n2:{place:'Capernaúm',title:'El techo abierto',scene:'mil_n2',
  text:'La casa donde está Jesús está repleta y no entra nadie más. Cuatro amigos traen a un hombre paralítico en una camilla… y se les ocurre una idea: subir al techo.',
  game:{type:'roof',title:'El techo abierto',how:'Tocá solo las tejas marcadas para abrir el hueco y bajar la camilla.',sky:['#BFE0FF','#FFF3DD']},
  ch:{t:'mc',q:'¿Qué hicieron los amigos para llegar hasta Jesús?',options:['Abrieron el techo y bajaron la camilla','Esperaron afuera hasta el otro día','Le pidieron a la gente que se fuera','Llamaron a Jesús por la ventana'],answer:'Abrieron el techo y bajaron la camilla',exp:'Jesús vio la fe de ellos. Primero le perdonó los pecados al hombre y después lo sanó: se levantó, tomó su camilla y salió caminando delante de todos.',ref:'Marcos 2:1-12'}},
 n3:{place:'Una colina',title:'Cinco panes',scene:'mil_n3',
  text:'Miles de personas siguieron a Jesús hasta un lugar alejado y se hizo tarde. No hay comida para tanta gente… pero un muchachito tiene algo para compartir.',
  game:{type:'count',title:'Panes y pescados',how:'Mirá rápido la imagen y contá cuántos panes o cuántos pescados hay.',sky:['#C9E6A8','#FFF6DC']},
  ch:{t:'who',quote:'Aquí hay un muchachito que tiene cinco panes de cebada y dos pescados. ¿Pero de qué sirven ante esta enorme multitud?',options:['Andrés','Felipe','Pedro','Judas'],answer:'Andrés',exp:'Lo dijo Andrés, el hermano de Simón Pedro. Jesús dio gracias, repartió los panes y los pescados, y comieron todos hasta quedar satisfechos. ¡Sobraron doce canastas!',ref:'Juan 6:8-13'}},
 fA:{place:'Entre la multitud',title:'El manto',fork:1,scene:'mil_fA',
  text:'Una mujer que estaba enferma desde hacía doce años se abre paso entre la gente. Está segura de que, si toca la ropa de Jesús, va a quedar sana.',
  game:{type:'trace',title:'Tocá el manto',how:'Arrastrá el dedo desde la mujer hasta el manto de Jesús sin chocar con nadie.',sky:['#F3D3B0','#FFF2E2']},
  ch:{t:'mc',q:'Según Jesús, ¿qué sanó a la mujer?',options:['Su fe en él','El dinero que gastó en médicos','Un remedio nuevo','Ser de una familia importante'],answer:'Su fe en él',exp:'Jesús la llamó «hija» y le dijo que su fe la había sanado. Ella se acercó con miedo, pero con confianza, y Jesús no la rechazó.',ref:'Marcos 5:25-34'}},
 fB:{place:'Camino de Jericó',title:'Bartimeo',fork:1,scene:'mil_fB',
  text:'Un ciego llamado Bartimeo pide limosna al costado del camino. Cuando escucha que pasa Jesús de Nazaret, empieza a gritar con todas sus fuerzas.',
  game:{type:'reveal',title:'Recuperar la vista',how:'La imagen se va aclarando. Tocá lo que es antes de que se vea del todo.',sky:['#F6D28E','#FFF2D6']},
  ch:{t:'who',quote:'¡Jesús, Hijo de David, ten compasión de mí!',options:['Bartimeo','Zaqueo','Jairo','Lázaro'],answer:'Bartimeo',exp:'Muchos le decían que se callara, pero él gritó todavía más fuerte. Jesús lo llamó, le devolvió la vista y Bartimeo lo siguió por el camino.',ref:'Marcos 10:46-52'}},
 n4:{place:'De noche en el lago',title:'Sobre el agua',scene:'mil_n4',
  text:'De madrugada, los discípulos ven a alguien caminando sobre el agua: ¡es Jesús! Pedro le pide ir hacia él… y baja de la barca.',
  game:{type:'hop',title:'Caminar sobre el agua',how:'Tocá para saltar las olas. Mantené la mirada en Jesús y llegá hasta él.',sky:['#26357A','#5F6DB5'],night:true},
  ch:{t:'mc',q:'¿Por qué Pedro empezó a hundirse?',options:['Porque vio el viento fuerte y tuvo miedo','Porque se cansó de caminar','Porque la barca se alejó','Porque Jesús se fue'],answer:'Porque vio el viento fuerte y tuvo miedo',exp:'Mientras miraba a Jesús, Pedro caminó sobre el agua. Cuando se fijó en el viento, tuvo miedo y empezó a hundirse. Jesús le extendió la mano enseguida.',ref:'Mateo 14:28-31'}},
 n5:{place:'Hito del camino',title:'Repasá la etapa',scene:'hito5',
  text:'Mirá todo lo que Jesús hizo: calmó el mar, sanó, alimentó a miles y caminó sobre el agua.',
  game:{type:'sort',title:'Clasificá los milagros',how:'Tocá a la izquierda o a la derecha según dónde va cada milagro.',sky:['#BFE0FF','#FFF3DD']},
  ch:{t:'order',q:'Ordená lo que pasó esa noche en el lago',items:['Jesús camina sobre el agua hacia la barca','Pedro le pide ir hacia él','Pedro mira el viento, tiene miedo y se hunde','Jesús lo toma de la mano y suben a la barca'],exp:'Mateo lo cuenta así, y termina con los discípulos adorando a Jesús como el Hijo de Dios.',ref:'Mateo 14:25-33'}}
}};
const MAP_PLACES=[
 {id:'nazaret',name:'Nazaret',x:165,y:112,lx:-50,ly:4},{id:'capernaum',name:'Capernaum',x:196,y:86,lx:-62,ly:-8},
 {id:'jerico',name:'Jericó',x:180,y:244,lx:-38,ly:-10},{id:'bautismo',name:'Jordán (Betábara)',x:201,y:252,lx:14,ly:4},
 {id:'jerusalen',name:'Jerusalén',x:153,y:258,lx:-60,ly:4},{id:'belen',name:'Belén',x:146,y:284,lx:-38,ly:6}
];
const MEDALS=[
 {id:'primer',name:'Primer paso',desc:'Tu primera respuesta correcta.',c:'#FFCF5C',g:'M26 14l3.5 7.4 8.1.9-6 5.6 1.6 8-7.2-4-7.2 4 1.6-8-6-5.6 8.1-.9z',f:1},
 {id:'racha5',name:'En llamas',desc:'Cinco respuestas correctas seguidas.',c:'#EF6F61',g:'M26 12c2 5 9 8.5 9 16a9 9 0 0 1-18 0c0-4.4 2.6-6.2 3.4-9.6 1.8 2 2.1 4.2 1.8 6.3C25 22 27 18 26 12z',f:1},
 {id:'jugador',name:'Gran jugador',desc:'Superá 300 puntos en un solo minijuego.',c:'#7FB7F5',g:'M17 22h18v8a9 9 0 0 1-18 0z M21 18v4 M31 18v4',w:3},
 {id:'perfecto',name:'Etapa perfecta',desc:'Una etapa entera sin errores en las preguntas.',c:'#2FAE7C',g:'M17 26l6 6 12-13',w:4},
 {id:'explorador',name:'Explorador',desc:'Recorré los dos caminos de una bifurcación.',c:'#FFE39A',g:'M26 38V24 M26 24L16 14 M26 24l10-10',w:3.4},
 {id:'cartografo',name:'Cartógrafo',desc:'Acertá los tres mapas.',c:'#9FCBF2',g:'M26 13l4 13-4 13-4-13z M13 26l13-4 13 4-13 4z',f:1},
 {id:'memoria',name:'Memoria de oro',desc:'Completá los tres versículos.',c:'#F3C79A',g:'M16 15h20v22H16z M20 21h12 M20 26h12 M20 31h8',w:2.6},
 {id:'peregrino',name:'Peregrino',desc:'Llegá al final de todas las etapas.',c:'#E8E0F8',g:'M18 38c2-6 4-8 8-8s6 2 8 8 M26 27a5 5 0 1 0 0-10 5 5 0 0 0 0 10',w:2.6}
];
const SKINS=['#F7D7BE','#E6B691','#C08559','#7E4E30'];
const HAIRS=['#2A1B14','#5B3521','#A8743A','#E7C680'];
const OUTFITS=['#5B8DEF','#EF6F61','#2FAE7C','#F2B33D','#9B7BE8'];

const CACHE='tsp-cache-v4';
let branch=null,profiles=[],current=null,saveT=null;
const P=()=>current;
const blank=()=>({done:{},visited:['start'],pos:'start',regions:{},medals:[],maps:[],verses:[],games:{},trivia:0,streak:0,best:0,rankId:null,items:{},gear:{own:[],eq:{}},missions:{},mact:null,exams:{},want:{},lvSeen:0,photo:''});
const KEYS=Object.keys(blank());
function serialize(p){const o={};KEYS.forEach(k=>o[k]=p[k]);return JSON.stringify(o);}
function save(){
  if(!current)return;
  try{localStorage.setItem(CACHE+':'+current.id,serialize(current));}catch(e){}
  clearTimeout(saveT);saveT=setTimeout(pushCloud,1200);
}
async function pushCloud(){
  const p=current;if(!p||p.demo)return;
  try{
    await patchItemFields('Perfiles',p.id,{estado:serialize(p),avatar:JSON.stringify(p.avatar),edad:p.avatar.age,puntos:total(p),etapas:stagesDone(p),medallas:p.medals.length});
    if(p.rankId)await patchItemFields('Ranking',p.rankId,{apodo:p.name,avatar:JSON.stringify(p.avatar),puntos:total(p),etapas:stagesDone(p)});
  }catch(e){console.warn(e);clearTimeout(saveT);saveT=setTimeout(pushCloud,8000);}
}
function fromItem(it){
  let st={},loc=null,av={};
  try{st=JSON.parse(it.estado||'{}');}catch(e){}
  try{loc=JSON.parse(localStorage.getItem(CACHE+':'+it._id)||'null');}catch(e){}
  try{av=JSON.parse(it.avatar||'{}');}catch(e){}
  const cloud={...blank(),...st},local=loc?{...blank(),...loc}:null;
  const useLocal=local&&Object.keys(local.done).length+gamesTotal(local)>Object.keys(cloud.done).length+gamesTotal(cloud);
  return {...(useLocal?local:cloud),id:it._id,name:it.apodo||'Jugador',rama:it.rama,avatar:{g:'chica',age:12,skin:'#E6B691',hair:'#2A1B14',outfit:'#5B8DEF',...av}};
}
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mult=s=>s>=5?2:s>=3?1.5:1;
const fmt=n=>Math.round(n).toLocaleString('es-AR');
const ageFactor=a=>.7+(Math.min(18,Math.max(6,a||12))-6)/12*.42;
const gamesTotal=p=>Object.values(p.games).reduce((a,b)=>a+b,0);
const total=p=>p.trivia+gamesTotal(p)+Object.keys(p.items||{}).length*25+Object.keys(p.missions||{}).length*50+Object.values(p.exams||{}).reduce((s,e)=>s+(e.pts||0),0);
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=amt<0?0:255,k=Math.abs(amt);r=Math.round(r+(t-r)*k);g=Math.round(g+(t-g)*k);b=Math.round(b+(t-b)*k);return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
const STAR=on=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="${on?'#F2B33D':'#DCE6F7'}" stroke="${on?'#FFE39A':'#C9D6EC'}" stroke-width="1"/></svg>`;
const coin=(m,size=52)=>`<svg class="coin" width="${size}" height="${size}" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="${m.c}"/><circle cx="26" cy="26" r="19" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><path d="${m.g}" fill="${m.f?'#22407F':'none'}" stroke="#22407F" stroke-width="${m.w||0}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

let uid=0;
function body(a){const age=a.age||14,kid=age<13,teen=age<18;return {leg:kid?14:teen?18:21,bh:kid?18:teen?22:25,hr:kid?12.5:teen?11.6:11};}
function avatarSVG(a){
  const u='a'+(uid++),{leg,bh,hr}=body(a),top=-(leg+bh),hy=top-hr+2.5;
  const dark=shade(a.outfit,-.22),pants='#34426E';
  const back=a.g==='chica'?`<path d="M${-hr-2} ${hy-2} Q${-hr-4} ${hy+hr+10} ${-hr+1} ${hy+hr+12} L${hr-1} ${hy+hr+12} Q${hr+4} ${hy+hr+10} ${hr+2} ${hy-2}Z" fill="${a.hair}"/>`:'';
  const front=a.g==='chica'
   ?`<path d="M${-hr-1} ${hy+2} Q${-hr-1} ${hy-hr-4} 0 ${hy-hr-1.5} Q${hr+1} ${hy-hr-4} ${hr+1} ${hy+2} Q${hr-2} ${hy-5} 3 ${hy-6.5} Q-4 ${hy-5} ${-hr-1} ${hy+2}Z" fill="${a.hair}"/><circle cx="${hr-1.5}" cy="${hy-6.5}" r="2.6" fill="#FFCF5C"/>`
   :`<path d="M${-hr-.6} ${hy+.5} Q${-hr-1.5} ${hy-hr-5} 1 ${hy-hr-2.5} Q${hr+2} ${hy-hr-4} ${hr+.6} ${hy+.5} L${hr-1.2} ${hy-3.5} Q3 ${hy-9} ${-hr+1.4} ${hy-3.8}Z" fill="${a.hair}"/>`;
  return `<g class="av"><defs><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(a.outfit,.12)}"/><stop offset="1" stop-color="${dark}"/></linearGradient><radialGradient id="${u}f" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="${shade(a.skin,.22)}"/><stop offset="1" stop-color="${a.skin}"/></radialGradient></defs>
  <ellipse rx="15" ry="3.8" fill="#22407F" opacity=".16"/><g class="bob">
   <g class="leg l"><rect x="-7" y="${-leg}" width="5.6" height="${leg}" rx="2.8" fill="${pants}"/><ellipse cx="-4.4" cy="-1" rx="3.8" ry="2.2" fill="#fff"/></g>
   <g class="leg r"><rect x="1.4" y="${-leg}" width="5.6" height="${leg}" rx="2.8" fill="${pants}"/><ellipse cx="4.4" cy="-1" rx="3.8" ry="2.2" fill="#fff"/></g>
   ${back}
   <g class="arm l"><rect x="-15.5" y="${top+3}" width="5.2" height="${bh-6}" rx="2.6" fill="${dark}"/><circle cx="-12.9" cy="${top+bh-2}" r="2.8" fill="${a.skin}"/></g>
   <g class="arm r"><rect x="10.3" y="${top+3}" width="5.2" height="${bh-6}" rx="2.6" fill="${dark}"/><circle cx="12.9" cy="${top+bh-2}" r="2.8" fill="${a.skin}"/></g>
   <rect x="-11" y="${top}" width="22" height="${bh+3}" rx="9" fill="url(#${u}b)"/>
   <path d="M-5.5 ${top+1} Q0 ${top+6.5} 5.5 ${top+1}" stroke="rgba(255,255,255,.55)" fill="none" stroke-width="1.8" stroke-linecap="round"/>
   <circle cx="0" cy="${hy}" r="${hr}" fill="url(#${u}f)"/>
   ${front}
   <ellipse cx="-4" cy="${hy+1.6}" rx="1.6" ry="2" fill="#1A2B57"/><ellipse cx="4" cy="${hy+1.6}" rx="1.6" ry="2" fill="#1A2B57"/>
   <circle cx="-3.5" cy="${hy+.9}" r=".6" fill="#fff"/><circle cx="4.5" cy="${hy+.9}" r=".6" fill="#fff"/>
   <circle cx="-6.8" cy="${hy+5.2}" r="2" fill="#EF6F61" opacity=".28"/><circle cx="6.8" cy="${hy+5.2}" r="2" fill="#EF6F61" opacity=".28"/>
   <path d="M-2.8 ${hy+5.4} Q0 ${hy+7.8} 2.8 ${hy+5.4}" stroke="#1A2B57" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  </g></g>`;
}
const headBox=a=>{const {leg,bh,hr}=body(a),hy=-(leg+bh)-hr+2.5;return `<g transform="translate(0,${-62-hy})">${avatarSVG(a)}</g>`;};

const T=(x,y,s,inner)=>`<g transform="translate(${x},${y}) scale(${s})">${inner}</g>`;
const SKY={dawn:['#9DBDF2','#FFD4C2'],day:['#86C1F4','#EAF5FF'],dusk:['#8C8FDB','#FFC59C'],night:['#1E2C66','#5468B4'],desert:['#F3BC7E','#FFE8C2'],gold:['#A7CFF7','#FFE4AE'],temple:['#F7E6C6','#FFF7E8']};
function defs(u){return `<defs>
<radialGradient id="${u}gl"><stop offset="0" stop-color="#FFF8DE" stop-opacity=".95"/><stop offset=".45" stop-color="#FFE9A8" stop-opacity=".42"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
<linearGradient id="${u}cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DDE9FA"/></linearGradient>
<radialGradient id="${u}sun" cx=".42" cy=".38"><stop offset="0" stop-color="#FFFCEB"/><stop offset="1" stop-color="#FFC94D"/></radialGradient>
<linearGradient id="${u}wa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93D3F6"/><stop offset="1" stop-color="#3F88CF"/></linearGradient>
<linearGradient id="${u}sa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6D9A6"/><stop offset="1" stop-color="#D9A562"/></linearGradient>
<linearGradient id="${u}wo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C38E58"/><stop offset="1" stop-color="#8B5B32"/></linearGradient>
<linearGradient id="${u}st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF2E1"/><stop offset="1" stop-color="#DCC7A2"/></linearGradient>
<linearGradient id="${u}lp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7D6" stop-opacity="0"/><stop offset=".7" stop-color="#FFF4C8" stop-opacity=".75"/><stop offset="1" stop-color="#FFE8A0" stop-opacity=".95"/></linearGradient>
<linearGradient id="${u}lf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DBE6A"/><stop offset="1" stop-color="#3F8348"/></linearGradient>
</defs>`;}
let hn=0;
const A={
 sky:(u,k)=>{const [a,b]=SKY[k];return `<linearGradient id="${u}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><rect x="-400" y="-100" width="1200" height="400" fill="url(#${u}sky)"/>`;},
 stars:u=>[[18,20],[46,48],[80,16],[120,40],[150,12],[178,52],[262,64],[296,22],[306,60],[30,82],[100,76],[140,88],[220,18],[240,80]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3?.8:1.4}" fill="#fff" opacity="${i%2?.55:.95}"/>`).join(''),
 cloud:(u,w,o=1)=>{const r=w/4;return `<g fill="url(#${u}cl)" opacity="${o}"><ellipse cx="0" cy="${r*.4}" rx="${w*.5}" ry="${r*.72}"/><circle cx="${-w*.22}" cy="${r*.1}" r="${r*.92}"/><circle cx="${w*.04}" cy="${-r*.4}" r="${r*1.22}"/><circle cx="${w*.28}" cy="${r*.12}" r="${r*.84}"/></g>`;},
 glow:(u,r,o=1)=>`<circle r="${r}" fill="url(#${u}gl)" opacity="${o}"/>`,
 sun:(u,r)=>A.glow(u,r*3)+`<circle r="${r}" fill="url(#${u}sun)"/>`,
 moon:u=>A.glow(u,40)+`<path d="M4 -13 A13 13 0 1 0 4 13 A10 10 0 1 1 4 -13Z" fill="#FFF6DD"/>`,
 star:(u,s)=>A.glow(u,s*5)+`<path d="M0 ${-s*2.2} Q${s*.28} ${-s*.28} ${s*2.2} 0 Q${s*.28} ${s*.28} 0 ${s*2.2} Q${-s*.28} ${s*.28} ${-s*2.2} 0 Q${-s*.28} ${-s*.28} 0 ${-s*2.2}Z" fill="#FFF7D6"/><path d="M0 ${-s} Q${s*.15} ${-s*.15} ${s} 0 Q${s*.15} ${s*.15} 0 ${s} Q${-s*.15} ${s*.15} ${-s} 0 Q${-s*.15} ${-s*.15} 0 ${-s}Z" fill="#fff" transform="rotate(45)"/>`,
 sparkles:(u,n=7,R=40)=>Array.from({length:n},(_,i)=>{const a=i/n*6.28,r=R*(.5+((i*37)%10)/14),s=2+(i%3);return `<path transform="translate(${Math.cos(a)*r},${Math.sin(a)*r*.7})" d="M0 ${-s*2} Q${s*.2} ${-s*.2} ${s*2} 0 Q${s*.2} ${s*.2} 0 ${s*2} Q${-s*.2} ${s*.2} ${-s*2} 0 Q${-s*.2} ${-s*.2} 0 ${-s*2}Z" fill="#FFF4C4"/>`;}).join(''),
 hills:(u,y,c1,c2,amp=28,ph=0)=>{const id=u+'h'+(hn++);return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient><path d="M-20 ${y} C 50 ${y-amp+ph} 110 ${y-amp*.15} 170 ${y-amp*.55} S 290 ${y-amp*1.05+ph} 340 ${y-amp*.3} V200 H-20Z" fill="url(#${id})"/>`;},
 ground:(u,y,c1,c2)=>{const id=u+'h'+(hn++);return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient><path d="M-20 ${y} Q160 ${y-8} 340 ${y} V200 H-20Z" fill="url(#${id})"/>`;},
 house:u=>`<g><rect x="-18" y="-26" width="36" height="26" rx="2" fill="url(#${u}st)"/><rect x="-20" y="-30" width="40" height="5" rx="2" fill="#CDB38B"/><path d="M-5 0 V-9 a5 5 0 0 1 10 0 V0Z" fill="#7A563E"/><rect x="8" y="-20" width="6" height="6" rx="1.4" fill="#FFD77A"/><rect x="-14" y="-20" width="5" height="5" rx="1.2" fill="#FFE4A0" opacity=".8"/></g>`,
 stable:u=>`<g><path d="M-48 -40 Q0 -64 48 -40 Z" fill="#A27447"/><path d="M-48 -40 Q0 -60 48 -40" stroke="#C99A62" stroke-width="3" fill="none"/><rect x="-44" y="-40" width="5" height="40" rx="2" fill="#7E5634"/><rect x="39" y="-40" width="5" height="40" rx="2" fill="#7E5634"/><rect x="-39" y="-40" width="78" height="40" fill="#3A2D52" opacity=".78"/>${T(0,-12,1,A.glow(u,38))}<path d="M-15 -14 L15 -14 L10 -1 L-10 -1Z" fill="url(#${u}wo)"/><path d="M-13 -15 Q0 -23 13 -15" stroke="#F6D47E" stroke-width="3.2" fill="none"/><ellipse cx="0" cy="-17" rx="6" ry="3.4" fill="#FFF8E6"/><rect x="-50" y="-2" width="100" height="4" rx="2" fill="#D7B06A"/></g>`,
 temple:u=>`<g><rect x="-64" y="-8" width="128" height="8" rx="2" fill="#D8C49A"/><rect x="-58" y="-14" width="116" height="7" rx="2" fill="#E7D7B3"/><rect x="-52" y="-60" width="104" height="47" fill="url(#${u}st)"/>${[-44,-26,-8,10,28,44].map(c=>`<rect x="${c-3.2}" y="-58" width="6.4" height="44" rx="2" fill="#E9DDC2"/><rect x="${c-1}" y="-58" width="1.2" height="44" fill="#fff" opacity=".7"/>`).join('')}<path d="M-60 -60 L0 -82 L60 -60Z" fill="#EBDDBB"/><path d="M-60 -60 L60 -60" stroke="#E9A52C" stroke-width="3"/><rect x="-10" y="-34" width="20" height="21" rx="9" fill="#6E5440"/></g>`,
 walls:u=>`<g fill="url(#${u}st)"><rect x="-70" y="-24" width="140" height="24"/>${[-70,-30,10,50].map(c=>`<rect x="${c}" y="-38" width="20" height="38" rx="2"/>`).join('')}<rect x="-8" y="-58" width="26" height="58" rx="2" fill="#F5E6C6"/><path d="M-8 -58 L5 -68 L18 -58Z" fill="#E9A52C"/></g>`,
 palm:u=>`<g><path d="M0 0 Q-4 -24 2 -46" stroke="url(#${u}wo)" stroke-width="5.5" fill="none" stroke-linecap="round"/><g fill="url(#${u}lf)"><path d="M2 -46 Q-16 -56 -30 -40 Q-14 -48 2 -46Z"/><path d="M2 -46 Q20 -58 32 -40 Q16 -50 2 -46Z"/><path d="M2 -46 Q-8 -66 -22 -62 Q-8 -58 2 -46Z"/><path d="M2 -46 Q12 -68 26 -60 Q12 -58 2 -46Z"/></g></g>`,
 tree:u=>`<g><rect x="-3.5" y="-26" width="7" height="26" rx="3" fill="url(#${u}wo)"/><circle cx="0" cy="-36" r="17" fill="#5E9B52"/><circle cx="-11" cy="-27" r="11" fill="#6FB062"/><circle cx="11" cy="-28" r="11" fill="#6FB062"/><circle cx="-5" cy="-42" r="7" fill="#8DC77B" opacity=".8"/></g>`,
 sheep:u=>`<g><rect x="-8" y="-5" width="3" height="9" rx="1.5" fill="#4B4440"/><rect x="5" y="-5" width="3" height="9" rx="1.5" fill="#4B4440"/><g fill="#FBF8F2"><circle cx="-7" cy="-9" r="6.5"/><circle cx="0" cy="-12" r="7.5"/><circle cx="7" cy="-9" r="6.5"/><ellipse cx="0" cy="-7" rx="12" ry="6"/></g><ellipse cx="13" cy="-11" rx="4.6" ry="4" fill="#4B4440"/><circle cx="14.4" cy="-12" r=".8" fill="#fff"/></g>`,
 lamb:u=>`<g>${A.glow(u,34)}<g transform="scale(1.3)">${A.sheep(u)}</g></g>`,
 camel:(u,c='#B98B5A')=>`<g fill="${c}"><path d="M-24 -18 Q-20 -36 -8 -25 Q0 -40 11 -25 L18 -25 Q20 -38 29 -38 L34 -36 L30 -31 L26 -15 L11 -12 L-21 -12Z"/>${[-19,-11,8,16].map(x=>`<rect x="${x}" y="-14" width="3.4" height="14" rx="1.5"/>`).join('')}</g>`,
 donkey:u=>`<g fill="#9C9188"><ellipse cx="0" cy="-16" rx="15" ry="8"/><path d="M12 -20 L22 -30 L26 -27 L18 -16Z"/><path d="M21 -31 l-1 -7 l3 6Z M24 -30 l1 -7 l1 7Z" fill="#7D736B"/>${[-10,-4,6,11].map(x=>`<rect x="${x}" y="-10" width="3" height="10" rx="1.4"/>`).join('')}</g>`,
 dove:u=>`<g>${A.glow(u,34)}<g fill="#FFFFFF"><path d="M-28 -6 Q-12 -24 0 -2 Q12 -24 28 -6 Q12 -9 4 4 L0 13 L-4 4 Q-12 -9 -28 -6Z"/><circle cx="0" cy="-2" r="4.2"/></g><path d="M-1 1 l1 2.5 l1 -2.5Z" fill="#F2B33D"/></g>`,
 figure:(u,robe,o={})=>`<g>${o.staff?`<path d="M14 0 L14 -46 Q14 -52 9 -50" stroke="#8B5B32" stroke-width="2.4" fill="none" stroke-linecap="round"/>`:''}<path d="M-11 0 Q-12 -20 -7 -31 Q0 -35 7 -31 Q12 -20 11 0Z" fill="${robe}"/><path d="M-11 0 Q-12 -20 -7 -31 Q-3 -33 -1 -33 Q-6 -18 -4 0Z" fill="#fff" opacity=".18"/><circle cy="-38" r="5.6" fill="#E3B48C"/><path d="M-7 -36 Q-7 -46 0 -46 Q7 -46 7 -36 Q8 -30 6 -26 L-6 -26 Q-8 -30 -7 -36Z" fill="${o.scarf||shade(robe,.35)}"/>${o.crown?`<path d="M-5 -45 l1.5 -5 l2 3 l1.5 -4 l1.5 4 l2 -3 l1.5 5Z" fill="#F2B33D"/>`:''}</g>`,
 people:(u,n=3)=>Array.from({length:n},(_,i)=>T(i*16-((n-1)*8),i%2*3,.8-(i%2)*.06,A.figure(u,['#7E9BD0','#C9876A','#9AB072','#B08CC9','#D3A35E'][i%5]))).join(''),
 lightP:(u,h=150)=>`<g><rect x="-17" y="${-h}" width="34" height="${h}" rx="17" fill="url(#${u}lp)"/>${A.glow(u,32)}</g>`,
 presence:u=>`<g>${A.glow(u,46)}<ellipse cx="0" cy="-20" rx="9" ry="20" fill="#FFF8E2" opacity=".85"/><circle cy="-44" r="6.5" fill="#FFFDF4"/>${A.sparkles(u,6,26)}</g>`,
 rays:u=>`<path d="M-16 -20 L16 -20 L80 200 L-80 200Z" fill="#FFF6D2" opacity=".28"/><path d="M-6 -20 L6 -20 L34 200 L-34 200Z" fill="#FFF6D2" opacity=".35"/>`,
 gifts:u=>`<g>${A.glow(u,32)}<rect x="-28" y="-15" width="17" height="15" rx="2" fill="#F2B33D"/><rect x="-21" y="-15" width="3" height="15" fill="#C47F14"/><path d="M-5 0 L-5 -12 Q2 -21 9 -12 L9 0Z" fill="#C08559"/><rect x="14" y="-11" width="15" height="11" rx="3" fill="#7FB7F5"/><rect x="20" y="-11" width="2.4" height="11" fill="#fff" opacity=".7"/></g>`,
 scroll:u=>`<g>${A.glow(u,72)}<rect x="-58" y="-27" width="116" height="62" rx="5" fill="#FBF3E2"/><rect x="-65" y="-31" width="11" height="70" rx="5.5" fill="url(#${u}wo)"/><rect x="54" y="-31" width="11" height="70" rx="5.5" fill="url(#${u}wo)"/><path d="M-44 -12 H40 M-44 0 H30 M-44 12 H36 M-44 24 H18" stroke="#C9AE80" stroke-width="3" stroke-linecap="round"/></g>`,
 river:(u,y)=>`<path d="M-20 ${y} Q80 ${y-6} 160 ${y+2} T340 ${y-2} V${y+24} Q240 ${y+19} 160 ${y+26} T-20 ${y+24}Z" fill="url(#${u}wa)"/>`,
 waves:u=>`<path d="M0 0 h40 M70 4 h28 M130 -2 h44 M210 3 h34 M270 -1 h30" stroke="#E4F5FF" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>`,
 ripples:u=>`<g>${A.glow(u,44)}<ellipse rx="40" ry="7" fill="none" stroke="#E4F5FF" stroke-width="2"/><ellipse rx="22" ry="4" fill="none" stroke="#fff" stroke-width="2"/></g>`,
 reeds:u=>`<g stroke="#5F8A3F" stroke-width="3" stroke-linecap="round" fill="none"><path d="M0 0 q-4 -20 -2 -34"/><path d="M6 0 q2 -22 6 -30"/><path d="M-6 0 q-6 -14 -10 -22"/></g><ellipse cx="-2" cy="-34" rx="2.6" ry="6.5" fill="#7A5436"/>`,
 rocks:u=>`<g><path d="M-24 0 L-17 -15 L-3 -19 L8 -8 L10 0Z" fill="#B49A7C"/><path d="M-17 -15 L-3 -19 L-6 -10Z" fill="#D4BFA1"/><path d="M4 0 L14 -12 L26 -10 L30 0Z" fill="#9C8167"/></g>`,
 bench:u=>`<g><rect x="-32" y="-10" width="64" height="7" rx="2" fill="url(#${u}wo)"/><rect x="-26" y="-3" width="5" height="12" fill="#7E5634"/><rect x="21" y="-3" width="5" height="12" fill="#7E5634"/></g>`,
 plank:u=>`<g><rect x="-24" y="-4" width="48" height="8" rx="2" fill="#D9A56A"/><path d="M-18 -1 h10 M2 1 h12" stroke="#B57E45" stroke-width="1.2"/></g>`,
 tent:(u,c)=>`<g><path d="M-22 0 L0 -28 L22 0Z" fill="${c}"/><path d="M0 -28 L22 0 L8 0Z" fill="#000" opacity=".1"/><path d="M-4 0 L0 -12 L4 0Z" fill="#5B3B2A"/></g>`,
 fire:u=>`<g>${A.glow(u,24)}<path d="M-6 0 Q-7 -12 0 -18 Q7 -12 6 0Z" fill="#FFB547"/><path d="M-3 0 Q-3 -7 0 -10 Q3 -7 3 0Z" fill="#FFF0B0"/><rect x="-10" y="0" width="20" height="3" rx="1.5" fill="#7E5634"/></g>`,
 columns:u=>`<rect x="-20" y="128" width="360" height="60" fill="#E2CFA8"/>${[18,82,238,302].map(c=>`<rect x="${c-11}" y="-10" width="22" height="142" rx="3" fill="url(#${u}st)"/><rect x="${c-3}" y="-10" width="2" height="142" fill="#fff" opacity=".6"/><rect x="${c-15}" y="-10" width="30" height="9" rx="2" fill="#EBDDBB"/>`).join('')}`
};

const fam=u=>`<g>${T(-16,0,1,A.figure(u,'#9B7650',{staff:1,scarf:'#E8D6B8'}))}${T(14,0,1,A.donkey(u))}${T(14,-12,.82,A.figure(u,'#5E8FD6',{scarf:'#EEF4FF'}))}</g>`;
const SCENES={
 nac_n1:u=>({sky:'dawn',dur:8,
  bg:T(258,118,1,A.sun(u,15))+T(60,40,1,A.cloud(u,74))+T(232,30,1,A.cloud(u,52,.9))+A.hills(u,122,'#C9B7EA','#A592D0',26)+T(150,130,1.25,A.house(u))+T(208,134,.92,A.house(u))+T(272,140,.9,A.palm(u))+A.hills(u,150,'#9A89C8','#7B6AB0',12,4)+T(176,150,.9,A.figure(u,'#5E8FD6',{scarf:'#EEF4FF'})),
  actors:{light:u=>A.lightP(u,150),spk:u=>A.sparkles(u,8,40)},
  tl:[['light',1,2.6,{x:160,y:96,o:0},{x:160,y:130,o:1}],['spk',2.4,3.6,{x:160,y:110,o:0,s:.5},{x:160,y:110,o:1,s:1.1}],['spk',3.6,8,{x:160,y:110,o:1,s:1.1,r:0},{x:160,y:110,o:.7,s:1.2,r:30}]],
  caps:[[0,'Nazaret, una mañana tranquila en Galilea.'],[2.5,'Una luz llena la casa de una joven llamada María.'],[5.2,'El ángel Gabriel le trae una noticia que cambia la historia.']]}),
 nac_n2:u=>({sky:'dusk',dur:8,
  bg:T(60,46,1,A.cloud(u,70,.9))+T(250,36,1,A.cloud(u,50,.8))+A.hills(u,116,'#D9A9C4','#B07BA6',30)+`<path d="M110 190 C150 156 170 132 168 114 L176 114 C180 134 200 156 252 190Z" fill="url(#${u}sa)" opacity=".95"/>`+T(46,142,.95,A.palm(u))+T(292,152,1.1,A.palm(u))+`<g transform="translate(236,152)"><rect x="-2" y="-30" width="4" height="30" fill="#7E5634"/><rect x="-27" y="-40" width="54" height="15" rx="4" fill="#F6E3B8"/><text y="-29" font-family="Fraunces,serif" font-weight="700" font-size="9" text-anchor="middle" fill="#7A5200">BELÉN</text></g>`,
  actors:{sun:u=>A.sun(u,18),fam:u=>fam(u)},
  tl:[['sun',0,8,{x:252,y:86},{x:252,y:104}],['fam',0,7,{x:340,y:162,s:.95},{x:200,y:150,s:.78}]],
  caps:[[0,'César Augusto ordena un censo en todo el imperio.'],[2.6,'Cada familia debe registrarse en su ciudad.'],[5.2,'José y María emprenden el camino a Belén.']]}),
 nac_n3:u=>({sky:'night',dur:8,
  bg:A.stars(u)+A.hills(u,130,'#4A5FA8','#2E3F86',24)+T(66,140,.72,A.house(u))+T(102,144,.6,A.house(u))+T(288,142,.66,A.house(u))+T(196,158,1.12,A.stable(u)),
  actors:{star:u=>A.star(u,5),beam:u=>`<path d="M0 0 L-34 118 L34 118Z" fill="#FFF3C4" opacity=".25"/>`,baby:u=>A.glow(u,34)},
  tl:[['star',.4,2.6,{x:200,y:-10,o:0,s:.4},{x:200,y:32,o:1,s:1}],['beam',2.6,3.6,{x:200,y:34,o:0},{x:200,y:34,o:1}],['baby',3.6,5.2,{x:196,y:142,o:0,s:.5},{x:196,y:142,o:1,s:1.2}],['baby',5.2,8,{x:196,y:142,o:1,s:1.2},{x:196,y:142,o:.85,s:1}]],
  caps:[[0,'Belén está repleta de viajeros por el censo.'],[2.6,'Una estrella brilla sobre un establo.'],[5.2,'En un pesebre, María acuesta a su bebé.']]}),
 nac_fA:u=>({sky:'night',dur:8,
  bg:A.stars(u)+A.hills(u,132,'#4B76A2','#2D5277',22)+T(170,154,1,A.sheep(u))+T(214,160,.9,A.sheep(u))+T(256,152,.95,A.sheep(u))+T(118,162,1,A.fire(u))+T(142,162,.9,A.figure(u,'#9B8661',{staff:1}))+T(290,158,.85,A.figure(u,'#7E906A',{staff:1})),
  actors:{burst:u=>A.glow(u,100),spk:u=>A.sparkles(u,10,46)},
  tl:[['burst',1.6,3.4,{x:226,y:44,o:0,s:.2},{x:226,y:44,o:1,s:1}],['spk',3,4.2,{x:226,y:46,o:0,s:.6},{x:226,y:46,o:1,s:1}],['spk',4.2,8,{x:226,y:46,o:1,s:1,r:0},{x:226,y:46,o:.8,s:1.25,r:40}]],
  caps:[[0,'Esa noche, unos pastores cuidan sus ovejas en el campo.'],[2.3,'De repente, la gloria del Señor los rodea de luz.'],[5.2,'«No tengan miedo. Les traigo buenas noticias que darán gran alegría a toda la gente.»']]}),
 nac_fB:u=>({sky:'night',dur:8,
  bg:A.stars(u)+A.hills(u,142,'#D2A577','#A5784C',16)+A.hills(u,160,'#B88954','#8C5F34',8,3),
  actors:{star:u=>A.star(u,5),car:u=>`<g>${T(0,0,1,A.camel(u,'#8E6440'))+T(-6,-30,.62,A.figure(u,'#7B5EA8',{crown:1}))}${T(-58,4,.9,A.camel(u,'#A1754B'))+T(-64,-23,.56,A.figure(u,'#C0574F',{crown:1}))}${T(-112,6,.82,A.camel(u,'#8E6440'))+T(-118,-19,.5,A.figure(u,'#3F8F7A',{crown:1}))}</g>`},
  tl:[['star',0,1.2,{x:60,y:40,o:0},{x:60,y:40,o:1}],['star',1.2,7.5,{x:60,y:40},{x:256,y:30}],['car',.4,7.8,{x:-20,y:158},{x:250,y:158}]],
  caps:[[0,'En el oriente, unos sabios estudian el cielo.'],[2.4,'Aparece una estrella nueva y deciden seguirla.'],[5.2,'Van a buscar al Rey que acaba de nacer.']]}),
 nac_n4:u=>({sky:'night',dur:8,
  bg:A.stars(u)+A.hills(u,134,'#4A5FA8','#2E3F86',20)+T(204,150,1.55,A.house(u)),
  actors:{star:u=>A.star(u,5),magi:u=>`<g>${T(0,0,.86,A.figure(u,'#7B5EA8',{crown:1}))}${T(-20,2,.8,A.figure(u,'#C0574F',{crown:1}))}${T(-40,0,.84,A.figure(u,'#3F8F7A',{crown:1}))}</g>`,gifts:u=>A.gifts(u)},
  tl:[['star',0,2.4,{x:110,y:18},{x:208,y:26}],['magi',.6,4.6,{x:20,y:166},{x:168,y:166}],['gifts',4.8,6.2,{x:244,y:168,o:0,s:.5},{x:244,y:168,o:1,s:1}]],
  caps:[[0,'La estrella se detiene sobre una casa de Belén.'],[2.6,'Los magos entran y se arrodillan ante el niño.'],[5.2,'Abren sus cofres y le ofrecen sus tesoros.']]}),
 hito1:u=>({sky:'gold',dur:7,
  bg:T(50,40,1,A.cloud(u,80))+T(270,30,1,A.cloud(u,60,.9))+T(80,150,1,A.cloud(u,140))+T(250,160,1,A.cloud(u,150))+T(160,175,1,A.cloud(u,220)),
  actors:{scroll:u=>A.scroll(u),spk:u=>A.sparkles(u,9,70)},
  tl:[['scroll',.4,2.2,{x:180,y:92,sx:.08,o:.4},{x:180,y:92,sx:1,o:1}],['spk',2,3.2,{x:180,y:92,o:0},{x:180,y:92,o:1}]],
  caps:[[0,'Hiciste un largo camino desde Nazaret.'],[2.4,'Todo lo que viviste queda escrito.'],[4.6,'Antes de seguir, repasá la historia.']]}),
 inf_n1:u=>({sky:'day',dur:8,
  bg:T(56,42,1,A.sun(u,14))+T(110,36,1,A.cloud(u,70))+T(270,48,1,A.cloud(u,56,.9))+A.hills(u,144,'#EAD3A6','#CDAE7C',18)+T(196,152,1.12,A.temple(u))+T(130,162,.85,A.figure(u,'#9B7650',{scarf:'#E8D6B8'}))+T(150,162,.8,A.figure(u,'#5E8FD6',{scarf:'#EEF4FF'})),
  actors:{doves:u=>`<g>${T(0,0,.42,A.dove(u))}${T(22,10,.36,A.dove(u))}</g>`,sim:u=>A.figure(u,'#ECE6D8',{staff:1,scarf:'#FFFFFF'})},
  tl:[['doves',.3,3.4,{x:-30,y:46},{x:150,y:128}],['sim',2.8,5.4,{x:330,y:164,s:.9},{x:232,y:164,s:.9}]],
  caps:[[0,'A los cuarenta días, José y María suben al templo.'],[2.6,'Llevan dos palomas como ofrenda, como pedía la Ley.'],[5.4,'Un anciano llamado Simeón se acerca lleno de alegría.']]}),
 inf_n2:u=>({sky:'night',dur:8,
  bg:A.stars(u)+T(254,42,1,A.moon(u))+A.hills(u,146,'#A8899E','#76607E',18)+A.hills(u,162,'#8E7090','#5E4B6E',8,4)+T(52,152,.9,A.palm(u)),
  actors:{fam:u=>fam(u)},
  tl:[['fam',.2,7.8,{x:330,y:164,s:.9},{x:120,y:164,s:.9}]],
  caps:[[0,'Un ángel le avisa a José en sueños: Herodes busca al niño.'],[2.8,'La familia sale de noche, sin esperar al amanecer.'],[5.4,'Cruzan el desierto rumbo al sur.']]}),
 inf_n3:u=>({sky:'day',dur:8,
  bg:T(240,34,1,A.cloud(u,70))+A.hills(u,124,'#BCD596','#8FAE66',22)+T(110,132,.85,A.house(u))+T(162,126,.75,A.house(u))+T(272,136,.9,A.house(u))+A.hills(u,158,'#A6C47E','#7E9E55',10,3)+T(220,166,1,A.bench(u)),
  actors:{sun:u=>A.sun(u,14),plank:u=>A.plank(u),spk:u=>A.sparkles(u,5,16)},
  tl:[['sun',0,7,{x:60,y:110},{x:60,y:38}],['plank',1,2,{x:210,y:152},{x:226,y:152}],['plank',2,3,{x:226,y:152},{x:210,y:152}],['plank',3,4,{x:210,y:152},{x:226,y:152}],['plank',4,5,{x:226,y:152},{x:214,y:152}],['spk',1,5,{x:232,y:148,o:0,s:.6},{x:232,y:148,o:1,s:1}]],
  caps:[[0,'Herodes murió y la familia vuelve a su tierra.'],[2.6,'Se establecen en un pueblo de Galilea.'],[5.2,'José trabaja la madera en su taller.']]}),
 inf_fA:u=>({sky:'dawn',dur:8,
  bg:T(70,40,1,A.cloud(u,64,.9))+A.hills(u,130,'#8DBA7C','#5E8F58',24)+A.hills(u,160,'#6FA463','#4B7F49',10,4),
  actors:{sun:u=>A.sun(u,22),tree:u=>A.tree(u),birds:u=>`<g>${T(0,0,.25,A.dove(u))}${T(26,8,.2,A.dove(u))}</g>`},
  tl:[['sun',0,6,{x:170,y:132},{x:170,y:60}],['tree',1,6,{x:226,y:158,s:.25},{x:226,y:158,s:1.25}],['birds',3,8,{x:-30,y:70},{x:340,y:40}]],
  caps:[[0,'Los años pasan entre el taller y las colinas.'],[2.8,'El niño de Nazaret va creciendo día a día.'],[5.4,'Lucas lo resume en una sola frase.']]}),
 inf_fB:u=>({sky:'dusk',dur:8,
  bg:T(70,40,1,A.cloud(u,64,.8))+A.hills(u,132,'#D9A9C4','#B07BA6',22)+`<path d="M-20 190 C80 160 160 150 230 128 L240 132 C180 156 120 170 140 190Z" fill="url(#${u}sa)"/>`,
  actors:{walls:u=>A.walls(u),car:u=>`<g>${T(0,0,.85,A.camel(u))}${T(-48,0,.9,A.tent(u,'#E8875A'))}${T(-80,0,.8,A.people(u,3))}</g>`},
  tl:[['walls',0,7.5,{x:250,y:122,s:.45},{x:250,y:122,s:.85}],['car',0,7.5,{x:20,y:170},{x:200,y:158}]],
  caps:[[0,'Cada año la familia sube a Jerusalén para la Pascua.'],[2.6,'Viajan en caravana con parientes y vecinos.'],[5.2,'Esta vez, el viaje va a ser distinto.']]}),
 inf_n4:u=>({sky:'temple',dur:8,
  bg:A.columns(u)+T(176,128,1,A.glow(u,80))+T(132,140,.78,A.figure(u,'#ECE6D8',{scarf:'#fff'}))+T(222,140,.78,A.figure(u,'#C9B79A',{scarf:'#F2E8D6'}))+T(252,142,.74,A.figure(u,'#9BA7C9',{scarf:'#E9EEF8'})),
  actors:{pres:u=>A.presence(u),fam:u=>`<g>${T(0,0,.9,A.figure(u,'#9B7650',{scarf:'#E8D6B8'}))}${T(20,0,.86,A.figure(u,'#5E8FD6',{scarf:'#EEF4FF'}))}</g>`},
  tl:[['pres',0,1.6,{x:176,y:142,o:0,s:.7},{x:176,y:142,o:1,s:.9}],['pres',1.6,8,{x:176,y:142,o:1,s:.9},{x:176,y:142,o:1,s:1}],['fam',3,6,{x:-30,y:170},{x:76,y:170}]],
  caps:[[0,'Tres días después, José y María llegan al templo.'],[2.6,'Lo encuentran sentado entre los maestros.'],[5.2,'Todos se asombran de lo que pregunta y responde.']]}),
 hito2:u=>({sky:'gold',dur:7,
  bg:T(60,46,1,A.cloud(u,80))+T(260,34,1,A.cloud(u,60,.9))+T(70,156,1,A.cloud(u,150))+T(260,160,1,A.cloud(u,150))+T(160,178,1,A.cloud(u,230)),
  actors:{scroll:u=>A.scroll(u),spk:u=>A.sparkles(u,9,70)},
  tl:[['scroll',.4,2.2,{x:180,y:92,sx:.08,o:.4},{x:180,y:92,sx:1,o:1}],['spk',2,3.2,{x:180,y:92,o:0},{x:180,y:92,o:1}]],
  caps:[[0,'Del templo a Egipto, y de Egipto a Nazaret.'],[2.4,'Cada paso quedó escrito.'],[4.6,'Repasá cómo sucedió.']]}),
 bau_n1:u=>({sky:'desert',dur:8,
  bg:T(244,48,1,A.sun(u,19))+A.hills(u,138,'#E9BE84','#C98F52',18)+A.hills(u,160,'#D8A46A','#B37A40',8,4)+T(70,160,1,A.rocks(u))+T(204,160,1,A.figure(u,'#A7804F',{scarf:'#C9A577'})),
  actors:{crowd:u=>A.people(u,4)},
  tl:[['crowd',1.6,6.4,{x:360,y:164,s:.8},{x:276,y:164,s:.8}]],
  caps:[[0,'En el desierto de Judea se escucha una voz.'],[2.6,'Juan llama a todos a volver a Dios.'],[5.2,'Viste ropa de pelo de camello y vive con muy poco.']]}),
 bau_n2:u=>({sky:'day',dur:8,
  bg:T(80,38,1,A.cloud(u,70))+T(260,50,1,A.cloud(u,54,.9))+A.hills(u,118,'#BFCB8C','#93A262',22)+A.river(u,138)+A.ground(u,160,'#C3D98E','#9FBF6C')+T(60,160,1,A.reeds(u))+T(276,162,1,A.reeds(u))+T(206,150,.85,A.figure(u,'#A7804F',{scarf:'#C9A577'})),
  actors:{w:u=>A.waves(u),crowd:u=>A.people(u,4)},
  tl:[['w',0,8,{x:-10,y:150},{x:30,y:150}],['crowd',1,6,{x:360,y:170,s:.82},{x:262,y:170,s:.82}]],
  caps:[[0,'Multitudes bajan desde Jerusalén y toda Judea.'],[2.6,'Llegan a la orilla del río para escuchar a Juan.'],[5.2,'Uno por uno, se bautizan confesando sus pecados.']]}),
 bau_n3:u=>({sky:'dusk',dur:8,
  bg:'',
  actors:{cam:u=>T(80,46,1,A.cloud(u,70,.85))+T(420,40,1,A.cloud(u,80,.85))+A.hills(u,126,'#C7A1C0','#9A7398',22)+T(320,0,1,A.hills(u,126,'#C7A1C0','#9A7398',26))+`<path d="M-20 140 Q300 130 660 142 V166 Q300 158 -20 166Z" fill="url(#${u}wa)"/><path d="M-20 166 Q300 158 660 166 V200 H-20Z" fill="#B9CF86"/>`+T(470,126,.95,A.walls(u))+T(560,140,1,A.palm(u))+T(380,146,.9,A.palm(u))+T(140,160,.85,A.figure(u,'#A7804F',{scarf:'#C9A577'}))},
  tl:[['cam',.5,7,{x:0,y:0},{x:-320,y:0}]],
  caps:[[0,'Juan bautiza junto al río, del otro lado.'],[2.6,'Muy cerca de la antigua ciudad de Jericó.'],[5.2,'Ese lugar se llama Betábara.']]}),
 bau_fA:u=>({sky:'dawn',dur:8,
  bg:T(80,40,1,A.cloud(u,64,.9))+A.hills(u,128,'#93B983','#6A955E',22)+A.river(u,152)+A.ground(u,170,'#A8C984','#86AD62')+T(110,166,.9,A.figure(u,'#A7804F',{scarf:'#C9A577'})),
  actors:{sun:u=>A.sun(u,22),lamb:u=>A.lamb(u)},
  tl:[['sun',0,6,{x:236,y:126},{x:236,y:70}],['lamb',1.6,3.6,{x:214,y:166,o:0,s:.6},{x:214,y:166,o:1,s:1}]],
  caps:[[0,'Juan ve que alguien se acerca por la orilla.'],[2.6,'Lo señala delante de todos.'],[5.2,'Y pronuncia una frase que nadie va a olvidar.']]}),
 bau_fB:u=>({sky:'day',dur:8,
  bg:T(70,40,1,A.cloud(u,70))+T(250,46,1,A.cloud(u,60,.9))+A.hills(u,116,'#BFCB8C','#93A262',22)+A.river(u,134)+T(190,152,.9,A.figure(u,'#A7804F',{scarf:'#C9A577'}))+`<path d="M150 146 Q190 140 230 146 L230 158 L150 158Z" fill="url(#${u}wa)" opacity=".85"/>`+A.ground(u,164,'#C3D98E','#9FBF6C'),
  actors:{pres:u=>A.presence(u),rip:u=>A.ripples(u)},
  tl:[['pres',.6,4.4,{x:340,y:156,o:0,s:.85},{x:236,y:156,o:1,s:.85}],['rip',4.4,6,{x:212,y:152,o:0,s:.6},{x:212,y:152,o:1,s:1}]],
  caps:[[0,'Jesús llega desde Galilea hasta el río.'],[2.6,'Le pide a Juan que lo bautice.'],[5.2,'Juan se sorprende y le responde.']]}),
 bau_n4:u=>({sky:'day',dur:8.5,
  bg:A.hills(u,126,'#B5CF8E','#89A964',22)+A.river(u,144)+A.ground(u,168,'#C3D98E','#9FBF6C')+T(190,156,1,A.presence(u)),
  actors:{cl:u=>A.cloud(u,120),cr:u=>A.cloud(u,120),rays:u=>A.rays(u),dove:u=>A.dove(u)},
  tl:[['cl',.4,2.4,{x:130,y:24},{x:20,y:24}],['cr',.4,2.4,{x:200,y:24},{x:310,y:24}],['rays',1.8,3.2,{x:190,y:0,o:0},{x:190,y:0,o:1}],['dove',2.8,5.4,{x:190,y:-30,s:.5},{x:190,y:84,s:.62}]],
  caps:[[0,'Jesús sale del agua.'],[2,'Los cielos se abren.'],[4,'El Espíritu de Dios desciende como una paloma.'],[6.2,'Y se escucha una voz desde el cielo.']]}),
 bau_n5:u=>({sky:'night',dur:8,
  bg:A.stars(u)+A.hills(u,140,'#A8899E','#76607E',16)+A.hills(u,160,'#8E7090','#5E4B6E',8,4)+T(96,164,1,A.rocks(u))+T(256,166,.9,A.rocks(u))+T(176,160,.85,A.presence(u)),
  actors:{moon:u=>A.moon(u)},
  tl:[['moon',0,8,{x:50,y:70},{x:270,y:36}]],
  caps:[[0,'El Espíritu lleva a Jesús al desierto.'],[2.8,'Cuarenta días y cuarenta noches de ayuno.'],[5.4,'Ahí empieza su camino.']]}),
 gal_n1:u=>({sky:'dusk',dur:8.5,
  bg:T(70,40,1,A.cloud(u,64,.85))+A.hills(u,124,'#D9A9C4','#B07BA6',22)+T(66,146,.8,A.house(u))+T(286,148,.85,A.house(u))+T(320,150,1,A.palm(u))+A.ground(u,162,'#E6C99A','#C9A877')+T(118,160,1,A.people(u,3))+T(236,158,.9,A.presence(u)),
  actors:{jars:u=>`<g>${[0,1,2,3,4,5].map(i=>`<g transform="translate(${i*17},0)"><path d="M-6 0 Q-9 -12 -5 -19 H5 Q9 -12 6 0Z" fill="#B8AFA2" stroke="#7E7568" stroke-width="1"/><rect x="-6" y="-21" width="12" height="3" rx="1" fill="#9C9286"/></g>`).join('')}</g>`,
   wine:u=>`<g>${[0,1,2,3,4,5].map(i=>`<ellipse cx="${i*17}" cy="-19" rx="5" ry="2" fill="#8E1E3A"/>`).join('')}</g>`,spk:u=>A.sparkles(u,8,44)},
  tl:[['jars',0,8.5,{x:132,y:174},{x:132,y:174}],['wine',4.2,5.6,{x:132,y:174,o:0},{x:132,y:174,o:1}],['spk',4.2,8.5,{x:174,y:150,o:0,s:.6},{x:174,y:150,o:1,s:1.1}]],
  caps:[[0,'En Caná de Galilea hay una fiesta de bodas.'],[2.6,'Se termina el vino y María le cuenta a Jesús.'],[5,'Las seis tinajas de agua se convierten en el mejor vino.']]}),
 gal_n2:u=>({sky:'temple',dur:8,
  bg:A.columns(u)+T(70,160,.9,A.people(u,2))+T(276,162,.9,A.people(u,2)),
  actors:{jesus:u=>A.presence(u),scroll:u=>A.scroll(u),spk:u=>A.sparkles(u,8,40)},
  tl:[['jesus',.2,2.4,{x:300,y:160,o:0},{x:180,y:160,o:1}],['jesus',2.4,8,{x:180,y:160},{x:180,y:160}],['scroll',2.6,4.2,{x:180,y:96,sx:.08,o:.4},{x:180,y:96,sx:1,o:1}],['spk',4.6,8,{x:180,y:96,o:0},{x:180,y:96,o:1}]],
  caps:[[0,'Jesús vuelve a Nazaret, el pueblo donde creció.'],[2.6,'En la sinagoga le dan el rollo del profeta Isaías.'],[5.2,'Lee que el Espíritu del Señor está sobre él.']]}),
 gal_n3:u=>({sky:'day',dur:8,
  bg:T(80,40,1,A.cloud(u,70))+T(270,48,1,A.cloud(u,56,.9))+A.hills(u,112,'#A9C98A','#7FA463',22)+`<path d="M-20 122 Q180 112 380 124 V170 H-20Z" fill="url(#${u}wa)"/>`+A.ground(u,170,'#E6D2A0','#C9B07A')+T(60,170,.8,A.house(u))+T(102,172,.7,A.house(u))+T(300,172,1,A.palm(u)),
  actors:{boat:u=>`<g><path d="M-30 0 Q0 14 30 0Z" fill="#7A5234"/><path d="M0 0 V-34" stroke="#5A3A22" stroke-width="2"/><path d="M1 -32 L22 -6 L1 -6Z" fill="#F3EBDD"/></g>`,w:u=>A.waves(u)},
  tl:[['w',0,8,{x:-10,y:136},{x:30,y:136}],['boat',0,8,{x:330,y:138,s:.8},{x:200,y:132,s:.8}]],
  caps:[[0,'Jesús deja Nazaret y se va a vivir a Capernaúm.'],[2.6,'Un pueblo de pescadores a la orilla del mar de Galilea.'],[5.2,'Desde ahí anuncia: el reino de Dios está cerca.']]}),
 gal_fA:u=>({sky:'dawn',dur:8.5,
  bg:A.hills(u,104,'#B8A7D8','#8F7EB6',20)+`<path d="M-20 112 Q180 104 380 114 V200 H-20Z" fill="url(#${u}wa)"/>`,
  actors:{boat:u=>`<g><path d="M-40 0 Q0 18 40 0Z" fill="#7A5234"/><path d="M0 0 V-42" stroke="#5A3A22" stroke-width="2.4"/><path d="M1 -40 L28 -8 L1 -8Z" fill="#F3EBDD"/></g>`,net:u=>`<g fill="none" stroke="#E8DCC0" stroke-width="1.2"><path d="M-30 0 Q0 40 30 0"/><path d="M-20 4 L-10 30 M0 6 L0 34 M20 4 L10 30 M-26 14 H26 M-18 26 H18"/></g>`,fish:u=>`<g>${[0,1,2,3,4,5,6].map(i=>`<ellipse cx="${(i%4)*12-18}" cy="${Math.floor(i/4)*9+12}" rx="6" ry="3" fill="#B8C8D0"/>`).join('')}</g>`,sun:u=>A.sun(u,18)},
  tl:[['sun',0,8.5,{x:290,y:110},{x:290,y:70}],['boat',0,8.5,{x:180,y:128},{x:186,y:130}],['net',2.4,3.6,{x:200,y:132,o:0},{x:200,y:132,o:1}],['fish',4.6,6,{x:200,y:132,o:0,s:.5},{x:200,y:132,o:1,s:1}]],
  caps:[[0,'Simón pescó toda la noche y no sacó nada.'],[2.6,'Jesús le dice: «Echen las redes en lo profundo».'],[5.2,'¡Las redes se llenan de tantos peces que empiezan a romperse!']]}),
 gal_fB:u=>({sky:'desert',dur:8,
  bg:T(250,46,1,A.sun(u,20))+A.hills(u,130,'#E9BE84','#C98F52',16)+A.ground(u,158,'#E6C99A','#C9A877')+`<g transform="translate(176,160)"><ellipse cx="0" cy="0" rx="26" ry="7" fill="#8C8374"/><rect x="-26" y="-16" width="52" height="16" fill="#9C9286"/><ellipse cx="0" cy="-16" rx="26" ry="7" fill="#B8AFA2"/><ellipse cx="0" cy="-16" rx="19" ry="4.5" fill="#3E6E8A"/></g>`+T(140,160,.9,A.presence(u)),
  actors:{wom:u=>A.figure(u,'#9A5A6A',{scarf:'#E8C9B0'}),drop:u=>A.glow(u,30)},
  tl:[['wom',.4,3.4,{x:360,y:162,s:.9},{x:220,y:160,s:.9}],['wom',3.4,8,{x:220,y:160,s:.9},{x:220,y:160,s:.9}],['drop',4.8,8,{x:176,y:140,o:0,s:.5},{x:176,y:140,o:1,s:1.2}]],
  caps:[[0,'En Samaria, junto al pozo de Jacob, Jesús descansa al mediodía.'],[2.6,'Una mujer llega a sacar agua y Jesús le habla.'],[5.2,'Le ofrece un agua que se convierte en vida eterna.']]}),
 gal_n4:u=>({sky:'gold',dur:8.5,
  bg:T(70,40,1,A.cloud(u,70,.9))+T(270,34,1,A.cloud(u,60,.85))+A.hills(u,104,'#B5CF8E','#89A964',34)+A.hills(u,150,'#A9C98A','#7FA463',14,3)+T(186,98,.75,A.presence(u)),
  actors:{crowd:u=>A.people(u,5),crowd2:u=>A.people(u,4),rays:u=>A.rays(u)},
  tl:[['crowd',.4,5,{x:-40,y:168,s:.8},{x:96,y:166,s:.8}],['crowd2',.8,5.4,{x:400,y:170,s:.8},{x:270,y:168,s:.8}],['rays',3.6,5.2,{x:186,y:20,o:0},{x:186,y:20,o:.8}]],
  caps:[[0,'Una gran multitud sigue a Jesús.'],[2.6,'Él sube a la ladera del monte y se sienta.'],[5.2,'Les enseña cómo es vivir en el reino de Dios.']]}),
 hito4:u=>({sky:'gold',dur:7,
  bg:T(60,46,1,A.cloud(u,80))+T(260,34,1,A.cloud(u,60,.9))+T(70,156,1,A.cloud(u,150))+T(260,160,1,A.cloud(u,150))+T(160,178,1,A.cloud(u,230)),
  actors:{scroll:u=>A.scroll(u),spk:u=>A.sparkles(u,9,70)},
  tl:[['scroll',.4,2.2,{x:180,y:92,sx:.08,o:.4},{x:180,y:92,sx:1,o:1}],['spk',2,3.2,{x:180,y:92,o:0},{x:180,y:92,o:1}]],
  caps:[[0,'De la boda de Caná al monte, pasando por el lago.'],[2.4,'Cada encuentro con Jesús cambió una vida.'],[4.6,'Repasá todo lo que viviste.']]}),
 mil_n1:u=>({sky:'night',dur:8.5,
  bg:`<path d="M-20 120 Q180 110 380 122 V200 H-20Z" fill="#2E4A6E"/>`,
  actors:{boat:u=>`<g><path d="M-44 0 Q0 18 44 0Z" fill="#6A4A2E"/><path d="M0 0 V-44" stroke="#4A3220" stroke-width="2.4"/><path d="M1 -42 L26 -8 L1 -8Z" fill="#D8D0C0"/>${T(-26,-4,.55,A.presence(u))}</g>`,w:u=>A.waves(u),bolt:u=>`<path d="M0 0 L-10 30 L4 30 L-8 64 L18 22 L4 22 L14 0Z" fill="#FFF6C8"/>`,calm:u=>A.glow(u,120,.6)},
  tl:[['w',0,5,{x:-10,y:118},{x:30,y:118}],['boat',0,5,{x:180,y:136,r:-8},{x:182,y:132,r:8}],['boat',5,8.5,{x:182,y:132,r:0},{x:182,y:132,r:0}],['bolt',1.2,1.6,{x:90,y:10,o:1},{x:90,y:10,o:0}],['bolt',2.6,3,{x:270,y:16,o:1},{x:270,y:16,o:0}],['calm',5.2,8.5,{x:180,y:90,o:0},{x:180,y:90,o:1}]],
  caps:[[0,'Una tormenta terrible sacude la barca.'],[2.6,'Los discípulos despiertan a Jesús, llenos de miedo.'],[5.2,'Jesús le habla al viento y a las olas, y todo queda en calma.']]}),
 mil_n2:u=>({sky:'day',dur:8,
  bg:T(70,40,1,A.cloud(u,64))+A.hills(u,128,'#BFCB8C','#93A262',16)+A.ground(u,160,'#E6D2A0','#C9B07A')+T(180,150,1.9,A.house(u))+T(70,164,1,A.people(u,4))+T(300,166,1,A.people(u,3)),
  actors:{mat:u=>`<g><rect x="-22" y="-5" width="44" height="10" rx="3" fill="#E8DDC6" stroke="#9C8A6A"/><path d="M-20 -5 V-60 M20 -5 V-60" stroke="#9C8A6A" stroke-width="1.4"/></g>`,friends:u=>A.people(u,4),spk:u=>A.sparkles(u,8,40)},
  tl:[['friends',.4,2.8,{x:360,y:166,s:.8},{x:240,y:120,s:.6}],['mat',3,6,{x:180,y:96,o:0},{x:180,y:132,o:1}],['spk',6,8,{x:180,y:120,o:0},{x:180,y:120,o:1}]],
  caps:[[0,'La casa está tan llena que no se puede entrar.'],[2.6,'Cuatro amigos suben al techo y abren un hueco.'],[5.2,'Bajan a su amigo en la camilla hasta Jesús.']]}),
 mil_n3:u=>({sky:'gold',dur:8.5,
  bg:A.hills(u,110,'#B5CF8E','#89A964',30)+A.hills(u,150,'#A9C98A','#7FA463',12,3)+T(180,124,.8,A.presence(u))+T(60,160,.9,A.people(u,5))+T(290,160,.9,A.people(u,5)),
  actors:{bread:u=>`<g>${[0,1,2,3,4].map(i=>`<ellipse cx="${i*12-24}" cy="0" rx="6" ry="3.6" fill="#D9A25A"/>`).join('')}${[0,1].map(i=>`<ellipse cx="${i*14-7}" cy="10" rx="7" ry="3" fill="#B8C8D0"/>`).join('')}</g>`,baskets:u=>`<g>${[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>`<path d="M${i*22-121} 0 h14 l-2 10 h-10z" fill="#B89A5E"/>`).join('')}</g>`},
  tl:[['bread',1.6,4,{x:180,y:142,o:0,s:.6},{x:180,y:142,o:1,s:1}],['baskets',5,8.5,{x:180,y:176,o:0},{x:180,y:176,o:1}]],
  caps:[[0,'Miles de personas siguieron a Jesús y se hizo tarde.'],[2.6,'Un muchachito comparte cinco panes y dos pescados.'],[5.2,'Comen todos, y sobran doce canastas llenas.']]}),
 mil_fA:u=>({sky:'dusk',dur:8,
  bg:A.hills(u,126,'#D9A9C4','#B07BA6',18)+A.ground(u,158,'#E6C99A','#C9A877')+T(250,156,.9,A.presence(u))+T(130,162,1,A.people(u,5)),
  actors:{wom:u=>A.figure(u,'#9A5A6A',{scarf:'#E8C9B0'}),glow:u=>A.glow(u,40)},
  tl:[['wom',.4,4.6,{x:40,y:168,s:.85},{x:226,y:160,s:.85}],['glow',4.6,8,{x:236,y:140,o:0,s:.5},{x:236,y:140,o:1,s:1.2}]],
  caps:[[0,'Una mujer enferma desde hace doce años se abre paso.'],[2.6,'Con fe, toca la ropa de Jesús.'],[5.2,'Jesús la mira y le dice que su fe la sanó.']]}),
 mil_fB:u=>({sky:'desert',dur:8,
  bg:T(250,46,1,A.sun(u,20))+A.hills(u,130,'#E9BE84','#C98F52',16)+A.ground(u,158,'#E6C99A','#C9A877')+T(470,126,.9,A.walls(u)),
  actors:{bart:u=>A.figure(u,'#7A6A5A',{scarf:'#C9B48A'}),jesus:u=>A.presence(u),light:u=>A.glow(u,60),crowd:u=>A.people(u,4)},
  tl:[['crowd',.4,4,{x:400,y:166,s:.8},{x:260,y:166,s:.8}],['jesus',.4,4,{x:360,y:160},{x:220,y:160}],['bart',0,8,{x:110,y:164,s:.9},{x:120,y:164,s:.9}],['light',4.8,8,{x:120,y:110,o:0,s:.4},{x:120,y:110,o:1,s:1}]],
  caps:[[0,'Bartimeo, un ciego, pide limosna junto al camino.'],[2.6,'Grita: «¡Jesús, Hijo de David, ten compasión de mí!».'],[5.2,'Jesús lo llama y le devuelve la vista.']]}),
 mil_n4:u=>({sky:'night',dur:8.5,
  bg:A.stars(u)+`<path d="M-20 122 Q180 114 380 124 V200 H-20Z" fill="#2E4A6E"/>`+`<g transform="translate(70,132)"><path d="M-40 0 Q0 16 40 0Z" fill="#6A4A2E"/><path d="M0 0 V-40" stroke="#4A3220" stroke-width="2.4"/></g>`,
  actors:{jesus:u=>A.presence(u),peter:u=>A.figure(u,'#6E8A9A',{}),moon:u=>A.moon(u)},
  tl:[['moon',0,8.5,{x:290,y:40},{x:300,y:30}],['jesus',0,4,{x:360,y:130},{x:240,y:126}],['jesus',4,8.5,{x:240,y:126},{x:240,y:126}],['peter',3,6.4,{x:90,y:128,s:.75},{x:190,y:128,s:.75}],['peter',6.4,8.5,{x:190,y:128,s:.75},{x:196,y:136,s:.75}]],
  caps:[[0,'De madrugada, Jesús camina sobre el agua hacia la barca.'],[2.6,'Pedro baja de la barca y camina hacia él.'],[5.4,'Cuando mira el viento se asusta… y Jesús le extiende la mano.']]}),
 hito5:u=>({sky:'gold',dur:7,
  bg:T(60,46,1,A.cloud(u,80))+T(260,34,1,A.cloud(u,60,.9))+T(70,156,1,A.cloud(u,150))+T(260,160,1,A.cloud(u,150))+T(160,178,1,A.cloud(u,230)),
  actors:{scroll:u=>A.scroll(u),spk:u=>A.sparkles(u,9,70)},
  tl:[['scroll',.4,2.2,{x:180,y:92,sx:.08,o:.4},{x:180,y:92,sx:1,o:1}],['spk',2,3.2,{x:180,y:92,o:0},{x:180,y:92,o:1}]],
  caps:[[0,'El mar, los enfermos, la multitud y las olas.'],[2.4,'Todo le obedece a Jesús.'],[4.6,'Repasá lo que viviste.']]})
};
const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
const DEF={x:0,y:0,s:1,sx:1,r:0,o:1};
function stateAt(segs,t){
  let last=null;
  for(const sg of segs){
    const f={...DEF,...(last||{}),...sg[3]},to={...f,...sg[4]};
    if(t<sg[1])return last||f;
    if(t<=sg[2]){const k=ease((t-sg[1])/Math.max(.001,sg[2]-sg[1]));const o={};for(const key in f)o[key]=f[key]+(to[key]-f[key])*k;return o;}
    last=to;
  }
  return last;
}
function mountVideo(box,key,avatar){
  const u='v'+(uid++),sc=SCENES[key](u),segs={};
  sc.tl.forEach(s=>(segs[s[0]]=segs[s[0]]||[]).push(s));
  segs.me=[['me',0,1.8,{x:-34,y:174,s:1.18},{x:46,y:174,s:1.18}]];
  const actors=Object.entries(sc.actors).map(([id,fn])=>`<g data-a="${id}">${fn(u)}</g>`).join('');
  box.innerHTML=`<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Escena animada">${defs(u)}${A.sky(u,sc.sky)}${sc.bg}${actors}<g data-a="me"><g class="me">${avatarSVG(avatar)}</g></g></svg><div class="cap"></div><div class="prog"></div><button class="vbtn">Saltar</button>`;
  const els={};box.querySelectorAll('[data-a]').forEach(g=>els[g.dataset.a]=g);
  const meg=box.querySelector('.me'),cap=box.querySelector('.cap'),prog=box.querySelector('.prog'),btn=box.querySelector('.vbtn');
  let t0=performance.now(),raf=0,ended=false,lastCap=-1;
  const apply=t=>{
    for(const id in els){const sg=segs[id];if(!sg)continue;const s=stateAt(sg,t);els[id].setAttribute('transform',`translate(${s.x},${s.y}) rotate(${s.r}) scale(${s.s*s.sx},${s.s})`);els[id].setAttribute('opacity',Math.max(0,Math.min(1,s.o)));}
    meg.classList.toggle('walking',t<1.8);meg.classList.toggle('idle',t>=1.8);
    let ci=-1;sc.caps.forEach((c,i)=>{if(t>=c[0])ci=i;});
    if(ci!==lastCap){const first=lastCap<0;lastCap=ci;cap.classList.add('fade');setTimeout(()=>{cap.textContent=ci>=0?sc.caps[ci][1]:'';cap.classList.remove('fade');},first?0:180);}
    prog.style.width=Math.min(100,t/sc.dur*100)+'%';
  };
  const finish=()=>{if(ended)return;ended=true;cancelAnimationFrame(raf);apply(sc.dur);btn.textContent='Ver de nuevo';};
  const loop=now=>{const t=(now-t0)/1000;if(t>=sc.dur){finish();return;}apply(t);raf=requestAnimationFrame(loop);};
  btn.onclick=()=>{if(ended){ended=false;btn.textContent='Saltar';lastCap=-1;t0=performance.now();raf=requestAnimationFrame(loop);}else finish();};
  if(reduce)finish();else raf=requestAnimationFrame(loop);
  return {stop(){cancelAnimationFrame(raf);}};
}

const RH=780,TOP=40,WIDTH=360;
const NODES={},ADJ={},EDGES=[];
function addEdge(a,b){EDGES.push([a,b]);(ADJ[a]=ADJ[a]||[]).push(b);(ADJ[b]=ADJ[b]||[]).push(a);}
NODES.start={id:'start',x:180,y:TOP+80,kind:'start',r:0,label:'Inicio'};
REGIONS.forEach((R,r)=>{
  const y0=TOP+r*RH;
  ORDER.forEach(k=>{const [x,y]=LOCAL[k],s=STORY[R.id][k];NODES[`${R.id}-${k}`]={id:`${R.id}-${k}`,x,y:y0+y,kind:'ch',r,k,label:s.place,...s};});
  NODES[`${R.id}-gate`]={id:`${R.id}-gate`,x:206,y:y0+RH,kind:'gate',r,label:REGIONS[r+1]?'Hacia '+REGIONS[r+1].name:'Fin de la prueba'};
  const prev=r===0?'start':`${REGIONS[r-1].id}-gate`,id=k=>`${R.id}-${k}`;
  addEdge(prev,id('n1'));addEdge(id('n1'),id('n2'));addEdge(id('n2'),id('n3'));
  addEdge(id('n3'),id('fA'));addEdge(id('n3'),id('fB'));addEdge(id('fA'),id('n4'));addEdge(id('fB'),id('n4'));
  addEdge(id('n4'),id('n5'));addEdge(id('n5'),id('gate'));
});
const WORLD_H=TOP+REGIONS.length*RH+320;
const edgeD=(a,b)=>{const P1=NODES[a],P2=NODES[b],my=(P1.y+P2.y)/2;return `M${P1.x} ${P1.y} C${P1.x} ${my} ${P2.x} ${my} ${P2.x} ${P2.y}`;};
const NICON={
 mc:'<circle r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle r="2.6" fill="currentColor"/>',
 who:'<path d="M-7 -5h14v8h-7l-4 4v-4h-3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
 order:'<path d="M-7 0h14" stroke="currentColor" stroke-width="2"/><circle cx="-5" r="2.4" fill="currentColor"/><circle r="2.4" fill="currentColor"/><circle cx="5" r="2.4" fill="currentColor"/>',
 verse:'<path d="M-6 -6h12v12h-12z M-3 -2h6 M-3 2h4" fill="none" stroke="currentColor" stroke-width="2"/>',
 map:'<path d="M0 7s5-5 5-9a5 5 0 0 0-10 0c0 4 5 9 5 9z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cy="-2" r="1.8" fill="currentColor"/>',
 done:'<path d="M-6 0l4 4 8-8" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
 gate:'<path d="M-7 8v-8a7 7 0 0 1 14 0v8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M-9 8h18" stroke="currentColor" stroke-width="2.4"/>',
 start:'<path d="M0 -9 Q1.2 -1.2 9 0 Q1.2 1.2 0 9 Q-1.2 1.2 -9 0 Q-1.2 -1.2 0 -9Z" fill="currentColor"/>'
};
const GICON={
 flood:'<rect x="-9" y="-9" width="8" height="8" fill="currentColor"/><rect x="1" y="-9" width="8" height="8" fill="currentColor" opacity=".5"/><rect x="-9" y="1" width="8" height="8" fill="currentColor" opacity=".5"/><rect x="1" y="1" width="8" height="8" fill="currentColor"/>',
 roof:'<path d="M-10 0 L0 -9 L10 0" stroke="currentColor" stroke-width="2.4" fill="none"/><rect x="-7" y="0" width="14" height="9" fill="none" stroke="currentColor" stroke-width="2"/><rect x="-2" y="-4" width="4" height="4" fill="currentColor"/>',
 count:'<ellipse cx="-4" cy="-3" rx="6" ry="3.6" fill="currentColor"/><ellipse cx="4" cy="5" rx="6" ry="3" fill="currentColor" opacity=".55"/>',
 trace:'<path d="M-9 8 C-4 -8 4 8 9 -8" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
 reveal:'<circle r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle r="3.4" fill="currentColor"/>',
 hop:'<path d="M-10 6 Q-5 -2 0 6 Q5 -2 10 6" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cy="-6" r="3" fill="currentColor"/>',
 sort:'<path d="M0 -9 V0 M0 0 L-8 8 M0 0 L8 8" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
 pour:'<path d="M-6 9 Q-9 0 -6 -6 H6 Q9 0 6 9Z" fill="currentColor"/><path d="M-1 -12 V-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 spell:'<rect x="-10" y="-7" width="8" height="10" rx="2" fill="currentColor"/><rect x="2" y="-4" width="8" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>',
 net:'<path d="M-9 -4 Q0 12 9 -4 M-6 0 L-2 8 M0 1 V9 M6 0 L2 8 M-8 3 H8" stroke="currentColor" stroke-width="1.8" fill="none"/>',
 row:'<path d="M-9 9 L9 -9 M9 9 L-9 -9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><ellipse rx="4" ry="7" fill="currentColor"/>',
 pipes:'<path d="M-10 -4 H0 V8 M0 -4 V-10" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
 lights:'<circle cx="-5" cy="-5" r="3.4" fill="currentColor"/><circle cx="5" cy="-5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="-5" cy="5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="5" cy="5" r="3.4" fill="currentColor"/>',
 match:'<circle cx="-7" cy="-5" r="2.6" fill="currentColor"/><circle cx="7" cy="5" r="2.6" fill="currentColor"/><path d="M-5 -4 L5 4" stroke="currentColor" stroke-width="2"/><circle cx="-7" cy="6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="-5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
 run:'<path d="M-8 6 L-2 -8 M2 -8 L8 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle r="2.2" fill="currentColor"/>',
 fly:'<path d="M-9 0 Q-4 -8 0 -1 Q4 -8 9 0 Q4 -2 0 6 Q-4 -2 -9 0Z" fill="currentColor"/>',
 cross:'<path d="M-9 4 Q-4 0 0 4 T9 4 M-9 -3 Q-4 -7 0 -3 T9 -3" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
 catch:'<path d="M-9 -2 h18 l-3 9 h-12z" fill="currentColor"/><circle cy="-7" r="3" fill="currentColor"/>',
 memo:'<rect x="-10" y="-8" width="9" height="13" rx="2" fill="currentColor"/><rect x="1" y="-5" width="9" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>',
 maze:'<path d="M-9 -9h18v18h-18zM-4 -9v9h8M4 4v5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>',
 simon:'<rect x="-9" y="-9" width="8" height="8" rx="2" fill="currentColor"/><rect x="1" y="-9" width="8" height="8" rx="2" fill="currentColor" opacity=".45"/><rect x="-9" y="1" width="8" height="8" rx="2" fill="currentColor" opacity=".45"/><rect x="1" y="1" width="8" height="8" rx="2" fill="currentColor"/>',
 verso:'<path d="M-9 -6h7M0 -6h9M-9 0h11M5 0h4M-9 6h5M-1 6h10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 herd:'<path d="M-10 9V-2h20V9" stroke="currentColor" stroke-width="2.2" fill="none"/><ellipse cx="0" cy="-6" rx="5" ry="3.5" fill="currentColor"/>',
 pop:'<circle cx="-5" cy="-4" r="4" fill="currentColor"/><circle cx="6" cy="2" r="4" fill="currentColor" opacity=".5"/><circle cx="-3" cy="7" r="3" fill="currentColor" opacity=".5"/>',
 swarm:'<path d="M0 -9l7 4v8l-7 4-7-4v-8Z" fill="currentColor"/><circle cx="9" cy="-8" r="2" fill="currentColor"/>',
 slide:'<rect x="-10" y="-10" width="9" height="9" rx="2" fill="currentColor"/><rect x="1" y="-10" width="9" height="9" rx="2" fill="currentColor"/><rect x="-10" y="1" width="9" height="9" rx="2" fill="currentColor"/>',
 balance:'<path d="M-10 6h20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M0 4l-5-12h10Z" fill="currentColor"/>',
 order:'<path d="M-9 -7h3M-3 -7h12M-9 0h3M-3 0h12M-9 7h3M-3 7h12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 words:'<path d="M-9 -9h18v18h-18z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M-6 -6l12 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
 stack:'<rect x="-8" y="4" width="16" height="5" rx="1.5" fill="currentColor"/><rect x="-6" y="-2" width="14" height="5" rx="1.5" fill="currentColor"/><rect x="-7" y="-8" width="13" height="5" rx="1.5" fill="currentColor"/>',
 diff:'<rect x="-10" y="-9" width="8" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="2" y="-9" width="8" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="0" r="2" fill="currentColor"/>',
 tf:'<path d="M-9 0l3 3 5-6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M3 -4l6 6M9 -4l-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 lantern:'<circle r="9" fill="currentColor" opacity=".25"/><circle r="4" fill="currentColor"/>',
 rhythm:'<path d="M-4 6V-8l10-2v13" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="-6" cy="6" r="3" fill="currentColor"/><circle cx="4" cy="4" r="3" fill="currentColor"/>',
 connect:'<path d="M-8 6L-2 -7 4 4 9 -6" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="-8" cy="6" r="2.4" fill="currentColor"/><circle cx="-2" cy="-7" r="2.4" fill="currentColor"/><circle cx="4" cy="4" r="2.4" fill="currentColor"/><circle cx="9" cy="-6" r="2.4" fill="currentColor"/>'
};
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const VIGN=[[4,262,176,'riv',1],[4,74,292,'house',1],[4,272,676,'palms',.8],[3,262,176,'house',1],[3,74,292,'riv',1],[3,272,676,'palms',.8],[0,258,170,'house',1],[0,74,292,'stable',.7],[0,272,676,'camels',.6],[1,262,178,'temple',.55],[1,76,290,'pyr',.7],[1,272,676,'tree',.8],[2,262,176,'palms',.8],[2,74,292,'riv',1],[2,272,676,'rocks',1]];
function vign(u,k){
  if(k==='house')return T(-14,0,.9,A.house(u))+T(16,2,.7,A.house(u));
  if(k==='stable')return T(0,0,.9,A.stable(u))+T(0,-62,1,A.star(u,3));
  if(k==='camels')return T(0,0,.9,A.camel(u))+T(-40,4,.75,A.camel(u,'#A1754B'));
  if(k==='temple')return A.temple(u);
  if(k==='pyr')return `<g><path d="M-36 0 L0 -40 L36 0Z" fill="#E7B66E"/><path d="M0 -40 L36 0 L8 0Z" fill="#C9944B"/><path d="M14 0 L36 -24 L58 0Z" fill="#E7B66E" opacity=".85"/></g>`;
  if(k==='tree')return T(0,0,1,A.tree(u))+T(30,2,.7,A.tree(u));
  if(k==='palms')return T(-12,0,.9,A.palm(u))+T(18,2,.7,A.palm(u));
  if(k==='riv')return `<g><path d="M-48 -6 Q0 -16 48 -6 Q0 2 -48 -6Z" fill="url(#${u}wa)"/>${T(-30,-4,.7,A.reeds(u))}${T(34,-4,.6,A.reeds(u))}</g>`;
  if(k==='rocks')return T(0,0,1,A.rocks(u))+T(-6,-46,1,A.moon(u));
  return '';
}
let worldFor=undefined;
function leafy(R,x,y,s,dir){let o='';for(let i=0;i<9;i++){const a=(R()*120-60)+(dir<0?180:0),l=s*(.35+R()*.45),cx=x+Math.cos(a*Math.PI/180)*l*.6,cy=y+Math.sin(a*Math.PI/180)*l*.6;o+=`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(l*.2).toFixed(1)}" ry="${(l*.55).toFixed(1)}" transform="rotate(${(a+90).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${R()<.3?'#1C2B1A':'#101A0F'}"/>`;}return o;}
function buildWorld(){
  const w=$('#world'),u='w',R=rng(11),HX=branch==='ados';worldFor=branch;
  w.setAttribute('viewBox',`0 0 ${WIDTH} ${WORLD_H}`);
  let h=defs(u)+`<defs><linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1">${HX?'<stop offset="0" stop-color="#0B110C"/><stop offset=".08" stop-color="#22190E"/><stop offset=".3" stop-color="#0F1A12"/><stop offset=".55" stop-color="#132016"/><stop offset=".8" stop-color="#1E1A10"/><stop offset="1" stop-color="#0B0907"/>':'<stop offset="0" stop-color="#B8D6FF"/><stop offset=".08" stop-color="#FFE3D6"/><stop offset=".3" stop-color="#D7E8FF"/><stop offset=".55" stop-color="#C2DFFF"/><stop offset=".8" stop-color="#FFEBC8"/><stop offset="1" stop-color="#FFF8EC"/>'}</linearGradient>
   <linearGradient id="trailG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFCF5C"/><stop offset="1" stop-color="#E9A52C"/></linearGradient>
   <linearGradient id="goldG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD873"/><stop offset="1" stop-color="#E9A52C"/></linearGradient>
   <filter id="nshadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#22407F" flood-opacity=".22"/></filter>
   <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter></defs><rect width="${WIDTH}" height="${WORLD_H}" fill="url(#wsky)"/>`;
  let far='';for(let i=0;i<46;i++){const x=R()*WIDTH,y=R()*WORLD_H,s=60+R()*120;far+=T(x,y,1,A.cloud(u,s,.55+R()*.35));}
  h+=`<g filter="url(#soft)" opacity="${HX?'.1':'.85'}">${far}</g>`;
  if(HX){let ff='';for(let i=0;i<70;i++){const x=R()*WIDTH,y=R()*WORLD_H;ff+=`<circle class="ff" style="animation-delay:${(-R()*4).toFixed(2)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1+R()*1.4).toFixed(1)}"/>`;}h+=`<g fill="#FFD27A">${ff}</g>`;}
  VIGN.forEach(([r,x,y,k,s])=>{const Y=TOP+r*RH+y;h+=(HX?`<g opacity=".16">${T(x,Y+18,1,A.cloud(u,110,.95))}</g>`:T(x,Y+18,1,A.cloud(u,110,.95)))+T(x,Y+8,s,vign(u,k));});
  REGIONS.forEach((Rg,r)=>{const y0=TOP+r*RH;h+=`<g transform="translate(20,${y0+(r?60:6)})"><text font-family="Nunito,sans-serif" font-weight="900" font-size="10.5" letter-spacing="2.4" fill="#E9A52C">ETAPA ${r+1}</text><text y="30" font-family="${HX?'Cinzel,serif':'Fraunces,serif'}" font-weight="700" font-size="28" fill="${HX?'#F1D7A2':'#22407F'}">${Rg.name}</text></g>`;});
  EDGES.forEach(([a,b])=>{const d=edgeD(a,b);h+=`<path class="trail-glow" d="${d}"/><path class="trail" id="e_${a}__${b}" d="${d}"/>`;});
  let near='';for(let i=0;i<18;i++){const x=(i%2?WIDTH-10:10)+(R()-.5)*30,y=R()*WORLD_H,s=70+R()*70;near+=T(x,y,1,A.cloud(u,s,.95));}
  h+=HX?`<g opacity=".1">${near}</g>`:near;
  if(HX){const ty=REGIONS.map((_,r)=>TOP+r*RH+(r?60:6));let lf='';for(let i=0;i<26;i++){const left=i%2===0,x=left?R()*24:WIDTH-R()*24,y=R()*WORLD_H,sz=60+R()*60;if(left&&ty.some(t=>y>t-130&&y<t+170))continue;lf+=leafy(R,x,y,sz,left?1:-1);}h+=lf;}
  const fy=TOP+REGIONS.length*RH+40;
  h+=(HX?'<g opacity=".14">':'')+T(90,fy+10,1,A.cloud(u,200))+T(270,fy+30,1,A.cloud(u,220))+T(180,fy+70,1,A.cloud(u,300))+(HX?'</g>':'')+`<g transform="translate(180,${fy+120})" text-anchor="middle"><text font-family="Nunito,sans-serif" font-weight="900" font-size="11" letter-spacing="2.4" fill="#E9A52C">PRÓXIMAMENTE</text>${SOON.map((s,i)=>`<text y="${30+i*22}" font-family="${HX?'Cinzel,serif':'Fraunces,serif'}" font-weight="600" font-size="17" fill="${HX?'#CFC3AF':'#22407F'}" opacity="${.85-i*.08}">${s}</text>`).join('')}</g>`;
  Object.values(NODES).forEach(n=>{
    const ic=n.kind==='ch'?n.ch.t:n.kind,lw=Math.max(44,n.label.length*5.9+16);
    h+=`<g class="node" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(n.label)}" transform="translate(${n.x},${n.y})"><circle class="halo" r="23"/><circle class="base" r="${n.kind==='gate'?25:21}"/><g class="ico" data-ic="${ic}">${NICON[ic]}</g><g class="lbl" transform="translate(0,${n.kind==='gate'?40:36})"><rect x="${-lw/2}" y="-9" width="${lw}" height="17" rx="8.5"/><text y="3.5">${esc(n.label)}</text></g>${n.fork?`<text class="bonus" y="-30">BIFURCACIÓN</text>`:''}</g>`;
  });
  h+=`<g id="avWrap"><g class="tag" transform="translate(0,-66)"><rect id="tagBg" x="-30" y="-9" width="60" height="15" rx="7.5"/><text id="tagTx" y="1.8"></text></g><g id="avBody" transform="scale(.84)"></g></g>`;
  w.innerHTML=h;
  w.querySelectorAll('.node').forEach(g=>{g.onclick=()=>tapNode(g.dataset.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tapNode(g.dataset.id);}};});
}

const isDone=id=>{const p=P();return id in p.done;};
const visited=id=>{const n=NODES[id];return n.kind==='ch'?isDone(id):P().visited.includes(id);};
const reachable=id=>visited(id)||id===P().pos||(ADJ[id]||[]).some(visited);
function regionReq(r){const R=REGIONS[r].id,ids=k=>`${R}-${k}`;const main=['n1','n2','n3','n4','n5'].filter(k=>isDone(ids(k))).length,forks=['fA','fB'].filter(k=>isDone(ids(k))).length;return {done:main+Math.min(1,forks),total:6};}
const curRegion=()=>{const n=NODES[P().pos];return n.kind==='start'?0:n.r;};
const LV_T=['Peregrino','Caminante','Aprendiz','Discípulo','Servidor','Mensajero','Testigo','Sembrador','Pescador de personas','Embajador','Atalaya','Pionero'];
const lvOf=t=>Math.max(1,Math.floor((1+Math.sqrt(1+4*t/60))/2)),lvNeed=n=>60*n*(n-1);
function lvUp(n){const d=document.createElement('div');d.className='lvup';d.innerHTML=`<div><small>¡Subiste de nivel!</small><b>${n}</b><span>${LV_T[Math.min(n-1,LV_T.length-1)]}</span></div>`;document.body.appendChild(d);setTimeout(()=>d.classList.add('out'),2600);setTimeout(()=>d.remove(),3300);}
function refreshHud(){
  const p=P(),r=curRegion(),q=regionReq(r);
  {const T=total(p),n=lvOf(T),a=lvNeed(n),b=lvNeed(n+1),el=$('#hudLv');el.style.setProperty('--xp',Math.round((T-a)/(b-a)*100));$('#lvN').textContent=n;$('#hudName').textContent=`Nivel ${n}`;$('#lvT').textContent=LV_T[Math.min(n-1,LV_T.length-1)];el.title=`Nivel ${n}: ${T-a} de ${b-a} puntos para el próximo`;if(p.lvSeen&&n>p.lvSeen)lvUp(n);if(p.lvSeen!==n){p.lvSeen=n;save();}}
  $('#hudStage').textContent=`Etapa ${r+1} de 10`;hudPhoto();
  $('#barFill').style.width=(q.done/q.total*100)+'%';$('#count').textContent=`${q.done}/${q.total}`;
  $('#score').textContent=fmt(total(p));$('#streakN').textContent=p.streak;
  const m=mult(p.streak);$('#mult').textContent=m>1?'×'+m:'';$('#streak').classList.toggle('hot',p.streak>=3);
}
function refreshMap(){
  const p=P();
  Object.values(NODES).forEach(n=>{
    const g=document.querySelector(`.node[data-id="${n.id}"]`),done=n.kind==='ch'&&isDone(n.id),ok=done&&p.done[n.id],reach=reachable(n.id);
    g.classList.toggle('ok',(done&&ok)||(n.kind!=='ch'&&visited(n.id)));g.classList.toggle('bad',done&&!ok);
    g.classList.toggle('locked',!reach);g.classList.toggle('next',reach&&!visited(n.id));
    const ic=g.querySelector('.ico'),want=done?'done':(n.kind==='ch'?n.ch.t:n.kind);
    if(ic.dataset.ic!==want){ic.dataset.ic=want;ic.innerHTML=NICON[want];}
  });
  EDGES.forEach(([a,b])=>{const e=document.getElementById(`e_${a}__${b}`);e.classList.toggle('done',visited(a)&&visited(b));e.classList.toggle('open',(visited(a)||visited(b))&&reachable(a)&&reachable(b));});
  refreshHud();
}
function placeAv(x,y){$('#avWrap').setAttribute('transform',`translate(${x},${y-6})`);}
function camTo(x,y,smooth){const rc=$('#world').getBoundingClientRect(),sc=rc.width/WIDTH;scrollTo({top:Math.max(0,scrollY+rc.top+y*sc-innerHeight*.52),behavior:smooth&&!reduce?'smooth':'auto'});}
function bfs(from,to){
  const prev={[from]:null},q=[from];
  while(q.length){const c=q.shift();if(c===to)break;for(const n of ADJ[c]||[]){if(n in prev)continue;if(n!==to&&!visited(n))continue;prev[n]=c;q.push(n);}}
  if(!(to in prev))return null;const path=[];for(let c=to;c!=null;c=prev[c])path.unshift(c);return path;
}
let walking=false;
function walkEdge(a,b){
  return new Promise(res=>{
    let el=document.getElementById(`e_${a}__${b}`),rev=false;if(!el){el=document.getElementById(`e_${b}__${a}`);rev=true;}
    const L=el.getTotalLength(),dur=reduce?60:Math.max(480,L/150*1000),t0=performance.now();
    const step=now=>{const k=Math.min(1,(now-t0)/dur),e=ease(k),pt=el.getPointAtLength(L*(rev?1-e:e));placeAv(pt.x,pt.y);camTo(pt.x,pt.y,false);if(k<1)requestAnimationFrame(step);else res();};
    requestAnimationFrame(step);
  });
}
async function tapNode(id){
  if(walking)return;const p=P();
  if(id===p.pos){arrive(id);return;}
  if(!reachable(id)){toast('Esa parada todavía está cerrada. Seguí el camino que brilla.');return;}
  const path=bfs(p.pos,id);if(!path)return;
  walking=true;const g=$('#avBody').firstElementChild;g.classList.add('walking');g.classList.remove('idle');
  for(let i=0;i<path.length-1;i++)await walkEdge(path[i],path[i+1]);
  g.classList.remove('walking');g.classList.add('idle');walking=false;
  p.pos=id;save();arrive(id);
}
function arrive(id){
  const n=NODES[id],p=P();
  if(n.kind==='ch'){setTimeout(()=>openStop(n),160);return;}
  if(!p.visited.includes(id)){p.visited.push(id);save();}
  if(n.kind==='gate'&&!REGIONS[n.r+1]){const m=p.missions||{},rd=['leer23','leer1'].filter(k=>m[k]).length,ph=['fotopastores','fotofelipe'].filter(k=>m[k]).length;if(rd<2||ph<2){const f=[];if(rd<2)f.push(`${2-rd} ${2-rd>1?'lecturas':'lectura'} en voz alta`);if(ph<2)f.push(`${2-ph} ${2-ph>1?'testimonios':'testimonio'}`);toast('Para terminar el recorrido te falta: '+f.join(' y ')+'. Buscá en el mapa a los personajes con «!».');refreshMap();return;}}
  if(n.kind==='gate'){const R=REGIONS[n.r].id;p.regions[R]=p.regions[R]||{};if(!p.regions[R].complete){if((p.exams||{})[R]&&p.exams[R].passed)finishRegion(n.r);else openExam(n.r,()=>finishRegion(n.r));return;}}
  refreshMap();
}

let active=null,locked=false,video=null;
function gameCard(n){
  const best=P().games[n.id]||0;
  return `<div class="gamecard glass"><div class="top"><span class="gico" style="color:#22407F"><svg width="26" height="26" viewBox="-12 -12 24 24" aria-hidden="true">${GICON[n.game.type]}</svg></span><div class="gt"><span>Minijuego</span><b>${esc(n.game.title)}</b></div><div class="best">Mejor marca<b>${fmt(best)}</b></div></div><span>${esc(n.game.how)}</span></div>`;
}
function flowButtons(n){
  return isDone(n.id)?`<div class="actions two"><button class="primary" id="play">Jugar de nuevo</button><button class="ghost" id="back">Volver al mapa</button></div>`:`<div class="actions"><button class="primary" id="play">Jugar</button></div>`;
}
function wireFlow(n){$('#play').onclick=()=>startArcade(n,()=>afterGame(n));const b=$('#back');if(b)b.onclick=closeStop;}
function openStop(n){
  active=n;locked=false;const p=P();
  const el=$('#stop');el.hidden=false;document.body.style.overflow='hidden';
  el.innerHTML=`<div class="sheet-in"><div class="video" id="video"></div><div class="sheet-body"><span class="kicker">Etapa ${n.r+1} · ${esc(n.place)}</span><h2>${esc(n.title)}</h2><p class="story">${esc(n.text.replace('{name}',p.name))}</p><div id="flow">${gameCard(n)}${flowButtons(n)}</div></div></div>`;
  el.scrollTop=0;
  video=mountVideo($('#video'),n.scene,p.avatar);
  const x=document.createElement('button');x.className='close';x.setAttribute('aria-label','Volver al mapa');x.innerHTML='<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="#22407F" stroke-width="2.6" stroke-linecap="round"/></svg>';x.onclick=closeStop;$('#video').appendChild(x);
  wireFlow(n);
}
function afterGame(n){
  const flow=$('#flow');if(!flow)return;
  if(isDone(n.id)){flow.innerHTML=gameCard(n)+flowButtons(n);wireFlow(n);return;}
  flow.innerHTML=`<div id="chal"></div>`;
  ({mc:renderMC,who:renderMC,order:renderOrder,verse:renderVerse,map:renderMap})[n.ch.t](n.ch,$('#chal'));
  setTimeout(()=>$('#chal').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}),80);
}
function closeStop(){if(video)video.stop();video=null;const el=$('#stop');el.hidden=true;el.innerHTML='';document.body.style.overflow='';active=null;refreshMap();}

const KIND={mc:'Opción múltiple',who:'¿Quién lo dijo?',order:'Línea de tiempo',verse:'Completá el versículo',map:'Mapa'};
const kindLabel=t=>`<span class="kicker kind"><svg viewBox="-9 -9 18 18" aria-hidden="true" style="color:#E9A52C">${NICON[t]}</svg>Desafío · ${KIND[t]}</span>`;
function renderMC(c,el){
  const opts=shuffle(c.options.slice()),head=c.t==='who'?`<div class="quote">${esc(c.quote)}</div>`:`<h3>${esc(c.q)}</h3>`;
  el.innerHTML=`<div class="card">${kindLabel(c.t)}${head}<div class="opts">${opts.map((o,k)=>`<button class="opt" data-v="${esc(o)}"><span class="k">${'ABCD'[k]}</span><span>${esc(o)}</span></button>`).join('')}</div></div>`;
  el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(locked)return;locked=true;const ok=b.dataset.v===c.answer;el.querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(x.dataset.v===c.answer)x.classList.add('correct');});if(!ok)b.classList.add('wrong');resolve(ok,`<p>Respuesta: <span class="answer">${esc(c.answer)}</span></p>`);});
}
function renderOrder(c,el){
  const items=shuffle(c.items.map((t,i)=>({t,i})));let picked=[];
  el.innerHTML=`<div class="card order">${kindLabel('order')}<h3>${esc(c.q)}</h3><p class="hint">Tocá los hechos del primero al último. Tocá uno marcado para corregir.</p><div class="opts">${items.map(it=>`<button class="opt" data-i="${it.i}"><span class="k"></span><span>${esc(it.t)}</span></button>`).join('')}</div><button class="primary" id="check" disabled>Comprobar</button></div>`;
  const btns=[...el.querySelectorAll('.opt')];
  const paint=()=>{btns.forEach(b=>{const p=picked.indexOf(+b.dataset.i);b.classList.toggle('picked',p>=0);b.querySelector('.k').textContent=p>=0?p+1:'';});$('#check').disabled=picked.length!==c.items.length;};
  btns.forEach(b=>b.onclick=()=>{if(locked)return;const i=+b.dataset.i,p=picked.indexOf(i);if(p>=0)picked=picked.slice(0,p);else picked.push(i);paint();});
  $('#check').onclick=()=>{if(locked)return;locked=true;const ok=picked.every((v,k)=>v===k);btns.forEach(b=>{b.disabled=true;const i=+b.dataset.i;b.classList.remove('picked');b.classList.add(picked.indexOf(i)===i?'correct':'wrong');});$('#check').hidden=true;resolve(ok,ok?'':`<p>El orden correcto:</p><ol class="ordered">${c.items.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`);};
}
function renderVerse(c,el){
  const fill=c.blanks.map(()=>null);
  el.innerHTML=`<div class="card">${kindLabel('verse')}<h3>Elegí las palabras que faltan</h3><div class="verse" id="vtext"></div><div class="bank" id="bank"></div><button class="primary" id="check" disabled>Comprobar</button></div>`;
  const draw=()=>{
    $('#vtext').innerHTML=c.parts.map(p=>typeof p==='number'?`<button class="blank ${fill[p]!=null?'filled':''}" data-b="${p}">${fill[p]!=null?esc(c.bank[fill[p]]):'&nbsp;'}</button>`:esc(p)).join('');
    $('#bank').innerHTML=c.bank.map((w,k)=>`<button class="chip ${fill.includes(k)?'used':''}" data-k="${k}" ${fill.includes(k)?'disabled':''}>${esc(w)}</button>`).join('');
    $('#check').disabled=fill.includes(null);
    $('#vtext').querySelectorAll('.blank').forEach(x=>x.onclick=()=>{if(locked)return;fill[+x.dataset.b]=null;draw();});
    $('#bank').querySelectorAll('.chip').forEach(x=>x.onclick=()=>{if(locked)return;const e=fill.indexOf(null);if(e<0)return;fill[e]=+x.dataset.k;draw();});
  };
  draw();
  $('#check').onclick=()=>{if(locked)return;locked=true;const ok=fill.every((k,i)=>c.bank[k]===c.blanks[i]);$('#vtext').querySelectorAll('.blank').forEach(x=>{const i=+x.dataset.b;x.disabled=true;x.classList.add(c.bank[fill[i]]===c.blanks[i]?'correct':'wrong');});$('#bank').querySelectorAll('.chip').forEach(x=>x.disabled=true);$('#check').hidden=true;if(ok){const p=P();if(!p.verses.includes(active.id))p.verses.push(active.id);}resolve(ok,`<p>“${c.parts.map(p=>typeof p==='number'?`<b class="answer">${esc(c.blanks[p])}</b>`:esc(p)).join('')}”</p>`);};
}
function renderMap(c,el){
  const land='M150,0 L300,0 L300,400 L0,400 L0,352 L8,340 L37,304 L60,262 L87,211 L104,160 L120,104 L117,94 L128,72 L146,28 Z';
  const dots=MAP_PLACES.map(p=>`<g class="dot" data-id="${p.id}" tabindex="0" role="button" aria-label="Lugar en el mapa"><circle class="hit" cx="${p.x}" cy="${p.y}" r="14"/><circle class="ring" cx="${p.x}" cy="${p.y}" r="6"/><text x="${p.x+p.lx}" y="${p.y+p.ly}">${p.name}</text></g>`).join('');
  el.innerHTML=`<div class="card">${kindLabel('map')}<h3>${esc(c.q)}</h3><div class="mapbox"><svg viewBox="0 0 300 400" id="qmap" role="img" aria-label="Mapa de la tierra de Israel en tiempos de Jesús">
    <defs><linearGradient id="qland" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4E7C8"/><stop offset="1" stop-color="#E5CF9F"/></linearGradient></defs>
    <rect width="300" height="400" fill="#9FCBF2"/><path d="${land}" fill="url(#qland)" stroke="#fff" stroke-width="2"/>
    <path d="M211,109 C204,130 216,150 208,170 S214,210 205,228 S199,250 198,262" fill="none" stroke="#6FAFE6" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="210" cy="94" rx="9" ry="15" fill="#6FAFE6"/><ellipse cx="197" cy="312" rx="9" ry="50" fill="#6FAFE6"/>
    <g font-family="Nunito,sans-serif" font-weight="900" letter-spacing="2" fill="#8C7650" opacity=".8">
      <text x="148" y="150" font-size="10">GALILEA</text><text x="138" y="200" font-size="10">SAMARIA</text><text x="118" y="336" font-size="10">JUDEA</text>
      <text x="34" y="170" font-size="9" fill="#fff" transform="rotate(-62 34 170)">MAR MEDITERRÁNEO</text><text x="224" y="300" font-size="8" fill="#3F7FC2" transform="rotate(90 224 300)">MAR MUERTO</text>
      <text x="224" y="74" font-size="8" fill="#3F7FC2">MAR DE GALILEA</text><text x="221" y="168" font-size="8" fill="#3F7FC2" transform="rotate(80 221 168)">JORDÁN</text>
    </g>${dots}</svg></div><p class="hint">Cada punto es un lugar de los evangelios. Elegí uno.</p></div>`;
  el.querySelectorAll('.dot').forEach(d=>{const act=()=>{if(locked)return;locked=true;const ok=d.dataset.id===c.target;$('#qmap').classList.add('revealed');el.querySelector(`.dot[data-id="${c.target}"]`).classList.add('correct');if(!ok)d.classList.add('wrong');if(ok){const p=P();if(!p.maps.includes(active.id))p.maps.push(active.id);}const t=MAP_PLACES.find(p=>p.id===c.target);resolve(ok,ok?'':`<p>El lugar marcado en verde es <span class="answer">${esc(t.name)}</span>.</p>`);};d.onclick=act;d.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}};});
}
let pendingMedals=[];
function resolve(ok,extra){
  const n=active,c=n.ch,p=P(),R=REGIONS[n.r].id;let pts=0;p.regions[R]=p.regions[R]||{};
  if(ok){p.streak++;p.best=Math.max(p.best,p.streak);pts=Math.round(100*mult(p.streak));p.trivia+=pts;p.regions[R].trivia=(p.regions[R].trivia||0)+pts;award('primer');if(p.streak>=5)award('racha5');}else p.streak=0;
  p.done[n.id]=ok;
  if(isDone(`${R}-fA`)&&isDone(`${R}-fB`))award('explorador');
  if(p.maps.length>=3)award('cartografo');if(p.verses.length>=3)award('memoria');
  save();
  const fb=document.createElement('div');fb.className='feedback';
  fb.innerHTML=`<div class="res ${ok?'ok':'bad'}"><span class="badge">${ok?'<svg width="22" height="22" viewBox="0 0 22 22"><path d="M5 11.5l4 4 8-9" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>':'<svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 4v7M10 15v.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'}</span><h3>${ok?(p.streak>=3?`¡Racha de ${p.streak}!`:'¡Correcto!'):'Casi'}</h3>${ok?`<span class="pts" id="ptsBadge">+${pts}</span>`:''}</div>${extra}<p>${esc(c.exp)}</p><span class="ref"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 2h4a1 1 0 0 1 1 1v8a1 1 0 0 0-1-1H1zM11 2H7a1 1 0 0 0-1 1v8a1 1 0 0 1 1-1h4z" fill="currentColor"/></svg>${esc(c.ref)}</span><button class="primary" id="cont">Seguir el camino</button>`;
  $('#chal').appendChild(fb);
  setTimeout(()=>{fb.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});if(ok)setTimeout(()=>{const b=$('#ptsBadge');if(!b)return;const r=b.getBoundingClientRect();sparks(r.left+r.width/2,r.top+r.height/2,30);floatText('+'+pts,r.left,r.top-6);},350);},120);
  $('#cont').onclick=()=>{closeStop();if(n.k==='n3')toast('El camino se bifurca. Elegí por dónde seguir.');else if(n.k==='n5')toast('¡Se abrió la puerta de la etapa!');};
}
function award(id){const p=P();if(p.medals.includes(id))return;p.medals.push(id);pendingMedals.push(id);save();const m=MEDALS.find(x=>x.id===id);toast('Medalla nueva: '+m.name,m);}

/* ===== MINIJUEGOS ===== */
const GW=360,GH=520;
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function skyBg(c,th,t){const g=c.createLinearGradient(0,0,0,GH);g.addColorStop(0,th.sky[0]);g.addColorStop(1,th.sky[1]);c.fillStyle=g;c.fillRect(0,0,GW,GH);if(th.night){c.fillStyle='#fff';for(let i=0;i<30;i++){const x=(i*97)%GW,y=(i*53)%260;c.globalAlpha=.3+.5*(.5+.5*Math.sin(t*2+i));c.fillRect(x,y,1.6,1.6);}c.globalAlpha=1;}}
function puff(c,x,y,w,col){c.fillStyle=col||'#fff';c.beginPath();c.ellipse(x,y+w*.1,w*.5,w*.2,0,0,7);c.fill();c.beginPath();c.arc(x-w*.22,y,w*.22,0,7);c.fill();c.beginPath();c.arc(x+w*.04,y-w*.1,w*.3,0,7);c.fill();c.beginPath();c.arc(x+w*.28,y+.02*w,w*.2,0,7);c.fill();}
function glowC(c,x,y,r,col='255,236,170'){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},.9)`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
function star4(c,x,y,s,col='#FFF3C4'){c.fillStyle=col;c.beginPath();c.moveTo(x,y-s*2);c.quadraticCurveTo(x+s*.3,y-s*.3,x+s*2,y);c.quadraticCurveTo(x+s*.3,y+s*.3,x,y+s*2);c.quadraticCurveTo(x-s*.3,y+s*.3,x-s*2,y);c.quadraticCurveTo(x-s*.3,y-s*.3,x,y-s*2);c.fill();}
function shadowE(c,x,y,w){c.fillStyle='rgba(34,64,127,.18)';c.beginPath();c.ellipse(x,y,w,w*.28,0,0,7);c.fill();}
const DRAW={
 star:(c,x,y,t)=>{glowC(c,x,y,22);star4(c,x,y,7+Math.sin(t*6)*.8,'#FFD45C');star4(c,x,y,3.5,'#FFFBEA');},
 orb:(c,x,y)=>{glowC(c,x,y,24);c.fillStyle='#FFF8DC';c.beginPath();c.arc(x,y,8,0,7);c.fill();},
 rock:(c,x,y)=>{shadowE(c,x,y+16,24);c.fillStyle='#B49A7C';c.beginPath();c.moveTo(x-24,y+14);c.lineTo(x-16,y-8);c.lineTo(x+2,y-16);c.lineTo(x+20,y-4);c.lineTo(x+24,y+14);c.closePath();c.fill();c.fillStyle='#D4BFA1';c.beginPath();c.moveTo(x-16,y-8);c.lineTo(x+2,y-16);c.lineTo(x-2,y-2);c.closePath();c.fill();},
 storm:(c,x,y,t)=>{c.save();c.translate(x,y);c.rotate(t*5);for(let i=0;i<3;i++){c.strokeStyle=`rgba(176,128,78,${.6-i*.12})`;c.lineWidth=6-i;c.beginPath();c.arc(0,0,10+i*7,i,i+4.2);c.stroke();}c.restore();},
 cart:(c,x,y)=>{shadowE(c,x,y+18,26);c.fillStyle='#B57E45';rr(c,x-24,y-12,48,22,5);c.fill();c.fillStyle='#D9A56A';rr(c,x-24,y-12,48,7,4);c.fill();c.fillStyle='#5B3B2A';c.beginPath();c.arc(x-14,y+12,6,0,7);c.fill();c.beginPath();c.arc(x+14,y+12,6,0,7);c.fill();},
 gloom:(c,x,y,t)=>{puff(c,x,y+Math.sin(t*4)*2,46,'#8A93AE');c.fillStyle='#fff';c.beginPath();c.arc(x-7,y,2,0,7);c.fill();c.beginPath();c.arc(x+7,y,2,0,7);c.fill();},
 thorn:(c,x,y)=>{c.strokeStyle='#4F6B33';c.lineWidth=3;c.lineCap='round';for(let i=0;i<7;i++){const a=i/7*6.28;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*15,y+Math.sin(a)*15);c.stroke();}c.fillStyle='#3F5A28';c.beginPath();c.arc(x,y,6,0,7);c.fill();},
 nail:(c,x,y,t)=>{c.save();c.translate(x,y);c.rotate(.5+Math.sin(t*3)*.2);c.fillStyle='#8E97AE';rr(c,-2.5,-14,5,26,2);c.fill();c.fillStyle='#6F7894';rr(c,-7,-16,14,5,2);c.fill();c.restore();},
 bee:(c,x,y,t)=>{c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.ellipse(x-4,y-9,6,4+Math.sin(t*30),-.5,0,7);c.fill();c.beginPath();c.ellipse(x+4,y-9,6,4+Math.sin(t*30),.5,0,7);c.fill();c.fillStyle='#F2B33D';c.beginPath();c.ellipse(x,y,11,8,0,0,7);c.fill();c.fillStyle='#3A2A1A';c.fillRect(x-3,y-8,3,16);c.fillRect(x+4,y-7,3,14);},
 sheep:(c,x,y)=>{c.fillStyle='#4B4440';c.fillRect(x-8,y+4,3,8);c.fillRect(x+5,y+4,3,8);c.fillStyle='#FFFDF8';[[x-8,y,8],[x,y-4,9],[x+8,y,8]].forEach(([a,b,r])=>{c.beginPath();c.arc(a,b,r,0,7);c.fill();});c.beginPath();c.ellipse(x,y+2,14,7,0,0,7);c.fill();c.fillStyle='#4B4440';c.beginPath();c.ellipse(x+15,y-3,5.5,4.6,0,0,7);c.fill();},
 lamb:(c,x,y,t)=>{glowC(c,x,y,26);DRAW.sheep(c,x,y,t);},
 gift:(c,x,y)=>{glowC(c,x,y,24);c.fillStyle='#F2B33D';rr(c,x-14,y-10,28,22,4);c.fill();c.fillStyle='#C47F14';c.fillRect(x-2,y-10,4,22);c.fillStyle='#FFE39A';rr(c,x-16,y-14,32,7,3);c.fill();},
 dove:(c,x,y,t)=>{const f=Math.sin(t*14)*6;glowC(c,x,y,22,'255,255,255');c.fillStyle='#fff';c.beginPath();c.moveTo(x-20,y-4-f);c.quadraticCurveTo(x-8,y-14-f,x,y);c.quadraticCurveTo(x+8,y-14-f,x+20,y-4-f);c.quadraticCurveTo(x+8,y-4,x+3,y+6);c.lineTo(x,y+12);c.lineTo(x-3,y+6);c.quadraticCurveTo(x-8,y-4,x-20,y-4-f);c.fill();c.beginPath();c.arc(x,y-1,4,0,7);c.fill();c.fillStyle='#F2B33D';c.beginPath();c.moveTo(x-1,y+1);c.lineTo(x,y+4);c.lineTo(x+1,y+1);c.fill();},
 plank:(c,x,y,t)=>{c.save();c.translate(x,y);c.rotate(Math.sin(t*2+x)*.3);c.fillStyle='#D9A56A';rr(c,-22,-5,44,10,3);c.fill();c.strokeStyle='#B57E45';c.lineWidth=1.2;c.beginPath();c.moveTo(-16,-1);c.lineTo(-4,-1);c.moveTo(4,2);c.lineTo(16,2);c.stroke();c.restore();},
 scroll:(c,x,y)=>{glowC(c,x,y,24);c.fillStyle='#FBF3E2';rr(c,x-14,y-10,28,20,3);c.fill();c.fillStyle='#B57E45';rr(c,x-18,y-12,6,24,3);c.fill();rr(c,x+12,y-12,6,24,3);c.fill();},
 honey:(c,x,y)=>{for(const [a,b] of [[0,0],[11,0],[5.5,-9.5],[-5.5,-9.5],[-11,0],[5.5,9.5]]){c.fillStyle='#F2B33D';c.strokeStyle='#C47F14';c.lineWidth=1.4;c.beginPath();for(let i=0;i<6;i++){const an=i/6*6.28+.52;c.lineTo(x+a+Math.cos(an)*6,y+b+Math.sin(an)*6);}c.closePath();c.fill();c.stroke();}},
 lantern:(c,x,y)=>{glowC(c,x,y,30);c.fillStyle='#F2B33D';rr(c,x-11,y-14,22,28,6);c.fill();c.fillStyle='#FFF6D0';rr(c,x-7,y-9,14,18,4);c.fill();c.fillStyle='#B57E45';c.fillRect(x-8,y-18,16,4);}
};
function drawMe(c,x,y,s,a,t,walk,basket){
  const {leg,bh,hr}=body(a),top=-(leg+bh),hy=top-hr+2.5,sw=walk?Math.sin(t*16)*.45:0,dk=shade(a.outfit,-.22);
  c.save();c.translate(x,y);c.scale(s,s);shadowE(c,0,0,15);c.translate(0,walk?-Math.abs(Math.sin(t*16))*1.5:0);
  [[-4.2,sw],[4.2,-sw]].forEach(([lx,an])=>{c.save();c.translate(lx,-leg);c.rotate(an);c.fillStyle='#34426E';rr(c,-2.8,0,5.6,leg,2.8);c.fill();c.fillStyle='#fff';c.beginPath();c.ellipse(0,leg-1,3.8,2.2,0,0,7);c.fill();c.restore();});
  if(a.g==='chica'){c.fillStyle=a.hair;c.beginPath();c.ellipse(0,hy+6,hr+2.4,hr+7,0,0,7);c.fill();}
  [[-12.9,-sw],[12.9,sw]].forEach(([ax,an])=>{c.save();c.translate(ax,top+4);c.rotate(basket?(ax<0?2.7:-2.7):an*.8);c.fillStyle=dk;rr(c,-2.6,0,5.2,bh-6,2.6);c.fill();c.fillStyle=a.skin;c.beginPath();c.arc(0,bh-5,2.8,0,7);c.fill();c.restore();});
  const g=c.createLinearGradient(0,top,0,top+bh);g.addColorStop(0,shade(a.outfit,.12));g.addColorStop(1,dk);c.fillStyle=g;rr(c,-11,top,22,bh+3,9);c.fill();
  c.fillStyle=a.skin;c.beginPath();c.arc(0,hy,hr,0,7);c.fill();
  c.fillStyle=a.hair;c.beginPath();c.arc(0,hy-1,hr+.7,Math.PI*1.04,Math.PI*1.96);c.quadraticCurveTo(2,hy-hr*.75,-hr,hy);c.fill();
  c.fillStyle='#1A2B57';c.beginPath();c.ellipse(-4,hy+1.6,1.6,2,0,0,7);c.fill();c.beginPath();c.ellipse(4,hy+1.6,1.6,2,0,0,7);c.fill();
  c.strokeStyle='#1A2B57';c.lineWidth=1.4;c.lineCap='round';c.beginPath();c.moveTo(-2.8,hy+5.4);c.quadraticCurveTo(0,hy+7.8,2.8,hy+5.4);c.stroke();
  if(basket){const by=top-hr*2-10;c.fillStyle='#C38E58';rr(c,-22,by,44,16,6);c.fill();c.strokeStyle='#8B5B32';c.lineWidth=1.5;for(let i=-16;i<=16;i+=8){c.beginPath();c.moveTo(i,by+2);c.lineTo(i,by+14);c.stroke();}c.fillStyle='#E0B07A';rr(c,-24,by-3,48,6,3);c.fill();}
  c.restore();
}
function Runner(th,f,av){
  const lanes=[80,180,280];let lane=1,px=180,objs=[],tt=0,spawn=.8,score=0,over=false,scroll=0;const decor=[];
  for(let i=0;i<8;i++)decor.push({x:i%2?346:14,y:i*70,k:i%3});
  return {get score(){return Math.floor(score)},get over(){return over},
   input(k,d){if(over)return;if(k==='left')lane=Math.max(0,lane-1);else if(k==='right')lane=Math.min(2,lane+1);else if(k==='tap')lane=d.x<px?Math.max(0,lane-1):Math.min(2,lane+1);},
   update(dt){if(over)return;tt+=dt;const v=(240+tt*10)*f;scroll+=v*dt;px+=(lanes[lane]-px)*Math.min(1,dt*16);score+=v*dt/40;spawn-=dt;
    if(spawn<=0){spawn=Math.max(.36,1-tt*.013)/f;const L=Math.floor(Math.random()*3),it=Math.random()<.3;objs.push({lane:L,y:-40,k:it?'item':'obs'});if(!it&&tt>6&&Math.random()<.4){const L2=(L+1+Math.floor(Math.random()*2))%3;objs.push({lane:L2,y:-40-Math.random()*20,k:'obs'});}}
    for(const o of objs){o.y+=v*dt;if(!o.dead&&Math.abs(o.y-430)<28&&Math.abs(lanes[o.lane]-px)<42){if(o.k==='obs')over=true;else{o.dead=true;score+=10;burstAt(lanes[o.lane],430);}}}
    objs=objs.filter(o=>o.y<580&&!o.dead);decor.forEach(d=>{d.y+=v*dt*.9;if(d.y>560)d.y-=560;});},
   draw(c,t){const g=c.createLinearGradient(0,0,0,GH);g.addColorStop(0,th.side);g.addColorStop(1,shade(th.side,-.12));c.fillStyle=g;c.fillRect(0,0,GW,GH);
    if(th.night){c.fillStyle='rgba(20,30,80,.25)';c.fillRect(0,0,GW,GH);}
    c.fillStyle=th.road;rr(c,28,-20,304,GH+40,26);c.fill();c.fillStyle='rgba(255,255,255,.28)';rr(c,34,-20,8,GH+40,4);c.fill();rr(c,318,-20,8,GH+40,4);c.fill();
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=4;c.setLineDash([22,26]);c.lineDashOffset=-scroll;[130,230].forEach(x=>{c.beginPath();c.moveTo(x,-20);c.lineTo(x,GH+20);c.stroke();});c.setLineDash([]);
    decor.forEach(d=>{if(d.k===0)puff(c,d.x,d.y,40,'rgba(255,255,255,.85)');else{c.fillStyle=shade(th.side,-.25);c.beginPath();c.arc(d.x,d.y,9+d.k*3,0,7);c.fill();}});
    for(const o of objs){const x=lanes[o.lane];if(o.k==='obs')DRAW[th.obs](c,x,o.y,t);else DRAW[th.item](c,x,o.y,t);}
    drawMe(c,px,452,1.2,av,t,!over);}};
}
function Flyer(th,f){
  const G=1450*Math.sqrt(f),J=-420,gap=Math.round(190-(f-.72)*60),W=64;let y=240,vy=0,pipes=[],sp=0,score=0,over=false,tt=0,started=false;const far=[];
  for(let i=0;i<6;i++)far.push({x:i*70,y:60+Math.random()*380,w:60+Math.random()*60});
  return {get score(){return score},get over(){return over},
   input(k){if(over)return;if(k==='tap'||k==='up'){started=true;vy=J;}},
   update(dt){tt+=dt;if(!started){y=240+Math.sin(tt*3)*8;return;}if(over)return;const spd=(150+tt*3.2)*f;vy+=G*dt;y+=vy*dt;sp-=dt;
    if(sp<=0){sp=1.5;pipes.push({x:GW+40,gy:150+Math.random()*220,passed:false,star:Math.random()<.55,got:false});}
    for(const p of pipes){p.x-=spd*dt;if(!p.passed&&p.x+W/2<110){p.passed=true;score+=10;}
     if(p.star&&!p.got&&Math.abs(p.x-110)<20&&Math.abs(p.gy-y)<24){p.got=true;score+=5;burstAt(110,y);}
     if(Math.abs(p.x-110)<W/2+12&&(y<p.gy-gap/2+12||y>p.gy+gap/2-12))over=true;}
    pipes=pipes.filter(p=>p.x>-80);if(y>GH-16||y<-20)over=true;far.forEach(c=>{c.x-=spd*dt*.3;if(c.x<-80)c.x+=GW+160;});},
   draw(c,t){skyBg(c,th,t);far.forEach(d=>puff(c,d.x,d.y,d.w,th.night?'rgba(255,255,255,.18)':'rgba(255,255,255,.55)'));
    for(const p of pipes){const top=p.gy-gap/2,bot=p.gy+gap/2,col=th.night?'#E4E9FF':'#FFFFFF';
     for(let yy=top-10;yy>-40;yy-=26)puff(c,p.x,yy,W+18,col);for(let yy=bot+10;yy<GH+40;yy+=26)puff(c,p.x,yy,W+18,col);
     if(p.star&&!p.got)DRAW.star(c,p.x,p.gy,t);}
    c.save();c.translate(110,y);c.rotate(Math.max(-.5,Math.min(.9,vy/700)));DRAW[th.player](c,0,0,t);c.restore();
    if(!started){c.fillStyle='rgba(34,64,127,.8)';c.font='800 16px Nunito, sans-serif';c.textAlign='center';c.fillText('Tocá para volar',GW/2,GH-40);}}};
}
function Crosser(th,f,av){
  const COLS=7,CW=GW/COLS,RHh=58,rows=[];let row=0,maxRow=0,px=CW*3.5,cam=0,over=false,hop=0,tt=0,lastType='safe',run=0,floor=0;
  function gen(i){if(i<2)return {t:'safe'};const rv=th.river,r=Math.random();let t;
    if(lastType==='safe')t=r<rv?'river':'road';else t=r<.28?'safe':(Math.random()<rv?'river':'road');
    if(t===lastType&&t!=='safe'){run++;if(run>=3){t='safe';run=0;}}else run=0;lastType=t;
    if(t==='safe')return {t};
    const dir=Math.random()<.5?-1:1,sp=(42+Math.min(i,90)*1.3)*f*(.8+Math.random()*.5)*dir,segs=[];
    if(t==='river'){let x=-40;while(x<GW+60){const w=CW*(1.8+Math.random()*1.2);segs.push({x:x+w/2,w});x+=w+CW*(1.1+Math.random()*.9);}}
    else{let x=-20;while(x<GW+60){const w=CW*.95;segs.push({x:x+w/2,w});x+=w+CW*(1.8+Math.random()*2.2);}}
    const last=segs[segs.length-1];return {t,sp,segs,span:Math.max(GW+120,last.x+last.w/2+60)};}
  const rowAt=i=>{while(rows.length<=i)rows.push(gen(rows.length));return rows[i];};
  const yOf=i=>GH-70-(i-cam)*RHh;
  function move(d){if(over)return;if(d==='up'){row++;hop=1;}else if(d==='down'&&row>0){row--;hop=1;}else if(d==='left')px=Math.max(CW/2,px-CW);else if(d==='right')px=Math.min(GW-CW/2,px+CW);
    if(rowAt(row).t!=='river')px=Math.round((px-CW/2)/CW)*CW+CW/2;maxRow=Math.max(maxRow,row);}
  return {get score(){return maxRow*10},get over(){return over},
   input(k){move(k==='tap'?'up':k);},
   update(dt){tt+=dt;hop=Math.max(0,hop-dt*7);if(!over&&tt>2.5)floor+=dt*(.22+tt*.004)*f;cam+=(Math.max(0,row-2)-cam)*Math.min(1,dt*6);if(floor-1.2>cam)cam=floor-1.2;if(over)return;if(row<floor-1.6){over=true;return;}
    for(let i=Math.max(0,Math.floor(cam)-2);i<Math.floor(cam)+12;i++){const R=rowAt(i);if(!R.segs)continue;for(const s of R.segs){s.x+=R.sp*dt;if(R.sp>0&&s.x-s.w/2>GW+40)s.x-=R.span;if(R.sp<0&&s.x+s.w/2<-40)s.x+=R.span;}}
    const R=rowAt(row);
    if(R.t==='river'&&hop<.5){const on=R.segs.find(s=>Math.abs(s.x-px)<s.w/2-4);if(!on){over=true;splash(px,yOf(row));}else{px+=R.sp*dt;if(px<4||px>GW-4)over=true;}}
    if(R.t==='road'&&hop<.4&&R.segs.some(s=>Math.abs(s.x-px)<s.w/2+10))over=true;},
   draw(c,t){skyBg(c,th,t);
    for(let i=Math.max(0,Math.floor(cam)-2);i<Math.floor(cam)+11;i++){const R=rowAt(i),y=yOf(i);
     if(R.t==='safe'){c.fillStyle=i%2?th.land:shade(th.land,-.05);c.fillRect(0,y-RHh/2,GW,RHh);c.fillStyle=shade(th.land,-.18);for(let k=0;k<5;k++){const x=(k*83+i*37)%GW;c.beginPath();c.arc(x,y+((k*13)%20)-10,3,0,7);c.fill();}}
     else if(R.t==='river'){const g=c.createLinearGradient(0,y-RHh/2,0,y+RHh/2);g.addColorStop(0,'#8FD0F5');g.addColorStop(1,'#4B92D4');c.fillStyle=g;c.fillRect(0,y-RHh/2,GW,RHh);c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;for(let k=0;k<4;k++){const x=((k*97+tt*20*(i%2?1:-1))%GW+GW)%GW;c.beginPath();c.moveTo(x,y+(k%2?8:-8));c.lineTo(x+20,y+(k%2?8:-8));c.stroke();}
      for(const s of R.segs){c.fillStyle='#A9733F';rr(c,s.x-s.w/2,y-14,s.w,28,13);c.fill();c.fillStyle='#C9935C';rr(c,s.x-s.w/2+4,y-12,s.w-8,9,5);c.fill();c.fillStyle='#8B5B32';c.beginPath();c.arc(s.x-s.w/2+10,y,5,0,7);c.fill();}}
     else{c.fillStyle=th.lane;c.fillRect(0,y-RHh/2,GW,RHh);c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.setLineDash([14,14]);c.beginPath();c.moveTo(0,y);c.lineTo(GW,y);c.stroke();c.setLineDash([]);for(const s of R.segs)DRAW[th.mover](c,s.x,y-4,t);}}
    drawMe(c,px,yOf(row)+14-Math.sin(hop*Math.PI)*12,1.05,av,t,hop>0);
    const fy=yOf(floor-1.6)+RHh/2,fg=c.createLinearGradient(0,fy-60,0,fy+20);fg.addColorStop(0,'rgba(255,255,255,0)');fg.addColorStop(1,'rgba(255,255,255,.95)');c.fillStyle=fg;c.fillRect(0,fy-60,GW,GH);for(let k=0;k<5;k++)puff(c,k*90+((t*10)%90),fy,110,'rgba(255,255,255,.9)');}};
}
function Catcher(th,f,av){
  let bx=180,tx=180,items=[],sp=.6,score=0,lives=3,over=false,tt=0,flash=0;const B=body(av),by=488-(B.leg+B.bh+B.hr*2+10)*1.2;
  return {get score(){return score},get over(){return over},
   input(k,d){if(over)return;if(k==='move'||k==='tap')tx=Math.max(26,Math.min(GW-26,d.x));if(k==='nudge')tx=Math.max(26,Math.min(GW-26,bx+d.dx));if(k==='left')tx=Math.max(26,tx-48);if(k==='right')tx=Math.min(GW-26,tx+48);},
   update(dt){if(over)return;tt+=dt;flash=Math.max(0,flash-dt);bx+=(tx-bx)*Math.min(1,dt*14);sp-=dt;
    if(sp<=0){sp=Math.max(.34,.95-tt*.012)/f;const bad=Math.random()<Math.min(.42,.18+tt*.006);items.push({x:30+Math.random()*(GW-60),y:-30,v:(120+tt*4.5)*f*(.85+Math.random()*.3),bad,ph:Math.random()*6});}
    for(const it of items){it.y+=it.v*dt;it.x+=Math.sin(tt*2+it.ph)*20*dt;
     if(!it.dead&&it.y>by-14&&it.y<by+18&&Math.abs(it.x-bx)<30){it.dead=true;if(it.bad){lives--;flash=.35;}else{score+=10;burstAt(it.x,it.y);}}
     if(!it.dead&&it.y>GH+20){it.dead=true;if(!it.bad){lives--;flash=.35;}}}
    items=items.filter(i=>!i.dead);if(lives<=0)over=true;},
   draw(c,t){skyBg(c,th,t);for(let i=0;i<4;i++)puff(c,(i*110+t*8)%(GW+120)-60,90+i*90,90,th.night?'rgba(255,255,255,.15)':'rgba(255,255,255,.55)');
    c.fillStyle=th.hx?'#2B2418':th.night?'#3B4C8E':'#CFE5B6';c.beginPath();c.ellipse(GW/2,GH+40,GW*.8,90,0,0,7);c.fill();
    for(const it of items)DRAW[it.bad?th.bad:th.good](c,it.x,it.y,t);
    drawMe(c,bx,488,1.2,av,t,false,true);
    for(let i=0;i<3;i++){c.fillStyle=i<lives?'#EF6F61':'rgba(34,64,127,.18)';const x=22+i*24,y=24;c.beginPath();c.moveTo(x,y+6);c.bezierCurveTo(x-10,y-2,x-6,y-10,x,y-4);c.bezierCurveTo(x+6,y-10,x+10,y-2,x,y+6);c.fill();}
    if(flash>0){c.fillStyle=`rgba(239,111,97,${flash})`;c.fillRect(0,0,GW,GH);}}};
}
/* ===== juegos nuevos: memoria, laberinto, Simón y versículo ===== */
function hearts(c,n,max){for(let i=0;i<max;i++){c.fillStyle=i<n?'#EF6F61':'rgba(34,64,127,.18)';const x=22+i*24,y=24;c.beginPath();c.moveTo(x,y+6);c.bezierCurveTo(x-10,y-2,x-6,y-10,x,y-4);c.bezierCurveTo(x+6,y-10,x+10,y-2,x,y+6);c.fill();}}
function timeBar(c,th,left,full){const w=GW-180,x=GW-w-16,y=18,k=Math.max(0,Math.min(1,left/full));c.fillStyle=th.hx?'rgba(233,195,122,.16)':'rgba(34,64,127,.14)';rr(c,x,y,w,10,5);c.fill();c.fillStyle=k<.25?'#EF6F61':th.hx?'#E2AC55':'#FF9636';if(k>0){rr(c,x,y,Math.max(10,w*k),10,5);c.fill();}c.fillStyle=th.hx?'#F1D7A2':th.night?'#FFFFFF':'#22407F';c.font='800 12px Nunito,sans-serif';c.textAlign='right';c.fillText(Math.ceil(Math.max(0,left))+' s',x-8,y+9);c.textAlign='left';}
function banner(c,th,txt,a){if(a<=0)return;c.globalAlpha=Math.min(1,a);c.font='900 22px Nunito,sans-serif';c.textAlign='center';const w=c.measureText(txt).width+40;c.fillStyle=th.hx?'rgba(20,16,10,.85)':'rgba(255,255,255,.92)';rr(c,GW/2-w/2,GH/2-26,w,48,24);c.fill();c.fillStyle=th.hx?'#FFE3A6':'#22407F';c.fillText(txt,GW/2,GH/2+6);c.textAlign='left';c.globalAlpha=1;}
let AC=null;function tone(fq,d=.22){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=fq;g.gain.setValueAtTime(.0001,AC.currentTime);g.gain.exponentialRampToValueAtTime(.18,AC.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d+.05);}catch(e){}}

function Memo(th,f,av){
  const keys=th.pairs;let cards=[],open=[],lock=0,score=0,over=false,tt=0,round=0,ban=0,full=0,left=0;
  function deal(){round++;const n=Math.min(keys.length,2+round*2),pick=shuffle(keys.slice()).slice(0,n),deck=shuffle([...pick,...pick]);
    const cols=4,rows=Math.ceil(deck.length/cols),gx=10,gy=10,w=(GW-32-gx*(cols-1))/cols,h=Math.min(96,(GH-92-gy*(rows-1))/rows),top=70+(GH-80-(rows*h+(rows-1)*gy))/2;
    cards=deck.map((k,i)=>({k,x:16+(i%cols)*(w+gx),y:top+Math.floor(i/cols)*(h+gy),w,h,up:false,done:false,flip:0}));open=[];
    const add=(10+n*6)/f;left=round===1?add:left+add;full=Math.max(full,left);ban=1.4;}
  deal();
  return {get score(){return score},get over(){return over},
   input(k,d){if(over||k!=='tap'||lock>0||ban>.9)return;const cd=cards.find(q=>d.x>q.x&&d.x<q.x+q.w&&d.y>q.y&&d.y<q.y+q.h);if(!cd||cd.up||cd.done)return;
    cd.up=true;open.push(cd);tone(520+open.length*110,.12);
    if(open.length===2){const [a,b]=open;if(a.k===b.k){a.done=b.done=true;score+=20;open=[];burstAt(a.x+a.w/2,a.y+a.h/2);burstAt(b.x+b.w/2,b.y+b.h/2);tone(880,.25);left+=2;
      if(cards.every(q=>q.done)){score+=10*round+Math.round(left);lock=.9;setTimeout(()=>{if(!over)deal();},800);}}else lock=.75;}},
   update(dt){if(over)return;tt+=dt;ban=Math.max(0,ban-dt);if(ban<.9)left-=dt;if(left<=0){left=0;over=true;}
    if(lock>0){lock-=dt;if(lock<=0&&open.length===2){open.forEach(q=>q.up=false);open=[];}}
    cards.forEach(q=>{const tg=q.up||q.done?1:0;q.flip+=(tg-q.flip)*Math.min(1,dt*14);});},
   draw(c,t){skyBg(c,th,t);timeBar(c,th,left,full);c.fillStyle=th.hx?'#F1D7A2':th.night?'#FFFFFF':'#22407F';c.font='900 12px Nunito,sans-serif';c.fillText('RONDA '+round,16,27);
    for(const q of cards){const s=Math.abs(Math.cos(q.flip*Math.PI)),front=q.flip>.5,cx=q.x+q.w/2,cy=q.y+q.h/2;c.save();c.translate(cx,cy);c.scale(Math.max(.02,s),1);
     if(front){c.fillStyle=q.done?(th.hx?'#3A3020':'#E9F8EF'):(th.hx?'#2A2418':'#FFFFFF');rr(c,-q.w/2,-q.h/2,q.w,q.h,14);c.fill();c.strokeStyle=q.done?'#5FD39A':(th.hx?'rgba(233,195,122,.5)':'rgba(34,64,127,.15)');c.lineWidth=2;c.stroke();c.save();c.scale(1/Math.max(.02,s),1);c.restore();DRAW[q.k](c,0,4,t);}
     else{const g=c.createLinearGradient(0,-q.h/2,0,q.h/2);g.addColorStop(0,th.hx?'#3B3122':'#6C8CF0');g.addColorStop(1,th.hx?'#1E1912':'#3E5BC8');c.fillStyle=g;rr(c,-q.w/2,-q.h/2,q.w,q.h,14);c.fill();c.strokeStyle=th.hx?'rgba(233,195,122,.55)':'rgba(255,255,255,.55)';c.lineWidth=2;rr(c,-q.w/2+6,-q.h/2+6,q.w-12,q.h-12,10);c.stroke();star4(c,0,0,9,th.hx?'#E2AC55':'#FFD45C');}
     c.restore();}
    banner(c,th,'Ronda '+round,ban);}};
}

function Maze(th,f,av){
  let round=0,C,R,cs,ox,oy,W,px=0,py=0,dx=0,dy=0,items=[],score=0,over=false,left=0,full=0,ban=0,tt=0,face=1;
  function gen(){round++;C=Math.min(13,5+round*2);R=Math.min(17,7+round*2);cs=Math.floor(Math.min((GW-24)/C,(GH-80)/R));ox=Math.floor((GW-C*cs)/2);oy=56+Math.floor((GH-64-R*cs)/2);
    W=Array.from({length:C*R},()=>15);const seen=new Uint8Array(C*R),st=[0];seen[0]=1;
    while(st.length){const i=st[st.length-1],x=i%C,y=Math.floor(i/C),nb=[];if(y>0&&!seen[i-C])nb.push([i-C,1,4]);if(x<C-1&&!seen[i+1])nb.push([i+1,2,8]);if(y<R-1&&!seen[i+C])nb.push([i+C,4,1]);if(x>0&&!seen[i-1])nb.push([i-1,8,2]);
     if(!nb.length){st.pop();continue;}const [j,a,b]=nb[Math.floor(Math.random()*nb.length)];W[i]&=~a;W[j]&=~b;seen[j]=1;st.push(j);}
    for(let k=0;k<Math.floor(C*R/14);k++){const i=Math.floor(Math.random()*C*R),x=i%C,y=Math.floor(i/C);if(x<C-1&&Math.random()<.5){W[i]&=~2;W[i+1]&=~8;}else if(y<R-1){W[i]&=~4;W[i+C]&=~1;}}
    px=0;py=0;dx=0;dy=0;items=[];const used=new Set([0,C*R-1]);for(let k=0;k<2+round;k++){let i;do i=Math.floor(Math.random()*C*R);while(used.has(i));used.add(i);items.push({x:i%C,y:Math.floor(i/C)});}
    const add=(C*R/6+8)/f;left=round===1?add:left+add;full=Math.max(full,left);ban=1.3;}
  gen();
  const move=k=>{if(over||ban>.8)return;const i=py*C+px,m={up:[0,-1,1],right:[1,0,2],down:[0,1,4],left:[-1,0,8]}[k];if(!m||W[i]&m[2])return;px+=m[0];py+=m[1];if(m[0])face=m[0];tone(330+((px+py)%5)*40,.06);
    const it=items.findIndex(q=>q.x===px&&q.y===py);if(it>=0){items.splice(it,1);score+=10;burstAt(ox+px*cs+cs/2,oy+py*cs+cs/2);tone(780,.18);}
    if(px===C-1&&py===R-1){score+=50+Math.round(left);burstAt(ox+px*cs+cs/2,oy+py*cs+cs/2);tone(990,.35);ban=2;setTimeout(()=>{if(!over)gen();},700);}};
  return {get score(){return score},get over(){return over},
   input(k,d){if(k==='tap'){const ax=ox+(px+.5)*cs,ay=oy+(py+.5)*cs,ddx=d.x-ax,ddy=d.y-ay;if(Math.abs(ddx)<cs*.5&&Math.abs(ddy)<cs*.5)return;move(Math.abs(ddx)>Math.abs(ddy)?(ddx<0?'left':'right'):(ddy<0?'up':'down'));}else move(k);},
   update(dt){if(over)return;tt+=dt;ban=Math.max(0,ban-dt);if(ban<.8)left-=dt;if(left<=0){left=0;over=true;}dx+=(px-dx)*Math.min(1,dt*18);dy+=(py-dy)*Math.min(1,dt*18);},
   draw(c,t){skyBg(c,th,t);timeBar(c,th,left,full);c.fillStyle=th.hx?'#F1D7A2':th.night?'#FFFFFF':'#22407F';c.font='900 12px Nunito,sans-serif';c.fillText('LABERINTO '+round,16,27);
    c.fillStyle=th.hx?'#1A1610':'#F3E5C2';rr(c,ox-6,oy-6,C*cs+12,R*cs+12,10);c.fill();
    const gxp=ox+(C-.5)*cs,gyp=oy+(R-.5)*cs;glowC(c,gxp,gyp,cs*1.2);DRAW[th.goal](c,gxp,gyp,t);
    for(const q of items){c.save();c.translate(ox+(q.x+.5)*cs,oy+(q.y+.5)*cs);c.scale(.62,.62);DRAW[th.item](c,0,0,t);c.restore();}
    c.strokeStyle=th.hx?'#8A6A3A':'#5FA956';c.lineWidth=Math.max(3,cs*.16);c.lineCap='round';c.beginPath();
    for(let y=0;y<R;y++)for(let x=0;x<C;x++){const w=W[y*C+x],X=ox+x*cs,Y=oy+y*cs;if(w&1){c.moveTo(X,Y);c.lineTo(X+cs,Y);}if(w&8){c.moveTo(X,Y);c.lineTo(X,Y+cs);}if(x===C-1&&w&2){c.moveTo(X+cs,Y);c.lineTo(X+cs,Y+cs);}if(y===R-1&&w&4){c.moveTo(X,Y+cs);c.lineTo(X+cs,Y+cs);}}c.stroke();
    const ax=ox+(dx+.5)*cs,ay=oy+(dy+.5)*cs;
    if(th.hx){const r=cs*3.2,g=c.createRadialGradient(ax,ay,r*.35,ax,ay,r);g.addColorStop(0,'rgba(8,6,4,0)');g.addColorStop(1,'rgba(8,6,4,.94)');c.fillStyle=g;c.fillRect(0,0,GW,GH);glowC(c,ax,ay-cs*.3,cs*.9,'255,200,120');}
    c.save();c.translate(ax,ay+cs*.42);c.scale(face,1);drawMe(c,0,0,cs/44,av,t,Math.abs(px-dx)+Math.abs(py-dy)>.05);c.restore();
    if(th.hx){timeBar(c,th,left,full);c.fillStyle='#F1D7A2';c.font='900 12px Nunito,sans-serif';c.fillText('LABERINTO '+round,16,27);}
    banner(c,th,ban>1.5&&round>1?'¡Lo encontraste!':'Laberinto '+round,ban);}};
}

function Simon(th,f,av){
  const COL=th.hx?['#C9452E','#C99A3C','#3C8C9E','#4E8C4A']:['#EF6F61','#F2B33D','#4FB5E8','#5FC27E'],FQ=[392,494,587,698];
  let seq=[],step=0,phase='wait',timer=1,lit=-1,litT=0,score=0,lives=2,over=false,tt=0,msg='',flash=0;
  const pads=[0,1,2,3].map(i=>({x:i%2?GW/2+6:20,y:120+(i>1?186:0),w:GW/2-26,h:176}));
  const next=()=>{seq.push(Math.floor(Math.random()*4));step=0;phase='show';timer=.7;msg='Mirá';};
  const light=(i,d)=>{lit=i;litT=d;tone(FQ[i],Math.min(.45,d));};
  next();
  return {get score(){return score},get over(){return over},
   input(k,d){if(over||phase!=='input')return;let i=-1;if(k==='tap'){i=pads.findIndex(p=>d.x>p.x&&d.x<p.x+p.w&&d.y>p.y&&d.y<p.y+p.h);}else i={up:0,right:1,left:2,down:3}[k]??-1;if(i<0)return;
    light(i,.25);if(i===seq[step]){step++;if(step===seq.length){score+=10*seq.length;phase='wait';timer=.9;msg='¡Bien!';burstAt(GW/2,110);}}
    else{lives--;flash=.4;tone(140,.4);if(lives<=0){over=true;return;}phase='wait';timer=1.1;msg='Otra vez';step=0;seq.again=true;}},
   update(dt){if(over)return;tt+=dt;flash=Math.max(0,flash-dt);if(litT>0){litT-=dt;if(litT<=0)lit=-1;}
    if(phase==='wait'){timer-=dt;if(timer<=0){if(seq.again){seq.again=false;step=0;phase='show';timer=.4;msg='Mirá';}else next();}}
    else if(phase==='show'){timer-=dt;if(timer<=0){if(step<seq.length){const sp=Math.max(.28,.62-seq.length*.025)/f;light(seq[step],sp*.8);step++;timer=sp;}else{phase='input';step=0;msg='¡Tu turno!';}}}},
   draw(c,t){skyBg(c,th,t);hearts(c,lives,2);c.fillStyle=th.hx?'#F1D7A2':th.night?'#FFFFFF':'#22407F';c.font='900 12px Nunito,sans-serif';c.textAlign='right';c.fillText('SECUENCIA '+seq.length,GW-16,28);
    c.font='900 24px Nunito,sans-serif';c.textAlign='center';c.fillStyle=th.hx?'#FFE3A6':th.night?'#FFFFFF':'#22407F';c.fillText(msg,GW/2,92);c.textAlign='left';
    pads.forEach((p,i)=>{const on=lit===i,cx=p.x+p.w/2,cy=p.y+p.h/2;if(on)glowC(c,cx,cy,p.w*.75,'255,240,190');c.fillStyle=on?shade(COL[i],.35):shade(COL[i],th.hx?-.35:-.05);rr(c,p.x,p.y,p.w,p.h,26);c.fill();
     c.fillStyle=on?'rgba(255,255,255,.95)':'rgba(255,255,255,.35)';c.beginPath();c.arc(cx,cy,40,0,7);c.fill();c.save();c.translate(cx,cy);c.scale(on?1.25:1.05,on?1.25:1.05);DRAW[th.pads[i]](c,0,0,t);c.restore();});
    if(flash>0){c.fillStyle=`rgba(239,111,97,${flash})`;c.fillRect(0,0,GW,GH);}}};
}

function Verso(th,f,av){
  const pool=shuffle(th.verses.slice());let vi=-1,V=null,tiles=[],built=[],score=0,over=false,left=0,full=0,ban=0,tt=0,shake=null,shT=0,ctx=null;
  const split=txt=>{const w=txt.split(' '),n=Math.min(9,w.length),out=[];let k=0;for(let i=0;i<n;i++){const take=Math.round((w.length-k)/(n-i));out.push(w.slice(k,k+take).join(' '));k+=take;}return out;};
  function load(){vi++;V=pool[vi%pool.length];const parts=split(V.text);built=[];tiles=shuffle(parts.map((s,i)=>({s,i,used:false})));layout();const add=(14+parts.length*2.4)/f;left=vi===0?add:left+add;full=Math.max(full,left);ban=1.3;V.parts=parts;}
  function layout(){if(!ctx)return;ctx.font='800 15px Nunito,sans-serif';const rows=[];let row=[],rw=0;const maxW=GW-32;
    tiles.filter(q=>!q.used).forEach(q=>{q.w=ctx.measureText(q.s).width+26;if(rw+q.w>maxW&&row.length){rows.push([row,rw]);row=[];rw=0;}row.push(q);rw+=q.w+8;});if(row.length)rows.push([row,rw]);
    let y=GH-24-rows.length*50;rows.forEach(([r,w])=>{let x=(GW-(w-8))/2;r.forEach(q=>{q.x=x;q.y=y;x+=q.w+8;});y+=50;});}
  function wrap(c,txt,maxW){const w=txt.split(' '),lines=[];let l='';w.forEach(s=>{const tt=l?l+' '+s:s;if(c.measureText(tt).width>maxW&&l){lines.push(l);l=s;}else l=tt;});if(l)lines.push(l);return lines;}
  load();
  return {get score(){return score},get over(){return over},
   input(k,d){if(over||k!=='tap'||ban>.8)return;const q=tiles.find(q=>!q.used&&d.x>q.x&&d.x<q.x+q.w&&d.y>q.y&&d.y<q.y+40);if(!q)return;
    const want=V.parts[built.length];if(q.s===want){q.used=true;built.push(q.s);score+=10;tone(520+built.length*40,.12);burstAt(q.x+q.w/2,q.y+20);layout();
      if(built.length===V.parts.length){score+=30;tone(990,.35);ban=2.2;setTimeout(()=>{if(!over)load();},1500);}}
    else{shake=q;shT=.4;left=Math.max(0,left-3);tone(160,.25);}},
   update(dt){if(over)return;tt+=dt;ban=Math.max(0,ban-dt);shT=Math.max(0,shT-dt);if(ban<.8)left-=dt;if(left<=0){left=0;over=true;}},
   draw(c,t){if(!ctx){ctx=c;layout();}skyBg(c,th,t);timeBar(c,th,left,full);c.fillStyle=th.hx?'#F1D7A2':th.night?'#FFFFFF':'#22407F';c.font='900 12px Nunito,sans-serif';c.fillText('VERSÍCULO '+(vi+1),16,27);
    c.fillStyle=th.hx?'rgba(20,16,10,.82)':'rgba(255,255,255,.9)';rr(c,16,52,GW-32,214,20);c.fill();
    c.fillStyle=th.hx?'#E2AC55':'#FF9636';c.font='900 13px Nunito,sans-serif';c.textAlign='center';c.fillText(V.ref.toUpperCase()+' · NTV',GW/2,80);
    c.font='700 18px Nunito,sans-serif';const done=built.join(' '),rest=V.parts.slice(built.length).map(s=>s.replace(/[^\s]/g,'_')).join(' ');
    const lines=wrap(c,(done+(done&&rest?' ':'')+rest),GW-64);let y=114;lines.slice(0,6).forEach(l=>{const cut=Math.max(0,Math.min(l.length,done.length-(lines.slice(0,lines.indexOf(l)).join(' ').length+(lines.indexOf(l)?1:0))));
      const a=l.slice(0,cut),b=l.slice(cut),wa=c.measureText(a).width,wb=c.measureText(b).width,x0=GW/2-(wa+wb)/2;c.textAlign='left';c.fillStyle=th.hx?'#FFF1D6':'#22407F';c.fillText(a,x0,y);c.fillStyle=th.hx?'rgba(241,215,162,.35)':'rgba(34,64,127,.28)';c.fillText(b,x0+wa,y);y+=27;});
    c.textAlign='center';c.font='800 15px Nunito,sans-serif';
    tiles.filter(q=>!q.used).forEach(q=>{const sx=q===shake&&shT>0?Math.sin(shT*60)*5:0;c.fillStyle=q===shake&&shT>0?'#FFD9D3':(th.hx?'#2A2418':'#FFFFFF');rr(c,q.x+sx,q.y,q.w,40,14);c.fill();c.strokeStyle=th.hx?'rgba(233,195,122,.5)':'rgba(34,64,127,.18)';c.lineWidth=1.5;c.stroke();c.fillStyle=th.hx?'#F1D7A2':'#22407F';c.fillText(q.s,q.x+sx+q.w/2,q.y+26);});
    c.textAlign='left';banner(c,th,ban>1.5&&vi>0||ban>1.5&&built.length?'¡Completo!':'Versículo '+(vi+1),ban>1.5&&built.length===V.parts.length?1:ban);}};
}
/* ===== 13 juegos más: ninguno se repite en el recorrido ===== */
const INK = th => th.hx ? '#F1D7A2' : th.night ? '#FFFFFF' : '#22407F';
const lab = (c, th, t, x, y, al) => { c.fillStyle = INK(th); c.font = '900 12px Nunito,sans-serif'; c.textAlign = al || 'left'; c.fillText(t, x, y); c.textAlign = 'left'; };
const card = (c, th, x, y, w, h, r) => { c.fillStyle = th.hx ? 'rgba(20,16,10,.82)' : 'rgba(255,255,255,.92)'; rr(c, x, y, w, h, r || 16); c.fill(); };
function wrapT(c, txt, maxW) { const w = txt.split(' '), L = []; let l = ''; w.forEach(s => { const t = l ? l + ' ' + s : s; if (c.measureText(t).width > maxW && l) { L.push(l); l = s; } else l = t; }); if (l) L.push(l); return L; }

// 1. Arrear ovejas al corral: arrastrá cada oveja hasta el corral
function Herd(th, f) {
  let sheep = [], held = null, score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, tt = 0;
  const pen = { x: GW / 2 - 70, y: 420, w: 140, h: 76 };
  const inPen = (x, y) => x > pen.x + 10 && x < pen.x + pen.w - 10 && y > pen.y + 8 && y < pen.y + pen.h;
  function deal() { round++; const n = 3 + round * 2; sheep = []; for (let i = 0; i < n; i++) sheep.push({ x: 40 + Math.random() * (GW - 80), y: 80 + Math.random() * 260, vx: 0, vy: 0, done: false, t: Math.random() * 3 }); const add = (14 + n * 3) / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || ban > .8) return; if (k === 'down') { held = sheep.filter(s => !s.done).find(s => Math.hypot(s.x - d.x, s.y - d.y) < 34) || null; }
      else if (k === 'move' && held) { held.x = Math.max(16, Math.min(GW - 16, d.x)); held.y = Math.max(60, Math.min(GH - 16, d.y)); }
      else if (k === 'up' && held) { if (inPen(held.x, held.y)) { held.done = true; score += 15; burstAt(held.x, held.y); tone(660 + sheep.filter(s => s.done).length * 40, .15); if (sheep.every(s => s.done)) { score += 10 * round + Math.round(left); setTimeout(() => { if (!over) deal(); }, 700); } } held = null; } },
    update(dt) { if (over) return; tt += dt; ban = Math.max(0, ban - dt); if (ban < .8) left -= dt; if (left <= 0) { left = 0; over = true; }
      for (const s of sheep) { if (s.done || s === held) continue; s.t -= dt; if (s.t <= 0) { s.t = 1 + Math.random() * 2; const a = Math.random() * 6.28, v = (20 + round * 8) * f; s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v; } s.x = Math.max(20, Math.min(GW - 20, s.x + s.vx * dt)); s.y = Math.max(70, Math.min(360, s.y + s.vy * dt)); } },
    draw(c, t) { skyBg(c, th, t); c.fillStyle = th.hx ? '#2B2418' : th.night ? '#3B4C8E' : '#CFE5B6'; c.fillRect(0, 300, GW, GH - 300); timeBar(c, th, left, full); lab(c, th, 'RONDA ' + round, 16, 27);
      c.strokeStyle = '#8B5B32'; c.lineWidth = 6; c.beginPath(); c.moveTo(pen.x, pen.y); c.lineTo(pen.x, pen.y + pen.h); c.lineTo(pen.x + pen.w, pen.y + pen.h); c.lineTo(pen.x + pen.w, pen.y); c.stroke(); c.lineWidth = 3; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(pen.x, pen.y + i * 18); c.lineTo(pen.x + pen.w, pen.y + i * 18); c.globalAlpha = .4; c.stroke(); c.globalAlpha = 1; }
      lab(c, th, 'CORRAL', GW / 2, pen.y - 8, 'center');
      for (const s of sheep) DRAW.sheep(c, s.x, s.y, t); banner(c, th, 'Ronda ' + round, ban); } };
}

// 2. Palomas en el palomar: tocá las palomas, no los halcones
function Pop(th, f) {
  let holes = [], score = 0, lives = 3, over = false, tt = 0, sp = 1, flash = 0;
  for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) holes.push({ x: 70 + q * 110, y: 150 + r * 115, k: null, t: 0 });
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap') return; const h = holes.find(h => h.k && Math.hypot(h.x - d.x, h.y - 10 - d.y) < 46); if (!h) return; if (h.k === 'dove') { score += 10; burstAt(h.x, h.y); tone(880, .1); } else { lives--; flash = .4; tone(150, .3); if (lives <= 0) over = true; } h.k = null; },
    update(dt) { if (over) return; tt += dt; flash = Math.max(0, flash - dt); sp -= dt; if (sp <= 0) { sp = Math.max(.32, .9 - tt * .012) / f; const free = holes.filter(h => !h.k); if (free.length) { const h = free[Math.floor(Math.random() * free.length)]; h.k = Math.random() < Math.min(.35, .12 + tt * .005) ? 'thorn' : 'dove'; h.t = Math.max(.6, 1.3 - tt * .01) / f; } }
      for (const h of holes) if (h.k) { h.t -= dt; if (h.t <= 0) { if (h.k === 'dove') { lives--; flash = .3; if (lives <= 0) over = true; } h.k = null; } } },
    draw(c, t) { skyBg(c, th, t); hearts(c, lives, 3); c.fillStyle = th.hx ? '#4A3E2C' : '#E8D3A8'; rr(c, 20, 90, GW - 40, 380, 24); c.fill();
      for (const h of holes) { c.fillStyle = th.hx ? '#1A1610' : '#5A4632'; c.beginPath(); c.ellipse(h.x, h.y + 18, 40, 16, 0, 0, 7); c.fill(); if (h.k) { c.save(); c.translate(h.x, h.y - 6); c.scale(1.3, 1.3); DRAW[h.k](c, 0, 0, t); c.restore(); } }
      if (flash > 0) { c.fillStyle = `rgba(239,111,97,${flash})`; c.fillRect(0, 0, GW, GH); } } };
}

// 3. Miel y abejas: arrastrá al personaje, juntá panales y esquivá abejas
function Swarm(th, f, av) {
  let px = GW / 2, py = 400, tx = px, ty = py, bees = [], combs = [], score = 0, lives = 3, inv = 0, over = false, tt = 0, sp = 0;
  const addBee = () => bees.push({ x: Math.random() * GW, y: 60, vx: (Math.random() - .5) * 160 * f, vy: (60 + Math.random() * 80) * f });
  addBee(); addBee();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over) return; if (k === 'down' || k === 'move') { tx = d.x; ty = d.y - 30; } },
    update(dt) { if (over) return; tt += dt; inv = Math.max(0, inv - dt); px += (tx - px) * Math.min(1, dt * 10); py += (ty - py) * Math.min(1, dt * 10); px = Math.max(16, Math.min(GW - 16, px)); py = Math.max(80, Math.min(GH - 20, py));
      sp -= dt; if (sp <= 0) { sp = 1.4; combs.push({ x: 30 + Math.random() * (GW - 60), y: 100 + Math.random() * (GH - 160), t: 6 }); } if (bees.length < 2 + Math.floor(tt / 9)) addBee();
      for (const b of bees) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < 10 || b.x > GW - 10) b.vx *= -1; if (b.y < 60 || b.y > GH - 10) b.vy *= -1; if (!inv && Math.hypot(b.x - px, b.y - (py - 20)) < 24) { lives--; inv = 1.4; tone(150, .3); if (lives <= 0) over = true; } }
      combs = combs.filter(m => { m.t -= dt; if (Math.hypot(m.x - px, m.y - (py - 20)) < 30) { score += 10; burstAt(m.x, m.y); tone(760, .12); return false; } return m.t > 0; }); },
    draw(c, t) { skyBg(c, th, t); c.fillStyle = th.hx ? '#3A2E1C' : '#F2DCA0'; c.fillRect(0, GH - 60, GW, 60); hearts(c, lives, 3);
      for (const m of combs) DRAW.honey(c, m.x, m.y, t); if (!(inv > 0 && Math.floor(t * 12) % 2)) drawMe(c, px, py, .9, av, t, true);
      for (const b of bees) DRAW.bee(c, b.x, b.y, t); } };
}

// 4. Rompecabezas deslizante del templo
function Slide(th, f) {
  let n = 3, tiles = [], empty = 0, score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, moves = 0; const S0 = 300, ox = 30, oy = 120;
  const pic = document.createElement('canvas'); pic.width = pic.height = 300;
  function paint() { const c = pic.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, th.hx ? '#2A2015' : '#FFD9B8'); g.addColorStop(1, th.hx ? '#6A4A2A' : '#FFF3DD'); c.fillStyle = g; c.fillRect(0, 0, 300, 300);
    c.fillStyle = th.hx ? '#E9A55A' : '#FFB347'; c.beginPath(); c.arc(230, 70, 34, 0, 7); c.fill(); c.fillStyle = th.hx ? '#C9B892' : '#F4E8CC'; c.fillRect(40, 140, 220, 120); c.fillStyle = th.hx ? '#A8987A' : '#E0D0AE'; c.beginPath(); c.moveTo(30, 140); c.lineTo(150, 90); c.lineTo(270, 140); c.fill(); c.fillRect(30, 255, 240, 18);
    for (let i = 0; i < 6; i++) { c.fillStyle = th.hx ? '#DCCDA6' : '#FFFFFF'; c.fillRect(52 + i * 36, 150, 14, 105); } c.fillStyle = '#6B4A2C'; c.fillRect(132, 200, 36, 55); c.fillStyle = th.hx ? '#3E4A2A' : '#7CB35E'; c.fillRect(0, 273, 300, 27); }
  function deal() { round++; n = round === 1 ? 3 : 4; paint(); tiles = [...Array(n * n).keys()]; empty = n * n - 1; let e = empty; for (let i = 0; i < 120 * n; i++) { const r = Math.floor(e / n), q = e % n, nb = []; if (r) nb.push(e - n); if (r < n - 1) nb.push(e + n); if (q) nb.push(e - 1); if (q < n - 1) nb.push(e + 1); const o = nb[Math.floor(Math.random() * nb.length)]; [tiles[e], tiles[o]] = [tiles[o], tiles[e]]; e = o; } empty = e; const add = (n === 3 ? 70 : 140) / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .8) return; const sz = S0 / n, q = Math.floor((d.x - ox) / sz), r = Math.floor((d.y - oy) / sz); if (q < 0 || r < 0 || q >= n || r >= n) return; const i = r * n + q, er = Math.floor(empty / n), eq = empty % n; if (Math.abs(er - r) + Math.abs(eq - q) !== 1) return;
      [tiles[i], tiles[empty]] = [tiles[empty], tiles[i]]; empty = i; moves++; tone(500 + (moves % 5) * 40, .05); if (tiles.every((v, j) => v === j)) { score += 100 * round + Math.round(left) * 2; burstAt(GW / 2, oy + 150); tone(990, .4); setTimeout(() => { if (!over) deal(); }, 900); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); if (ban < .8) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'TEMPLO ' + round, 16, 27); lab(c, th, 'Tocá una pieza junto al hueco para moverla', GW / 2, 96, 'center');
      const sz = S0 / n; c.drawImage(pic, GW - 76, 40, 60, 60); for (let i = 0; i < n * n; i++) { const v = tiles[i]; if (v === n * n - 1 && i === empty) continue; const r = Math.floor(i / n), q = i % n, sr = Math.floor(v / n), sq = v % n; c.drawImage(pic, sq * sz, sr * sz, sz, sz, ox + q * sz + 1, oy + r * sz + 1, sz - 2, sz - 2); }
      banner(c, th, 'Templo ' + round, ban); } };
}

// 5. Equilibrio sobre el tronco: mantené el cántaro derecho
function Balance(th, f, av) {
  let a = 0, va = 0, push = 0, dist = 0, score = 0, lives = 3, over = false, tt = 0, wind = 0, fall = 0;
  return { get score() { return Math.floor(score) }, get over() { return over },
    input(k, d) { if (over) return; if (k === 'lean') push = d.d; else if (k === 'left') va -= .5; else if (k === 'right') va += .5; else if (k === 'tap' || k === 'down') va += d.x < GW / 2 ? -.5 : .5; },
    update(dt) { if (over) return; tt += dt; if (fall > 0) { fall -= dt; if (fall <= 0) { a = 0; va = 0; } return; } wind += (Math.random() - .5) * dt * 3; wind *= .98;
      va += (Math.sin(a) * 2.2 + wind * (1 + tt * .03) + push * 4) * dt * f; push = 0; a += va * dt; va *= .985; dist += (50 + tt) * dt; score += dt * 10;
      if (Math.abs(a) > 1) { lives--; fall = 1; tone(150, .3); splash(GW / 2, 360); if (lives <= 0) over = true; } },
    draw(c, t) { const g = c.createLinearGradient(0, 0, 0, GH); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]); c.fillStyle = g; c.fillRect(0, 0, GW, GH); c.fillStyle = th.hx ? '#2E5A5A' : '#7FC4F0'; c.fillRect(0, 330, GW, GH - 330);
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const x = ((i * 70 - dist * 2) % (GW + 80) + GW + 80) % (GW + 80) - 40; c.beginPath(); c.moveTo(x, 360 + (i % 3) * 40); c.lineTo(x + 30, 360 + (i % 3) * 40); c.stroke(); }
      c.fillStyle = '#8B5B32'; rr(c, -20, 330, GW + 40, 26, 13); c.fill(); for (let i = 0; i < 6; i++) { const x = ((i * 90 - dist * 3) % (GW + 90) + GW + 90) % (GW + 90) - 45; c.fillStyle = '#6E4626'; c.beginPath(); c.arc(x, 343, 5, 0, 7); c.fill(); }
      hearts(c, lives, 3); lab(c, th, Math.floor(dist / 10) + ' m', GW - 16, 28, 'right');
      c.save(); c.translate(GW / 2, 332); c.rotate(fall > 0 ? Math.sign(a) * 1.4 : a); drawMe(c, 0, 0, 1.3, av, t, true); c.fillStyle = '#C98C5A'; c.beginPath(); c.ellipse(0, -112, 14, 18, 0, 0, 7); c.fill(); c.restore();
      c.fillStyle = INK(th); c.globalAlpha = .7; c.font = '800 12px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText('Inclinate hacia el otro lado para no caerte', GW / 2, 480); c.textAlign = 'left'; c.globalAlpha = 1; } };
}

// 6. Ordená la historia
const ORDER_SETS = [['El ángel visita a María', 'Viaje a Belén', 'Nace Jesús', 'Los pastores lo visitan', 'Los magos lo adoran'],
  ['Presentación en el templo', 'Huida a Egipto', 'Regreso a Nazaret', 'Viaje a Jerusalén a los doce años', 'Jesús con los maestros en el templo'],
  ['Juan predica en el desierto', 'Jesús llega al Jordán', 'Juan lo bautiza', 'El Espíritu baja como paloma', 'Una voz habla desde el cielo']];
function Order(th, f) {
  let set = [], cards = [], got = 0, score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, shake = null, shT = 0; const order = shuffle([0, 1, 2]);
  function deal() { set = ORDER_SETS[order[round % 3]]; round++; got = 0; cards = shuffle(set.map((s, i) => ({ s, i, used: false }))); cards.forEach((q, j) => { q.x = 20; q.y = 220 + j * 56; q.w = GW - 40; q.h = 46; }); const add = 26 / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .8) return; const q = cards.find(q => !q.used && d.x > q.x && d.x < q.x + q.w && d.y > q.y && d.y < q.y + q.h); if (!q) return;
      if (q.i === got) { q.used = true; got++; score += 20; tone(520 + got * 60, .12); burstAt(q.x + q.w / 2, q.y + 20); if (got === set.length) { score += 30 + Math.round(left); setTimeout(() => { if (!over) deal(); }, 900); } } else { shake = q; shT = .4; left = Math.max(0, left - 3); tone(160, .25); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); shT = Math.max(0, shT - dt); if (ban < .8) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'HISTORIA ' + round, 16, 27); card(c, th, 16, 50, GW - 32, 150); lab(c, th, '¿Qué pasó primero? Tocá en orden', GW / 2, 72, 'center');
      c.font = '700 13px Nunito,sans-serif'; set.slice(0, got).forEach((s, i) => { c.fillStyle = th.hx ? '#FFF1D6' : '#22407F'; c.fillText((i + 1) + '. ' + s, 30, 98 + i * 20); });
      c.font = '800 14px Nunito,sans-serif'; for (const q of cards) { if (q.used) continue; const sx = q === shake && shT > 0 ? Math.sin(shT * 60) * 5 : 0; c.fillStyle = q === shake && shT > 0 ? '#FFD9D3' : (th.hx ? '#2A2418' : '#FFFFFF'); rr(c, q.x + sx, q.y, q.w, q.h, 14); c.fill(); c.fillStyle = th.hx ? '#F1D7A2' : '#22407F'; c.textAlign = 'center'; c.fillText(q.s, q.x + sx + q.w / 2, q.y + 28); c.textAlign = 'left'; }
      banner(c, th, 'Historia ' + round, ban); } };
}

// 7. Sopa de letras
const WORD_SETS = [['JUAN', 'JORDAN', 'AGUA', 'PALOMA', 'CIELO', 'HIJO'], ['MIEL', 'DESIERTO', 'CORDERO', 'VOZ', 'AMADO', 'RIO']];
function Words(th, f) {
  const N = 8, cs = 38, ox = (GW - N * cs) / 2, oy = 150; let grid, words, found, sel = null, cur = null, score = 0, over = false, left = 0, full = 0, round = 0, ban = 0;
  function deal() { words = WORD_SETS[round % 2]; round++; found = []; grid = Array.from({ length: N * N }, () => ''); const dirs = [[1, 0], [0, 1], [1, 1]];
    for (const w of words) { for (let tr = 0; tr < 200; tr++) { const [dx, dy] = dirs[Math.floor(Math.random() * 3)], x = Math.floor(Math.random() * (N - dx * (w.length - 1))), y = Math.floor(Math.random() * (N - dy * (w.length - 1))); let ok = true; for (let i = 0; i < w.length; i++) { const g = grid[(y + dy * i) * N + x + dx * i]; if (g && g !== w[i]) { ok = false; break; } } if (ok) { for (let i = 0; i < w.length; i++) grid[(y + dy * i) * N + x + dx * i] = w[i]; break; } } }
    const AB = 'ABCDEFGHIJLMNOPRSTUV'; grid = grid.map(g => g || AB[Math.floor(Math.random() * AB.length)]); const add = 80 / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  const cell = d => { const q = Math.floor((d.x - ox) / cs), r = Math.floor((d.y - oy) / cs); return q >= 0 && r >= 0 && q < N && r < N ? [q, r] : null; };
  const line = (a, b) => { const dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); if (!(a[0] === b[0] || a[1] === b[1] || Math.abs(b[0] - a[0]) === Math.abs(b[1] - a[1]))) return null; const L = []; for (let i = 0; i <= n; i++) L.push([a[0] + dx * i, a[1] + dy * i]); return L; };
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || ban > .8) return; const p = cell(d); if (k === 'down') { sel = p; cur = p; } else if (k === 'move' && sel && p) cur = p; else if (k === 'up' && sel) { const L = cur && line(sel, cur); if (L) { const w = L.map(([q, r]) => grid[r * N + q]).join(''), rw = w.split('').reverse().join(''); const hit = words.find(x => !found.some(f => f.w === x) && (x === w || x === rw)); if (hit) { found.push({ w: hit, L }); score += 20; tone(700 + found.length * 50, .15); burstAt(ox + (L[0][0] + .5) * cs, oy + (L[0][1] + .5) * cs); if (found.length === words.length) { score += 40 + Math.round(left); setTimeout(() => { if (!over) deal(); }, 900); } } } sel = cur = null; } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); if (ban < .8) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'SOPA ' + round, 16, 27); card(c, th, ox - 8, oy - 8, N * cs + 16, N * cs + 16);
      const mark = (L, col) => { c.strokeStyle = col; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(ox + (L[0][0] + .5) * cs, oy + (L[0][1] + .5) * cs); c.lineTo(ox + (L[L.length - 1][0] + .5) * cs, oy + (L[L.length - 1][1] + .5) * cs); c.stroke(); };
      found.forEach(fw => mark(fw.L, th.hx ? 'rgba(233,195,122,.4)' : 'rgba(255,150,54,.35)')); if (sel && cur) { const L = line(sel, cur); if (L) mark(L, 'rgba(95,211,154,.45)'); }
      c.font = '800 18px Nunito,sans-serif'; c.textAlign = 'center'; c.fillStyle = th.hx ? '#F1D7A2' : '#22407F'; for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) c.fillText(grid[r * N + q], ox + (q + .5) * cs, oy + (r + .5) * cs + 6);
      c.font = '800 13px Nunito,sans-serif'; words.forEach((w, i) => { const x = 60 + (i % 3) * 120, y = 70 + Math.floor(i / 3) * 24; const ok = found.some(f => f.w === w); c.fillStyle = ok ? (th.hx ? '#5FD39A' : '#24B37E') : INK(th); c.fillText((ok ? '✓ ' : '') + w, x, y); }); c.textAlign = 'left';
      lab(c, th, 'Deslizá el dedo de la primera a la última letra', GW / 2, oy + N * cs + 34, 'center'); banner(c, th, 'Sopa ' + round, ban); } };
}

// 8. Construí la casa: apilá las tablas
function Stack(th, f) {
  let blocks = [{ x: GW / 2 - 70, w: 140 }], cur = null, dir = 1, score = 0, over = false, cam = 0, tt = 0, falling = [];
  const H = 26, base = 470; const spawn = () => { const w = blocks[blocks.length - 1].w; cur = { x: dir > 0 ? -w : GW, w, sp: (120 + blocks.length * 9) * f }; };
  spawn();
  return { get score() { return score }, get over() { return over },
    input(k) { if (over || (k !== 'tap' && k !== 'up' && k !== 'down')) return; const top = blocks[blocks.length - 1], l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
      if (r - l <= 4) { falling.push({ ...cur, y: base - blocks.length * H, vy: 0 }); over = true; tone(140, .4); return; }
      if (cur.x < l) falling.push({ x: cur.x, w: l - cur.x, y: base - blocks.length * H, vy: 0 }); if (cur.x + cur.w > r) falling.push({ x: r, w: cur.x + cur.w - r, y: base - blocks.length * H, vy: 0 });
      const perfect = Math.abs(cur.x - top.x) < 4; blocks.push({ x: perfect ? top.x : l, w: perfect ? top.w : r - l }); score += perfect ? 20 : 10; tone(perfect ? 990 : 600 + blocks.length * 15, .12); if (perfect) burstAt(top.x + top.w / 2, base - blocks.length * H - cam); dir *= -1; spawn(); },
    update(dt) { tt += dt; cam += (Math.max(0, blocks.length * H - 260) - cam) * Math.min(1, dt * 4); falling.forEach(b => { b.vy += 900 * dt; b.y += b.vy * dt; }); if (over || !cur) return; cur.x += cur.sp * dir * dt; if (cur.x > GW) dir = -1; if (cur.x + cur.w < 0) dir = 1; },
    draw(c, t) { skyBg(c, th, t); lab(c, th, 'ALTURA ' + (blocks.length - 1), GW - 16, 28, 'right'); c.fillStyle = th.hx ? '#3E3222' : '#C9A877'; c.fillRect(0, base + H - (-cam) * 0 + cam, GW, 200);
      const draw = (b, y, col) => { c.fillStyle = col; rr(c, b.x, y + cam, b.w, H - 2, 4); c.fill(); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(b.x + 3, y + cam + H - 8, b.w - 6, 3); };
      blocks.forEach((b, i) => draw(b, base - i * H, i % 2 ? '#B88A55' : '#A8784A')); if (cur && !over) draw(cur, base - blocks.length * H, '#D2A06A'); falling.forEach(b => draw(b, b.y, '#9A6A3E'));
      if (blocks.length < 3) { c.fillStyle = INK(th); c.globalAlpha = .75; c.font = '800 13px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText('Tocá para soltar la tabla justo encima', GW / 2, 120); c.textAlign = 'left'; c.globalAlpha = 1; } } };
}

// 9. Encontrá las diferencias
function Diff(th, f) {
  const icons = ['plank', 'nail', 'scroll', 'lantern', 'gift', 'honey', 'star', 'dove', 'lamb', 'orb'];
  let A, B, diffs, found, score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, miss = null, mT = 0; const W = 300, Hh = 190, ox = 30, oyA = 60, oyB = 280;
  function deal() { round++; A = []; for (let i = 0; i < 12; i++) A.push({ k: icons[Math.floor(Math.random() * icons.length)], x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (Hh - 60), s: .8 + Math.random() * .5 });
    B = A.map(o => ({ ...o })); const idx = shuffle([...A.keys()]).slice(0, 5); diffs = idx.map((i, j) => { const o = B[i]; if (j % 3 === 0) o.hide = true; else if (j % 3 === 1) o.k = icons[(icons.indexOf(o.k) + 3) % icons.length]; else o.s *= 1.6; return { x: o.x, y: o.y }; }); found = [];
    const add = 50 / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  deal();
  const scene = (c, L, oy, t) => { c.save(); c.beginPath(); rr(c, ox, oy, W, Hh, 14); c.clip(); c.fillStyle = th.hx ? '#3A2E20' : '#F1E2C2'; c.fillRect(ox, oy, W, Hh); c.fillStyle = th.hx ? '#4A3A28' : '#D9C29A'; c.fillRect(ox, oy + Hh - 40, W, 40); for (const o of L) { if (o.hide) continue; c.save(); c.translate(ox + o.x, oy + o.y); c.scale(o.s, o.s); DRAW[o.k](c, 0, 0, 0); c.restore(); } c.restore(); };
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .8) return; const oy = d.y > oyB ? oyB : oyA, lx = d.x - ox, ly = d.y - oy; const hit = diffs.find((q, i) => !found.includes(i) && Math.hypot(q.x - lx, q.y - ly) < 28);
      if (hit) { found.push(diffs.indexOf(hit)); score += 20; tone(820, .12); burstAt(d.x, d.y); if (found.length === diffs.length) { score += 30 + Math.round(left); setTimeout(() => { if (!over) deal(); }, 900); } } else { miss = d; mT = .5; left = Math.max(0, left - 2); tone(160, .2); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); mT = Math.max(0, mT - dt); if (ban < .8) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, found.length + ' DE 5', 16, 27); scene(c, A, oyA, t); scene(c, B, oyB, t);
      c.strokeStyle = '#5FD39A'; c.lineWidth = 3; found.forEach(i => { [oyA, oyB].forEach(oy => { c.beginPath(); c.arc(ox + diffs[i].x, oy + diffs[i].y, 24, 0, 7); c.stroke(); }); });
      if (mT > 0 && miss) { c.strokeStyle = `rgba(239,111,97,${mT * 2})`; c.beginPath(); c.arc(miss.x, miss.y, 18, 0, 7); c.stroke(); }
      lab(c, th, 'Tocá lo que cambió en el dibujo de abajo', GW / 2, oyB - 12, 'center'); banner(c, th, 'Taller ' + round, ban); } };
}

// 10. Verdadero o falso rápido
const TF = [['Juan bautizaba en el río Jordán.', 1], ['Juan comía langostas y miel silvestre.', 1], ['Juan se vestía con ropa de seda.', 0], ['El Espíritu bajó sobre Jesús como una paloma.', 1], ['Jesús nació en Nazaret.', 0], ['Los magos siguieron una estrella.', 1], ['Los pastores trajeron oro, incienso y mirra.', 0], ['Jesús tenía doce años cuando se quedó en el templo.', 1], ['María y José encontraron a Jesús en el mercado.', 0], ['José era carpintero.', 1], ['Juan dijo que él era el Mesías.', 0], ['Juan llamó a Jesús «el Cordero de Dios».', 1], ['La familia huyó a Babilonia.', 0], ['Simeón tomó al niño en sus brazos en el templo.', 1], ['Jesús fue bautizado en el mar de Galilea.', 0], ['Una voz del cielo dijo: «Este es mi Hijo amado».', 1]];
function TrueFalse(th, f) {
  let deck = shuffle(TF.slice()), i = 0, q = deck[0], qt = 0, score = 0, lives = 3, streak = 0, over = false, fb = 0, fbOk = 0;
  const lim = () => Math.max(3.2, 7 - i * .15) / f, bt = [{ v: 1, x: 24, y: 400, w: 150, h: 70, s: 'Verdadero' }, { v: 0, x: GW - 174, y: 400, w: 150, h: 70, s: 'Falso' }];
  const answer = v => { if (over || fb > 0) return; const ok = v === q[1]; if (ok) { streak++; score += 10 + Math.min(30, streak * 3); tone(700 + streak * 30, .12); } else { streak = 0; lives--; tone(150, .3); if (lives <= 0) over = true; } fb = .7; fbOk = ok; };
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (k === 'left') answer(1); else if (k === 'right') answer(0); else if (k === 'tap') { const b = bt.find(b => d.x > b.x && d.x < b.x + b.w && d.y > b.y && d.y < b.y + b.h); if (b) answer(b.v); } },
    update(dt) { if (over) return; if (fb > 0) { fb -= dt; if (fb <= 0) { i++; if (i >= deck.length) { deck = shuffle(TF.slice()); i = 0; } q = deck[i]; qt = 0; } return; } qt += dt; if (qt > lim()) { answer(q[1] ? 0 : 1); } },
    draw(c, t) { skyBg(c, th, t); hearts(c, lives, 3); lab(c, th, 'RACHA ' + streak, GW - 16, 28, 'right'); card(c, th, 20, 90, GW - 40, 230, 22);
      const k = fb > 0 ? 0 : 1 - qt / lim(); c.fillStyle = th.hx ? '#E2AC55' : '#FF9636'; rr(c, 40, 296, (GW - 80) * Math.max(0, k), 8, 4); c.fill();
      c.font = '800 21px Nunito,sans-serif'; c.fillStyle = th.hx ? '#FFF1D6' : '#22407F'; c.textAlign = 'center'; wrapT(c, q[0], GW - 90).forEach((l, j, L) => c.fillText(l, GW / 2, 205 - (L.length - 1) * 14 + j * 28));
      if (fb > 0) { c.font = '900 18px Nunito,sans-serif'; c.fillStyle = fbOk ? '#24B37E' : '#EF6F61'; c.fillText(fbOk ? '¡Bien!' : (q[1] ? 'Era verdadero' : 'Era falso'), GW / 2, 130); }
      bt.forEach(b => { c.fillStyle = b.v ? '#5FC27E' : '#EF6F61'; rr(c, b.x, b.y, b.w, b.h, 18); c.fill(); c.fillStyle = '#FFFFFF'; c.font = '900 18px Nunito,sans-serif'; c.fillText(b.s, b.x + b.w / 2, b.y + 42); }); c.textAlign = 'left'; } };
}

// 11. Linterna en el desierto: encontrá lo escondido en la oscuridad
function Lantern(th, f) {
  let lx = GW / 2, ly = 300, items = [], score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, tt = 0; const pool = ['star', 'scroll', 'lamb', 'dove', 'honey', 'gift', 'lantern', 'orb'];
  function deal() { round++; items = []; for (let i = 0; i < 4 + round; i++) items.push({ k: pool[Math.floor(Math.random() * pool.length)], x: 30 + Math.random() * (GW - 60), y: 80 + Math.random() * (GH - 120), got: false }); const add = (20 + round * 6) / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || ban > .8) return; if (k === 'down' || k === 'move') { lx = d.x; ly = d.y - 40; } if (k === 'down' || k === 'up') { const it = items.find(o => !o.got && Math.hypot(o.x - lx, o.y - ly) < 70 && Math.hypot(o.x - d.x, o.y - d.y) < 36); if (it) { it.got = true; score += 15; tone(820, .12); burstAt(it.x, it.y); if (items.every(o => o.got)) { score += 20 + Math.round(left); setTimeout(() => { if (!over) deal(); }, 800); } } } },
    update(dt) { if (over) return; tt += dt; ban = Math.max(0, ban - dt); if (ban < .8) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { c.fillStyle = '#C9A86E'; c.fillRect(0, 0, GW, GH); for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(140,110,70,.35)'; c.beginPath(); c.ellipse((i * 97) % GW, 60 + (i * 53) % (GH - 60), 40, 12, 0, 0, 7); c.fill(); }
      for (const o of items) if (!o.got) DRAW[o.k](c, o.x, o.y, t);
      const g = c.createRadialGradient(lx, ly, 30, lx, ly, 95); g.addColorStop(0, 'rgba(6,5,12,0)'); g.addColorStop(1, 'rgba(6,5,12,.97)'); c.fillStyle = g; c.fillRect(0, 0, GW, GH); glowC(c, lx, ly, 40, '255,210,140');
      c.fillStyle = '#FFFFFF'; c.font = '900 12px Nunito,sans-serif'; c.fillText('ENCONTRADOS ' + items.filter(o => o.got).length + '/' + items.length, 16, 27); timeBar(c, { ...th, night: true }, left, full);
      if (round === 1 && tt < 4) { c.fillStyle = 'rgba(255,255,255,.8)'; c.font = '800 13px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText('Arrastrá la luz y tocá lo que encuentres', GW / 2, GH - 30); c.textAlign = 'left'; } banner(c, { ...th, hx: true }, 'Noche ' + round, ban); } };
}

// 12. Ritmo: tocá cuando las notas llegan a la línea
function Rhythm(th, f) {
  const lanes = [70, 180, 290], hitY = 440; let notes = [], sp = 0, score = 0, combo = 0, miss = 0, over = false, tt = 0, flash = [0, 0, 0], beat = 0;
  const hit = l => { flash[l] = .2; const n = notes.find(n => !n.done && n.l === l && Math.abs(n.y - hitY) < 38); if (n) { n.done = true; combo++; score += 10 + Math.min(20, combo); tone([523, 659, 784][l] * (combo % 8 === 0 ? 2 : 1), .18); burstAt(lanes[l], hitY); } else { combo = 0; } };
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over) return; if (k === 'left') hit(0); else if (k === 'up' || k === 'down') hit(1); else if (k === 'right') hit(2); else if (k === 'tap') hit(d.x < GW / 3 ? 0 : d.x < GW * 2 / 3 ? 1 : 2); },
    update(dt) { if (over) return; tt += dt; const bpm = (84 + tt * 1.2) * f, iv = 60 / bpm, v = 260 * f + tt * 3; sp -= dt; if (sp <= 0) { sp = iv * (Math.random() < .25 ? .5 : 1); notes.push({ l: Math.floor(Math.random() * 3), y: -20 }); }
      for (const n of notes) { n.y += v * dt; if (!n.done && n.y > hitY + 40) { n.done = true; n.missed = true; combo = 0; miss++; if (miss >= 6) over = true; } } notes = notes.filter(n => n.y < GH + 30 && !(n.done && !n.missed)); flash = flash.map(x => Math.max(0, x - dt)); },
    draw(c, t) { skyBg(c, th, t); lab(c, th, 'COMBO ' + combo, 16, 27); lab(c, th, 'FALLAS ' + miss + '/6', GW - 16, 27, 'right');
      lanes.forEach((x, l) => { c.fillStyle = th.hx ? 'rgba(233,195,122,.08)' : 'rgba(255,255,255,.35)'; rr(c, x - 46, 50, 92, GH - 70, 20); c.fill(); c.fillStyle = flash[l] ? '#FFE79A' : (th.hx ? 'rgba(233,195,122,.35)' : 'rgba(34,64,127,.18)'); c.beginPath(); c.arc(x, hitY, 32, 0, 7); c.fill(); });
      for (const n of notes) if (!n.done) { c.save(); c.translate(lanes[n.l], n.y); c.scale(1.1, 1.1); DRAW[['star', 'dove', 'orb'][n.l]](c, 0, 0, t); c.restore(); } } };
}

// 13. Uní los puntos en orden
const SHAPES = [{ n: 'La paloma', p: [[180, 120], [215, 140], [235, 175], [290, 160], [330, 190], [270, 225], [230, 260], [180, 290], [140, 250], [80, 270], [60, 230], [110, 200], [140, 170], [150, 135]] },
  { n: 'La estrella', p: [[180, 90], [205, 165], [285, 165], [220, 210], [245, 290], [180, 240], [115, 290], [140, 210], [75, 165], [155, 165]] },
  { n: 'La lámpara', p: [[110, 230], [150, 200], [215, 200], [245, 175], [275, 170], [265, 195], [250, 230], [215, 262], [150, 262], [115, 250]] }];
function Connect(th, f) {
  let sh, k = 0, score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, done = 0, miss = null, mT = 0; const order = shuffle([0, 1, 2]);
  function deal() { sh = SHAPES[order[round % 3]]; round++; k = 0; done = 0; const add = (12 + sh.p.length * 1.2) / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(kk, d) { if (over || kk !== 'tap' || ban > .8 || done) return; const p = sh.p[k]; if (Math.hypot(p[0] - d.x, p[1] + 60 - d.y) < 26) { k++; score += 5; tone(500 + k * 30, .08); if (k === sh.p.length) { done = 1.2; score += 40 + Math.round(left); burstAt(GW / 2, 260); tone(990, .4); setTimeout(() => { if (!over) deal(); }, 1300); } } else { miss = d; mT = .4; left = Math.max(0, left - 1.5); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); mT = Math.max(0, mT - dt); done = Math.max(0, done - dt); if (ban < .8 && !done) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, sh.n.toUpperCase(), 16, 27); const P = sh.p.map(([x, y]) => [x, y + 60]);
      if (k === P.length) { c.fillStyle = th.hx ? 'rgba(233,195,122,.35)' : 'rgba(255,200,80,.45)'; c.beginPath(); P.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fill(); }
      c.strokeStyle = th.hx ? '#E9C37A' : '#FF9636'; c.lineWidth = 4; c.lineJoin = 'round'; c.beginPath(); P.slice(0, k).forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); if (k === P.length) c.closePath(); c.stroke();
      P.forEach((p, i) => { c.fillStyle = i < k ? (th.hx ? '#E9C37A' : '#FF9636') : (th.hx ? '#2A2418' : '#FFFFFF'); c.strokeStyle = INK(th); c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], 13, 0, 7); c.fill(); c.stroke(); c.fillStyle = i < k ? '#1B1206' : INK(th); c.font = '900 12px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText(i + 1, p[0], p[1] + 4); c.textAlign = 'left'; });
      if (mT > 0 && miss) { c.strokeStyle = `rgba(239,111,97,${mT * 2})`; c.beginPath(); c.arc(miss.x, miss.y, 16, 0, 7); c.stroke(); }
      lab(c, th, 'Tocá los puntos del 1 en adelante', GW / 2, GH - 24, 'center'); banner(c, th, sh.n, ban); } };
}
/* ===== juegos de Galilea: tinajas, letras del rollo, redes, remos, caños, lámparas y pares ===== */
const FISH_C = ['#9AB8C2', '#C9A26A', '#8FA88A', '#B88A7A'];
DRAW.fish = (c, x, y, t, k) => { const col = FISH_C[(k || 0) % 4]; c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 14, 7, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-12, 0); c.lineTo(-22, -7 + Math.sin(t * 9) * 2); c.lineTo(-22, 7 + Math.sin(t * 9) * 2); c.closePath(); c.fill(); c.fillStyle = '#1B1206'; c.beginPath(); c.arc(8, -2, 1.8, 0, 7); c.fill(); c.restore(); };
const jarPath = (c, x, y, w, h) => { c.beginPath(); c.moveTo(x - w * .38, y); c.quadraticCurveTo(x - w * .62, y - h * .55, x - w * .4, y - h * .92); c.lineTo(x + w * .4, y - h * .92); c.quadraticCurveTo(x + w * .62, y - h * .55, x + w * .38, y); c.closePath(); };
// 1. Llená las tinajas (mantener apretado y soltar a tiempo)
function Pour(th, f) {
  let jars = [], cur = 0, pouring = false, score = 0, lives = 3, over = false, left = 50 / f, full = 50 / f, round = 0, ban = 0, wine = 0, msg = '', mT = 0, splashT = 0;
  function deal() { round++; jars = Array.from({ length: 6 }, (_, i) => ({ lv: 0, ok: false, x: 52 + (i % 3) * 128, y: i < 3 ? 250 : 430 })); cur = 0; wine = 0; ban = 1.4; }
  deal();
  const sp = () => (.32 + round * .08 + cur * .03) * f;
  const finish = () => { const j = jars[cur]; if (j.lv >= .86 && j.lv <= 1) { j.ok = true; const perfect = j.lv >= .93; score += perfect ? 30 : 20; msg = perfect ? '¡Perfecto!' : '¡Bien!'; mT = .7; tone(perfect ? 880 : 660, .15); burstAt(j.x, j.y - 120); } else if (j.lv < .86) { msg = 'Falta agua'; mT = .7; tone(300, .2); return; } cur++; if (cur >= 6) { wine = 1.6; score += 50; left += 14 / f; full = Math.max(full, left); tone(990, .5); setTimeout(() => { if (!over) deal(); }, 1700); } };
  return { get score() { return score }, get over() { return over },
    input(k) { if (over || ban > .6 || wine > 0 || cur >= 6) return; if (k === 'down') pouring = true; if (k === 'up' && pouring) { pouring = false; finish(); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); mT = Math.max(0, mT - dt); splashT = Math.max(0, splashT - dt); if (wine > 0) wine = Math.max(0, wine - dt);
      if (ban < .6 && !wine) left -= dt; if (left <= 0) { left = 0; over = true; }
      if (pouring && cur < 6) { const j = jars[cur]; j.lv += sp() * dt; if (j.lv > 1.06) { pouring = false; j.lv = 0; lives--; splashT = .5; msg = '¡Rebalsó!'; mT = .8; tone(180, .3); if (lives <= 0) over = true; } } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); hearts(c, lives, 3); lab(c, th, 'TINAJAS ' + Math.min(cur, 6) + '/6', GW / 2, 50, 'center');
      jars.forEach((j, i) => { const w = 84, h = 130; c.fillStyle = th.hx ? '#6E665A' : '#C9C1B4'; jarPath(c, j.x, j.y, w, h); c.fill();
        c.save(); jarPath(c, j.x, j.y, w, h); c.clip(); const lv = Math.min(1.06, j.lv), turned = j.ok && (wine > 0 && wine < 1.2 || (round > 0 && cur >= 6 && wine === 0)); c.fillStyle = turned ? '#8E1E3A' : '#5FA8D8'; c.fillRect(j.x - w, j.y - h * .92 * lv, w * 2, h * lv); c.restore();
        c.strokeStyle = INK(th); c.lineWidth = 2; jarPath(c, j.x, j.y, w, h); c.stroke(); c.strokeStyle = '#E6B84A'; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(j.x - 30, j.y - h * .92 * .86); c.lineTo(j.x + 30, j.y - h * .92 * .86); c.stroke(); c.setLineDash([]);
        if (i === cur && !wine) { c.fillStyle = th.hx ? '#E9C37A' : '#FF9636'; c.beginPath(); c.moveTo(j.x, j.y - h - 34); c.lineTo(j.x - 8, j.y - h - 48); c.lineTo(j.x + 8, j.y - h - 48); c.fill(); if (pouring) { c.fillStyle = 'rgba(95,168,216,.85)'; c.fillRect(j.x - 3, j.y - h - 30, 6, h * .92 * (1 - Math.min(1, j.lv)) + 30); } } });
      if (splashT > 0) { c.fillStyle = `rgba(95,168,216,${splashT})`; c.fillRect(0, 0, GW, GH); }
      if (mT > 0) banner(c, th, msg, mT * 1.5); lab(c, th, 'Mantené apretado para llenar · soltá en la franja dorada', GW / 2, GH - 18, 'center');
      banner(c, th, wine > 0 ? '¡El agua se volvió vino!' : 'Ronda ' + round, wine > 0 ? wine : ban); } };
}
// 2. Letras del rollo (formá la palabra tocando las letras en orden)
const SPELL_W = ['ISAÍAS', 'ROLLO', 'ESPÍRITU', 'UNGIDO', 'LIBERTAD', 'POBRES', 'NAZARET', 'SINAGOGA', 'NOTICIA', 'VISTA'];
function Spell(th, f) {
  let word = '', got = 0, tiles = [], score = 0, over = false, left = 40 / f, full = 40 / f, round = 0, ban = 0, miss = null, mT = 0; const order = shuffle(SPELL_W.slice());
  function deal() { word = order[round % order.length]; round++; got = 0; const ab = 'AEIOURSNLTDCMPBG', L = word.split(''); while (L.length < 14) L.push(ab[Math.floor(Math.random() * ab.length)]); tiles = shuffle(L).map((ch, i) => ({ ch, x: 40 + (i % 5) * 70, y: 250 + Math.floor(i / 5) * 78, ph: Math.random() * 6, used: false })); ban = 1.2; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .7) return; const q = tiles.find(q => !q.used && Math.hypot(q.x - d.x, q.y + Math.sin(q.ph) * 6 - d.y) < 30); if (!q) return;
      if (q.ch === word[got]) { q.used = true; got++; score += 8; tone(440 + got * 50, .1); if (got === word.length) { score += 30 + word.length * 4; left += 7 / f; full = Math.max(full, left); burstAt(GW / 2, 150); tone(990, .35); setTimeout(() => { if (!over) deal(); }, 700); } } else { miss = q; mT = .4; left = Math.max(0, left - 2); tone(170, .2); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); mT = Math.max(0, mT - dt); tiles.forEach(q => q.ph += dt * 1.6); if (ban < .7) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'PALABRA ' + round, 16, 27); card(c, th, 16, 60, GW - 32, 120);
      c.textAlign = 'center'; c.font = '900 30px Nunito,sans-serif'; const s = word.split('').map((ch, i) => i < got ? ch : '_').join(' '); c.fillStyle = th.hx ? '#FFE3A6' : '#22407F'; c.fillText(s, GW / 2, 132); c.font = '700 12px Nunito,sans-serif'; c.fillText('Del rollo de Isaías · Lucas 4:18', GW / 2, 162); c.textAlign = 'left';
      tiles.forEach(q => { if (q.used) return; const y = q.y + Math.sin(q.ph) * 6, sx = q === miss && mT > 0 ? Math.sin(mT * 60) * 4 : 0; c.fillStyle = q === miss && mT > 0 ? '#FFD9D3' : th.hx ? '#2A2418' : '#FFF6E0'; c.beginPath(); c.arc(q.x + sx, y, 27, 0, 7); c.fill(); c.strokeStyle = th.hx ? '#E9C37A' : '#C9A04A'; c.lineWidth = 2; c.stroke(); c.fillStyle = INK(th); c.font = '900 22px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText(q.ch, q.x + sx, y + 8); c.textAlign = 'left'; });
      banner(c, th, 'Palabra ' + round, ban); } };
}
// 3. Redes en el lago (tocá para tirar la red)
function Net(th, f) {
  let bx = GW / 2, dir = 1, fish = [], net = null, nets = 8, score = 0, over = false, tt = 0, sp = 0, combo = 0, msg = '', mT = 0; const sea = 150;
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || net) return; if (nets <= 0) return; nets--; net = { x: bx, y: sea + 6, v: 260 * f, down: true, got: [] }; tone(300, .08); },
    update(dt) { if (over) return; tt += dt; mT = Math.max(0, mT - dt); bx += dir * (70 + tt * 1.2) * f * dt; if (bx > GW - 40) { bx = GW - 40; dir = -1; } if (bx < 40) { bx = 40; dir = 1; }
      sp -= dt; if (sp <= 0) { sp = (.5 + Math.random() * .6) / f; const l = Math.random() < .5; fish.push({ x: l ? -30 : GW + 30, y: sea + 50 + Math.random() * 300, v: (40 + Math.random() * 70) * f * (l ? 1 : -1), k: Math.floor(Math.random() * 4), big: Math.random() < .12 }); }
      fish.forEach(q => q.x += q.v * dt); fish = fish.filter(q => q.x > -60 && q.x < GW + 60 && !q.caught);
      if (net) { if (net.down) { net.y += net.v * dt; if (net.y > GH - 30) net.down = false; } else net.y -= net.v * 1.3 * dt;
        fish.forEach(q => { if (!q.caught && Math.abs(q.x - net.x) < 30 && Math.abs(q.y - net.y) < 22) { q.caught = true; net.got.push(q); } });
        if (!net.down && net.y <= sea + 6) { const n = net.got.length; if (n) { const pts = net.got.reduce((s, q) => s + (q.big ? 30 : 10), 0) * (n > 2 ? 2 : 1); score += pts; combo++; msg = n > 2 ? '¡Redes llenas! ×2' : '+' + pts; mT = .8; tone(600 + n * 80, .2); burstAt(net.x, sea); if (n > 2) nets++; } else { combo = 0; msg = 'Nada esta vez'; mT = .6; } net = null; if (nets <= 0) setTimeout(() => { over = true; }, 300); } } },
    draw(c, t) { skyBg(c, th, t); const g = c.createLinearGradient(0, sea, 0, GH); g.addColorStop(0, th.hx ? '#1E3E48' : '#5FB4E6'); g.addColorStop(1, th.hx ? '#0C1C22' : '#2E6E9A'); c.fillStyle = g; c.fillRect(0, sea, GW, GH - sea);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= GW; x += 8) c.lineTo(x, sea + Math.sin(x * .05 + t * 2) * 3); c.stroke();
      fish.forEach(q => { c.save(); c.translate(q.x, q.y); if (q.v < 0) c.scale(-1, 1); if (q.big) c.scale(1.6, 1.6); DRAW.fish(c, 0, 0, t, q.k); c.restore(); });
      c.fillStyle = '#7A5234'; c.beginPath(); c.moveTo(bx - 46, sea - 10); c.quadraticCurveTo(bx, sea + 16, bx + 46, sea - 10); c.closePath(); c.fill(); c.strokeStyle = '#5A3A22'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, sea - 10); c.lineTo(bx, sea - 70); c.stroke(); c.fillStyle = '#F3EBDD'; c.beginPath(); c.moveTo(bx + 2, sea - 68); c.lineTo(bx + 34, sea - 18); c.lineTo(bx + 2, sea - 18); c.fill();
      if (net) { c.strokeStyle = '#D9CBA6'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, sea - 4); c.lineTo(net.x, net.y - 20); c.stroke(); c.save(); c.translate(net.x, net.y); c.beginPath(); c.arc(0, 0, 30, 0, Math.PI); c.stroke(); for (let i = -24; i <= 24; i += 8) { c.beginPath(); c.moveTo(i, -2); c.lineTo(i * .7, 24); c.stroke(); } net.got.forEach((q, i) => DRAW.fish(c, -14 + (i % 3) * 14, 8 + Math.floor(i / 3) * 8, t, q.k)); c.restore(); }
      lab(c, th, 'REDES ' + nets, 16, 27); lab(c, th, 'Tocá para tirar la red', GW - 16, 27, 'right'); if (mT > 0) banner(c, th, msg, mT * 1.5); } };
}
// 4. Remá mar adentro (tocá alternando izquierda y derecha)
function Row(th, f) {
  let x = GW / 2, speed = 0, last = null, dist = 0, goal = 500, rocks = [], sp = 0, score = 0, over = false, left = 45 / f, full = 45 / f, round = 1, ban = 1.2, hit = 0, tt = 0, oarL = 0, oarR = 0;
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || ban > .6) return; let s = null; if (k === 'tap') s = d.x < GW / 2 ? 'L' : 'R'; if (k === 'left') s = 'L'; if (k === 'right') s = 'R'; if (!s) return;
      if (s === 'L') { oarL = .25; x += 14; } else { oarR = .25; x -= 14; } x = Math.max(40, Math.min(GW - 40, x));
      if (last && last !== s) { speed = Math.min(260, speed + 34); tone(s === 'L' ? 392 : 440, .05); } else speed = Math.max(40, speed - 20); last = s; },
    update(dt) { if (over) return; tt += dt; ban = Math.max(0, ban - dt); hit = Math.max(0, hit - dt); oarL = Math.max(0, oarL - dt); oarR = Math.max(0, oarR - dt); if (ban < .6) left -= dt; if (left <= 0) { left = 0; over = true; }
      speed = Math.max(0, speed - 55 * dt); const v = speed * f; dist += v * dt * .25; rocks.forEach(r => r.y += v * dt);
      sp -= v * dt; if (sp <= 0) { sp = 140 + Math.random() * 120; rocks.push({ x: 30 + Math.random() * (GW - 60), y: -30, r: 14 + Math.random() * 12 }); }
      rocks.forEach(r => { if (!r.hit && Math.abs(r.x - x) < r.r + 18 && Math.abs(r.y - 420) < r.r + 26) { r.hit = true; hit = .5; speed *= .2; left = Math.max(0, left - 3); tone(150, .3); } }); rocks = rocks.filter(r => r.y < GH + 40);
      if (dist >= goal) { score += 60 + Math.round(left) * 2; round++; goal = dist + 500 + round * 80; left += 18 / f; full = Math.max(full, left); ban = 1.4; burstAt(GW / 2, 200); tone(990, .4); } score = Math.max(score, Math.floor(dist / 10) + (round - 1) * 60); },
    draw(c, t) { const g = c.createLinearGradient(0, 0, 0, GH); g.addColorStop(0, th.hx ? '#1E3E48' : '#7FC4F0'); g.addColorStop(1, th.hx ? '#0C1C22' : '#3E86B8'); c.fillStyle = g; c.fillRect(0, 0, GW, GH);
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { const y = ((i * 70 + dist * 4) % (GH + 70)) - 35; c.beginPath(); for (let xx = 0; xx <= GW; xx += 12) c.lineTo(xx, y + Math.sin(xx * .04 + i) * 5); c.stroke(); }
      rocks.forEach(r => { c.fillStyle = th.hx ? '#4A4438' : '#8C8374'; c.beginPath(); c.ellipse(r.x, r.y, r.r, r.r * .8, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(r.x, r.y + 4, r.r + 6, r.r * .5, 0, 0, Math.PI); c.stroke(); });
      c.save(); c.translate(x, 420); if (hit > 0) c.rotate(Math.sin(hit * 40) * .1); c.fillStyle = '#7A5234'; c.beginPath(); c.ellipse(0, 0, 22, 44, 0, 0, 7); c.fill(); c.fillStyle = '#C08A55'; c.fillRect(-16, -6, 32, 6); c.strokeStyle = '#C08A55'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-18, 0); c.lineTo(-48, oarL > 0 ? 20 : -14); c.stroke(); c.beginPath(); c.moveTo(18, 0); c.lineTo(48, oarR > 0 ? 20 : -14); c.stroke(); c.restore();
      const k = Math.min(1, (dist % 100000) / goal); lab(c, th, 'MAR ADENTRO ' + Math.round(Math.min(100, (dist / goal) * 100)) + '%', 16, 27); timeBar(c, th, left, full);
      c.fillStyle = th.hx ? 'rgba(233,195,122,.25)' : 'rgba(255,255,255,.5)'; rr(c, 16, 44, GW - 32, 8, 4); c.fill(); c.fillStyle = th.hx ? '#E9C37A' : '#FF9636'; rr(c, 16, 44, Math.max(8, (GW - 32) * Math.min(1, dist / goal)), 8, 4); c.fill();
      lab(c, th, 'Tocá izquierda y derecha, alternando', GW / 2, GH - 18, 'center'); banner(c, th, round > 1 ? '¡Más adentro! Etapa ' + round : 'A los remos', ban); } };
}
// 5. Agua para el pueblo (girá los caños para unir el pozo con el pueblo)
function Pipes(th, f) {
  const N = 5, CS = 62, ox = (GW - N * CS) / 2, oy = 150; let grid = [], score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, flow = 0, src = 0, dst = 0;
  const D = [[0, -1], [1, 0], [0, 1], [-1, 0]], conn = (t) => ({ I: [0, 2], L: [0, 1], T: [0, 1, 2] }[t.k].map(s => (s + t.r) % 4));
  function deal() { round++; flow = 0; src = Math.floor(Math.random() * N); dst = Math.floor(Math.random() * N); const path = []; let x = 0, y = src; const seen = new Set(); path.push([x, y]); seen.add(x + ',' + y);
    while (!(x === N - 1 && y === dst)) { const opts = []; if (x < N - 1) opts.push([1, 0], [1, 0]); if (y < N - 1) opts.push([0, 1]); if (y > 0) opts.push([0, -1]); if (x === N - 1) opts.length = 0, opts.push(y < dst ? [0, 1] : [0, -1]); const nb = opts.map(([a, b]) => [x + a, y + b]).filter(([a, b]) => !seen.has(a + ',' + b)); const n = nb.length ? nb[Math.floor(Math.random() * nb.length)] : [x + 1, y]; x = n[0]; y = n[1]; seen.add(x + ',' + y); path.push([x, y]); }
    grid = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ k: ['I', 'L', 'T'][Math.floor(Math.random() * 3)], r: Math.floor(Math.random() * 4), on: false })));
    path.forEach(([px, py], i) => { const prev = i ? path[i - 1] : [-1, src], next = i < path.length - 1 ? path[i + 1] : [N, dst], a = D.findIndex(([dx, dy]) => px + dx === prev[0] && py + dy === prev[1]), b = D.findIndex(([dx, dy]) => px + dx === next[0] && py + dy === next[1]); grid[py][px] = { k: (a + 2) % 4 === b ? 'I' : 'L', r: Math.floor(Math.random() * 4), on: false }; });
    const add = (22 + round * 4) / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; check(); }
  function check() { grid.forEach(r => r.forEach(t => t.on = false)); const q = [[0, src, 3]]; let ok = false; const vis = new Set();
    while (q.length) { const [x, y, from] = q.shift(); if (x < 0 || y < 0 || x >= N || y >= N) continue; const t = grid[y][x], cs = conn(t); if (!cs.includes(from)) continue; const key = x + ',' + y; if (vis.has(key)) continue; vis.add(key); t.on = true; for (const s of cs) { if (s === from) continue; const [dx, dy] = D[s]; if (x + dx === N && y + dy === dst && s === 1) ok = true; q.push([x + dx, y + dy, (s + 2) % 4]); } }
    return ok; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .7 || flow) return; const gx = Math.floor((d.x - ox) / CS), gy = Math.floor((d.y - oy) / CS); if (gx < 0 || gy < 0 || gx >= N || gy >= N) return; grid[gy][gx].r = (grid[gy][gx].r + 1) % 4; tone(500, .05); if (check()) { flow = 1.4; score += 60 + Math.round(left) * 2; tone(880, .4); burstAt(GW - 30, oy + dst * CS + CS / 2); setTimeout(() => { if (!over) deal(); }, 1500); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); flow = Math.max(0, flow - dt); if (ban < .7 && !flow) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'POZO ' + round, 16, 27); lab(c, th, 'Girá los caños hasta que el agua llegue al pueblo', GW / 2, 120, 'center');
      c.fillStyle = th.hx ? '#6E665A' : '#9C9286'; c.beginPath(); c.arc(ox - 8, oy + src * CS + CS / 2, 16, 0, 7); c.fill(); c.fillStyle = '#5FA8D8'; c.beginPath(); c.arc(ox - 8, oy + src * CS + CS / 2, 9, 0, 7); c.fill();
      c.fillStyle = th.hx ? '#C8B08A' : '#F4E3C3'; c.fillRect(ox + N * CS + 2, oy + dst * CS + 14, 22, 30); c.fillStyle = '#8A6A44'; c.beginPath(); c.moveTo(ox + N * CS - 2, oy + dst * CS + 16); c.lineTo(ox + N * CS + 13, oy + dst * CS + 2); c.lineTo(ox + N * CS + 28, oy + dst * CS + 16); c.fill();
      grid.forEach((row, y) => row.forEach((tl, x) => { const cx = ox + x * CS + CS / 2, cy = oy + y * CS + CS / 2; c.fillStyle = th.hx ? '#2A2418' : 'rgba(255,255,255,.75)'; rr(c, cx - CS / 2 + 2, cy - CS / 2 + 2, CS - 4, CS - 4, 10); c.fill();
        c.strokeStyle = tl.on ? '#5FA8D8' : (th.hx ? '#8A7A5A' : '#B8AFA2'); c.lineWidth = 12; c.lineCap = 'round'; conn(tl).forEach(s => { const [dx, dy] = D[s]; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + dx * CS / 2, cy + dy * CS / 2); c.stroke(); }); }));
      banner(c, th, flow ? '¡Agua viva para el pueblo!' : 'Pozo ' + round, flow || ban); } };
}
// 6. Luz del mundo (encendé todas las lámparas)
function Lights(th, f) {
  const N = 4, CS = 72, ox = (GW - N * CS) / 2, oy = 170; let on = [], moves = 0, score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, done = 0;
  const press = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < N && b < N) on[b * N + a] = !on[b * N + a]; });
  function deal() { round++; moves = 0; done = 0; on = Array(N * N).fill(true); const k = Math.min(8, 2 + round); for (let i = 0; i < k; i++) press(Math.floor(Math.random() * N), Math.floor(Math.random() * N)); if (on.every(Boolean)) press(1, 1); const add = (18 + round * 5) / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .7 || done) return; const x = Math.floor((d.x - ox) / CS), y = Math.floor((d.y - oy) / CS); if (x < 0 || y < 0 || x >= N || y >= N) return; press(x, y); moves++; tone(on[y * N + x] ? 660 : 330, .06);
      if (on.every(Boolean)) { done = 1.4; score += 50 + Math.round(left) * 2 + Math.max(0, 20 - moves) * 2; tone(990, .45); burstAt(GW / 2, oy + CS * 2); setTimeout(() => { if (!over) deal(); }, 1500); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); done = Math.max(0, done - dt); if (ban < .7 && !done) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'COLINA ' + round, 16, 27); lab(c, th, 'Cada lámpara cambia junto con sus vecinas', GW / 2, 140, 'center'); lab(c, th, 'Toques: ' + moves, GW / 2, oy + N * CS + 28, 'center');
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const cx = ox + x * CS + CS / 2, cy = oy + y * CS + CS / 2, lit = on[y * N + x];
        if (lit) { const g = c.createRadialGradient(cx, cy - 6, 2, cx, cy - 6, 34); g.addColorStop(0, 'rgba(255,214,120,.9)'); g.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy - 6, 34, 0, 7); c.fill(); }
        c.fillStyle = th.hx ? '#8A6A44' : '#B4704A'; c.beginPath(); c.ellipse(cx, cy + 10, 22, 10, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(cx + 16, cy + 6); c.lineTo(cx + 30, cy + 2); c.lineTo(cx + 18, cy + 14); c.fill();
        c.fillStyle = lit ? '#FFC94A' : 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(cx + 28, cy + 2); c.quadraticCurveTo(cx + 34, cy - 12 - Math.sin(t * 8 + x + y) * 2, cx + 28, cy - 18); c.quadraticCurveTo(cx + 22, cy - 10, cx + 28, cy + 2); if (lit) c.fill(); }
      lab(c, th, 'Mateo 5:14-16', GW / 2, GH - 18, 'center'); banner(c, th, done ? '¡Que brille tu luz!' : 'Colina ' + round, done || ban); } };
}
// 7. Lugares y momentos (uní cada par)
const MATCH_SETS = [
  [['Caná', 'Agua convertida en vino'], ['Nazaret', 'El rollo de Isaías'], ['Capernaúm', 'Su casa junto al lago'], ['Pozo de Jacob', 'El agua viva'], ['El monte', 'Las bienaventuranzas']],
  [['María', '«Hagan lo que él les diga»'], ['Simón', 'Tiró las redes otra vez'], ['La samaritana', 'Contó a todo el pueblo'], ['Santiago y Juan', 'Dejaron la barca de su padre'], ['Isaías', 'El profeta del rollo']],
  [['Las tinajas', 'La primera señal'], ['Las redes llenas', 'Pescadores de personas'], ['La lámpara', 'Luz del mundo'], ['El pozo', 'Vida eterna'], ['El rollo', 'Buena Noticia a los pobres']]
];
function Match(th, f) {
  let L = [], Rr = [], sel = null, pairs = [], score = 0, over = false, left = 0, full = 0, round = 0, ban = 0, bad = null, bT = 0; const order = shuffle([0, 1, 2]);
  function deal() { const set = MATCH_SETS[order[round % 3]]; round++; pairs = []; sel = null; L = set.map(([a], i) => ({ s: a, i, x: 14, y: 140 + i * 66, w: 150, h: 52 })); Rr = shuffle(set.map(([, b], i) => ({ s: b, i }))).map((q, j) => ({ ...q, x: GW - 14 - 168, y: 140 + j * 66, w: 168, h: 52 })); const add = 30 / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  deal();
  const hitBox = (list, d) => list.find(q => !q.done && d.x > q.x && d.x < q.x + q.w && d.y > q.y && d.y < q.y + q.h);
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .7) return; const a = hitBox(L, d); if (a) { sel = a; tone(520, .05); return; } const b = hitBox(Rr, d); if (!b || !sel) return;
      if (b.i === sel.i) { sel.done = b.done = true; pairs.push([sel, b]); score += 25; tone(700 + pairs.length * 60, .12); burstAt(b.x + b.w / 2, b.y + 26); sel = null; if (pairs.length === L.length) { score += 30 + Math.round(left); setTimeout(() => { if (!over) deal(); }, 900); } }
      else { bad = b; bT = .4; left = Math.max(0, left - 3); tone(160, .25); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); bT = Math.max(0, bT - dt); if (ban < .7) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'PARES ' + pairs.length + '/' + L.length, 16, 27); lab(c, th, 'Tocá a la izquierda y después su pareja a la derecha', GW / 2, 118, 'center');
      c.strokeStyle = th.hx ? '#E9C37A' : '#FF9636'; c.lineWidth = 3; pairs.forEach(([a, b]) => { c.beginPath(); c.moveTo(a.x + a.w, a.y + 26); c.lineTo(b.x, b.y + 26); c.stroke(); });
      const box = (q, side) => { const sx = q === bad && bT > 0 ? Math.sin(bT * 60) * 4 : 0, active = q === sel; c.fillStyle = q.done ? (th.hx ? 'rgba(233,195,122,.25)' : 'rgba(255,200,80,.35)') : active ? (th.hx ? '#4A3A1E' : '#FFE7B0') : q === bad && bT > 0 ? '#FFD9D3' : (th.hx ? '#2A2418' : '#FFFFFF'); rr(c, q.x + sx, q.y, q.w, q.h, 12); c.fill(); if (active) { c.strokeStyle = th.hx ? '#E9C37A' : '#FF9636'; c.lineWidth = 2; c.stroke(); }
        c.fillStyle = INK(th); c.font = (side ? '700 11.5px' : '800 13px') + ' Nunito,sans-serif'; c.textAlign = 'center'; const words = q.s.split(' '); let l1 = '', l2 = ''; words.forEach(w => { if ((l1 + ' ' + w).trim().length <= (side ? 22 : 18) && !l2) l1 = (l1 + ' ' + w).trim(); else l2 = (l2 + ' ' + w).trim(); }); c.fillText(l1, q.x + sx + q.w / 2, q.y + (l2 ? 22 : 31)); if (l2) c.fillText(l2, q.x + sx + q.w / 2, q.y + 38); c.textAlign = 'left'; };
      L.forEach(q => box(q, 0)); Rr.forEach(q => box(q, 1)); banner(c, th, 'Ronda ' + round, ban); } };
}

/* ===== juegos de los milagros: calma, techo, panes, manto, vista, agua y clasificar ===== */
DRAW.bread = (c, x, y) => { c.save(); c.translate(x, y); c.fillStyle = '#D9A25A'; c.beginPath(); c.ellipse(0, 0, 15, 9, 0, 0, 7); c.fill(); c.strokeStyle = '#A8733A'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -5); c.lineTo(-3, 4); c.moveTo(1, -6); c.lineTo(4, 4); c.stroke(); c.restore(); };
// 1. Calmá la tormenta (pintá todo el mar de un solo color)
function Flood(th, f) {
  const PAL = ['#2E4A6E', '#4A6E8A', '#7FA8C4', '#5A5A72', '#9AC8D8'];
  let N = 8, K = 4, grid = [], moves = 0, maxM = 0, score = 0, over = false, round = 0, ban = 0, done = 0, left = 60 / f, full = 60 / f;
  function deal() { round++; N = Math.min(11, 7 + round); K = Math.min(5, 3 + round); grid = Array.from({ length: N * N }, () => Math.floor(Math.random() * K)); moves = 0; maxM = Math.round(N * 1.9 + K * 1.4); ban = 1.3; done = 0; left += round > 1 ? 18 / f : 0; full = Math.max(full, left); }
  function paint(col) { const old = grid[0]; if (old === col) return; const st = [0], seen = new Set([0]); while (st.length) { const i = st.pop(); grid[i] = col; const x = i % N, y = Math.floor(i / N); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy; if (a < 0 || b < 0 || a >= N || b >= N) return; const j = b * N + a; if (!seen.has(j) && grid[j] === old) { seen.add(j); st.push(j); } }); } }
  deal();
  const cs = () => Math.floor(300 / N), ox = () => (GW - cs() * N) / 2, oy = 92;
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .7 || done) return; const by = oy + cs() * N + 22; if (d.y < by || d.y > by + 54) return; const bw = (GW - 32) / K, i = Math.floor((d.x - 16) / bw); if (i < 0 || i >= K) return; paint(i); moves++; tone(330 + i * 70, .07);
      if (grid.every(v => v === grid[0])) { done = 1.6; score += 60 + Math.max(0, maxM - moves) * 8; tone(990, .45); burstAt(GW / 2, 220); setTimeout(() => { if (!over) deal(); }, 1600); } else if (moves >= maxM) { left = Math.max(0, left - 10); moves = 0; tone(160, .3); grid = Array.from({ length: N * N }, () => Math.floor(Math.random() * K)); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); done = Math.max(0, done - dt); if (ban < .7 && !done) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'MAR ' + round + ' · ' + moves + '/' + maxM, 16, 27); lab(c, th, 'Empezá arriba a la izquierda y calmá todo el mar', GW / 2, 78, 'center');
      const s = cs(), x0 = ox(); grid.forEach((v, i) => { c.fillStyle = PAL[v]; c.fillRect(x0 + (i % N) * s, oy + Math.floor(i / N) * s, s + .5, s + .5); }); c.strokeStyle = INK(th); c.lineWidth = 2; c.strokeRect(x0, oy, s * N, s * N);
      const by = oy + s * N + 22, bw = (GW - 32) / K; for (let i = 0; i < K; i++) { c.fillStyle = PAL[i]; rr(c, 16 + i * bw + 4, by, bw - 8, 50, 14); c.fill(); }
      banner(c, th, done ? '¡Hubo una gran calma!' : 'Mar ' + round, done || ban); } };
}
// 2. El techo abierto (sacá solo las tejas marcadas)
function Roof(th, f) {
  const C = 6, R = 6, S = 52, ox = (GW - C * S) / 2, oy = 120; let tiles = [], tgt = null, score = 0, over = false, round = 0, ban = 0, done = 0, left = 0, full = 0, bad = null, bT = 0, low = 0;
  function deal() { round++; done = 0; low = 0; const w = 2 + Math.floor(Math.random() * 2), h = 2 + (round > 2 ? 1 : 0); const x = Math.floor(Math.random() * (C - w + 1)), y = Math.floor(Math.random() * (R - h + 1)); tgt = { x, y, w, h }; tiles = Array.from({ length: C * R }, () => true); const add = (10 + w * h * 1.2) / f; left = round === 1 ? add + 6 : left + add; full = Math.max(full, left); ban = 1.2; }
  deal();
  const inT = (x, y) => x >= tgt.x && x < tgt.x + tgt.w && y >= tgt.y && y < tgt.y + tgt.h;
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || ban > .7 || done) return; const x = Math.floor((d.x - ox) / S), y = Math.floor((d.y - oy) / S); if (x < 0 || y < 0 || x >= C || y >= R || !tiles[y * C + x]) return;
      if (inT(x, y)) { tiles[y * C + x] = false; score += 6; tone(500 + Math.random() * 200, .05); burstAt(ox + x * S + S / 2, oy + y * S + S / 2); let all = true; for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) if (inT(i, j) && tiles[j * C + i]) all = false; if (all) { done = 2; score += 40 + Math.round(left); tone(880, .4); setTimeout(() => { if (!over) deal(); }, 2000); } }
      else { bad = [x, y]; bT = .5; left = Math.max(0, left - 3); tone(150, .25); } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); bT = Math.max(0, bT - dt); if (done) { done = Math.max(0, done - dt); low = Math.min(1, low + dt * .8); } if (ban < .7 && !done) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'CASA ' + round, 16, 27); lab(c, th, 'Sacá solo las tejas marcadas para bajar la camilla', GW / 2, 100, 'center');
      c.fillStyle = th.hx ? '#3A2E20' : '#E9D7B4'; c.fillRect(ox, oy, C * S, R * S); const g = c.createRadialGradient(ox + C * S / 2, oy + R * S / 2, 10, ox + C * S / 2, oy + R * S / 2, 160); g.addColorStop(0, 'rgba(255,240,190,.9)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.fillRect(ox, oy, C * S, R * S);
      for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) { if (!tiles[j * C + i]) continue; const x = ox + i * S, y = oy + j * S, sx = bad && bad[0] === i && bad[1] === j && bT > 0 ? Math.sin(bT * 60) * 3 : 0; c.fillStyle = (i + j) % 2 ? '#A8724A' : '#B8805A'; rr(c, x + 2 + sx, y + 2, S - 4, S - 4, 6); c.fill(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 4 + sx, y + S / 2); c.lineTo(x + S - 4 + sx, y + S / 2); c.stroke(); }
      c.setLineDash([6, 5]); c.strokeStyle = '#FFF2B0'; c.lineWidth = 3; c.strokeRect(ox + tgt.x * S + 2, oy + tgt.y * S + 2, tgt.w * S - 4, tgt.h * S - 4); c.setLineDash([]);
      if (done) { const cx = ox + (tgt.x + tgt.w / 2) * S, top = oy - 40 + low * (tgt.y * S + tgt.h * S / 2 + 40); c.strokeStyle = '#C9B48A'; c.lineWidth = 2; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(cx + s * 26, oy - 40); c.lineTo(cx + s * 26, top); c.stroke(); }); c.fillStyle = '#E8DDC6'; rr(c, cx - 30, top - 8, 60, 16, 4); c.fill(); }
      banner(c, th, done ? '¡Lo bajaron hasta Jesús!' : 'Casa ' + round, done ? Math.min(1, done) : ban); } };
}
// 3. Panes y pescados (contá rápido)
function Count(th, f) {
  let items = [], ask = 'bread', ans = 0, opts = [], phase = 'show', pT = 0, score = 0, lives = 3, over = false, round = 0, streak = 0, fb = '', fT = 0;
  function deal() { round++; const nb = 2 + Math.floor(Math.random() * Math.min(9, 3 + round)), nf = 1 + Math.floor(Math.random() * Math.min(7, 2 + round)); items = []; const put = k => { for (let tries = 0; tries < 60; tries++) { const x = 40 + Math.random() * (GW - 80), y = 120 + Math.random() * 260; if (items.every(q => Math.hypot(q.x - x, q.y - y) > 36)) { items.push({ k, x, y }); return; } } }; for (let i = 0; i < nb; i++) put('bread'); for (let i = 0; i < nf; i++) put('fish');
    ask = Math.random() < .5 ? 'bread' : 'fish'; ans = items.filter(q => q.k === ask).length; const s = new Set([ans]); while (s.size < 3) s.add(Math.max(0, ans + Math.floor(Math.random() * 5) - 2)); opts = shuffle([...s]); phase = 'show'; pT = Math.max(1.1, 2.4 - round * .08) / f; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || phase !== 'ask') return; const i = Math.floor((d.x - 16) / ((GW - 32) / 3)); if (d.y < 400 || d.y > 470 || i < 0 || i > 2) return;
      if (opts[i] === ans) { streak++; score += 20 + streak * 4; fb = '¡Correcto!'; tone(700 + streak * 30, .15); } else { streak = 0; lives--; fb = 'Eran ' + ans; tone(170, .3); if (lives <= 0) { over = true; return; } } fT = .9; phase = 'fb'; setTimeout(() => { if (!over) deal(); }, 900); },
    update(dt) { if (over) return; fT = Math.max(0, fT - dt); if (phase === 'show') { pT -= dt; if (pT <= 0) phase = 'ask'; } },
    draw(c, t) { skyBg(c, th, t); hearts(c, lives, 3); lab(c, th, 'RONDA ' + round + (streak > 1 ? ' · RACHA ' + streak : ''), GW - 16, 27, 'right');
      card(c, th, 16, 100, GW - 32, 290);
      if (phase === 'show') items.forEach(q => q.k === 'bread' ? DRAW.bread(c, q.x, q.y) : DRAW.fish(c, q.x, q.y, t, 1)); else { c.fillStyle = INK(th); c.font = '900 20px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText(ask === 'bread' ? '¿Cuántos panes había?' : '¿Cuántos pescados había?', GW / 2, 250); c.textAlign = 'left'; }
      if (phase !== 'show') { const bw = (GW - 32) / 3; opts.forEach((o, i) => { c.fillStyle = th.hx ? '#2A2418' : '#FFFFFF'; rr(c, 16 + i * bw + 6, 404, bw - 12, 60, 16); c.fill(); c.fillStyle = INK(th); c.font = '900 26px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText(o, 16 + i * bw + bw / 2, 444); c.textAlign = 'left'; }); }
      else lab(c, th, 'Mirá bien…', GW / 2, 430, 'center');
      if (fT > 0) banner(c, th, fb, fT * 1.5); lab(c, th, 'Cinco panes y dos pescados · Juan 6:9', GW / 2, GH - 18, 'center'); } };
}
// 4. Tocá el manto (dibujá un camino entre la gente sin chocar)
function Trace(th, f) {
  let people = [], path = [], drawing = false, score = 0, over = false, round = 0, ban = 0, left = 0, full = 0, done = 0, hit = 0; const A = { x: 40, y: 470 }; let B = { x: 300, y: 110 };
  function deal() { round++; done = 0; path = []; B = { x: 60 + Math.random() * (GW - 120), y: 100 }; people = []; const n = Math.min(16, 7 + round * 2); for (let i = 0; i < n * 8 && people.length < n; i++) { const p = { x: 30 + Math.random() * (GW - 60), y: 150 + Math.random() * 280, r: 16 + Math.random() * 8, ph: Math.random() * 6 }; if (Math.hypot(p.x - A.x, p.y - A.y) > 60 && Math.hypot(p.x - B.x, p.y - B.y) > 60 && people.every(q => Math.hypot(q.x - p.x, q.y - p.y) > q.r + p.r + 16)) people.push(p); } const add = 16 / f; left = round === 1 ? add + 6 : left + add; full = Math.max(full, left); ban = 1.2; }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || ban > .7 || done) return; if (k === 'down') { if (Math.hypot(d.x - A.x, d.y - A.y) < 40) { drawing = true; path = [{ x: A.x, y: A.y }]; } return; } if (k === 'move' && drawing) { const l = path[path.length - 1]; if (Math.hypot(d.x - l.x, d.y - l.y) < 6) return; path.push({ x: d.x, y: d.y });
        if (people.some(p => Math.hypot(p.x - d.x, p.y + Math.sin(p.ph) * 3 - d.y) < p.r + 6)) { drawing = false; hit = .5; path = []; left = Math.max(0, left - 2); tone(150, .25); return; }
        if (Math.hypot(d.x - B.x, d.y - B.y) < 26) { drawing = false; done = 1.4; score += 50 + Math.round(left) * 2; tone(990, .4); burstAt(B.x, B.y); setTimeout(() => { if (!over) deal(); }, 1400); } return; }
      if (k === 'up') { if (drawing && !done) { drawing = false; path = []; } } },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); hit = Math.max(0, hit - dt); done = Math.max(0, done - dt); people.forEach(p => p.ph += dt * 2); if (ban < .7 && !done) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'MULTITUD ' + round, 16, 27); lab(c, th, 'Arrastrá desde la mujer hasta el manto sin tocar a nadie', GW / 2, 72, 'center');
      c.fillStyle = th.hx ? 'rgba(233,195,122,.25)' : 'rgba(255,214,120,.45)'; c.beginPath(); c.arc(B.x, B.y, 26 + Math.sin(t * 4) * 3, 0, 7); c.fill(); c.fillStyle = '#E8DDC6'; c.beginPath(); c.moveTo(B.x - 14, B.y - 10); c.lineTo(B.x + 14, B.y - 10); c.lineTo(B.x + 18, B.y + 14); c.lineTo(B.x - 18, B.y + 14); c.fill(); c.fillStyle = '#3E5A9A'; c.fillRect(B.x - 18, B.y + 8, 36, 4);
      people.forEach((p, i) => { const y = p.y + Math.sin(p.ph) * 3; c.fillStyle = ['#C9876A', '#7E9BD0', '#9AB072', '#B08CC9', '#D3A35E'][i % 5]; c.beginPath(); c.arc(p.x, y, p.r, 0, 7); c.fill(); c.fillStyle = '#E6B691'; c.beginPath(); c.arc(p.x, y - p.r * .5, p.r * .42, 0, 7); c.fill(); });
      c.fillStyle = '#9A5A6A'; c.beginPath(); c.arc(A.x, A.y, 18, 0, 7); c.fill(); c.fillStyle = '#E6B691'; c.beginPath(); c.arc(A.x, A.y - 9, 8, 0, 7); c.fill();
      if (path.length > 1) { c.strokeStyle = th.hx ? '#E9C37A' : '#FF9636'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); path.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); }
      if (hit > 0) { c.fillStyle = `rgba(239,111,97,${hit * .5})`; c.fillRect(0, 0, GW, GH); }
      banner(c, th, done ? '¡Tu fe te ha sanado!' : 'Multitud ' + round, done || ban); } };
}
// 5. Bartimeo ve (adiviná la imagen mientras se aclara)
const REVEAL_K = [['star', 'Estrella'], ['dove', 'Paloma'], ['lamb', 'Cordero'], ['sheep', 'Oveja'], ['lantern', 'Lámpara'], ['scroll', 'Rollo'], ['fish', 'Pescado'], ['bread', 'Pan'], ['honey', 'Panal'], ['gift', 'Cofre'], ['plank', 'Tabla'], ['bee', 'Abeja']];
function Reveal(th, f) {
  const off = document.createElement('canvas'), sm = document.createElement('canvas'); off.width = off.height = 200; let item = null, opts = [], clear = 0, score = 0, lives = 3, over = false, round = 0, fb = '', fT = 0, lock = false; const order = shuffle(REVEAL_K.slice());
  function deal() { item = order[round % order.length]; round++; clear = 0; lock = false; const o = new Set([item[1]]); while (o.size < 4) o.add(REVEAL_K[Math.floor(Math.random() * REVEAL_K.length)][1]); opts = shuffle([...o]); const x = off.getContext('2d'); x.clearRect(0, 0, 200, 200); x.fillStyle = th.hx ? '#F1D7A2' : '#FFF8E8'; x.fillRect(0, 0, 200, 200); x.save(); x.translate(100, 100); x.scale(4, 4); DRAW[item[0]](x, 0, 0, 0, 1); x.restore(); }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || k !== 'tap' || lock) return; const i = Math.floor((d.y - 380) / 34); if (i < 0 || i > 3 || d.x < 30 || d.x > GW - 30) return; lock = true;
      if (opts[i] === item[1]) { const pts = Math.round(20 + (1 - clear) * 60); score += pts; fb = '¡Ahora veo! +' + pts; tone(880, .3); } else { lives--; fb = 'Era: ' + item[1]; tone(170, .3); if (lives <= 0) { over = true; return; } } clear = 1; fT = 1; setTimeout(() => { if (!over) deal(); }, 1000); },
    update(dt) { if (over) return; fT = Math.max(0, fT - dt); if (!lock) { clear = Math.min(1, clear + dt * .12 * f); if (clear >= 1) { lock = true; lives--; fb = 'Era: ' + item[1]; fT = 1; tone(170, .3); if (lives <= 0) { over = true; return; } setTimeout(() => { if (!over) deal(); }, 1000); } } },
    draw(c, t) { skyBg(c, th, t); hearts(c, lives, 3); lab(c, th, 'IMAGEN ' + round, GW - 16, 27, 'right'); lab(c, th, '¿Qué es? Cuanto antes lo adivines, más puntos', GW / 2, 64, 'center');
      const res = Math.max(4, Math.round(4 + clear * clear * 196)); sm.width = sm.height = res; const sx = sm.getContext('2d'); sx.imageSmoothingEnabled = true; sx.drawImage(off, 0, 0, res, res); c.save(); c.imageSmoothingEnabled = clear > .95; rr(c, 60, 90, 240, 240, 24); c.clip(); c.drawImage(sm, 60, 90, 240, 240); c.restore(); c.imageSmoothingEnabled = true; c.strokeStyle = INK(th); c.lineWidth = 2; rr(c, 60, 90, 240, 240, 24); c.stroke();
      opts.forEach((o, i) => { c.fillStyle = th.hx ? '#2A2418' : '#FFFFFF'; rr(c, 30, 380 + i * 34, GW - 60, 30, 12); c.fill(); c.fillStyle = INK(th); c.font = '800 15px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText(o, GW / 2, 400 + i * 34); c.textAlign = 'left'; });
      if (fT > 0) banner(c, th, fb, fT * 1.5); } };
}
// 6. Caminar sobre el agua (saltá las olas con la mirada en Jesús)
function Hop(th, f) {
  let y = 0, vy = 0, waves = [], sp = 1, dist = 0, goal = 600, faith = 3, score = 0, over = false, tt = 0, hit = 0, round = 1, ban = 1.2; const GY = 400;
  return { get score() { return score }, get over() { return over },
    input(k) { if (over || ban > .6) return; if ((k === 'tap' || k === 'up') && y <= 0) { vy = 520; tone(520, .06); } },
    update(dt) { if (over) return; tt += dt; ban = Math.max(0, ban - dt); hit = Math.max(0, hit - dt); if (ban > .6) return; const v = (150 + round * 22) * f; dist += v * dt * .2; vy -= 1300 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
      sp -= dt; if (sp <= 0) { sp = (.9 + Math.random() * 1.1) / f; waves.push({ x: GW + 30, h: 22 + Math.random() * 26 }); } waves.forEach(w => w.x -= v * dt);
      waves.forEach(w => { if (!w.hit && Math.abs(w.x - 90) < 20 && y < w.h - 4) { w.hit = true; faith--; hit = .6; tone(150, .3); if (faith <= 0) over = true; } }); waves = waves.filter(w => w.x > -40);
      score = Math.floor(dist / 4) + (round - 1) * 80; if (dist >= goal) { round++; goal = dist + 600 + round * 60; faith = Math.min(3, faith + 1); ban = 1.4; score += 80; burstAt(GW - 60, GY - 60); tone(990, .4); } },
    draw(c, t) { skyBg(c, th, t); const sea = c.createLinearGradient(0, GY, 0, GH); sea.addColorStop(0, th.hx ? '#1E3E48' : '#5FB4E6'); sea.addColorStop(1, th.hx ? '#0C1C22' : '#2E6E9A'); c.fillStyle = sea; c.fillRect(0, GY, GW, GH - GY);
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= GW; x += 8) c.lineTo(x, GY + Math.sin(x * .06 + t * 3) * 3); c.stroke();
      const jx = GW - 50 + Math.sin(t) * 4; c.fillStyle = 'rgba(255,240,190,.55)'; c.beginPath(); c.arc(jx, GY - 40, 34, 0, 7); c.fill(); c.fillStyle = '#FFF8E2'; c.beginPath(); c.ellipse(jx, GY - 30, 9, 22, 0, 0, 7); c.fill(); c.beginPath(); c.arc(jx, GY - 58, 7, 0, 7); c.fill();
      waves.forEach(w => { c.fillStyle = th.hx ? '#2E5C6A' : '#3E86B8'; c.beginPath(); c.moveTo(w.x - 24, GY + 2); c.quadraticCurveTo(w.x - 6, GY - w.h * 1.4, w.x + 10, GY - w.h); c.quadraticCurveTo(w.x + 4, GY - w.h * .4, w.x + 24, GY + 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(w.x + 8, GY - w.h + 2, 4, 0, 7); c.fill(); });
      c.save(); c.translate(90, GY - y); if (hit > 0) c.rotate(Math.sin(hit * 40) * .15); c.fillStyle = '#6E8A9A'; c.beginPath(); c.ellipse(0, -22, 10, 20, 0, 0, 7); c.fill(); c.fillStyle = '#E6B691'; c.beginPath(); c.arc(0, -46, 8, 0, 7); c.fill(); c.restore();
      for (let i = 0; i < 3; i++) { c.fillStyle = i < faith ? '#FFC94A' : 'rgba(127,127,127,.3)'; c.beginPath(); c.arc(24 + i * 22, 28, 7, 0, 7); c.fill(); } lab(c, th, 'FE', 90, 32);
      c.fillStyle = th.hx ? 'rgba(233,195,122,.25)' : 'rgba(255,255,255,.5)'; rr(c, 120, 22, GW - 140, 8, 4); c.fill(); c.fillStyle = th.hx ? '#E9C37A' : '#FF9636'; rr(c, 120, 22, Math.max(8, (GW - 140) * Math.min(1, dist / goal)), 8, 4); c.fill();
      lab(c, th, 'Tocá para saltar las olas · mirá a Jesús', GW / 2, GH - 18, 'center'); banner(c, th, round > 1 ? '¡Seguí caminando!' : 'Vení', ban); } };
}
// 7. Clasificá (izquierda o derecha)
const SORT_SETS = [
  { a: 'Sanó a alguien', b: 'Poder sobre la naturaleza', items: [['Bartimeo ve otra vez', 'a'], ['Calma la tormenta', 'b'], ['El paralítico camina', 'a'], ['Camina sobre el agua', 'b'], ['La mujer que tocó su manto', 'a'], ['Multiplica panes y pescados', 'b'], ['La suegra de Pedro', 'a'], ['La pesca milagrosa', 'b']] },
  { a: 'Pasó en el agua', b: 'Pasó en tierra', items: [['Pedro camina hacia Jesús', 'a'], ['El techo abierto en Capernaúm', 'b'], ['La tormenta se calma', 'a'], ['Comen cinco mil personas', 'b'], ['Las redes se llenan', 'a'], ['Bartimeo junto al camino', 'b'], ['Jesús duerme en la barca', 'a'], ['La hija de Jairo', 'b']] },
  { a: 'Con una palabra', b: 'Tomando de la mano o tocando', items: [['La tormenta se calma', 'a'], ['El paralítico se levanta', 'a'], ['Bartimeo recupera la vista', 'a'], ['El siervo del oficial romano', 'a'], ['La hija de Jairo', 'b'], ['La suegra de Pedro', 'b'], ['El leproso queda limpio', 'b'], ['Pedro, que se hundía', 'b']] }
];
function Sort(th, f) {
  let set = null, queue = [], cur = null, cx = GW / 2, fly = 0, flyTo = 0, score = 0, streak = 0, over = false, left = 0, full = 0, round = 0, ban = 0, fb = '', fT = 0; const order = shuffle([0, 1, 2]);
  function deal() { set = SORT_SETS[order[round % 3]]; round++; queue = shuffle(set.items.slice()); next(); const add = 28 / f; left = round === 1 ? add : left + add; full = Math.max(full, left); ban = 1.3; }
  function next() { cur = queue.shift() || null; cx = GW / 2; fly = 0; if (!cur) setTimeout(() => { if (!over) deal(); }, 600); }
  deal();
  return { get score() { return score }, get over() { return over },
    input(k, d) { if (over || ban > .7 || !cur || fly) return; let s = null; if (k === 'tap') s = d.x < GW / 2 ? 'a' : 'b'; if (k === 'left') s = 'a'; if (k === 'right') s = 'b'; if (!s) return;
      if (s === cur[1]) { streak++; score += 15 + streak * 3; fb = '¡Bien!'; tone(600 + streak * 30, .1); } else { streak = 0; left = Math.max(0, left - 3); fb = 'Era: ' + (cur[1] === 'a' ? set.a : set.b); tone(170, .25); } fT = .7; fly = .35; flyTo = s === 'a' ? -1 : 1; },
    update(dt) { if (over) return; ban = Math.max(0, ban - dt); fT = Math.max(0, fT - dt); if (fly) { fly = Math.max(0, fly - dt); cx += flyTo * 900 * dt; if (!fly) next(); } if (ban < .7) left -= dt; if (left <= 0) { left = 0; over = true; } },
    draw(c, t) { skyBg(c, th, t); timeBar(c, th, left, full); lab(c, th, 'RONDA ' + round + (streak > 2 ? ' · RACHA ' + streak : ''), 16, 27);
      [[set.a, 16], [set.b, GW / 2 + 6]].forEach(([s, x]) => { c.fillStyle = th.hx ? 'rgba(233,195,122,.18)' : 'rgba(255,255,255,.6)'; rr(c, x, 380, GW / 2 - 22, 100, 18); c.fill(); c.fillStyle = INK(th); c.font = '900 13px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText(s, x + (GW / 2 - 22) / 2, 436); c.textAlign = 'left'; });
      if (cur) { c.fillStyle = th.hx ? '#2A2418' : '#FFFFFF'; rr(c, cx - 140, 180, 280, 110, 20); c.fill(); c.strokeStyle = th.hx ? '#E9C37A' : '#FF9636'; c.lineWidth = 2; c.stroke(); c.fillStyle = INK(th); c.font = '800 17px Nunito,sans-serif'; c.textAlign = 'center'; const w = cur[0].split(' '); let l1 = '', l2 = ''; w.forEach(x => { if ((l1 + ' ' + x).trim().length <= 22 && !l2) l1 = (l1 + ' ' + x).trim(); else l2 = (l2 + ' ' + x).trim(); }); c.fillText(l1, cx, l2 ? 228 : 240); if (l2) c.fillText(l2, cx, 252); c.textAlign = 'left'; }
      lab(c, th, 'Tocá a la izquierda o a la derecha', GW / 2, GH - 18, 'center'); if (fT > 0) banner(c, th, fb, fT * 1.5); else banner(c, th, 'Ronda ' + round, ban); } };
}

const ENGINES={flood:Flood,roof:Roof,count:Count,trace:Trace,reveal:Reveal,hop:Hop,sort:Sort,pour:Pour,spell:Spell,net:Net,row:Row,pipes:Pipes,lights:Lights,match:Match,run:Runner,fly:Flyer,cross:Crosser,catch:Catcher,memo:Memo,maze:Maze,simon:Simon,verso:Verso,herd:Herd,pop:Pop,swarm:Swarm,slide:Slide,balance:Balance,order:Order,words:Words,stack:Stack,diff:Diff,tf:TrueFalse,lantern:Lantern,rhythm:Rhythm,connect:Connect};
const TAPG=['flood','roof','count','reveal','hop','sort','spell','net','row','pipes','lights','match','memo','simon','verso','pop','slide','order','diff','tf','rhythm','connect','stack','balance'],DRAGG=['trace','pour','herd','swarm','words','lantern'];
let ar=null;const bursts=[];
function burstAt(x,y){bursts.push({x,y,t:0});}
function splash(x,y){bursts.push({x,y,t:0,w:1});}
function startArcade(n,done){
  const p=P(),th=branch==='ados'?{...n.game,sky:['#0C1410','#2A2015'],night:true,hx:true}:n.game,cv=$('#arc');
  $('#arcade').hidden=false;$('#arTitle').textContent=th.title;$('#arScore').textContent='0';
  ar={n,th,f:ageFactor(p.avatar.age),game:null,raf:0,last:0,t:0,k:1,done,running:false};
  ar.fit=()=>{if(!ar)return;const st=$('#arStage').getBoundingClientRect(),w=Math.max(200,Math.min(st.width,st.height*GW/GH)),h=w*GH/GW,d=Math.min(devicePixelRatio||1,2);cv.style.width=w+'px';cv.style.height=h+'px';cv.width=Math.round(w*d);cv.height=Math.round(h*d);ar.k=cv.width/GW;if(!ar.running)drawFrame();};
  const arrow=(d,rot)=>`<button data-k="${d}" aria-label="${{left:'Izquierda',right:'Derecha',up:'Avanzar',down:'Bajar'}[d]}"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(${rot}deg)"><path d="M15 5l-7 7 7 7" stroke="#22407F" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  $('#arCtrl').innerHTML=th.type==='maze'?arrow('left',0)+arrow('up',90)+arrow('down',270)+arrow('right',180):th.type==='balance'?arrow('left',0)+arrow('right',180):[...TAPG,...DRAGG].includes(th.type)?'':th.type==='cross'?arrow('left',0)+arrow('up',90)+arrow('right',180):th.type==='fly'?`<button class="tapbar" data-k="up">Tocá para volar</button>`:arrow('left',0)+arrow('right',180);
  ar.game=ENGINES[th.type](th,ar.f,p.avatar);
  ar.fit();addEventListener('resize',ar.fit);
  const toLocal=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*GW,y:(e.clientY-r.top)/r.height*GH};};
  let down=null;
  cv.onpointerdown=e=>{e.preventDefault();if(!ar||!ar.running)return;const q=toLocal(e);down=q;if(th.type==='catch')ar.game.input('move',q);if(th.type==='fly'||TAPG.includes(th.type))ar.game.input('tap',q);if(DRAGG.includes(th.type))ar.game.input('down',q);};
  cv.onpointermove=e=>{if(ar&&ar.running&&(th.type==='catch'||(DRAGG.includes(th.type)&&down))&&(e.buttons||e.pointerType==='touch'))ar.game.input('move',toLocal(e));};
  cv.onpointerup=e=>{if(!ar||!ar.running||!down)return;const q=toLocal(e),dx=q.x-down.x,dy=q.y-down.y;if(DRAGG.includes(th.type))ar.game.input('up',q);
    if(th.type==='run'){if(Math.abs(dx)>28)ar.game.input(dx<0?'left':'right');else ar.game.input('tap',q);}
    if(th.type==='cross'){if(Math.abs(dx)>28&&Math.abs(dx)>Math.abs(dy))ar.game.input(dx<0?'left':'right');else if(dy>28)ar.game.input('down');else ar.game.input('up');}
    if(th.type==='maze'){if(Math.max(Math.abs(dx),Math.abs(dy))>24)ar.game.input(Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down'));else ar.game.input('tap',q);}
    down=null;};
  $('#arCtrl').querySelectorAll('button').forEach(b=>b.onpointerdown=e=>{e.preventDefault();if(ar&&ar.running)ar.game.input(th.type==='fly'?'tap':b.dataset.k,{x:GW/2,y:GH/2});});
  const KM={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',' ':'up',a:'left',d:'right',w:'up',s:'down'};ar.held={};ar.rep=0;
  ar.key=e=>{if(!ar||!ar.running)return;const k=KM[e.key.length===1?e.key.toLowerCase():e.key];if(!k)return;e.preventDefault();if(e.repeat)return;ar.held[k]=true;ar.rep=.22;ar.game.input(th.type==='fly'?'tap':k,{x:GW/2,y:GH/2});};
  ar.keyup=e=>{if(!ar)return;const k=KM[e.key.length===1?e.key.toLowerCase():e.key];if(k)ar.held[k]=false;};
  addEventListener('keydown',ar.key);addEventListener('keyup',ar.keyup);
  $('#arClose').onclick=()=>endArcade(true);
  showArCard('intro');
}
function drawFrame(){
  const c=$('#arc').getContext('2d');c.setTransform(ar.k,0,0,ar.k,0,0);ar.game.draw(c,ar.t);
  for(const b of bursts){const a=1-b.t/.5;if(a<=0)continue;c.globalAlpha=a;for(let i=0;i<6;i++){const an=i/6*6.28;if(b.w){c.fillStyle='#E4F5FF';c.beginPath();c.arc(b.x+Math.cos(an)*b.t*60,b.y+Math.sin(an)*b.t*40-b.t*30,3,0,7);c.fill();}else star4(c,b.x+Math.cos(an)*b.t*70,b.y+Math.sin(an)*b.t*70,3,'#FFD45C');}c.globalAlpha=1;}
}
function runGame(){
  ar.game=ENGINES[ar.th.type](ar.th,ar.f,P().avatar);ar.running=true;ar.t=0;ar.last=performance.now();bursts.length=0;
  const loop=now=>{if(!ar)return;const dt=Math.min(.033,(now-ar.last)/1000);ar.last=now;ar.t+=dt;if(ar.running&&ar.held){const H=ar.held,th=ar.th;if(th.type==='catch'){const dir=(H.right?1:0)-(H.left?1:0);if(dir)ar.game.input('nudge',{dx:dir*38});}else if(th.type==='balance'){const dir=(H.right?1:0)-(H.left?1:0);if(dir)ar.game.input('lean',{d:dir});}else if(['run','cross','maze'].includes(th.type)){const k=['left','right','up','down'].find(x=>H[x]);if(k){ar.rep-=dt;if(ar.rep<=0){ar.rep=.14;ar.game.input(k,{x:GW/2,y:GH/2});}}}}ar.game.update(dt);bursts.forEach(b=>b.t+=dt);for(let i=bursts.length-1;i>=0;i--)if(bursts[i].t>.5)bursts.splice(i,1);drawFrame();$('#arScore').textContent=fmt(ar.game.score);
    if(ar.game.over){ar.running=false;setTimeout(()=>ar&&gameOver(),450);return;}ar.raf=requestAnimationFrame(loop);};
  ar.raf=requestAnimationFrame(loop);
}
function showArCard(kind,data={}){
  const card=$('#arCard'),th=ar.th;card.hidden=false;
  if(kind==='intro'){const best=P().games[ar.n.id]||0;
    card.innerHTML=`<div class="box glass"><span class="kicker">Minijuego</span><h3>${esc(th.title)}</h3><p>${esc(th.how)}</p><p>${['memo','maze','verso','herd','slide','order','words','diff','lantern','connect'].includes(th.type)?'Se juega contra reloj: cada ronda que superás te da más tiempo.':th.type==='simon'?'Tenés dos vidas. Cada secuencia es una luz más larga.':['pop','swarm','balance','tf'].includes(th.type)?'Tenés tres vidas.':th.type==='rhythm'?'Si se te pasan seis notas, se termina.':th.type==='stack'?'Se termina cuando una tabla cae afuera.':'Se juega hasta perder.'} Tu mejor marca suma puntos${best?` (ahora: ${fmt(best)})`:''}.</p><button class="primary" id="arGo">Jugar</button></div>`;
    $('#arGo').onclick=()=>{card.hidden=true;runGame();};}
  else{card.innerHTML=`<div class="box glass"><span class="kicker">¡Se terminó!</span><div class="bigscore">${fmt(data.score)}</div>${data.gain>0?`<span class="newbest">Nueva mejor marca · +${fmt(data.gain)} puntos</span>`:`<p>Tu mejor marca sigue en ${fmt(data.best)}.</p>`}<button class="primary" id="arAgain">Jugar de nuevo</button><button class="ghost" id="arNext">${isDone(ar.n.id)?'Volver a la parada':'Ir al desafío'}</button></div>`;
    $('#arAgain').onclick=()=>{card.hidden=true;runGame();};$('#arNext').onclick=()=>endArcade(false);
    if(data.gain>0){const r=card.querySelector('.bigscore').getBoundingClientRect();sparks(r.left+r.width/2,r.top+r.height/2,50,1.6);}}
}
function gameOver(){
  const p=P(),id=ar.n.id,sc=ar.game.score,best=p.games[id]||0,gain=Math.max(0,sc-best);
  if(gain>0)p.games[id]=sc;
  if(sc>=300)award('jugador');
  save();showArCard('over',{score:sc,best:Math.max(best,sc),gain});
}
function endArcade(abort){
  if(!ar)return;cancelAnimationFrame(ar.raf);removeEventListener('resize',ar.fit);removeEventListener('keydown',ar.key);removeEventListener('keyup',ar.keyup);
  const done=ar.done;ar=null;$('#arcade').hidden=true;
  refreshHud();if(active){const gc=document.querySelector('#flow .gamecard');if(gc)gc.outerHTML=gameCard(active);}
  if(!abort&&done)done();
}

/* ===== FIN DE ETAPA ===== */
const regionGames=(p,R)=>ORDER.reduce((a,k)=>a+(p.games[`${R}-${k}`]||0),0);
/* examen de etapa: repaso profundo antes de pasar a la siguiente */
const EXAMS={
nacimiento:[
 {t:'mc',q:'¿Qué ángel le anunció a María que iba a ser la madre de Jesús?',o:['Gabriel','Miguel','Rafael','Uriel'],a:0,exp:'Dios envió al ángel Gabriel a Nazaret, a una virgen comprometida con José.',ref:'Lucas 1:26-27'},
 {t:'mc',q:'¿En qué pueblo vivía María cuando recibió el anuncio?',o:['Nazaret de Galilea','Belén de Judea','Jerusalén','Capernaúm'],a:0,exp:'El anuncio llegó a Nazaret, un pueblo chico de Galilea. Jesús nacería después en Belén.',ref:'Lucas 1:26-27'},
 {t:'tf',q:'Jesús nació en Nazaret.',a:false,exp:'Jesús nació en Belén de Judea, la ciudad de David, tal como lo había anunciado el profeta Miqueas.',ref:'Mateo 2:1-6 · Miqueas 5:2'},
 {t:'match',q:'Uní cada personaje con lo que hizo',p:[['María','Aceptó ser la sierva del Señor'],['José','Viajó a Belén por ser de la familia de David'],['Los pastores','Fueron a ver al niño y contaron lo que oyeron'],['Los magos','Siguieron la estrella y adoraron al niño']],exp:'Cada uno respondió a Dios a su manera: con un sí, con obediencia, con prisa por ir a ver y con adoración.',ref:'Lucas 1:38; 2:4, 15-17 · Mateo 2:9-11'},
 {t:'verse',parts:['¡El ',0,' —sí, el Mesías, el Señor— ha nacido hoy en Belén, la ciudad de ',1,'!'],blanks:['Salvador','David'],bank:['Salvador','Abraham','David','Profeta','Moisés','Maestro'],exp:'El anuncio del ángel resume quién es Jesús: Salvador, Mesías y Señor.',ref:'Lucas 2:11'},
 {t:'mc',q:'¿Qué profeta había anunciado que el Mesías nacería en Belén?',o:['Miqueas','Isaías','Jeremías','Elías'],a:0,exp:'Cuando Herodes preguntó dónde nacería el Cristo, los escribas citaron al profeta Miqueas.',ref:'Mateo 2:4-6 · Miqueas 5:2'},
 {t:'mc',q:'¿Qué significa el nombre «Emanuel»?',o:['Dios con nosotros','Dios salva','Príncipe de paz','Hijo de David'],a:0,exp:'Mateo explica el nombre que anunció Isaías: en Jesús, Dios vino a estar con nosotros.',ref:'Mateo 1:23'},
 {t:'mc',q:'¿Qué hicieron los pastores después de ver al niño?',o:['Contaron a todos lo que el ángel les había dicho','Se quedaron callados para no meterse en problemas','Fueron a avisarle a Herodes','Le llevaron oro e incienso'],a:0,exp:'Los pastores fueron los primeros en anunciar la noticia, y todos se asombraban de lo que contaban.',ref:'Lucas 2:17-18'},
 {t:'order',q:'Ordená cómo sucedió',items:['Gabriel le anuncia a María que será madre','José y María viajan a Belén por el censo','Jesús nace y es acostado en un pesebre','Los ángeles les anuncian la noticia a los pastores','Los magos llegan guiados por la estrella'],exp:'Lucas cuenta el anuncio, el viaje, el nacimiento y los pastores. Mateo agrega la visita posterior de los magos.',ref:'Lucas 1–2 · Mateo 2'},
 {t:'mc',q:'¿Qué hacía María con todo lo que estaba pasando?',o:['Lo guardaba en su corazón y pensaba en ello','Se lo contaba a Herodes','Lo escribía en un libro','Prefería olvidarlo'],a:0,exp:'María meditaba lo que Dios hacía. Es un ejemplo de alguien que procesa lo que vive a la luz de Dios.',ref:'Lucas 2:19'},
 {t:'app',q:'Un compañero de tu curso te dice que la Navidad es solo regalos y comida. Como los pastores, ¿qué harías?',o:['Le contás con tus palabras y con cariño que Jesús, el Salvador, nació para todos','Le decís que está equivocado y dejás de hablarle','Esperás a que algún día te pregunte','Le mandás una lista de versículos sin explicarle nada'],a:0,exp:'Los pastores contaron lo que vieron y oyeron. Un testimonio sencillo, con amor y con tus palabras, abre puertas.',ref:'Lucas 2:17'},
 {t:'reflect',q:'¿Qué te enseña el «sí» de María sobre cómo responderle a Dios? Escribilo en una o dos frases.',ref:'Lucas 1:38'}],
infancia:[
 {t:'mc',q:'¿Para qué llevaron José y María a Jesús al templo cuando tenía cuarenta días?',o:['Para presentarlo al Señor, como pedía la ley de Moisés','Para bautizarlo','Para que estudiara con los maestros','Para anotarlo en el censo'],a:0,exp:'Cumplieron lo que pedía la ley: presentar al primer hijo varón al Señor y ofrecer un sacrificio.',ref:'Lucas 2:22-24'},
 {t:'mc',q:'¿Qué ofrenda llevaron al templo?',o:['Un par de tórtolas o dos pichones de paloma','Un cordero de un año','Oro e incienso','Diez monedas de plata'],a:0,exp:'Era la ofrenda que la ley permitía a las familias de pocos recursos. Jesús creció en un hogar humilde.',ref:'Lucas 2:24 · Levítico 12:8'},
 {t:'match',q:'Uní cada personaje con lo que hizo',p:[['Simeón','Tomó al niño en brazos y alabó a Dios'],['Ana','Hablaba del niño a todos los que esperaban la redención'],['Herodes','Mandó matar a los niños de Belén'],['José','Fue avisado en sueños para huir a Egipto']],exp:'Dos ancianos fieles reconocieron al Mesías. Un rey celoso quiso eliminarlo. Y José obedeció a tiempo.',ref:'Lucas 2:25-38 · Mateo 2:13-16'},
 {t:'tf',q:'Ana era una profetisa anciana que servía a Dios día y noche en el templo.',a:true,exp:'Ana nunca se iba del templo: adoraba a Dios con ayunos y oraciones día y noche.',ref:'Lucas 2:36-37'},
 {t:'mc',q:'Al volver de Egipto, ¿por qué la familia se instaló en Nazaret?',o:['Porque en Judea reinaba Arquelao, hijo de Herodes, y José fue advertido en sueños','Porque Belén había sido destruida','Porque César Augusto lo ordenó','Porque en Nazaret estaba el templo'],a:0,exp:'José tuvo miedo de ir a Judea y, avisado en sueños, se fue a Galilea, a Nazaret.',ref:'Mateo 2:22-23'},
 {t:'verse',parts:['Jesús crecía en ',0,' y en estatura, y en el ',1,' de Dios y de toda la gente.'],blanks:['sabiduría','favor'],bank:['fuerza','sabiduría','fama','favor','riqueza','poder'],exp:'Un crecimiento completo: mente, cuerpo, relación con Dios y con los demás.',ref:'Lucas 2:52'},
 {t:'mc',q:'¿Cuántos días tardaron José y María en encontrar a Jesús en Jerusalén?',o:['Tres días','Un día','Siete días','Cuarenta días'],a:0,exp:'Después de tres días lo encontraron en el templo, sentado entre los maestros.',ref:'Lucas 2:46'},
 {t:'mc',q:'¿Qué estaba haciendo Jesús entre los maestros del templo?',o:['Los escuchaba y les hacía preguntas','Les daba órdenes','Vendía palomas en el patio','Dormía después del viaje'],a:0,exp:'Jesús escuchaba y preguntaba, y todos se asombraban de su entendimiento y de sus respuestas.',ref:'Lucas 2:46-47'},
 {t:'tf',q:'Después de que lo encontraron en el templo, Jesús volvió a Nazaret con sus padres y les obedecía.',a:true,exp:'Aun sabiendo que Dios era su Padre, Jesús vivía en obediencia a José y María.',ref:'Lucas 2:51'},
 {t:'order',q:'Ordená la infancia de Jesús',items:['Lo presentan en el templo a los cuarenta días','Huyen a Egipto por la amenaza de Herodes','Vuelven y se establecen en Nazaret','Viajan a Jerusalén para la Pascua cuando Jesús tiene 12 años','Lo encuentran en el templo entre los maestros'],exp:'Lucas y Mateo se complementan para mostrar los primeros años de Jesús.',ref:'Lucas 2:22-51 · Mateo 2:13-23'},
 {t:'app',q:'En tu grupo alguien dice que si ya sabés mucho de Dios no hace falta obedecer a tus padres. ¿Qué te enseña la infancia de Jesús?',o:['Jesús, aun sabiendo que Dios era su Padre, volvió a casa y obedecía a sus padres','Que a los doce años uno ya es independiente','Que obedecer solo importa dentro del templo','Que conviene discutir hasta ganar'],a:0,exp:'Saber de Dios y obedecer van juntos. Jesús es el modelo: sabiduría con humildad.',ref:'Lucas 2:49-52'},
 {t:'reflect',q:'Jesús crecía en sabiduría, en estatura y en el favor de Dios y de la gente. ¿En cuál de esas áreas querés crecer este año, y cómo?',ref:'Lucas 2:52'}],
bautismo:[
 {t:'mc',q:'¿Cuál era el centro del mensaje de Juan el Bautista?',o:['Que la gente se arrepintiera y volviera a Dios, porque el reino del cielo estaba cerca','Que había que pelear contra los romanos','Que había que ir al templo una vez por año','Que el Mesías iba a llegar dentro de mil años'],a:0,exp:'Juan preparaba el corazón de la gente para recibir a Jesús llamándolos al arrepentimiento.',ref:'Mateo 3:1-2'},
 {t:'mc',q:'¿Qué profeta había anunciado «una voz que clama en el desierto»?',o:['Isaías','Jeremías','Daniel','Jonás'],a:0,exp:'Mateo explica que Juan cumplía lo anunciado por Isaías: preparar el camino para el Señor.',ref:'Mateo 3:3 · Isaías 40:3'},
 {t:'tf',q:'Juan bautizó a Jesús enseguida y sin dudar.',a:false,exp:'Juan intentó impedirlo, porque sentía que él necesitaba ser bautizado por Jesús. Jesús le respondió que así convenía cumplir lo que Dios pedía.',ref:'Mateo 3:13-15'},
 {t:'match',q:'¿Quién hizo qué en el bautismo de Jesús?',p:[['El Padre','Habló desde el cielo'],['El Hijo','Fue bautizado en el Jordán'],['El Espíritu Santo','Descendió como una paloma'],['Juan','Preparó el camino y bautizó']],exp:'En el Jordán se ve a la Trinidad junta: el Padre habla, el Hijo es bautizado y el Espíritu desciende.',ref:'Mateo 3:16-17'},
 {t:'verse',parts:['¡Miren! ¡El ',0,' de Dios, que quita el ',1,' del mundo!'],blanks:['Cordero','pecado'],bank:['León','pecado','Hijo','Cordero','dolor','mal'],exp:'Juan presenta a Jesús con la imagen del cordero del sacrificio: él carga con el pecado del mundo.',ref:'Juan 1:29'},
 {t:'mc',q:'¿Qué les dijo Juan a los que tenían dos túnicas?',o:['Que compartieran una con el que no tenía','Que vendieran una en el mercado','Que las llevaran al templo','Que se pusieran las dos para el frío'],a:0,exp:'El arrepentimiento verdadero se ve en acciones concretas, como compartir con el que necesita.',ref:'Lucas 3:10-11'},
 {t:'mc',q:'Según Lucas, ¿qué hacía Jesús cuando el cielo se abrió?',o:['Estaba orando','Estaba predicando','Estaba durmiendo','Estaba comiendo'],a:0,exp:'Lucas destaca que Jesús oraba. La oración acompaña cada momento importante de su vida.',ref:'Lucas 3:21-22'},
 {t:'mc',q:'Después del bautismo, ¿a dónde llevó el Espíritu a Jesús?',o:['Al desierto, para ser tentado','A Nazaret, a su casa','A Jerusalén, al templo','A Egipto'],a:0,exp:'Antes de empezar su ministerio, Jesús enfrentó la tentación en el desierto.',ref:'Mateo 4:1'},
 {t:'mc',q:'¿Cuántos días ayunó Jesús en el desierto?',o:['Cuarenta','Siete','Doce','Tres'],a:0,exp:'Jesús ayunó cuarenta días y cuarenta noches, y después tuvo hambre.',ref:'Mateo 4:2'},
 {t:'order',q:'Ordená lo que pasó',items:['Juan predica en el desierto de Judea','Jesús llega desde Galilea al Jordán','El Espíritu desciende como paloma y habla el Padre','Jesús ayuna cuarenta días en el desierto'],exp:'Mateo lo cuenta como un solo movimiento: la predicación, el bautismo, la voz del cielo y la prueba en el desierto.',ref:'Mateo 3:1 – 4:2'},
 {t:'app',q:'Un amigo que empezó a seguir a Jesús te pregunta por qué bautizarse. ¿Qué le contestarías?',o:['Que Jesús mismo se bautizó para cumplir lo que Dios pedía, y bautizarse es un paso de obediencia al seguirlo','Que es una tradición familiar y nada más','Que sirve para que la gente vea que es mejor que los demás','Que después de bautizarse ya no hace falta orar'],a:0,exp:'Jesús dijo que así convenía cumplir toda justicia. El bautismo es una forma pública de decir: «Yo sigo a Jesús».',ref:'Mateo 3:15 · Mateo 28:19'},
 {t:'reflect',q:'Juan preparó el camino para Jesús. ¿A quién de tu entorno podés ayudar a conocerlo, y qué paso concreto vas a dar esta semana?',ref:'Mateo 3:3'}],
galilea:[
 {t:'mc',q:'¿Cuál fue la primera señal milagrosa de Jesús?',o:['Convertir el agua en vino en Caná','Caminar sobre el agua','Multiplicar los panes','Sanar a un ciego'],a:0,exp:'«Esta señal milagrosa en Caná de Galilea marcó la primera vez que Jesús reveló su gloria. Y sus discípulos creyeron en él.»',ref:'Juan 2:11'},
 {t:'tf',q:'En la boda de Caná, María les pidió a los sirvientes que hicieran lo que Jesús les dijera.',a:true,exp:'María les dijo: «Hagan lo que él les diga». Su confianza en Jesús es un ejemplo para nosotros.',ref:'Juan 2:5'},
 {t:'mc',q:'¿De qué profeta era el rollo que leyó Jesús en la sinagoga de Nazaret?',o:['Isaías','Jeremías','Daniel','Malaquías'],a:0,exp:'Le dieron el rollo de Isaías y Jesús leyó el pasaje sobre el Ungido que trae la Buena Noticia a los pobres.',ref:'Lucas 4:17-18'},
 {t:'verse',parts:['El ',0,' del Señor está sobre mí, porque me ha ungido para llevar la ',1,' a los pobres.'],blanks:['Espíritu','Buena Noticia'],bank:['Espíritu','ángel','Buena Noticia','ley','comida','corona'],exp:'Después de leerlo, Jesús dijo que esa Escritura se cumplía ese mismo día.',ref:'Lucas 4:18, 21'},
 {t:'mc',q:'¿A qué pueblo junto al mar de Galilea se fue a vivir Jesús?',o:['Capernaúm','Jericó','Belén','Betania'],a:0,exp:'Jesús dejó Nazaret y se fue a vivir a Capernaúm, junto al lago.',ref:'Mateo 4:13'},
 {t:'match',q:'Uní cada personaje con lo que hizo',p:[['Simón','Tiró las redes otra vez aunque no había pescado nada'],['La mujer samaritana','Corrió al pueblo a contar de Jesús'],['María','Pidió a los sirvientes que obedecieran a Jesús'],['Santiago y Juan','Dejaron la barca y a su padre para seguir a Jesús']],exp:'Cada encuentro con Jesús terminó en confianza, testimonio y seguimiento.',ref:'Lucas 5:5 · Juan 4:28-29 · Juan 2:5 · Mateo 4:21-22'},
 {t:'tf',q:'Cuando Simón obedeció a Jesús, las redes se llenaron tanto que comenzaron a romperse.',a:true,exp:'«Y esta vez las redes se llenaron de tantos peces ¡que comenzaron a romperse!»',ref:'Lucas 5:6'},
 {t:'mc',q:'¿Qué le ofreció Jesús a la mujer junto al pozo de Jacob?',o:['Un agua que se convierte en manantial de vida eterna','Un cántaro nuevo','Comida para el viaje','Un lugar en el templo'],a:0,exp:'Jesús le habló de un agua que quita la sed para siempre: la vida eterna que él da.',ref:'Juan 4:14'},
 {t:'order',q:'Una forma de ordenar estos relatos',items:['La boda de Caná','La mujer samaritana junto al pozo','La lectura en la sinagoga de Nazaret','El llamado de los pescadores','La enseñanza en el monte'],exp:'Juan cuenta Caná y Samaria al comienzo. Después, Lucas narra la sinagoga y el llamado, y Mateo reúne la enseñanza del monte.',ref:'Juan 2; 4 · Lucas 4–5 · Mateo 5'},
 {t:'mc',q:'Según Jesús, ¿qué son sus seguidores en el mundo?',o:['La luz del mundo','Los dueños del mundo','Los jueces del mundo','Los que se esconden del mundo'],a:0,exp:'«Ustedes son la luz del mundo, como una ciudad en lo alto de una colina que no puede esconderse.»',ref:'Mateo 5:14'},
 {t:'app',q:'En tu escuela hay un compañero nuevo que siempre está solo en los recreos. Si sos luz del mundo, ¿qué hacés?',o:['Te acercás, lo invitás a sumarse y te interesás por él','Esperás a que lo haga otro','Le decís que vaya a la iglesia y listo','Lo mirás de lejos para no quedar mal'],a:0,exp:'La luz se ve en lo que hacemos. Un gesto de amor concreto muestra a Jesús mejor que muchas palabras.',ref:'Mateo 5:16'},
 {t:'reflect',q:'Simón tiró las redes otra vez solo porque Jesús se lo pidió. ¿En qué área de tu vida Jesús te pide que confíes y obedezcas? Escribilo en una o dos frases.',ref:'Lucas 5:5'}],
milagros:[
 {t:'mc',q:'¿Qué hacía Jesús cuando se desató la tormenta?',o:['Dormía en la parte de atrás de la barca','Remaba con los discípulos','Pescaba con una red','Oraba en la orilla'],a:0,exp:'Jesús dormía, y los discípulos, aterrados, lo despertaron.',ref:'Marcos 4:38'},
 {t:'tf',q:'Después de que Jesús habló, el viento se detuvo y hubo una gran calma.',a:true,exp:'«De repente, el viento se detuvo y hubo una gran calma.»',ref:'Marcos 4:39'},
 {t:'mc',q:'¿Cuántos amigos llevaron al paralítico hasta Jesús?',o:['Cuatro','Dos','Doce','Siete'],a:0,exp:'Cuatro amigos lo cargaron en una camilla y lo bajaron por el techo.',ref:'Marcos 2:3-4'},
 {t:'mc',q:'¿Qué le dijo Jesús primero al paralítico?',o:['Que sus pecados eran perdonados','Que volviera otro día','Que fuera al templo','Que se lavara en el río'],a:0,exp:'Jesús atendió primero su necesidad más profunda: el perdón. Después lo sanó para mostrar que tenía autoridad para perdonar.',ref:'Marcos 2:5-12'},
 {t:'match',q:'Uní cada personaje con lo que hizo',p:[['Andrés','Llevó al muchachito con los panes y los pescados'],['Bartimeo','Gritó pidiendo compasión'],['Pedro','Caminó sobre el agua hacia Jesús'],['La mujer enferma','Tocó la ropa de Jesús con fe']],exp:'Cada uno se acercó a Jesús a su manera, y él respondió a cada uno.',ref:'Juan 6:8-9 · Marcos 10:47 · Mateo 14:29 · Marcos 5:27'},
 {t:'mc',q:'¿Cuántas canastas sobraron después de que comió la multitud?',o:['Doce','Cinco','Dos','Siete'],a:0,exp:'Comieron todos hasta quedar satisfechos y con lo que sobró llenaron doce canastas.',ref:'Juan 6:12-13'},
 {t:'tf',q:'El muchachito tenía cinco panes de cebada y dos pescados.',a:true,exp:'«Aquí hay un muchachito que tiene cinco panes de cebada y dos pescados.» Jesús multiplicó lo poco que alguien compartió.',ref:'Juan 6:9'},
 {t:'order',q:'Ordená lo que pasó esa noche en el lago',items:['Jesús camina sobre el agua hacia la barca','Pedro le pide ir hacia él','Pedro mira el viento, tiene miedo y se hunde','Jesús lo toma de la mano','Los discípulos lo adoran como Hijo de Dios'],exp:'Mateo termina el relato con los discípulos adorando a Jesús.',ref:'Mateo 14:25-33'},
 {t:'mc',q:'¿Qué hizo Bartimeo después de recuperar la vista?',o:['Siguió a Jesús por el camino','Volvió a pedir limosna','Se fue sin decir nada','Se enojó con la multitud'],a:0,exp:'Bartimeo no solo recuperó la vista: se convirtió en seguidor de Jesús.',ref:'Marcos 10:52'},
 {t:'mc',q:'¿Para qué fueron escritas las señales de Jesús, según el evangelio de Juan?',o:['Para que creamos que Jesús es el Mesías, el Hijo de Dios, y tengamos vida','Para entretener a la gente','Para mostrar que Jesús era un mago','Para asustar a los romanos'],a:0,exp:'Juan explica que escribió estas señales para que creamos en Jesús y, al creer, tengamos vida en su nombre.',ref:'Juan 20:30-31'},
 {t:'app',q:'Una amiga está pasando por algo muy difícil y tiene miedo. ¿Qué hacés?',o:['La escuchás, orás con ella y la animás a confiar en Jesús','Le decís que no es para tanto','Cambiás de tema para no ponerte triste','Le contás a todos lo que le pasa'],a:0,exp:'Como los amigos del paralítico, podemos acercar a otros a Jesús con amor y oración.',ref:'Marcos 2:3-5'},
 {t:'reflect',q:'Pedro empezó a hundirse cuando dejó de mirar a Jesús. ¿Qué cosas te distraen de mirarlo a él y cómo podés volver a enfocarte?',ref:'Mateo 14:30-31'}]
};
function openExam(r,onPass){
  const R=REGIONS[r],E=EXAMS[R.id];if(!E){onPass();return;}
  const p=P(),items=E.map(x=>x),graded=items.filter(x=>x.t!=='reflect').length,need=Math.ceil(graded*(branch==='kids'?.6:.7));
  let i=0,ok=0,wrong=[],reflect='';
  const box=document.createElement('div');box.className='exam'+(branch==='ados'?' hx':'');document.body.appendChild(box);
  const shuf=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(v=>v[1]);
  const head=()=>`<div class="ex-top"><small>Examen de etapa · ${esc(R.name)}</small><div class="ex-bar"><i style="width:${i/items.length*100}%"></i></div><span>${i+1} / ${items.length}</span></div>`;
  const intro=()=>{box.innerHTML=`<div class="ex-card ex-intro"><div class="ex-seal">✦</div><small>Antes de seguir el camino</small><h2>Examen de la etapa<br><em>${esc(R.name)}</em></h2><p>Repasá todo lo que viviste en esta etapa. Son ${items.length} desafíos: preguntas, pasajes para completar, personajes para unir, una situación real para resolver y una reflexión personal.</p><p class="ex-note">Para pasar a la etapa siguiente necesitás ${need} respuestas correctas de ${graded}. Si no llegás, podés repasar y volver a intentarlo.</p><div class="ex-btns"><button class="ex-go">Empezar</button><button class="ex-later">Más tarde</button></div></div>`;
    box.querySelector('.ex-go').onclick=()=>show();box.querySelector('.ex-later').onclick=()=>{box.remove();refreshMap();};};
  const next=good=>{if(good===true)ok++;else if(good===false)wrong.push(items[i]);i++;i<items.length?show():end();};
  const feedback=(card,good,x)=>{const f=document.createElement('div');f.className='ex-fb '+(good?'ok':'no');f.innerHTML=`<b>${good?'¡Correcto!':'No es esa'}</b><p>${esc(x.exp||'')}</p><small>${esc(x.ref||'')}</small><button class="ex-next">${i+1<items.length?'Siguiente':'Ver resultado'}</button>`;card.appendChild(f);f.querySelector('.ex-next').onclick=()=>next(good);f.scrollIntoView({behavior:'smooth',block:'nearest'});};
  const show=()=>{const x=items[i];let h=head()+'<div class="ex-card">';const tag={mc:'Opción múltiple',tf:'Verdadero o falso',match:'Unir',verse:'Completá el pasaje',order:'Ordená',app:'Situación ministerial',reflect:'Reflexión personal'}[x.t];
    h+=`<span class="ex-tag t-${x.t}">${tag}</span><h3>${esc(x.q||'Completá el versículo')}</h3>`;
    if(x.t==='mc'||x.t==='app'){const o=shuf(x.o.map((t,k)=>({t,k})));h+='<div class="ex-opts">'+o.map(v=>`<button data-k="${v.k}">${esc(v.t)}</button>`).join('')+'</div>';}
    if(x.t==='tf')h+='<div class="ex-opts ex-tf"><button data-v="1">Verdadero</button><button data-v="0">Falso</button></div>';
    if(x.t==='match'){const rights=shuf(x.p.map(v=>v[1]));h+='<div class="ex-match">'+x.p.map((v,k)=>`<label><b>${esc(v[0])}</b><select data-k="${k}"><option value="">Elegí…</option>${rights.map(r=>`<option>${esc(r)}</option>`).join('')}</select></label>`).join('')+'</div><button class="ex-check" disabled>Comprobar</button>';}
    if(x.t==='verse')h+=`<p class="ex-verse">${x.parts.map(v=>typeof v==='number'?`<button class="ex-blank" data-b="${v}">______</button>`:esc(v)).join('')}</p><div class="ex-bank">${shuf(x.bank).map(w=>`<button>${esc(w)}</button>`).join('')}</div><button class="ex-check" disabled>Comprobar</button>`;
    if(x.t==='order'){x._o=shuf(x.items.map((t,k)=>({t,k})));h+='<ol class="ex-order"></ol><button class="ex-check">Comprobar</button>';}
    if(x.t==='reflect')h+=`<textarea class="ex-ta" rows="4" maxlength="500" placeholder="Escribí tu respuesta…"></textarea><p class="ex-note">Esta respuesta no tiene nota: es para vos. Queda guardada en tu perfil.</p><button class="ex-check" disabled>Guardar y seguir</button>`;
    h+=`<small class="ex-ref">${esc(x.ref||'')}</small></div>`;box.innerHTML=h;const card=box.querySelector('.ex-card');box.scrollTop=0;
    const lock=()=>card.querySelectorAll('button:not(.ex-next),select,textarea').forEach(b=>b.disabled=true);
    if(x.t==='mc'||x.t==='app')card.querySelectorAll('.ex-opts button').forEach(b=>b.onclick=()=>{const good=+b.dataset.k===x.a;lock();b.classList.add(good?'ok':'no');if(!good)card.querySelector(`.ex-opts button[data-k="${x.a}"]`).classList.add('ok');feedback(card,good,x);});
    if(x.t==='tf')card.querySelectorAll('.ex-opts button').forEach(b=>b.onclick=()=>{const good=(b.dataset.v==='1')===x.a;lock();b.classList.add(good?'ok':'no');if(!good)card.querySelector(`.ex-opts button[data-v="${x.a?1:0}"]`).classList.add('ok');feedback(card,good,x);});
    if(x.t==='match'){const sels=[...card.querySelectorAll('select')],chk=card.querySelector('.ex-check');sels.forEach(s=>s.onchange=()=>{chk.disabled=sels.some(v=>!v.value);});
      chk.onclick=()=>{let good=true;sels.forEach(s=>{const k=+s.dataset.k,g=s.value===x.p[k][1];s.parentNode.classList.add(g?'ok':'no');if(!g){good=false;s.parentNode.insertAdjacentHTML('beforeend',`<em>${esc(x.p[k][1])}</em>`);}});lock();feedback(card,good,x);};}
    if(x.t==='verse'){const fill=Array(x.blanks.length).fill(null),bl=[...card.querySelectorAll('.ex-blank')],bank=[...card.querySelectorAll('.ex-bank button')],chk=card.querySelector('.ex-check');
      const sync=()=>{bl.forEach(b=>{const v=fill[+b.dataset.b];b.textContent=v||'______';b.classList.toggle('on',!!v);});bank.forEach(b=>b.classList.toggle('used',fill.includes(b.textContent)));chk.disabled=fill.some(v=>!v);};
      bank.forEach(b=>b.onclick=()=>{if(fill.includes(b.textContent))return;const k=fill.indexOf(null);if(k<0)return;fill[k]=b.textContent;sync();});bl.forEach(b=>b.onclick=()=>{fill[+b.dataset.b]=null;sync();});
      chk.onclick=()=>{const good=fill.every((v,k)=>v===x.blanks[k]);bl.forEach(b=>b.classList.add(fill[+b.dataset.b]===x.blanks[+b.dataset.b]?'ok':'no'));lock();feedback(card,good,x);};}
    if(x.t==='order'){const ol=card.querySelector('.ex-order'),draw=()=>{ol.innerHTML=x._o.map((v,k)=>`<li><span>${esc(v.t)}</span><button data-u="${k}" aria-label="Subir"${k?'':' disabled'}>▲</button><button data-d="${k}" aria-label="Bajar"${k<x._o.length-1?'':' disabled'}>▼</button></li>`).join('');
        ol.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const k=+b.dataset.u;[x._o[k-1],x._o[k]]=[x._o[k],x._o[k-1]];draw();});ol.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const k=+b.dataset.d;[x._o[k+1],x._o[k]]=[x._o[k],x._o[k+1]];draw();});};draw();
      card.querySelector('.ex-check').onclick=()=>{const good=x._o.every((v,k)=>v.k===k);ol.querySelectorAll('li').forEach((li,k)=>li.classList.add(x._o[k].k===k?'ok':'no'));lock();feedback(card,good,good?x:Object.assign({},x,{exp:(x.exp||'')+' Orden correcto: '+x.items.map((t,k)=>(k+1)+'. '+t).join(' · ')}));};}
    if(x.t==='reflect'){const ta=card.querySelector('.ex-ta'),chk=card.querySelector('.ex-check');ta.oninput=()=>{chk.disabled=ta.value.trim().length<15;};chk.onclick=()=>{reflect=ta.value.trim();next(null);};}
  };
  const end=()=>{const pass=ok>=need,ex=p.exams=p.exams||{},prev=ex[R.id]||{},first=pass&&!prev.passed,pts=ok*15+(first?100:0);
    ex[R.id]={best:Math.max(prev.best||0,ok),of:graded,passed:prev.passed||pass,pts:(prev.pts||0)+(first?pts:0)+(prev.passed?0:(pass?0:0)),reflect:reflect||prev.reflect||'',at:new Date().toISOString()};save();refreshHud();
    box.innerHTML=`<div class="ex-card ex-end ${pass?'pass':'fail'}"><div class="ex-seal">${pass?'🏆':'📖'}</div><small>Examen de ${esc(R.name)}</small><h2>${pass?'¡Etapa aprobada!':'Todavía no'}</h2><div class="ex-score"><b>${ok}</b><span>de ${graded} correctas</span></div>
      <p>${pass?(first?`Sumaste ${pts} puntos. ¡Seguí el camino!`:'Ya habías aprobado esta etapa. ¡Bien repasado!'):`Necesitás ${need}. Repasá estos temas y volvé a intentarlo cuando quieras:`}</p>
      ${wrong.length?'<ul class="ex-rev">'+wrong.map(w=>`<li><b>${esc(w.q||'Completar el pasaje')}</b><small>${esc(w.ref||'')}</small></li>`).join('')+'</ul>':''}
      <div class="ex-btns"><button class="ex-go">${pass?'Continuar':'Volver a intentarlo'}</button>${pass?'':'<button class="ex-later">Repasar el camino</button>'}</div></div>`;
    box.querySelector('.ex-go').onclick=()=>{if(pass){box.remove();onPass();}else{i=0;ok=0;wrong=[];show();}};const l=box.querySelector('.ex-later');if(l)l.onclick=()=>{box.remove();refreshMap();};};
  intro();
}
function finishRegion(r){
  const p=P(),R=REGIONS[r].id,ids=ORDER.map(k=>`${R}-${k}`).filter(isDone),okN=ids.filter(id=>p.done[id]).length,acc=ids.length?okN/ids.length:0;
  Object.assign(p.regions[R],{complete:true,stars:acc>=.9?3:acc>=.7?2:1,correct:okN,answered:ids.length});
  if(ids.length&&okN===ids.length)award('perfecto');
  if(REGIONS.every(x=>p.regions[x.id]&&p.regions[x.id].complete))award('peregrino');
  save();refreshMap();celebrate(r);
}
function celebrate(r){
  $('#barFill').style.width='100%';
  setTimeout(()=>{
    let rc=$('#bar').getBoundingClientRect();if(!rc.width)rc=$('#hudLv').getBoundingClientRect();const fly=document.createElement('div');fly.className='bar-fly';fly.innerHTML='<i></i>';
    Object.assign(fly.style,{left:rc.left+'px',top:rc.top+'px',width:rc.width+'px',height:rc.height+'px'});document.body.appendChild(fly);
    const W=Math.min(innerWidth*.82,420),H=22,L=(innerWidth-W)/2,Tp=innerHeight*.44-H/2;$('#dim').classList.add('on');
    const an=fly.animate([{left:rc.left+'px',top:rc.top+'px',width:rc.width+'px',height:rc.height+'px'},{left:L+'px',top:Tp+'px',width:W+'px',height:H+'px'}],{duration:reduce?1:850,easing:'cubic-bezier(.55,-0.25,.25,1.25)',fill:'forwards'});
    an.onfinish=()=>{fly.classList.add('glow');const cx=innerWidth/2,cy=Tp+H/2;petals(cx,cy,180);sparks(cx,cy,90,2.2);setTimeout(()=>petals(cx,cy-40,80),220);setTimeout(()=>{fly.classList.add('out');showLevelUp(r);setTimeout(()=>fly.remove(),600);},520);};
  },450);
}
function showLevelUp(r){
  const p=P(),R=REGIONS[r],st=p.regions[R.id],next=REGIONS[r+1],gpts=regionGames(p,R.id),tpts=st.trivia||0;
  const mh=pendingMedals.length?`<div><p class="kicker" style="margin:0 0 8px">Medallas nuevas</p><div class="new-medals">${pendingMedals.map(id=>{const m=MEDALS.find(x=>x.id===id);return `<span class="mchip">${coin(m,26)}${m.name}</span>`;}).join('')}</div></div>`:'';pendingMedals=[];
  $('#levelup').innerHTML=`<div class="lu" role="dialog" aria-label="Etapa completada"><span class="kicker">Etapa ${r+1} · ${R.name}</span><h2>¡Etapa completada, ${esc(p.name)}!</h2>
   <div class="stars">${[1,2,3].map(k=>STAR(k<=st.stars)).join('')}</div>
   <div><div class="big" id="luScore">0</div><span class="muted" style="font-size:14px;font-weight:800">puntos en esta etapa</span></div>
   <div class="stats"><div class="stat glass"><b>${st.correct}/${st.answered}</b><span>Correctas</span></div><div class="stat glass"><b>${fmt(gpts)}</b><span>En juegos</span></div><div class="stat glass"><b>${p.best}</b><span>Mejor racha</span></div></div>${mh}
   <div class="btns"><button class="primary" id="luGo">${next?'Seguir hacia '+next.name:'Ver el ranking'}</button></div>
   ${next?'':'<p class="muted" style="margin:0;font-size:14px;font-weight:700">Terminaste la versión de prueba. Las próximas etapas llegan pronto.</p>'}</div>`;
  $('#levelup').hidden=false;const sc=$('#luScore');
  setTimeout(()=>countTo(sc,0,tpts+gpts,1300,()=>{const b=sc.getBoundingClientRect();sparks(b.left+Math.random()*b.width,b.top+Math.random()*b.height,6,1.2);}),300);
  $('#luGo').onclick=()=>{$('#levelup').hidden=true;$('#dim').classList.remove('on');if(next){const nn=NODES[`${next.id}-n1`];camTo(nn.x,nn.y,true);toast(`Etapa ${r+2}: ${next.name}. Tocá la primera parada.`);}else{renderRank();show('rankView');}};
}

/* ===== PANTALLAS ===== */
const VIEWS=['hubView','adosView','homeView','authView','profilesView','createView','mapView','medalsView','rankView'];
function show(id){VIEWS.forEach(v=>$('#'+v).hidden=v!==id);if(id!=='mapView')scrollTo(0,0);}
const stagesDone=p=>Object.values(p.regions).filter(x=>x.complete).length;
const BR={kids:{name:'Kids',min:6,max:11,def:9},ados:{name:'Hero',min:12,max:18,def:14}};
const HASH={kids:'kids',ados:'hero'},fromHash=h=>h==='hero'||h==='ados'?'ados':h==='kids'?'kids':null;
function setBranch(b){branch=b;document.body.dataset.branch=b;try{history.replaceState(null,'','#'+HASH[b]);}catch(e){}}

/* inicio y sesión */
function renderSession(s){
  let h;
  if(s.loading)h='<span>Cargando tu cuenta…</span>';
  else if(!s.loggedIn)h='<span>Para jugar necesitás una cuenta familiar.</span><button class="linkbtn" data-act="login">Ingresar</button>';
  else{const m=s.member||{},n=m.firstName||m.displayName||'tu familia';h=`<span>Hola, ${esc(n)}</span><button class="linkbtn" data-act="logout">Cerrar sesión</button>`;}
  document.querySelectorAll('[data-session]').forEach(el=>el.innerHTML=h);
}
const LANDING={kids:'homeView',ados:'adosView'};
const onLanding=()=>['hubView','homeView','adosView'].some(v=>$('#'+v).hidden===false);
function play(b){setBranch(b);const s=getMemberState();if(s.loading){setTimeout(()=>play(b),150);return;}if(s.loggedIn)loadProfiles();else openAuth();}
function landing(b){current=null;setBranch(b);show(LANDING[b]);renderSession(getMemberState());}
function goHome(){current=null;branch=null;delete document.body.dataset.branch;try{history.replaceState(null,'',location.pathname);}catch(e){}show('hubView');renderSession(getMemberState());renderFamily();renderPulse();}
function goBack(){if(branch&&LANDING[branch])landing(branch);else goHome();}
function startDemo(b){setBranch(b);const id='demo-'+b;let loc=null;try{loc=JSON.parse(localStorage.getItem(CACHE+':'+id)||'null');}catch(e){}current={...blank(),...(loc||{}),id,name:'Invitado',rama:b,demo:true,avatar:{g:b==='ados'?'chico':'chica',age:b==='ados'?14:9,skin:'#E6B691',hair:'#2A1B14',outfit:b==='ados'?'#2FAE7C':'#FF8A2B'}};profiles=[current];enterMap();}
function route(){const raw=location.hash.replace('#','');const sala=/^sala-(kids|hero)-([A-Za-z0-9]{6})$/.exec(raw);if(sala){try{sessionStorage.setItem('tsp:join',sala[2].toUpperCase());}catch(e){}history.replaceState(null,'',location.pathname+'#'+sala[1]);landing(fromHash(sala[1]));setTimeout(()=>toast('Elegí tu perfil y entrá al mapa para unirte a la sala '+sala[2].toUpperCase()+'.'),600);return;}if(raw==='jugar-kids'||raw==='jugar-hero'){startDemo(raw==='jugar-kids'?'kids':'ados');return;}const h=fromHash(raw);if(h)landing(h);else goHome();}
addEventListener('hashchange',()=>{const h=fromHash(location.hash.replace('#',''));if(h&&branch===h&&!onLanding())return;route();});
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-session] [data-act]');if(a){if(a.dataset.act==='login')openAuth();else doLogout();return;}
  const g=e.target.closest('[data-go]');if(g){if(location.hash==='#'+g.dataset.go)landing(fromHash(g.dataset.go));else location.hash=g.dataset.go;return;}
  const p=e.target.closest('[data-play]');if(p){play(p.dataset.play);return;}
  if(e.target.closest('[data-hub]'))goHome();
});
let famBusy=false;
async function renderFamily(){
  const el=$('#family');if(!el)return;const s=getMemberState();
  if(s.loading){el.innerHTML='<p class="fam-empty">Cargando tu cuenta…</p>';return;}
  if(!s.loggedIn){el.innerHTML='<div class="fam-cta"><p>Creá tu cuenta familiar para guardar el progreso de cada chico y ver acá cómo avanza cada uno.</p><button class="primary" data-act="login">Crear cuenta o ingresar</button></div>';return;}
  if(famBusy)return;famBusy=true;
  el.innerHTML='<p class="fam-empty">Buscando a tu familia…</p>';
  let ps=[];
  try{const page=await queryItems('Perfiles',{limit:50});ps=(page.items||[]).map(fromItem);}
  catch(e){famBusy=false;el.innerHTML='<p class="fam-empty">No pudimos traer los personajes. Revisá la conexión.</p>';return;}
  famBusy=false;
  if(!ps.length){el.innerHTML='<p class="fam-empty">Todavía no hay personajes. Elegí Kids o Hero más arriba para crear el primero.</p>';return;}
  ps.sort((a,b)=>total(b)-total(a));
  el.innerHTML='<div class="fam-grid">'+ps.map(p=>`<button class="fam-card" data-id="${esc(p.id)}"><svg viewBox="-22 -84 44 44" aria-hidden="true">${headBox(p.avatar)}</svg><span class="info"><b>${esc(p.name)}</b><span class="meta"><span class="br-${esc(p.rama)}">${p.rama==='kids'?'Kids':'Hero'} · ${p.avatar.age} años</span><span class="pts">${fmt(total(p))} pts</span><span>${stagesDone(p)}/3 etapas</span><span>${p.medals.length}/${MEDALS.length} medallas</span></span></span></button>`).join('')+'</div>';
  el.querySelectorAll('.fam-card').forEach(c=>c.onclick=()=>{const p=ps.find(x=>x.id===c.dataset.id);if(!p)return;setBranch(p.rama);profiles=ps.filter(x=>x.rama===p.rama);current=p;enterMap();});
}
$('#family').addEventListener('click',e=>{if(e.target.closest('[data-act="login"]'))openAuth();});
/* pulso semanal de la portada */
const RETOS=Object.values(STORY).flatMap(r=>Object.values(r)).map(s=>s&&s.ch).filter(c=>c&&c.t==='mc'&&Array.isArray(c.options));
function renderReto(){
  const el=$('#hubReto');if(!el||!RETOS.length)return;
  const wk=Math.floor((Date.now()/864e5+3)/7),c=RETOS[wk%RETOS.length];
  const opts=c.options.map((o,i)=>({o,k:(i*7+wk*3)%11})).sort((a,b)=>a.k-b.k).map(x=>x.o);
  el.innerHTML=`<span class="tag">Reto de la semana</span><h3>${esc(c.q)}</h3><div class="opts">${opts.map(o=>`<button data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="res" hidden></div>`;
  el.querySelectorAll('.opts button').forEach(b=>b.onclick=()=>{
    const ok=b.dataset.o===c.answer;
    el.querySelectorAll('.opts button').forEach(x=>{x.disabled=true;if(x.dataset.o===c.answer)x.classList.add('ok');});
    if(!ok)b.classList.add('no');
    const r=el.querySelector('.res');r.hidden=false;
    r.innerHTML=`<p><b>${ok?'¡Bien ahí!':'Casi.'}</b> ${esc(c.exp||'')}</p><button class="cta">Seguí entrenando</button>`;
    r.querySelector('.cta').onclick=()=>$('#hubView .duo').scrollIntoView({behavior:'smooth',block:'center'});
  });
}
let pulseBusy=false;
async function renderPulse(){
  const st=$('#hubStats'),ld=$('#hubLead');if(!st||pulseBusy)return;pulseBusy=true;
  let items=[];
  try{const page=await queryItems('Ranking',{sort:[{field:'puntos',direction:'desc'}],limit:100});items=page.items||[];}catch(e){}
  pulseBusy=false;
  const sum=f=>items.reduce((a,i)=>a+(+i[f]||0),0);
  st.innerHTML=`<div class="stat"><b>${fmt(items.length)}</b><span class="live">entrenando</span></div><div class="stat"><b>${fmt(sum('etapas'))}</b><span>etapas superadas</span></div><div class="stat"><b>${fmt(sum('puntos'))}</b><span>puntos ganados</span></div>`;
  const list=b=>{const t=items.filter(i=>i.rama===b).slice(0,3);return t.length?'<ol>'+t.map((i,k)=>`<li><span class="pos">${k+1}</span><span class="nm">${esc(i.apodo||'Jugador')}<small>${b==='kids'?'Kids':'Hero'}</small></span><span class="pts">${fmt(+i.puntos||0)}</span></li>`).join('')+'</ol>':`<p class="none">${b==='kids'?'Kids':'Hero'}: todavía nadie. El primer lugar está libre.</p>`;};
  ld.innerHTML=`<span class="tag">Ranking</span><h3>Los que van adelante</h3>${list('ados')}<div style="height:12px"></div>${list('kids')}`;
}
renderReto();
function doLogout(){current=null;logout(location.pathname).catch(()=>{});}

/* ingreso */
function openAuth(){showForm('fLogin');show('authView');}
const teen=()=>branch==='ados';
function showForm(id){['fLogin','fSignup','fVerify'].forEach(f=>$('#'+f).hidden=f!==id);$('#approval').hidden=true;document.querySelectorAll('.tabs button').forEach(t=>t.setAttribute('aria-selected',String((t.dataset.tab==='login'&&id==='fLogin')||(t.dataset.tab==='signup'&&id==='fSignup'))));document.querySelectorAll('.auth [data-msg]').forEach(m=>m.textContent='');authMode(id);}
function authMode(id){const t=teen(),su=id==='fSignup';$('#social').hidden=id==='fVerify';$('#teenConsent').hidden=!(t&&su);$('#socialMsg').textContent='';$('#signupHelp').textContent=t?'Si tenés entre 12 y 18 años podés crear tu propia cuenta. Tus papás o quien esté a cargo tienen que saberlo.':'La cuenta la crea una persona adulta: mamá, papá o quien esté a cargo. Adentro van a poder crear un personaje para cada chico de la familia.';$('#sFirst').placeholder=t?'Tu nombre':'Tu nombre (adulto)';}
document.querySelectorAll('.tabs button').forEach(t=>t.onclick=()=>showForm(t.dataset.tab==='login'?'fLogin':'fSignup'));
$('#authBack').onclick=goBack;
$('#demoBtn').onclick=()=>startDemo(branch||'kids');
const ERR={invalidPassword:'La contraseña no coincide con esa cuenta.',invalidEmail:'Revisá el email: no encontramos una cuenta con ese dato.',emailAlreadyExists:'Ese email ya tiene cuenta. Ingresá con tu contraseña.',resetPassword:'Esta cuenta necesita una contraseña nueva. Revisá tu email.'};
function afterAuth(r,form){
  if(r.state==='SUCCESS'){if(branch)loadProfiles();else goHome();return;}
  if(r.state==='EMAIL_VERIFICATION_REQUIRED'){showForm('fVerify');return;}
  if(r.state==='OWNER_APPROVAL_REQUIRED'){['fLogin','fSignup','fVerify'].forEach(f=>$('#'+f).hidden=true);$('#approval').hidden=false;return;}
  form.querySelector('[data-msg]').textContent=ERR[r.errorCode]||r.error||'Algo salió mal. Revisá los datos y probá de nuevo.';
}
function bindForm(id,action){
  const f=$('#'+id);
  f.addEventListener('submit',e=>{e.preventDefault();if(!f.reportValidity())return;const btn=f.querySelector('button[type=submit]');btn.disabled=true;f.querySelector('[data-msg]').textContent='';
    action().then(r=>afterAuth(r,f)).catch(err=>afterAuth({state:'FAILURE',error:err&&err.message?err.message:String(err)},f)).then(()=>{btn.disabled=false;});});
}
bindForm('fLogin',()=>login($('#lEmail').value.trim(),$('#lPass').value));
bindForm('fSignup',()=>{if(teen()&&!$('#sConsent').checked){return Promise.resolve({state:'FAILURE',error:'Marcá la casilla de arriba: tus papás tienen que saber que te creás una cuenta.'});}if(teen())saveConsent();return register($('#sEmail').value.trim(),$('#sPass').value,{firstName:$('#sFirst').value.trim()});});
bindForm('fVerify',()=>verifyEmail($('#vCode').value.trim()));

/* ingresar con Google o Facebook (Wix hace todo el inicio de sesión) */
const IDP={google:'0e6a50f5-b523-4e29-990d-f37fa2ffdd69',facebook:'3ecad13f-52c3-483d-911f-31dbcf2a6d23'};
const b64u=b=>btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function saveConsent(){try{localStorage.setItem('tsp:consent',JSON.stringify({at:new Date().toISOString(),rama:'hero'}));}catch(e){}}
async function socialStart(kind){
  const su=!$('#fSignup').hidden;
  if(teen()&&su&&!$('#sConsent').checked){$('#socialMsg').textContent='Marcá la casilla de arriba: tus papás tienen que saber que te creás una cuenta.';return;}
  $('#socialMsg').textContent='';document.querySelectorAll('.sbtn').forEach(b=>b.disabled=true);
  try{
    const verifier=b64u(crypto.getRandomValues(new Uint8Array(32))),state=b64u(crypto.getRandomValues(new Uint8Array(16)));
    const challenge=b64u(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
    const redirectUri=location.origin+'/';
    sessionStorage.setItem('tsp:oauth',JSON.stringify({verifier,state,redirectUri,back:branch?'#'+(branch==='ados'?'hero':'kids'):'',consent:teen()&&su}));
    const r=await wixRequest('/headless/v1/redirect-session',{body:{auth:{authRequest:{redirectUri,clientId:WIX_CLIENT_ID,codeChallenge:challenge,codeChallengeMethod:'S256',responseMode:'fragment',responseType:'code',scope:'offline_access',state,idp:IDP[kind]}}}});
    const url=r&&r.redirectSession&&r.redirectSession.fullUrl;if(!url)throw new Error('sin url');
    location.assign(url);
  }catch(e){console.warn(e);document.querySelectorAll('.sbtn').forEach(b=>b.disabled=false);$('#socialMsg').textContent='No pudimos abrir el ingreso con '+(kind==='google'?'Google':'Facebook')+'. Probá de nuevo o usá tu email.';}
}
document.querySelectorAll('.sbtn').forEach(b=>b.onclick=()=>socialStart(b.dataset.idp));
async function socialFinish(){
  const h=new URLSearchParams(location.hash.slice(1));if(!h.has('code')&&!h.has('error'))return false;
  let st=null;try{st=JSON.parse(sessionStorage.getItem('tsp:oauth'));sessionStorage.removeItem('tsp:oauth');}catch(e){}
  history.replaceState(null,'',location.pathname+((st&&st.back)||''));
  if(!st||h.get('state')!==st.state||h.has('error')){setTimeout(()=>toast('No se pudo completar el ingreso. Probá de nuevo.'),400);return false;}
  try{const t=await mintTokens({grantType:'authorization_code',code:h.get('code'),codeVerifier:st.verifier,redirectUri:st.redirectUri},'member');setTokens(t);if(st.consent)saveConsent();await refreshMember();return true;}
  catch(e){console.warn(e);setTimeout(()=>toast('No se pudo completar el ingreso. Probá de nuevo.'),400);return false;}
}

/* personajes de la cuenta */
async function loadProfiles(){
  show('profilesView');
  $('#profTitle').textContent=`¿Quién juega? · ${BR[branch].name}`;
  $('#profNote').textContent=branch==='kids'?'Cada chico de la familia puede tener su propio personaje.':'Cada adolescente de la familia puede tener su propio personaje.';
  $('#players').innerHTML='<li class="loading glass">Buscando tus personajes…</li>';$('#newPlayer').hidden=true;
  try{
    const page=await queryItems('Perfiles',{filters:[{field:'rama',op:'eq',value:branch}],limit:50});
    profiles=(page.items||[]).map(fromItem);
  }catch(e){
    console.warn(e);$('#players').innerHTML='<li class="empty glass">No pudimos traer tus personajes. Revisá la conexión y volvé a intentar.</li>';$('#newPlayer').hidden=false;return;
  }
  renderProfiles();
}
function renderProfiles(){
  const list=profiles.slice().sort((a,b)=>total(b)-total(a));
  $('#players').innerHTML=list.length?list.map(p=>`<li><button class="pcard glass" data-id="${esc(p.id)}"><svg width="56" height="56" viewBox="-22 -84 44 44" aria-hidden="true">${headBox(p.avatar)}</svg><span class="info"><b>${esc(p.name)}</b><span>${p.avatar.age} años · ${fmt(total(p))} pts · ${stagesDone(p)} de 3 etapas</span></span><span class="go">Jugar</span></button></li>`).join(''):'<li class="empty glass">Todavía no hay personajes en esta rama. Creá el primero.</li>';
  $('#newPlayer').hidden=false;
  $('#players').querySelectorAll('.pcard').forEach(b=>b.onclick=()=>{current=profiles.find(p=>p.id===b.dataset.id);enterMap();});
}
$('#profBack').onclick=goBack;

/* creador */
let draft=null,editing=false;
const ageNote=a=>a<13?'Personaje niño · juegos más tranquilos':a<16?'Personaje adolescente · juegos a velocidad media':'Personaje adolescente grande · juegos más rápidos';
function openCreate(edit){
  editing=edit;const p=edit&&P(),R=BR[branch];
  draft=p?{...p.avatar}:{g:'chica',age:R.def,skin:SKINS[1],hair:HAIRS[0],outfit:OUTFITS[0]};
  draft.age=Math.min(R.max,Math.max(R.min,draft.age));
  const ag=$('#cAge');ag.min=R.min;ag.max=R.max;ag.value=draft.age;
  $('#cName').value=p?p.name:'';$('#cName').disabled=!!p;$('#cName').placeholder='Apodo para el juego';
  $('#createTitle').textContent=p?'Editar personaje':'Creá tu personaje';$('#cGo').textContent=p?'Guardar cambios':'Empezar el camino';$('#cErr').hidden=true;$('#cGo').disabled=false;
  document.querySelectorAll('.swatches').forEach(s=>{const k=s.dataset.k,arr={skin:SKINS,hair:HAIRS,outfit:OUTFITS}[k];s.innerHTML=arr.map((c,i)=>`<button class="sw" style="background:${c}" data-v="${c}" aria-label="Color ${i+1}"></button>`).join('');});
  paintCreate();show('createView');
}
function paintCreate(){
  document.querySelectorAll('.seg,.swatches').forEach(g=>g.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(draft[g.dataset.k]===b.dataset.v))));
  $('#cAgeOut').textContent=draft.age+' años';$('#cAgeNote').textContent=ageNote(draft.age);
  $('#preview').innerHTML=`<g class="idle">${avatarSVG(draft)}</g>`;
}
document.querySelectorAll('.seg,.swatches').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;draft[g.dataset.k]=b.dataset.v;paintCreate();}));
$('#cAge').addEventListener('input',e=>{draft.age=+e.target.value;paintCreate();});
$('#cGo').onclick=async()=>{
  if(editing){P().avatar={...draft};save();enterMap();return;}
  const name=$('#cName').value.trim();
  if(!name){$('#cErr').textContent='Escribí un apodo para empezar.';$('#cErr').hidden=false;$('#cName').focus();return;}
  if(profiles.some(p=>p.name.toLowerCase()===name.toLowerCase())){$('#cErr').textContent='Ya tenés un personaje con ese apodo. Elegí otro.';$('#cErr').hidden=false;return;}
  $('#cGo').disabled=true;$('#cGo').textContent='Creando…';
  try{
    const av=JSON.stringify(draft);
    const rk=await insertItem('Ranking',{apodo:name,rama:branch,avatar:av,puntos:0,etapas:0});
    const st={...blank(),rankId:rk._id};
    const it=await insertItem('Perfiles',{apodo:name,rama:branch,edad:draft.age,avatar:av,estado:JSON.stringify(st),puntos:0,etapas:0,medallas:0});
    patchItemFields('Ranking',rk._id,{perfil:it._id}).catch(()=>{});
    current={...st,id:it._id,name,rama:branch,avatar:{...draft}};profiles.push(current);enterMap();
  }catch(e){console.warn(e);$('#cErr').textContent='No pudimos crear el personaje. Revisá la conexión y probá de nuevo.';$('#cErr').hidden=false;$('#cGo').disabled=false;$('#cGo').textContent='Empezar el camino';}
};
$('#createBack').onclick=()=>{if(editing)enterMap();else loadProfiles();};
$('#newPlayer').onclick=()=>openCreate(false);

/* mapa */
window.GAME={NODES,EDGES,ADJ,REGIONS,VIGN,TOP,RH,WIDTH,get branch(){return branch},P,reachable,visited,isDone,bfs,arrive,save,toast,refreshHud,syncMap(){refreshMap();const n=NODES[P().pos];placeAv(n.x,n.y);requestAnimationFrame(()=>camTo(n.x,n.y,false));}};
function enterMap(){
  if(worldFor!==branch)buildWorld();
  const p=P();
  $('#hudAv').innerHTML=headBox(p.avatar);$('#avBody').innerHTML=`<g class="idle">${avatarSVG(p.avatar)}</g>`;
  const tw=Math.max(40,p.name.length*6.4+18);$('#tagBg').setAttribute('x',-tw/2);$('#tagBg').setAttribute('width',tw);$('#tagTx').textContent=p.name;
  show('mapView');refreshMap();const n=NODES[p.pos];placeAv(n.x,n.y);requestAnimationFrame(()=>camTo(n.x,n.y,false));
  if(p.pos==='start'&&!isDone('nacimiento-n1'))setTimeout(()=>toast(`¡Hola, ${p.name}! Tocá la parada que brilla para empezar.`),500);
  import(new URL('./walk3d.js', import.meta.url).href).then(m=>m.enter()).catch(e=>console.warn(e));
}
$('#menuBtn').onclick=()=>$('#menu').hidden=false;
$('#hudLv').onclick=$('#hudTitle').onclick=()=>openProg();
/* foto de la cuenta en el HUD (Hero: cada chico entra con su propia cuenta) */
const myPhoto=()=>{const p=current&&P(),m=getMemberState().member;return (p&&p.photo)||(branch==='ados'&&m&&m.photoUrl)||'';};
function hudPhoto(){const im=$('#hudPh'),u=myPhoto();if(!im)return;if(u&&im.dataset.u!==u){im.dataset.u=u;im.onerror=()=>{im.hidden=true;$('#hudAv').style.display='';};im.onload=()=>{im.hidden=false;$('#hudAv').style.display='none';};im.src=u;}if(!u){im.hidden=true;im.removeAttribute('data-u');$('#hudAv').style.display='';}}
subscribeMember(()=>{try{if(current)hudPhoto();}catch(e){}});
/* Mi progreso: todo junto en un solo lugar */
function openProg(){
  const p=P(),r=curRegion(),q=regionReq(r),T=total(p),n=lvOf(T),a=lvNeed(n),b=lvNeed(n+1),rank=LV_T[Math.min(n-1,LV_T.length-1)],ph=myPhoto();
  const ex=p.exams||{},mis=Object.keys(p.missions||{}).length,exOk=REGIONS.filter(x=>ex[x.id]&&ex[x.id].passed).length;
  const st=REGIONS.map((x,i)=>{const done=p.regions[x.id]&&p.regions[x.id].complete,cur=i===r&&!done,e=ex[x.id];return `<li class="${done?'ok':cur?'cur':'lock'}"><i>${done?'✓':cur?'➜':'🔒'}</i><span><b>Etapa ${i+1} · ${esc(x.name)}</b><small>${done?'Completa':cur?`En curso · ${q.done} de ${q.total} hitos`:'Todavía no'}${e&&e.passed?` · Examen ${e.best??e.ok??''}${e.of?'/'+e.of:''} ✓`:''}</small></span></li>`;}).join('');
  let el=$('#prog');if(!el){el=document.createElement('div');el.id='prog';document.body.appendChild(el);}
  el.innerHTML=`<div class="prog-in" role="dialog" aria-label="Mi progreso"><button class="prog-x" aria-label="Cerrar">✕</button>
    <div class="prog-top"><label class="prog-phw" title="Cambiar mi foto">${ph?`<img class="prog-ph" src="${esc(ph)}" alt="" referrerpolicy="no-referrer">`:`<svg class="prog-ph" viewBox="-22 -84 44 44" aria-hidden="true">${headBox(p.avatar)}</svg>`}<span class="prog-cam">📷</span><input type="file" accept="image/*" class="prog-file" hidden></label><div><small>${esc(p.name||'')}</small><b>Nivel ${n}</b><span>${esc(rank)}</span><button class="prog-chg" type="button">${ph?'Cambiar foto':'Poner mi foto'}</button>${p.photo?'<button class="prog-chg prog-del" type="button">Quitar</button>':''}</div></div>
    <div class="prog-xp"><div class="prog-bar"><i style="width:${Math.round((T-a)/(b-a)*100)}%"></i></div><small>${fmt(T-a)} de ${fmt(b-a)} puntos para el nivel ${n+1}</small></div>
    <div class="prog-stats"><div><b>${fmt(T)}</b><small>Puntos</small></div><div><b>${p.streak||0}</b><small>Racha</small></div><div><b>${mis}</b><small>Misiones</small></div><div><b>${exOk}</b><small>Exámenes</small></div></div>
    <h3>Tu camino</h3><p class="prog-now">Estás en la etapa ${r+1} de 10 · <b>${esc(REGIONS[r].name)}</b></p><div class="prog-bar sm"><i style="width:${Math.round(q.done/q.total*100)}%"></i></div>
    <ol class="prog-st">${st}</ol>
    <button class="prog-med" data-a="med">🏅 Ver mis medallas</button></div>`;
  el.hidden=false;
  const fi=el.querySelector('.prog-file');fi.onchange=()=>{const f=fi.files&&fi.files[0];if(!f)return;const img=new Image(),u=URL.createObjectURL(f);img.onload=()=>{const S=192,c=document.createElement('canvas');c.width=c.height=S;const k=Math.min(img.width,img.height),x=c.getContext('2d');x.drawImage(img,(img.width-k)/2,(img.height-k)/2,k,k,0,0,S,S);URL.revokeObjectURL(u);p.photo=c.toDataURL('image/jpeg',.82);save();hudPhoto();openProg();};img.onerror=()=>toast('No pude abrir esa imagen. Probá con otra.');img.src=u;};
  el.querySelector('.prog-chg:not(.prog-del)').onclick=()=>fi.click();
  {const d=el.querySelector('.prog-del');if(d)d.onclick=()=>{delete p.photo;save();hudPhoto();openProg();};}
  el.onclick=e=>{if(e.target===el||e.target.closest('.prog-x')){el.hidden=true;return;}if(e.target.closest('[data-a="med"]')){el.hidden=true;renderMedals();show('medalsView');}};
}
$('#menu').onclick=e=>{const a=e.target.closest('[data-a]');if(e.target.id==='menu'||a)$('#menu').hidden=true;if(!a)return;
  ({prog:()=>openProg(),medals:()=>{renderMedals();show('medalsView');},rank:()=>{renderRank();show('rankView');},edit:()=>openCreate(true),who:()=>{pushCloud();loadProfiles();},home:()=>{pushCloud();goHome();},logout:()=>{pushCloud().then(doLogout);},close:()=>{}})[a.dataset.a]();};
document.querySelectorAll('.back').forEach(b=>b.onclick=enterMap);
function renderMedals(){const p=P();$('#medals').innerHTML=MEDALS.map(m=>`<div class="medal glass ${p.medals.includes(m.id)?'':'off'}">${coin(m)}<b>${m.name}</b><span>${m.desc}</span></div>`).join('');}
async function renderRank(){
  const el=$('#rank');el.innerHTML='<li class="loading glass">Cargando el ranking…</li>';
  $('#rankNote').textContent=`Ranking ${BR[branch].name}: todos los jugadores de esta rama. Solo se muestra el apodo y el personaje.`;
  await pushCloud();
  let items=[];
  try{const page=await queryItems('Ranking',{filters:[{field:'rama',op:'eq',value:branch}],sort:[{field:'puntos',direction:'desc'}],limit:50});items=page.items||[];}
  catch(e){el.innerHTML='<li class="empty glass">No pudimos cargar el ranking. Revisá la conexión.</li>';return;}
  items=items.filter(i=>(i.puntos||0)>0);
  const me=P()&&P().rankId;
  el.innerHTML=items.length?items.map((it,k)=>{let av={};try{av=JSON.parse(it.avatar||'{}');}catch(e){}av={g:'chica',age:12,skin:'#E6B691',hair:'#2A1B14',outfit:'#5B8DEF',...av};return `<li class="glass ${it._id===me?'me':''}"><span class="pos">${k+1}</span><svg width="42" height="42" viewBox="-22 -84 44 44" aria-hidden="true">${headBox(av)}</svg><span class="nm">${esc(it.apodo||'Jugador')}<small>${it.etapas||0} de 3 etapas</small></span><span class="sc">${fmt(it.puntos||0)}</span></li>`;}).join(''):'<li class="empty glass" style="display:block">Todavía está vacío. Jugá tu primera parada y aparecés acá.</li>';
}
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pushCloud();});

/* ===== EFECTOS ===== */
const fx=$('#fx'),ctx=fx.getContext('2d');let parts=[],raf=0,dpr=1;
function sizeFx(){dpr=Math.min(devicePixelRatio||1,2);fx.width=innerWidth*dpr;fx.height=innerHeight*dpr;}
sizeFx();addEventListener('resize',sizeFx);
const PETAL=['#EF6F61','#F7A3A8','#FFD0D6','#FFCF5C','#FFE39A','#FFFFFF'],GOLD=['#F2B33D','#FFD873','#FFF6D8','#FFC94D'];
const pick=a=>a[Math.floor(Math.random()*a.length)],scaleN=n=>Math.round(n*(reduce?.2:1));
function petals(x,y,n){for(let i=0;i<scaleN(n);i++){const a=Math.random()*Math.PI*2,s=3+Math.random()*10;parts.push({k:'p',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3,r:Math.random()*6.28,vr:(Math.random()-.5)*.25,sz:6+Math.random()*9,c:pick(PETAL),life:0,max:120+Math.random()*80,sw:Math.random()*6.28});}loop();}
function sparks(x,y,n,f=1){for(let i=0;i<scaleN(n);i++){const a=Math.random()*Math.PI*2,s=(1+Math.random()*5)*f;parts.push({k:'s',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,r:Math.random()*6.28,vr:(Math.random()-.5)*.3,sz:2.5+Math.random()*4.5,c:pick(GOLD),life:0,max:35+Math.random()*40});}loop();}
function loop(){if(!raf)raf=requestAnimationFrame(tick);}
function starPath(s){ctx.beginPath();for(let i=0;i<8;i++){const r2=i%2?s*.3:s,a=i*Math.PI/4;ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);}ctx.closePath();}
function tick(){
  raf=0;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);parts=parts.filter(p=>p.life<p.max);
  for(const p of parts){p.life++;const t=p.life/p.max;ctx.save();
    if(p.k==='p'){p.vx*=.965;p.vy=p.vy*.965+.13;p.sw+=.09;p.x+=p.vx+Math.sin(p.sw)*.9;p.y+=p.vy;p.r+=p.vr;ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=Math.max(0,1-t*t);ctx.fillStyle=p.c;ctx.beginPath();ctx.ellipse(0,0,p.sz,p.sz*.42*Math.abs(Math.cos(p.sw))+1.2,0,0,Math.PI*2);ctx.fill();}
    else{p.vx*=.93;p.vy=p.vy*.93+.06;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.globalAlpha=Math.max(0,1-t);ctx.fillStyle=p.c;ctx.shadowColor='#FFC94D';ctx.shadowBlur=10;starPath(p.sz*(1-t*.4));ctx.fill();}
    ctx.restore();}
  if(parts.length)loop();
}
function floatText(txt,x,y){const s=document.createElement('span');s.className='float';s.textContent=txt;s.style.left=x+'px';s.style.top=y+'px';document.body.appendChild(s);setTimeout(()=>s.remove(),1100);}
function countTo(el,from,to,dur,onStep){const t0=performance.now();let last=0;const step=now=>{const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(to-from)*e);if(onStep&&now-last>70&&k<1){last=now;onStep();}if(k<1)requestAnimationFrame(step);};requestAnimationFrame(step);}
let toastT;
(function(){const K='tsp:play',LIM=5400,AGAIN=1800;let st=null;try{st=JSON.parse(sessionStorage.getItem(K));}catch(e){}if(!st||Date.now()-st.last>6e5)st={s:0,last:Date.now(),next:LIM};
function note(min){if(document.getElementById('breakNote'))return;const d=document.createElement('div');d.id='breakNote';d.setAttribute('role','dialog');d.style.cssText='position:fixed;inset:0;z-index:99;display:grid;place-items:center;padding:20px;background:rgba(8,10,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)';
const t=min<105?'una hora y media':(min<135?'dos horas':'más de dos horas');
d.innerHTML=`<div style="max-width:360px;width:100%;background:#FFF8EC;color:#2A2118;border-radius:22px;padding:26px 22px 20px;text-align:center;font-family:Nunito,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.4)"><div style="font-size:44px;line-height:1">⏰</div><h3 style="margin:10px 0 8px;font:900 21px Nunito,system-ui,sans-serif;text-wrap:balance">Ya estuviste jugando ${t} seguida${min<105?'':'s'}</h3><p style="margin:0 0 18px;font:600 15px/1.5 Nunito,system-ui,sans-serif;color:#5A4A3A">Es un buen momento para descansar: tomá agua, estirá las piernas y mirá un rato lejos de la pantalla. Tu avance queda guardado.</p><button data-b="1" style="width:100%;border:0;border-radius:14px;padding:13px;background:#E8913A;color:#fff;font:900 16px Nunito,system-ui,sans-serif;margin-bottom:8px">Me tomo un descanso</button><button data-b="0" style="width:100%;border:1px solid #D9C7AE;border-radius:14px;padding:11px;background:transparent;color:#5A4A3A;font:800 14px Nunito,system-ui,sans-serif">Sigo un rato más</button></div>`;
document.body.appendChild(d);d.querySelectorAll('button').forEach(b=>b.onclick=()=>d.remove());}
function save(){try{sessionStorage.setItem(K,JSON.stringify(st));}catch(e){}}
setInterval(()=>{const n=Date.now();if(document.hidden){if(n-st.last>6e5){st.s=0;st.next=LIM;}return;}const gap=(n-st.last)/1000;if(gap>600){st.s=0;st.next=LIM;}else st.s+=gap;st.last=n;save();if(st.s>=st.next){st.next=st.s+AGAIN;save();note(st.s/60);}},20000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){const n=Date.now();if(n-st.last>6e5){st.s=0;st.next=LIM;}st.last=n;save();}});})();
function toast(txt,m){const t=$('#toast');t.innerHTML=(m?coin(m,28):'')+`<span>${esc(txt)}</span>`;t.style.paddingLeft=m?'8px':'16px';t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2800);}

buildWorld();
subscribeMember(st=>{if(onLanding()){renderSession(st);if(!st.loading&&$('#hubView').hidden===false)renderFamily();}});
socialFinish().then(ok=>{route();if(ok&&branch)loadProfiles();});
