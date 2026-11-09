// Intercesión y ayuno semanal del equipo de voluntarios.
// Cada día tiene un foco (rotan los 9), un versículo NTV verificado en bible.com, un mini devocional
// y una oración guiada en cuatro pasos. Un responsable por día, rotativo entre los voluntarios activos.
// El ayuno tiene su propia rotación, publicada por adelantado: la web solo marca el día; cada uno elige el tipo.
import { q, todos, guardar, hoyAR, mandar, marco, p } from "./sem";
import { esc } from "./vol";

export type Foco = { id: string; titulo: string; versos: { ref: string; texto: string }[]; devocional: string; oracion: { adoracion: string; gratitud: string; intercesion: string; entrega: string } };

// Texto bíblico: Nueva Traducción Viviente (NTV), © Tyndale House Foundation, 2010. Verificado en bible.com (versión 127).
export const FOCOS: Foco[] = [
  {
    id: "reino", titulo: "El Reino en Habitat",
    versos: [
      { ref: "Mateo 6:33", texto: "Busquen el reino de Dios por encima de todo lo demás y lleven una vida justa, y él les dará todo lo que necesiten." },
      { ref: "Salmos 127:1", texto: "Si el SEÑOR no construye la casa, el trabajo de los constructores es una pérdida de tiempo. Si el SEÑOR no protege la ciudad, protegerla con guardias no sirve para nada." },
      { ref: "Habacuc 2:14", texto: "Así como las aguas llenan el mar, la tierra se llenará del conocimiento de la gloria del SEÑOR." },
    ],
    devocional: "Habitat existe para que Jesús sea el centro. Cada clase, cada tutoría y cada silla acomodada son parte de una casa que el Señor mismo levanta. Hoy oramos para que Su presencia ocupe el primer lugar y que todo lo demás se ordene alrededor de Él.",
    oracion: { adoracion: "Jesús, Rey eterno, te adoramos porque Tu Reino es inconmovible y Tu presencia llena Habitat.", gratitud: "Gracias por cada persona que se forma, por cada clase y por todo lo que ya hiciste en estos años.", intercesion: "Que Tu Reino venga sobre cada programa, cada clase y cada encuentro. Guardanos de construir en nuestras fuerzas.", entrega: "Te entregamos Habitat: es Tu casa. Hacé lo que quieras con ella." },
  },
  {
    id: "estudiantes", titulo: "Los estudiantes",
    versos: [
      { ref: "2 Timoteo 2:15", texto: "Esfuérzate para poder presentarte delante de Dios y recibir su aprobación. Sé un buen obrero, alguien que no tiene de qué avergonzarse y que explica correctamente la palabra de verdad." },
      { ref: "Salmos 119:105", texto: "Tu palabra es una lámpara que guía mis pies y una luz para mi camino." },
      { ref: "Santiago 1:5", texto: "Si necesitan sabiduría, pídansela a nuestro generoso Dios, y él se la dará; no los reprenderá por pedirla." },
    ],
    devocional: "Cada alumno trae una historia, un llamado y también batallas que a veces no vemos. Hoy los ponemos delante del Señor por nombre: los que cursan presencial, por Zoom y a su ritmo desde el Campus. Pedimos que la Palabra eche raíces profundas en ellos.",
    oracion: { adoracion: "Padre, te adoramos porque sos el Maestro que forma corazones con paciencia y amor.", gratitud: "Gracias por cada estudiante que pusiste en Habitat y por la sed que despertaste en ellos.", intercesion: "Dales sabiduría, constancia y un corazón enseñable. Sostené a los que están cansados, a los que dudan y a los que atraviesan pruebas.", entrega: "Te los confiamos: terminá en ellos la obra que empezaste." },
  },
  {
    id: "provision", titulo: "La provisión y la protección",
    versos: [
      { ref: "Filipenses 4:19", texto: "Y este mismo Dios quien me cuida suplirá todo lo que necesiten, de las gloriosas riquezas que nos ha dado por medio de Cristo Jesús." },
      { ref: "Salmos 121:7", texto: "El SEÑOR te libra de todo mal y cuida tu vida." },
      { ref: "Salmos 23:1", texto: "El SEÑOR es mi pastor; tengo todo lo que necesito." },
    ],
    devocional: "El Señor es fiel proveedor. Hoy le presentamos las necesidades concretas de Habitat: el alquiler, las becas, los recursos y el sostén de quienes sirven. También pedimos Su cuidado sobre el edificio, sobre cada encuentro y sobre cada persona que llega.",
    oracion: { adoracion: "Señor, te adoramos como el Pastor que cuida y provee a Su pueblo.", gratitud: "Gracias por cada provisión de estos años y por cada sembrador que usaste para sostener la obra.", intercesion: "Proveé lo que Habitat necesita este mes. Abrí puertas, multiplicá lo que tenemos y guardanos de todo mal.", entrega: "Descansamos en Vos: Tus recursos nunca se acaban." },
  },
  {
    id: "fuerza", titulo: "La fuerza",
    versos: [
      { ref: "Isaías 40:31", texto: "En cambio, los que confían en el SEÑOR encontrarán nuevas fuerzas; volarán alto, como con alas de águila. Correrán y no se cansarán; caminarán y no desmayarán." },
      { ref: "Efesios 6:10", texto: "Una palabra final: sean fuertes en el Señor y en su gran poder." },
      { ref: "Filipenses 4:13", texto: "Pues todo lo puedo hacer por medio de Cristo, quien me da las fuerzas." },
    ],
    devocional: "Servir cansa, y el Señor lo sabe. Hoy oramos por fuerzas renovadas para el equipo, para los profes y para la dirección. Pedimos la fuerza que viene de esperar en Él, esa que sostiene en la constancia de cada semana.",
    oracion: { adoracion: "Dios Todopoderoso, te adoramos porque Tu poder se perfecciona en nuestra debilidad.", gratitud: "Gracias por sostenernos cada semana y por las veces que nos levantaste.", intercesion: "Renová las fuerzas de quienes sirven. Dales descanso, gozo y salud. Que nadie sirva desde el agotamiento.", entrega: "Te damos nuestro cansancio y recibimos Tu fuerza." },
  },
  {
    id: "equipo", titulo: "El equipo y sus familias",
    versos: [
      { ref: "Salmos 133:1", texto: "¡Qué maravilloso y agradable es cuando los hermanos conviven en armonía!" },
      { ref: "Gálatas 6:9", texto: "Así que no nos cansemos de hacer el bien. A su debido tiempo, cosecharemos numerosas bendiciones si no nos damos por vencidos." },
      { ref: "1 Corintios 15:58", texto: "Por lo tanto, mis amados hermanos, permanezcan fuertes y constantes. Trabajen siempre para el Señor con entusiasmo, porque ustedes saben que nada de lo que hacen para el Señor es inútil." },
    ],
    devocional: "Detrás de cada voluntario hay una familia que también sirve: con tiempo, con paciencia y con amor. Hoy oramos por la unidad del equipo y por cada casa, para que el servicio en Habitat sea fuente de bendición en cada hogar.",
    oracion: { adoracion: "Padre, te adoramos porque nos hiciste familia en Cristo.", gratitud: "Gracias por cada voluntario, por su entrega silenciosa y por sus familias.", intercesion: "Fortalecé la unidad del equipo. Bendecí cada casa: matrimonios, hijos, trabajos y salud.", entrega: "Ponemos nuestras familias en Tus manos." },
  },
  {
    id: "profes", titulo: "Profesores y tutores",
    versos: [
      { ref: "1 Pedro 5:2", texto: "Cuiden del rebaño que Dios les ha encomendado. Háganlo con gusto, no de mala gana ni por el beneficio personal que puedan obtener de ello, sino porque están deseosos de servir a Dios." },
      { ref: "Colosenses 3:23", texto: "Trabajen de buena gana en todo lo que hagan, como si fuera para el Señor y no para la gente." },
      { ref: "Hebreos 6:10", texto: "Pues Dios no es injusto. No olvidará con cuánto esfuerzo han trabajado para él y cómo han demostrado su amor por él sirviendo a otros creyentes como todavía lo hacen." },
    ],
    devocional: "Los profes siembran la Palabra y los tutores acompañan de cerca cada proceso. Hoy oramos por revelación fresca al preparar las clases, por sabiduría en cada conversación y por corazones llenos del amor de Jesús por los alumnos.",
    oracion: { adoracion: "Jesús, te adoramos como el Buen Pastor que cuida a cada oveja.", gratitud: "Gracias por cada profe y cada tutor que entrega su tiempo con amor.", intercesion: "Dales revelación al enseñar y ternura al acompañar. Cuidá sus vidas, sus familias y su intimidad con Vos.", entrega: "Que todo lo que enseñen y hagan sea para Vos." },
  },
  {
    id: "sembradores", titulo: "Los sembradores",
    versos: [
      { ref: "2 Corintios 9:6", texto: "Recuerden lo siguiente: un agricultor que siembra solo unas cuantas semillas obtendrá una cosecha pequeña. Pero el que siembra abundantemente obtendrá una cosecha abundante." },
      { ref: "2 Corintios 9:7", texto: "Cada uno debe decidir en su corazón cuánto dar; y no den de mala gana ni bajo presión, «porque Dios ama a la persona que da con alegría»." },
      { ref: "Proverbios 11:25", texto: "El generoso prosperará, y el que reanima a otros será reanimado." },
    ],
    devocional: "Cada sembrador hace posible becas, misiones y formación. Hoy los bendecimos: que el Señor multiplique lo que dan, que vean el fruto de su siembra y que sus casas estén llenas de Su provisión.",
    oracion: { adoracion: "Señor, te adoramos como el Dador de toda buena dádiva.", gratitud: "Gracias por cada sembrador y por la generosidad que pusiste en sus corazones.", intercesion: "Bendecí sus trabajos, sus familias y sus economías. Que vean el fruto de lo que siembran.", entrega: "Que todo lo que recibimos sea administrado para Tu gloria." },
  },
  {
    id: "direccion", titulo: "La dirección 2027 y Eckballo",
    versos: [
      { ref: "Proverbios 16:3", texto: "Pon todo lo que hagas en manos del SEÑOR, y tus planes tendrán éxito." },
      { ref: "Mateo 9:38", texto: "Así que oren al Señor que está a cargo de la cosecha; pídanle que envíe más obreros a sus campos»." },
      { ref: "Isaías 43:19", texto: "Pues estoy a punto de hacer algo nuevo. ¡Mira, ya he comenzado! ¿No lo ves? Haré un camino a través del desierto; crearé ríos en la tierra árida y baldía." },
    ],
    devocional: "El Señor está haciendo algo nuevo. Hoy oramos por la dirección de Habitat y por los planes de 2027, y especialmente por Eckballo: que el Señor envíe obreros a Su cosecha y que cada decisión nazca de Su voz.",
    oracion: { adoracion: "Señor de la cosecha, te adoramos porque Tus planes son perfectos.", gratitud: "Gracias por la visión que nos diste y por cada paso que ya abriste.", intercesion: "Dale sabiduría y unidad a la dirección. Guiá cada decisión de 2027 y levantá obreros para Eckballo.", entrega: "Ponemos los planes en Tus manos: que se haga Tu voluntad." },
  },
  {
    id: "generaciones", titulo: "Las nuevas generaciones (Kids & Hero)",
    versos: [
      { ref: "Salmos 145:4", texto: "Que cada generación cuente a sus hijos de tus poderosos actos y que proclame tu poder." },
      { ref: "Deuteronomio 6:7", texto: "Repíteselos a tus hijos una y otra vez. Habla de ellos en tus conversaciones cuando estés en tu casa y cuando vayas por el camino, cuando te acuestes y cuando te levantes." },
      { ref: "Marcos 10:14", texto: "Cuando Jesús vio lo que sucedía, se enojó con sus discípulos y les dijo: «Dejen que los niños vengan a mí. ¡No los detengan! Pues el reino de Dios pertenece a los que son como estos niños." },
    ],
    devocional: "Los chicos de hoy son la iglesia de hoy. Oramos por Kids & Hero, por cada niño y adolescente que va a conocer a Jesús a través de lo que se crea, y por las familias que los acompañan en el camino.",
    oracion: { adoracion: "Jesús, te adoramos porque recibís a los niños con los brazos abiertos.", gratitud: "Gracias por cada chico que te busca y por quienes los acompañan.", intercesion: "Usá Kids & Hero para mostrarles Tu amor. Protegé sus corazones y despertá en ellos una fe viva.", entrega: "Te entregamos esta generación: es Tuya." },
  },
];
export const NTV = "Nueva Traducción Viviente (NTV), © Tyndale House Foundation, 2010.";

