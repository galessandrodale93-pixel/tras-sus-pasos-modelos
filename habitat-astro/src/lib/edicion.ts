// Edición de videos de las clases (Adoración, Liderazgo y Maranata). Un video por clase:
// Para entregar → En edición (desde que Gui marca que le entregó el material a Cris; 7 días de plazo) → Editada → Subida.
// Al subirlo aparece en el Campus (como material de la clase) y se avisa a los directores.
import { esClase, type Clase } from "./profe";
import { q, todos, guardar, hoyAR, mandar, marco, p } from "./sem";
import { esc } from "./vol";

export const PROGRAMAS = ["Adoración", "Liderazgo", "Maranata"];
export const ESTADOS = ["Para entregar", "En edición", "Editada", "Subida"];
export const FUENTES = ["Compu de Habitat", "Celular de Gui (audio en la compu)"];
export const PLAZO = 7;
export type EdVideo = { _id: string; title?: string; programa?: string; fecha: string; estado: string; entregado?: string; limite?: string; fuente?: string; url?: string; subido?: string; atraso?: string; nota?: string };
const DIA = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const WEB = "https://www.habitat-cfm.org";

// Todas las clases dictadas, con su estado de edición (las que no tienen registro están "Para entregar").
export async function lista() {
  const hoy = hoyAR();
  const [cl, ev] = await Promise.all([todos<Clase>("TutClases"), todos<EdVideo>("EdVideos")]);
  const E = Object.fromEntries(ev.map((v) => [v._id, v]));
  return cl.filter((c) => esClase(c) && PROGRAMAS.includes(String(c.programa)) && c.fecha <= hoy)
    .map((c) => { const v = E[c._id] || ({} as EdVideo); const { _createdDate, _updatedDate, _owner, ...x } = v as Record<string, unknown>; return { ...x, _id: c._id, title: c.title, programa: c.programa, fecha: c.fecha, estado: v.estado || "Para entregar" } as EdVideo; })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Ritmo para ponerse al día: lo nuevo de cada semana más una parte de lo atrasado, para cerrar en ~8 semanas.
export function plan(L: EdVideo[], ritmoFijo?: number) {
  const hoy = hoyAR(), pend = L.filter((v) => v.estado !== "Subida");
  const ult = L.filter((v) => v.fecha >= DIA(hoy, -28)).length, nuevasSemana = Math.max(1, Math.round(ult / 4));
  const ritmo = ritmoFijo && ritmoFijo > 0 ? ritmoFijo : nuevasSemana + Math.max(1, Math.ceil(pend.length / 8));
  const extra = ritmo - nuevasSemana, semanas = extra > 0 ? Math.ceil(pend.length / extra) : 0;
  return { pendientes: pend.length, atrasados: pend.filter((v) => v.fecha < DIA(hoy, -PLAZO)).length, nuevasSemana, ritmo, fechaEstimada: extra > 0 ? DIA(hoy, semanas * 7) : "", semanas };
}

async function editores() {
  const cfg = (await q("TutConfig").eq("_id", "editores").limit(1).find()).items[0] as { valor?: string } | undefined;
  const ids = String((cfg && cfg.valor) || "").split(/[,\s]+/).filter(Boolean);
  const T = await todos<{ _id: string; title?: string; email?: string; rol?: string }>("TutTutores");
  return { eds: T.filter((t) => ids.includes(t._id) && t.email), dirs: T.filter((t) => t.rol === "director" && t.email), ids };
}
export async function puedeEditar(id: string) { const { ids } = await editores(); return ids.includes(id); }

const fl = (f: string) => { const d = new Date(f + "T12:00:00Z"); return d.getUTCDate() + "/" + (d.getUTCMonth() + 1); };
const linea = (v: EdVideo) => `<li>${esc(v.programa)} · ${esc(fl(v.fecha))} · ${esc(v.title)}${v.limite ? " (hasta el " + esc(fl(v.limite)) + ")" : ""}</li>`;

export async function avisarEntrega(vs: EdVideo[], remitente: string) {
  const { eds } = await editores();
  for (const e of eds) await mandar(e.email as string, "Te llegó material para editar: " + vs.length + " clase" + (vs.length === 1 ? "" : "s"), marco("Habitat · Edición de videos", "Material nuevo para editar 🎬", `${p(`Hola ${esc(String(e.title || "").split(/\s+/)[0])}! Gui te entregó el material de estas clases:`)}<ul style="font:15px/1.7 Arial">${vs.map(linea).join("")}</ul>${p(`Tenés ${PLAZO} días para cada una. Cuando la tengas, subila desde tu panel y les aparece a los alumnos en el Campus.`)}<p style="margin:18px 0"><a href="${WEB}/edicion.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir mi panel</a></p>`), remitente);
}

export async function avisarSubida(v: EdVideo, remitente: string) {
  const { dirs } = await editores();
  for (const d of dirs) await mandar(d.email as string, "Video subido: " + (v.title || "clase"), marco("Habitat · Edición de videos", "Ya está en el Campus 🎬", `${p(`Se subió el video de <b>${esc(v.programa)} · ${esc(v.title)}</b> (clase del ${esc(fl(v.fecha))}). Los alumnos ya lo ven en el Campus.`)}<p style="margin:18px 0"><a href="${esc(v.url || WEB + "/edicion.html")}" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Ver el video</a></p>`), remitente);
}

// Aviso diario: atrasos (una vez por video) y, los lunes, un resumen semanal para Cris.
export async function edicionDiario(hoy: string, dry: boolean, remitente: string) {
  const L = await lista(), { eds } = await editores();
  const atr = L.filter((v) => v.estado !== "Subida" && v.limite && v.limite < hoy && !v.atraso);
  const out: Record<string, unknown> = { atrasos: atr.length };
  if (dry || !eds.length) return out;
  if (atr.length) {
    for (const e of eds) await mandar(e.email as string, "Se pasó el plazo de " + atr.length + " video" + (atr.length === 1 ? "" : "s"), marco("Habitat · Edición de videos", "Videos con el plazo vencido", `${p("Estos videos pasaron los 7 días desde que recibiste el material:")}<ul style="font:15px/1.7 Arial">${atr.map(linea).join("")}</ul>${p("Si necesitás más tiempo o te falta algo del material, avisale a Gui. ¡Gracias por todo lo que hacés! 🙌🏽")}<p style="margin:18px 0"><a href="${WEB}/edicion.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir mi panel</a></p>`), remitente);
    for (const v of atr) await guardar("EdVideos", { ...v, atraso: hoy } as unknown as Record<string, unknown>);
  }
  if (new Date(hoy + "T12:00:00Z").getUTCDay() === 1) {
    const cfg = (await q("TutConfig").eq("_id", "edRitmo").limit(1).find()).items[0] as { valor?: string } | undefined;
    const P = plan(L, Number((cfg && cfg.valor) || 0)), enEd = L.filter((v) => v.estado === "En edición" || v.estado === "Editada");
    const sem = L.filter((v) => v.subido && v.subido >= DIA(hoy, -7)).length;
    for (const e of eds) await mandar(e.email as string, "Edición de videos · tu semana", marco("Habitat · Edición de videos", "Resumen de la semana", `${p(`Hola ${esc(String(e.title || "").split(/\s+/)[0])}! La semana pasada se subieron <b>${sem}</b> video${sem === 1 ? "" : "s"}. Gracias 🙌🏽`)}${p(`Tenés <b>${enEd.length}</b> en edición. Quedan <b>${P.pendientes}</b> por subir en total. Ritmo sugerido: <b>${P.ritmo} por semana</b>${P.fechaEstimada ? `, así quedamos al día cerca del ${esc(fl(P.fechaEstimada))}` : ""}.`)}${enEd.length ? `<ul style="font:15px/1.7 Arial">${enEd.slice(0, 12).map(linea).join("")}</ul>` : ""}<p style="margin:18px 0"><a href="${WEB}/edicion.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir mi panel</a></p>`), remitente);
    out.semanal = true;
  }
  return out;
}
