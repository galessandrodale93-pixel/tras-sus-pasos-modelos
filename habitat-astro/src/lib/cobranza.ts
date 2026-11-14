// Cobro de cuotas por transferencia (alias habitatcfm), sin débito automático.
// Se activa con TutConfig «cobranza» = «transferencia». Vencimiento: el 10 de cada mes.
//  · día 1 y 8: recordatorio a quien todavía no pagó el mes
//  · día 11: falta el pago (puede tener recargo)
//  · día 15: último aviso
// Cada aviso sale una sola vez por alumno y mes (FinAvisos).
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { mandar, marco, p } from "./sem";
import { esc } from "./vol";
import { estadoMes, type Plan, type Cobro } from "./fin";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
export const ALIAS = "habitatcfm";
export const VENCE = 10;
const MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
type Alumno = { _id: string; title?: string; email?: string; activo?: boolean };

async function todos<T>(col: string): Promise<T[]> {
  const out: T[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as T[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as T[])); }
  return out;
}
export async function activa() {
  const c = (await q("TutConfig").eq("_id", "cobranza").limit(1).find()).items[0] as { valor?: string } | undefined;
  return !!c && c.valor === "transferencia";
}

const PASO: Record<number, { tipo: string; asunto: (m: string) => string; titulo: string; cuerpo: (nom: string, m: string, deuda: string) => string }> = {
  1: { tipo: "inicio", asunto: (m) => "Tu cuota de " + m + " en Habitat", titulo: "Ya podés pagar tu cuota 🙌🏽", cuerpo: (n, m, d) => `${p(`Hola ${n}! Arrancó ${m} y ya podés abonar tu cuota de Habitat. Tenés tiempo hasta el <b>${VENCE} de ${m}</b>.`)}${d}` },
  8: { tipo: "recordatorio", asunto: (m) => "Recordatorio: tu cuota de " + m + " vence el " + VENCE, titulo: "Se acerca el vencimiento", cuerpo: (n, m, d) => `${p(`Hola ${n}! Te recordamos que tu cuota de <b>${m}</b> vence el <b>${VENCE}</b>. Si ya la pagaste, ¡gracias! Mandanos el comprobante así lo registramos.`)}${d}` },
  11: { tipo: "vencido", asunto: (m) => "Te falta el pago de la cuota de " + m, titulo: "Te falta el pago de este mes", cuerpo: (n, m, d) => `${p(`Hola ${n}! Todavía no registramos el pago de tu cuota de <b>${m}</b>, que vencía el ${VENCE}. Pasado el vencimiento la cuota puede tener un recargo, así que te pedimos ponerte al día lo antes posible.`)}${d}${p("Si estás pasando por una dificultad, respondé este mail y lo hablamos: queremos acompañarte.")}` },
  15: { tipo: "ultimo", asunto: (m) => "Último aviso: cuota de " + m + " pendiente", titulo: "Seguimos esperando tu pago", cuerpo: (n, m, d) => `${p(`Hola ${n}! Tu cuota de <b>${m}</b> sigue pendiente. Pasado el vencimiento puede tener un recargo. Por favor, ponete al día esta semana o escribinos si necesitás coordinar algo.`)}${d}` },
};
const comoPagar = `<div style="background:#fff;border:1px solid #e6dccb;border-radius:14px;padding:14px 16px;margin:6px 0 14px"><p style="font:700 15px Arial;margin:0 0 6px">Cómo pagar</p><p style="font:16px/1.6 Arial;margin:0">Transferí desde tu banco o Mercado Pago al alias <b>${ALIAS}</b> y respondé este mail con el comprobante.</p></div>`;

