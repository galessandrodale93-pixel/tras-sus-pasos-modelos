// Cobro de cuotas por transferencia (alias habitatcfm), sin débito automático.
// Se activa con TutConfig «cobranza» = «transferencia». Vencimiento: el 10 de cada mes.
//  · día 1: ya se puede pagar · día 8: vence el 10 · día 10: hoy vence
//  · cada mail trae el botón «Pagar con Mercado Pago» con el monto ya puesto (se registra solo)
//  · día 11: falta el pago (puede tener recargo)
//  · día 15: último aviso
//  · día 11: además, a cada tutor la lista de su grupo que todavía no pagó
// Cada aviso sale una sola vez por alumno y mes (FinAvisos).
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { mandar, marco, p } from "./sem";
import { esc } from "./vol";
import { estadoMes, type Plan, type Cobro } from "./fin";
import { linkPago, montoDe } from "./pagoCuota";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
export const ALIAS = "habitatcfm";
export const VENCE = 10;
const MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
type Alumno = { _id: string; title?: string; email?: string; activo?: boolean; cuota?: number; cuotaCon?: string; cuotaDetalle?: string };

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
  10: { tipo: "vence", asunto: (m) => "Hoy vence tu cuota de " + m, titulo: "Hoy vence tu cuota ⏰", cuerpo: (n, m, d) => `${p(`Hola ${n}! Hoy es el último día para pagar tu cuota de <b>${m}</b>. Con el botón la pagás en un minuto.`)}${d}` },
  11: { tipo: "vencido", asunto: (m) => "Te falta el pago de la cuota de " + m, titulo: "Te falta el pago de este mes", cuerpo: (n, m, d) => `${p(`Hola ${n}! Todavía no registramos el pago de tu cuota de <b>${m}</b>, que vencía el ${VENCE}. Pasado el vencimiento la cuota puede tener un recargo, así que te pedimos ponerte al día lo antes posible.`)}${d}${p("Si estás pasando por una dificultad, respondé este mail y lo hablamos: queremos acompañarte.")}` },
  15: { tipo: "ultimo", asunto: (m) => "Último aviso: cuota de " + m + " pendiente", titulo: "Seguimos esperando tu pago", cuerpo: (n, m, d) => `${p(`Hola ${n}! Tu cuota de <b>${m}</b> sigue pendiente. Pasado el vencimiento puede tener un recargo. Por favor, ponete al día esta semana o escribinos si necesitás coordinar algo.`)}${d}` },
};
const comoPagarDe = (a: Alumno) => comoPagar.replace("al alias", a.cuotaDetalle && a.cuotaDetalle !== "Becado" ? `<b>${esc(a.cuotaDetalle)}</b> al alias` : (Number(a.cuota) ? `<b>$ ${Number(a.cuota).toLocaleString("es-AR")}</b>${a.cuotaCon ? " (compartida con " + esc(String(a.cuotaCon).split(/\s+/)[0]) + ")" : ""} al alias` : "al alias"));
const comoPagar = `<div style="background:#fff;border:1px solid #e6dccb;border-radius:14px;padding:14px 16px;margin:6px 0 14px"><p style="font:700 15px Arial;margin:0 0 6px">Si preferís transferir</p><p style="font:16px/1.6 Arial;margin:0">Transferí desde tu banco o Mercado Pago al alias <b>${ALIAS}</b> y respondé este mail con el comprobante.</p></div>`;