const INICIO = "2026-11-09"; // día 0 de la rotación de focos
const diaN = (f: string) => Math.round((Date.parse(f + "T12:00:00Z") - Date.parse(INICIO + "T12:00:00Z")) / 864e5);
export function delDia(f: string) {
  const n = diaN(f), i = ((n % 9) + 9) % 9, foco = FOCOS[i], v = foco.versos[((Math.floor(n / 9) % 3) + 3) % 3];
  return { fecha: f, foco: foco.titulo, focoId: foco.id, verso: v, devocional: foco.devocional, oracion: foco.oracion };
}

export const TIPOS_AYUNO = [
  { id: "daniel", titulo: "Ayuno de Daniel", como: "Durante el día comés solo verduras, frutas, legumbres y cereales integrales, y tomás agua. Sin carnes, dulces, harinas refinadas ni bebidas con azúcar o cafeína.", base: "Daniel 1:12 y 10:3", cuidado: "Es el más amable para el cuerpo. Igual, tomá mucha agua y si tomás medicación con comidas, respetá esos horarios." },
  { id: "parcial", titulo: "Ayuno parcial", como: "Dejás una o dos comidas del día (por ejemplo, el desayuno y el almuerzo) y usás ese tiempo para orar. Cortás con una comida liviana.", base: "Hechos 13:2-3", cuidado: "Tomá agua durante todo el día. Si hacés trabajo físico, elegí dejar una sola comida." },
  { id: "sol", titulo: "De sol a sol", como: "Desde que sale el sol hasta que se pone, solo agua. Cortás el ayuno a la noche con una comida suave.", base: "Jueces 20:26 y Esdras 8:21-23", cuidado: "Tomá abundante agua. Si sentís mareos, debilidad fuerte o tenés alguna condición de salud, pasá a un ayuno parcial." },
  { id: "pantallas", titulo: "Ayuno de pantallas", como: "Durante el día dejás las redes, series y el celular para lo que no sea indispensable, y llenás ese tiempo con oración y la Palabra.", base: "Salmos 46:10 y Mateo 6:6", cuidado: "Es una buena opción para quienes no pueden dejar de comer por salud. Avisá en tu casa y en el trabajo si vas a estar menos disponible." },
];
export const SALUD = "Si estás embarazada o amamantando, tenés diabetes, presión baja, trastornos de la alimentación, tomás medicación o tenés alguna condición de salud, consultá con tu médico antes de ayunar sin comida y elegí el ayuno de pantallas o el de Daniel. El ayuno es para buscar a Dios: hacelo con libertad y sin culpa.";