export async function cobranzaDiario(hoy: string, dry: boolean, remitente: string) {
  if (!(await activa())) return { cobranza: "inactiva" };
  const dia = +hoy.slice(8, 10), paso = PASO[dia];
  if (!paso) return { cobranza: "hoy no toca" };
  const hoyMes = hoy.slice(0, 7), mesTxt = MS[+hoyMes.slice(5, 7) - 1];
  const [al, planes, cobros, hechos] = await Promise.all([todos<Alumno>("TutAlumnos"), todos<Plan>("FinPlanes"), todos<Cobro>("FinCobros"), q("FinAvisos").eq("mes", hoyMes).eq("tipo", paso.tipo).limit(1000).find().then((r) => new Set((r.items as unknown as { alumnoId: string }[]).map((x) => x.alumnoId)))]);
  let ok = 0, sin = 0;
  for (const a of al.filter((x) => x.activo !== false)) {
    if (hechos.has(a._id)) continue;
    const ps = planes.filter((x) => x.alumnoId === a._id);
    const imp = ps.flatMap((pl) => { const L: string[] = []; for (let m = 1; m <= +hoyMes.slice(5, 7); m++) { const mm = hoyMes.slice(0, 4) + "-" + String(m).padStart(2, "0"); const e = estadoMes(pl, cobros, mm, hoyMes); if (e === "debe" || e === "pendiente") L.push(pl.escuela + " · " + MS[m - 1]); } return L; });
    if (!imp.length) continue; // al día, becado o de baja
    if (!a.email) { sin++; continue; }
    if (dry) { ok++; continue; }
    const deuda = imp.length > 1 ? `${p("Lo que figura pendiente:")}<ul style="font:16px/1.7 Arial;margin:0 0 12px">${imp.map((x) => "<li>" + esc(x) + "</li>").join("")}</ul>` : "";
    const nom = esc(String(a.title || "").split(/\s+/)[0]);
    const html = marco("Habitat · Tu cuota", paso.titulo, `${paso.cuerpo(nom, mesTxt, deuda)}${comoPagar}<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/campus.html#cuotaSec" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Ver mi cuota en el Campus</a></p>`, `<a href="https://www.habitat-cfm.org/campus.html" style="color:#b8904f">habitat-cfm.org/campus</a>`);
    const r = await mandar(a.email, paso.asunto(mesTxt), html, remitente, "Habitat CFM");
    if (r.ok) { ok++; await save("FinAvisos", { _id: hoyMes + "|" + paso.tipo + "|" + a._id, mes: hoyMes, tipo: paso.tipo, alumnoId: a._id, fecha: hoy }); }
  }
  return { cobranza: paso.tipo, enviados: ok, sinEmail: sin };
}

// Mail único a todos los alumnos: se termina el débito automático y cómo va a ser el cobro
export const mailNuevoSistema = (nom: string) => marco("Habitat · Tu cuota", "Cambia la forma de pagar la cuota", `${p(`Hola ${nom}! Te escribimos para contarte un cambio: <b>dejamos de usar el débito automático de Debi</b>. Desde ahora no te vamos a debitar nada de tu tarjeta ni de tu cuenta.`)}${p("<b>Cómo es ahora:</b>")}<ul style="font:16px/1.8 Arial;margin:0 0 12px"><li>Pagás tu cuota <b>por transferencia al alias ${ALIAS}</b>, desde tu banco o Mercado Pago.</li><li>Tenés tiempo <b>hasta el ${VENCE} de cada mes</b>.</li><li>Después de transferir, respondé el mail de recordatorio con el comprobante.</li><li>En el <b>Campus</b>, en «Mi cuota», ves en todo momento qué meses figuran pagos y cuáles pendientes.</li><li>Te vamos a mandar un recordatorio a principio de mes y otro antes del vencimiento.</li></ul>${p("Pasado el vencimiento la cuota puede tener un recargo, así que te pedimos pagar a tiempo. Si tenés cualquier duda o estás pasando por una dificultad, respondé este mail y lo hablamos.")}${p("Gracias por ser parte de Habitat 🙌🏽")}<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/campus.html#cuotaSec" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Ver mi cuota en el Campus</a></p>`, `<a href="https://www.habitat-cfm.org/campus.html" style="color:#b8904f">habitat-cfm.org/campus</a>`);
