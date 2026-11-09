// Testimonios en video de los alumnos: propuesta de los más comprometidos, invitación segmentada,
// respuestas desde el mail ("Ya lo subí", "Necesito ayuda", "Prefiero filmarlo allá"), recordatorios con tope
// y aviso a directores y tutores cuando llega un video. El video aprobado pasa a SemTestimonios.
import { estadoMes, type Plan, type Cobro } from "./fin";
import { esc } from "./vol";
import { q, todos, guardar, mandar, marco, p, hoyAR, type Testimonio } from "./sem";

const WEB = "https://www.habitat-cfm.org";
export const PLAZO = 14, TOPE = 4;
export const ESTADOS = ["Invitado", "Ya lo subió (revisar)", "Necesita ayuda", "Filmar en Habitat", "Subido", "Sin respuesta", "Descartado"];

export type Video = { _id: string; title?: string; alumnoId: string; email?: string; becado?: boolean; estado?: string; invitado?: string; limite?: string; proximo?: string; recordatorios?: number; video?: string; subido?: string; clave?: string; nota?: string };
type Alumno = { _id: string; title?: string; email?: string; activo?: boolean; tutores?: string; carreras?: string; formaPago?: string };
type Asis = { alumnoId: string; fecha: string; estado: string };
type Eval = { alumnoId: string; ok?: boolean; fecha?: string };

export const masDias = (f: string, n: number) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const nrm = (t: unknown) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const esBecado = (a: Alumno, planes: Plan[]) => /becad/.test(nrm(a.formaPago)) || planes.some((x) => x.alumnoId === a._id && (/becad/.test(nrm(x.formaPago)) || /becad/.test(nrm(x.especial))));

// Compromiso de los últimos 4 meses: asistencia (50 %), exámenes y TP aprobados (30 %) y pagos al día (20 %).
export async function propuesta() {
  const hoy = hoyAR(), desde = masDias(hoy, -120), mesHoy = hoy.slice(0, 7);
  const [al, asis, ev, planes, cobros, vids] = await Promise.all([todos<Alumno>("TutAlumnos"), todos<Asis>("TutAsistencia"), todos<Eval>("TutEvaluaciones"), todos<Plan>("FinPlanes"), todos<Cobro>("FinCobros"), todos<Video>("SemVideos")]);
  const ya = new Set(vids.filter((v) => v.estado !== "Descartado").map((v) => v.alumnoId));
  return al.filter((a) => a.activo !== false).map((a) => {
    const as = asis.filter((x) => x.alumnoId === a._id && x.fecha >= desde);
    const pres = as.filter((x) => /[PZV]/.test(x.estado)).length, just = as.filter((x) => x.estado === "J").length;
    const pAsis = as.length ? (pres + just * 0.5) / as.length : 0;
    const es = ev.filter((x) => x.alumnoId === a._id), ok = es.filter((x) => x.ok !== false).length;
    const pEval = es.length ? ok / es.length : 0.5;
    const becado = esBecado(a, planes);
    const ps = planes.filter((x) => x.alumnoId === a._id);
    let meses = 0, debe = 0;
    for (let m = 3; m <= +hoy.slice(5, 7); m++) {
      const mes = hoy.slice(0, 4) + "-" + String(m).padStart(2, "0");
      for (const pl of ps) { const e = estadoMes(pl, cobros, mes, mesHoy); if (e === "nada" || e === "futuro") continue; meses++; if (e === "debe") debe++; }
    }
    const pPago = becado ? 1 : meses ? 1 - debe / meses : 0.5;
    const puntaje = Math.round(100 * (0.5 * pAsis + 0.3 * pEval + 0.2 * pPago));
    return { alumnoId: a._id, title: a.title, email: a.email || "", carreras: a.carreras || "", becado, puntaje, asistencia: Math.round(100 * pAsis), clases: as.length, aprobados: ok + "/" + es.length, debe, ya: ya.has(a._id) };
  }).sort((x, y) => Number(x.ya) - Number(y.ya) || y.puntaje - x.puntaje);
}

/* ---------------- mails ---------------- */
const PREGUNTAS = (becado: boolean) => [
  "¿Quién sos y qué estudiás en Habitat?",
  "¿Cómo llegaste a Habitat?",
  "¿Qué cambió en tu vida desde que estudiás acá?",
  becado ? "¿Qué significa para vos la beca que recibiste?" : "¿Qué significa para vos estudiar en Habitat?",
  "Un mensaje para quien siembra en tu formación.",
];
const btn = (href: string, t: string, dark = true) => `<a href="${href}" style="display:inline-block;margin:0 8px 10px 0;background:${dark ? "#10251d" : "#fbf8f2"};color:${dark ? "#fbf8f2" : "#10251d"};border:1px solid #10251d;font:700 14px Arial;padding:11px 18px;border-radius:999px;text-decoration:none">${t}</a>`;
const link = (v: Video, r = "") => `${WEB}/testimonio.html?k=${encodeURIComponent(v.clave || "")}${r ? "&r=" + r : ""}`;
const larga = (f: string) => { const d = new Date(f + "T12:00:00Z"); return d.getUTCDate() + " de " + ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][d.getUTCMonth()]; };