/* ---------------- rotaciones ---------------- */
type Vol = { _id: string; title?: string; email?: string; activo?: boolean };
export type Turno = { _id: string; title?: string; fecha: string; responsableId: string; sumados?: string; avisoNoche?: string; avisoManana?: string; nota?: string };
export type Ayuno = { _id: string; title?: string; fecha: string; mes: string; voluntarioId: string; aviso?: string; tipo?: string };
const DIA = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
export const activos = async () => (await todos<Vol>("VolVoluntarios")).filter((v) => v.activo !== false).sort((a, b) => String(a.title).localeCompare(String(b.title)));

// Completa los turnos de intercesión de los próximos `dias` días, siguiendo la rueda de voluntarios.
export async function asegurarTurnos(dias = 45) {
  const hoy = hoyAR(), V = await activos();
  if (!V.length) return 0;
  const T = await todos<Turno>("IntTurnos"), ya = new Set(T.map((t) => t.fecha));
  const cfg = (await q("TutConfig").eq("_id", "intIdx").limit(1).find()).items[0] as { valor?: string } | undefined;
  let idx = Number((cfg && cfg.valor) || 0), n = 0;
  for (let i = 0; i < dias; i++) {
    const f = DIA(hoy, i);
    if (ya.has(f)) continue;
    const v = V[idx % V.length]; idx++;
    await guardar("IntTurnos", { _id: f, title: f, fecha: f, responsableId: v._id, sumados: "[]", avisoNoche: "", avisoManana: "", nota: "" });
    n++;
  }
  if (n) await guardar("TutConfig", { _id: "intIdx", valor: String(idx) });
  return n;
}