type Paso = (typeof PASO)[number];
// un mail por alumno que tenga algo pendiente (una sola vez por mes y tipo)
async function enviar(paso: Paso, hoy: string, dry: boolean, remitente: string, soloMes = false) {
  const hoyMes = hoy.slice(0, 7), mesTxt = MS[+hoyMes.slice(5, 7) - 1];
  const [al, planes, cobros, hechos] = await Promise.all([todos<Alumno>("TutAlumnos"), todos<Plan>("FinPlanes"), todos<Cobro>("FinCobros"), q("FinAvisos").eq("mes", hoyMes).eq("tipo", paso.tipo).limit(1000).find().then((r) => new Set((r.items as unknown as { alumnoId: string }[]).map((x) => x.alumnoId)))]);
  let ok = 0, sin = 0;
  const pendientes: { a: Alumno; imp: string[] }[] = [];
  for (const a of al.filter((x) => x.activo !== false)) {
    const ps = planes.filter((x) => x.alumnoId === a._id);
    const imp = ps.flatMap((pl) => { const L: string[] = []; for (let m = 1; m <= +hoyMes.slice(5, 7); m++) { const mm = hoyMes.slice(0, 4) + "-" + String(m).padStart(2, "0"); const e = estadoMes(pl, cobros, mm, hoyMes); if (e === "debe" || e === "pendiente") L.push(pl.escuela + " · " + MS[m - 1]); } return L; });
    if (!imp.length) continue; // al día, becado o de baja
    if (soloMes && !imp.some((x) => x.endsWith(mesTxt))) continue;
    pendientes.push({ a, imp });
    if (hechos.has(a._id)) continue;
    if (!a.email) { sin++; continue; }
    if (dry) { ok++; continue; }
    const deuda = imp.length > 1 ? `${p("Lo que figura pendiente:")}<ul style="font:16px/1.7 Arial;margin:0 0 12px">${imp.map((x) => "<li>" + esc(x) + "</li>").join("")}</ul>` : "";
    const nom = esc(String(a.title || "").split(/\s+/)[0]);
    const link = await linkPago(a, hoyMes).catch(() => "");
    const boton = link ? `<p style="margin:18px 0 6px"><a href="${link}" style="background:#009ee3;color:#fff;font:700 16px Arial;padding:14px 22px;border-radius:999px;text-decoration:none;display:inline-block">💳 Pagar $ ${montoDe(a).toLocaleString("es-AR")} con Mercado Pago</a></p><p style="font:13px Arial;color:#5d6b64;margin:0 0 14px">Tarjeta, débito o dinero en cuenta. Queda registrado solo, no hace falta mandar comprobante${a.cuotaCon ? " (cubre también a " + esc(String(a.cuotaCon).split(/\s+/)[0]) + ")" : ""}.</p>` : "";
    const html = marco("Habitat · Tu cuota", paso.titulo, `${paso.cuerpo(nom, mesTxt, deuda)}${boton}${comoPagarDe(a)}<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/campus.html#cuotaSec" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Ver mi cuota en el Campus</a></p>`, `<a href="https://www.habitat-cfm.org/campus.html" style="color:#b8904f">habitat-cfm.org/campus</a>`);
    const r = await mandar(a.email, paso.asunto(mesTxt), html, remitente, "Habitat CFM");
    if (r.ok) { ok++; await save("FinAvisos", { _id: hoyMes + "|" + paso.tipo + "|" + a._id, mes: hoyMes, tipo: paso.tipo, alumnoId: a._id, fecha: hoy }); }
  }
  return { ok, sin, pendientes };
}

// a cada tutor, la lista de su grupo que todavía no pagó (para escribirles personalmente)
async function avisarTutores(hoy: string, pend: { a: Alumno & { tutores?: string }; imp: string[] }[], dry: boolean, remitente: string) {
  const tut = await todos<{ _id: string; title?: string; email?: string; rol?: string }>("TutTutores");
  const nr = (t: unknown) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let ok = 0;
  for (const t of tut.filter((x) => x.email)) {
    const pre = nr(t.title).split(" ")[0].slice(0, 4);
    const mios = pend.filter((x) => nr(x.a.tutores).split(/\s+y\s+|,|\s+/).some((w) => w && w.slice(0, 4) === pre));
    if (!mios.length) continue;
    if (dry) { ok++; continue; }
    const lista = `<ul style="font:15px/1.7 Arial;margin:0 0 12px">${mios.map((x) => `<li><b>${esc(x.a.title || "")}</b> · ${esc(x.imp.join(", "))}</li>`).join("")}</ul>`;
    const html = marco("Habitat · Tutores", "Quiénes de tu grupo no pagaron todavía", `${p(`Hola ${esc(String(t.title || "").split(/\s+/)[0])}! La cuota venció ayer y estos alumnos de tu grupo todavía no la tienen registrada. Un mensaje tuyo, cercano, suele ser lo que más ayuda 💛`)}${lista}${p("Ya les llegó el mail con el botón para pagar con Mercado Pago. Si alguno está pasando un momento difícil, avisale a la dirección y lo vemos.")}`, `<a href="https://www.habitat-cfm.org/tutor.html" style="color:#b8904f">habitat-cfm.org/tutor</a>`);
    const r = await mandar(t.email as string, "Cuotas pendientes de tu grupo", html, remitente, "Habitat CFM");
    if (r.ok) ok++;
  }
  return ok;
}