function guia(v: Video) {
  return `<p style="font:700 13px Arial;letter-spacing:.12em;color:#b8904f;text-transform:uppercase;margin:20px 0 6px">Cómo filmarlo</p>
<ul style="font:16px/1.7 Arial;margin:0 0 12px"><li>Celular en vertical, como un Reel.</li><li>Buena luz: mirá hacia una ventana o una lámpara, con la luz de frente.</li><li>Encuadre de la cadera para arriba, en un lugar tranquilo y sin ruido.</li><li>Hablá con naturalidad, como si se lo contaras a un amigo.</li></ul>
<p style="font:700 13px Arial;letter-spacing:.12em;color:#b8904f;text-transform:uppercase;margin:20px 0 6px">Las 5 preguntas</p>
<ol style="font:16px/1.7 Arial;margin:0 0 12px">${PREGUNTAS(!!v.becado).map((x) => "<li>" + x + "</li>").join("")}</ol>`;
}

export function htmlInvitacion(v: Video) {
  const nom = esc(String(v.title || "").split(/\s+/)[0]);
  const intro = v.becado
    ? "Tu historia es parte de lo que Dios está haciendo en Habitat, y tu beca existe gracias a personas que siembran en la formación de esta generación. Nos encantaría que les cuentes en un video corto qué significa para vos."
    : "Te elegimos porque tu compromiso con la formación se nota: en las clases, en los exámenes y en cómo vivís este tiempo. Nos encantaría que cuentes tu historia en un video corto para quienes siembran en Habitat.";
  return marco("Habitat · Tu testimonio", "Queremos escuchar tu historia 🎥", `
${p(`Hola ${nom}!`)}${p(intro)}${guia(v)}
${p(`Tenés tiempo hasta el <b>${larga(v.limite || hoyAR())}</b>. Lo subís desde el Campus, o si preferís lo filmamos juntos en Habitat.`)}
<p style="margin:16px 0">${btn(link(v), "Subir mi video")}${btn(link(v, "alla"), "Prefiero filmarlo en Habitat", false)}</p>
${p("Gracias por animarte. Tu voz puede abrir camino para que otros también se formen.")}`);
}

export function htmlRecordatorio(v: Video, n: number) {
  const nom = esc(String(v.title || "").split(/\s+/)[0]);
  const frase = ["Te recordamos el video de tu testimonio.", "¿Pudiste filmar tu testimonio?", "Seguimos esperando tu video con mucha alegría.", "Último recordatorio de tu testimonio."][Math.min(n, 3)];
  return marco("Habitat · Tu testimonio", frase, `
${p(`Hola ${nom}! ${v.limite && v.limite >= hoyAR() ? `Tenés tiempo hasta el <b>${larga(v.limite)}</b>.` : "Todavía estás a tiempo."} Contanos cómo vas:`)}
<p style="margin:16px 0">${btn(link(v, "subi"), "Ya lo subí")}${btn(link(v, "ayuda"), "Necesito ayuda", false)}${btn(link(v, "alla"), "Prefiero filmarlo allá", false)}</p>
${guia(v)}
<p style="margin:16px 0">${btn(link(v), "Subir mi video")}</p>`);
}

const AVISO: Record<string, string> = {
  subido: "subió su video testimonio",
  subi: "dice que ya subió su video, pero no lo encontramos: conviene escribirle",
  ayuda: "pidió ayuda con su video testimonio",
  alla: "prefiere filmar su testimonio en Habitat",
  sin: "no respondió a los recordatorios del video testimonio",
};
async function avisarEquipo(v: Video, que: string, remitente: string) {
  const al = (await q("TutAlumnos").eq("_id", v.alumnoId).limit(1).find()).items[0] as Alumno | undefined;
  const tut = (await todos<{ title?: string; email?: string; rol?: string; pareja?: string }>("TutTutores")).filter((t) => t.email && (t.rol === "director" || (al && al.tutores && t.pareja === al.tutores)));
  const cuerpo = `${p(`<b>${esc(v.title)}</b>${v.becado ? " (becado)" : ""} ${AVISO[que]}.`)}${v.video ? `<p style="margin:16px 0">${btn(v.video, "Ver el video ▶")}</p>` : ""}<p style="margin:16px 0">${btn(WEB + "/sembradores-panel.html#videos", "Abrir en el panel", false)}</p>${p("Los directores lo aprueban en el panel de Sembradores; una vez aprobado, les llega a los sembradores según su foco.")}`;
  for (const t of tut) await mandar(t.email as string, esc(v.title) + " " + AVISO[que].split(":")[0], marco("Habitat · Testimonios", "Novedad de un testimonio", cuerpo), remitente);
  return tut.length;
}