// Publica la rotación de ayuno de 1 o 3 meses: cada voluntario activo, un día por mes, repartidos en el mes.
export async function publicarAyuno(mes: string, meses: number) {
  const V = await activos(), out: string[] = [];
  for (let k = 0; k < meses; k++) {
    const [y, m] = mes.split("-").map(Number), d0 = new Date(Date.UTC(y, m - 1 + k, 1)), mm = d0.toISOString().slice(0, 7);
    const ult = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 0)).getUTCDate();
    const ya = (await q("IntAyuno").eq("mes", mm).limit(500).find()).items.length;
    if (ya) { out.push(mm + " ya publicado"); continue; }
    for (let i = 0; i < V.length; i++) {
      const dia = 1 + Math.floor((i * ult) / V.length), f = mm + "-" + String(dia).padStart(2, "0");
      await guardar("IntAyuno", { _id: f + "|" + V[i]._id, title: V[i].title || "", fecha: f, mes: mm, voluntarioId: V[i]._id, aviso: "", tipo: "" });
    }
    out.push(mm + ": " + V.length + " voluntarios");
  }
  return out;
}

/* ---------------- avisos ---------------- */
const WEB = "https://www.habitat-cfm.org";
const DL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const larga = (f: string) => { const d = new Date(f + "T12:00:00Z"); return DL[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MS[d.getUTCMonth()]; };
function htmlDia(nom: string, f: string, manana: boolean) {
  const d = delDia(f), o = d.oracion;
  return marco("Habitat · Intercesión", (manana ? "Mañana" : "Hoy") + " estás a cargo de la intercesión 🙏", `
${p(`Hola ${esc(nom)}! ${manana ? "Mañana, " + esc(larga(f)) + "," : "Hoy"} sos quien sostiene en oración a Habitat. El foco del día es <b>${esc(d.foco)}</b>.`)}
<p style="font:italic 17px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:16px 0">«${esc(d.verso.texto)}» ${esc(d.verso.ref)} (NTV)</p>
${p(esc(d.devocional))}
<p style="font:700 13px Arial;letter-spacing:.12em;color:#b8904f;text-transform:uppercase;margin:18px 0 6px">Oración guiada</p>
<ol style="font:16px/1.7 Arial;margin:0 0 12px"><li><b>Adoración:</b> ${esc(o.adoracion)}</li><li><b>Gratitud:</b> ${esc(o.gratitud)}</li><li><b>Intercesión:</b> ${esc(o.intercesion)}</li><li><b>Entrega:</b> ${esc(o.entrega)}</li></ol>
${p("En la página también están los pedidos de oración del equipo y de los profes.")}
<p style="margin:18px 0"><a href="${WEB}/intercesion.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir la intercesión de ${manana ? "mañana" : "hoy"}</a></p>
<p style="font:12px Arial;color:#8a948f">Texto bíblico: ${esc(NTV)}</p>`);
}

// cuando: "noche" (avisa al de mañana) o "manana" (avisa al de hoy). También el recordatorio de ayuno, 3 días antes.
export async function oracionAviso(cuando: "noche" | "manana", hoy: string, dry: boolean, remitente: string) {
  await asegurarTurnos(45).catch(() => 0);
  const f = cuando === "noche" ? DIA(hoy, 1) : hoy, campo = cuando === "noche" ? "avisoNoche" : "avisoManana";
  const t = (await q("IntTurnos").eq("_id", f).limit(1).find()).items[0] as Turno | undefined;
  const V = Object.fromEntries((await todos<Vol>("VolVoluntarios")).map((v) => [v._id, v]));
  const out: Record<string, unknown> = {};
  if (t && !(t as Record<string, string>)[campo]) {
    const v = V[t.responsableId];
    if (v && v.email && !dry) {
      const r = await mandar(String(v.email).split(/[,;\s]+/)[0], (cuando === "noche" ? "Mañana" : "Hoy") + " estás a cargo de la intercesión: " + delDia(f).foco, htmlDia(String(v.title || "").split(/\s+/)[0], f, cuando === "noche"), remitente);
      if (r.ok) await guardar("IntTurnos", { ...t, [campo]: hoy });
      out.turno = { v: v.title, ok: r.ok };
    } else out.turno = { v: v && v.title, dry, sinEmail: !(v && v.email) };
  }
  if (cuando === "manana") { // recordatorio de ayuno 3 días antes
    const obj = DIA(hoy, 3), L = (await q("IntAyuno").eq("fecha", obj).limit(200).find()).items as Ayuno[];
    const av: unknown[] = [];
    for (const a of L) {
      const v = V[a.voluntarioId]; if (a.aviso || !v || !v.email) continue;
      if (dry) { av.push(v.title); continue; }
      const r = await mandar(String(v.email).split(/[,;\s]+/)[0], "Tu día de ayuno es el " + larga(obj), marco("Habitat · Ayuno", "Tu día de ayuno se acerca", `${p(`Hola ${esc(String(v.title || "").split(/\s+/)[0])}! Te recordamos que el <b>${esc(larga(obj))}</b> es tu día de ayuno por Habitat.`)}${p("Elegí con libertad el tipo de ayuno que mejor te quede: de Daniel, parcial, de sol a sol o de pantallas. En la página tenés la guía con cada uno, su base bíblica y los cuidados de salud.")}<p style="margin:18px 0"><a href="${WEB}/intercesion.html#ayuno" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Ver la guía de ayuno</a></p>`), remitente);
      if (r.ok) await guardar("IntAyuno", { ...a, aviso: hoy });
      av.push({ v: v.title, ok: r.ok });
    }
    out.ayuno = av;
  }
  return out;
}

// Pedidos de oración de las reflexiones de los profes (campo "oracion"), una vez cada uno.
export async function pedidosDeProfes() {
  const [R, P, ya] = await Promise.all([todos<{ _id: string; profeId?: string; fecha?: string; oracion?: string }>("ProfReflexion"), todos<{ _id: string; title?: string }>("Profes"), todos<{ _id: string }>("IntPedidos")]);
  const ids = new Set(ya.map((x) => x._id)), NP = Object.fromEntries(P.map((x) => [x._id, x.title]));
  let n = 0;
  for (const r of R) {
    const t = String(r.oracion || "").trim(), id = "refl-" + r._id.replace(/[^a-zA-Z0-9-]+/g, "-");
    if (t.length < 4 || ids.has(id)) continue;
    await guardar("IntPedidos", { _id: id, title: "Profe " + String(NP[r.profeId || ""] || "").split(/\s+/)[0], texto: t.slice(0, 1000), fecha: r.fecha || hoyAR(), estado: "Activo", fuente: "Reflexión de un profe", respondida: "", por: "" });
    n++;
  }
  return n;
}