export async function cobranzaDiario(hoy: string, dry: boolean, remitente: string) {
  if (!(await activa())) return { cobranza: "inactiva" };
  const dia = +hoy.slice(8, 10), paso = PASO[dia];
  if (!paso) return { cobranza: "hoy no toca" };
  const r = await enviar(paso, hoy, dry, remitente);
  const tutores = dia === 11 ? await avisarTutores(hoy, r.pendientes, dry, remitente) : undefined;
  return { cobranza: paso.tipo, enviados: r.ok, sinEmail: r.sin, tutores };
}

// Mail puntual (lo dispara la dirección): reabre el pago del mes con plazo sin recargo y el botón de Mercado Pago
export async function cobranzaReabre(hoy: string, hasta: string, dry: boolean, remitente: string) {
  const mesTxt = MS[+hoy.slice(5, 7) - 1];
  const paso: Paso = { tipo: "reabre", asunto: (m) => "Tu cuota de " + m + ": ahora la pagás con un toque", titulo: "Ya podés pagar tu cuota 🙌🏽", cuerpo: (n, m, d) => `${p(`Hola ${n}! Te escribimos de nuevo porque el mail anterior salió como «último aviso» y fue un error nuestro: es el primer mes con la nueva forma de pago, sin débito automático.`)}${p(`Tenés tiempo de pagar la cuota de <b>${m}</b> hasta el <b>${esc(hasta)}</b>, sin recargo. Ahora es más fácil: tocás el botón y la pagás con Mercado Pago en un minuto.`)}${d}` };
  const r = await enviar(paso, hoy, dry, remitente);
  return { reabre: mesTxt, enviados: r.ok, sinEmail: r.sin, pendientes: r.pendientes.length };
}

// Mail único a todos los alumnos: se termina el débito automático y cómo va a ser el cobro
export const mailNuevoSistema = (nom: string) => marco("Habitat · Tu cuota", "Cambia la forma de pagar la cuota", `${p(`Hola ${nom}! Te escribimos para contarte un cambio: <b>dejamos de usar el débito automático de Debi</b>. Desde ahora no te vamos a debitar nada de tu tarjeta ni de tu cuenta.`)}${p("<b>Cómo es ahora:</b>")}<ul style="font:16px/1.8 Arial;margin:0 0 12px"><li>Pagás tu cuota <b>por transferencia al alias ${ALIAS}</b>, desde tu banco o Mercado Pago.</li><li>Tenés tiempo <b>hasta el ${VENCE} de cada mes</b>.</li><li>Después de transferir, respondé el mail de recordatorio con el comprobante.</li><li>En el <b>Campus</b>, en «Mi cuota», ves en todo momento qué meses figuran pagos y cuáles pendientes.</li><li>Te vamos a mandar un recordatorio a principio de mes y otro antes del vencimiento.</li></ul>${p("Pasado el vencimiento la cuota puede tener un recargo, así que te pedimos pagar a tiempo. Si tenés cualquier duda o estás pasando por una dificultad, respondé este mail y lo hablamos.")}${p("Gracias por ser parte de Habitat 🙌🏽")}<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/campus.html#cuotaSec" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Ver mi cuota en el Campus</a></p>`, `<a href="https://www.habitat-cfm.org/campus.html" style="color:#b8904f">habitat-cfm.org/campus</a>`);