/* ---------------- acciones ---------------- */
export async function invitar(ids: string[], remitente: string) {
  const hoy = hoyAR();
  const [al, planes, vids] = await Promise.all([todos<Alumno>("TutAlumnos"), todos<Plan>("FinPlanes"), todos<Video>("SemVideos")]);
  const out: unknown[] = [];
  for (const id of ids) {
    const a = al.find((x) => x._id === id);
    if (!a) continue;
    const prev = vids.find((v) => v._id === id);
    if (prev && prev.estado !== "Descartado" && prev.estado !== "Sin respuesta") { out.push({ id, ya: prev.estado }); continue; }
    const v: Video = { _id: id, title: a.title, alumnoId: id, email: a.email || "", becado: esBecado(a, planes), estado: "Invitado", invitado: hoy, limite: masDias(hoy, PLAZO), proximo: masDias(hoy, 3), recordatorios: 0, video: "", subido: "", clave: crypto.randomUUID().replace(/-/g, ""), nota: "" };
    let r: unknown = "sin email";
    if (v.email) r = await mandar(v.email, v.becado ? "Tu beca puede inspirar a otros: ¿nos contás tu historia?" : "Queremos escuchar tu historia en Habitat 🎥", htmlInvitacion(v), remitente);
    await guardar("SemVideos", v as unknown as Record<string, unknown>);
    out.push({ id, r });
  }
  return out;
}

export async function porClave(k: string) {
  if (!/^[a-f0-9]{32}$/.test(k)) return null;
  return ((await q("SemVideos").eq("clave", k).limit(1).find()).items[0] as Video | undefined) || null;
}

// Respuesta desde el mail o la página: subi | ayuda | alla
export async function responder(v: Video, r: string, remitente: string) {
  if (v.estado === "Subido" || v.estado === "Descartado") return v;
  const est = r === "ayuda" ? "Necesita ayuda" : r === "alla" ? "Filmar en Habitat" : r === "subi" ? (v.video ? "Subido" : "Ya lo subió (revisar)") : "";
  if (!est || est === v.estado) return v;
  const it = { ...v, estado: est, proximo: "" };
  await guardar("SemVideos", it as unknown as Record<string, unknown>);
  if (est !== "Subido") await avisarEquipo(it, r, remitente);
  return it;
}

export async function videoSubido(v: Video, url: string, remitente: string) {
  const it: Video = { ...v, estado: "Subido", video: url, subido: hoyAR(), proximo: "" };
  await guardar("SemVideos", it as unknown as Record<string, unknown>);
  const t: Testimonio = { _id: "v-" + v._id, title: v.title, alumnoId: v.alumnoId, texto: "", video: url, foco: v.becado ? "Becas" : "General", becado: !!v.becado, permiso: false, estado: "Pendiente", fecha: hoyAR() };
  const prev = (await q("SemTestimonios").eq("_id", t._id).limit(1).find()).items[0] as Testimonio | undefined;
  await guardar("SemTestimonios", { ...(prev || {}), ...t, texto: (prev && prev.texto) || "", permiso: !!(prev && prev.permiso) } as Record<string, unknown>);
  await avisarEquipo(it, "subido", remitente);
  return it;
}

// Recordatorios cada 2 o 3 días (al azar), con tope; al llegar al tope y pasado el plazo queda "Sin respuesta".
export async function testimoniosDiario(hoy: string, dry: boolean, remitente: string) {
  const vs = (await todos<Video>("SemVideos")).filter((v) => v.estado === "Invitado" && v.proximo && v.proximo <= hoy);
  const out: unknown[] = [];
  for (const v of vs) {
    const n = v.recordatorios || 0;
    if (n >= TOPE) {
      if (v.limite && v.limite < hoy) { if (!dry) { await guardar("SemVideos", { ...v, estado: "Sin respuesta", proximo: "" } as unknown as Record<string, unknown>); await avisarEquipo(v, "sin", remitente); } out.push({ v: v.title, fin: true }); }
      continue;
    }
    if (dry || !v.email) { out.push({ v: v.title, rec: n + 1, email: !!v.email }); continue; }
    const r = await mandar(v.email, n >= TOPE - 1 ? "Último recordatorio: tu video testimonio" : "Tu video testimonio para Habitat 🎥", htmlRecordatorio(v, n), remitente);
    const prox = masDias(hoy, 2 + (Math.random() < 0.5 ? 0 : 1));
    await guardar("SemVideos", { ...v, recordatorios: n + 1, proximo: n + 1 >= TOPE ? masDias(v.limite && v.limite > hoy ? v.limite : hoy, 1) : prox } as unknown as Record<string, unknown>);
    out.push({ v: v.title, rec: n + 1, ok: r.ok });
  }
  return out;
}
