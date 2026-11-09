// Mercado Pago → Finanzas. La clave la carga la dirección en el gestor de claves de Wix (MP_ACCESS_TOKEN);
// nunca está en el código. Cada pago aprobado se guarda en FinIngresos y se clasifica:
// siembra automática (suscripción), cuota de un alumno (por nombre o email), alguien recordado, libros, o "Por clasificar".
import { auth } from "@wix/essentials";
import { secrets } from "@wix/secrets";
import { q, todos, guardar, hoyAR, desdePago, mandar, marco, p, slug } from "./sem";
import { esc } from "./vol";

const getSecret = auth.elevate(secrets.getSecretValue);
export const TIPOS_ING = ["Siembra automática", "Siembra puntual", "Libros", "Efectivo", "Cuota de alumno (MP)", "Otro", "Por clasificar"];
const SIEMBRA = ["Siembra automática", "Siembra puntual"];

export type Ingreso = { _id: string; title?: string; email?: string; fecha: string; mes: string; monto: number; neto?: number; tipo: string; origen: string; alumnoId?: string; pagador?: string; descripcion?: string; estado?: string; nota?: string; por?: string };
type Pagador = { _id: string; title?: string; tipo: string; alumnoId?: string };
type Alumno = { _id: string; title?: string; email?: string };

const nrm = (t: unknown) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const fechaAR = (iso: string) => new Date(Date.parse(iso) - 3 * 3600e3).toISOString().slice(0, 10);

export async function token() {
  try { const r = await getSecret("MP_ACCESS_TOKEN"); return (r && r.value) || ""; } catch { return ""; }
}
async function mp(path: string, tk: string) {
  const r = await fetch("https://api.mercadopago.com" + path, { headers: { authorization: "Bearer " + tk } });
  if (!r.ok) throw new Error("Mercado Pago respondió " + r.status);
  return r.json();
}

// deno-lint-ignore no-explicit-any
type Pago = any;
export function clavePagador(pg: Pago) {
  const py = pg.payer || {};
  const email = String(py.email || "").toLowerCase();
  if (email && !/@(testuser|mercadopago)\./.test(email)) return "e-" + slug(email);
  const doc = py.identification && py.identification.number;
  if (doc) return "d-" + String(doc).replace(/\D/g, "");
  const n = [py.first_name, py.last_name].filter(Boolean).join(" ");
  return n ? "n-" + slug(n) : "";
}
const nombrePagador = (pg: Pago) => { const py = pg.payer || {}; return [py.first_name, py.last_name].filter(Boolean).join(" ") || String(py.email || "") || "Sin nombre"; };
const esSuscripcion = (pg: Pago) => pg.operation_type === "recurring_payment" || !!(pg.metadata && pg.metadata.preapproval_id) || /subscription|preapproval/i.test(String((pg.point_of_interaction || {}).type || ""));

export async function clasificar(pg: Pago, ctx?: { pag: Pagador[]; al: Alumno[] }) {
  const pag = ctx ? ctx.pag : await todos<Pagador>("FinPagadores"), al = ctx ? ctx.al : await todos<Alumno>("TutAlumnos");
  const key = clavePagador(pg), nom = nombrePagador(pg), email = String((pg.payer || {}).email || "").toLowerCase();
  const rec = pag.find((x) => x._id === key);
  if (rec) return { tipo: rec.tipo, alumnoId: rec.alumnoId || "", key };
  if (esSuscripcion(pg)) return { tipo: "Siembra automática", alumnoId: "", key };
  const a = al.find((x) => (email && String(x.email || "").toLowerCase() === email) || (nom && nrm(x.title) === nrm(nom)));
  if (a) return { tipo: "Cuota de alumno (MP)", alumnoId: a._id, key };
  if (/libro|asombro/i.test(String(pg.description || ""))) return { tipo: "Libros", alumnoId: "", key };
  if (/siembra|sembr|ofrenda|donaci/i.test(String(pg.description || ""))) return { tipo: "Siembra puntual", alumnoId: "", key };
  return { tipo: "Por clasificar", alumnoId: "", key };
}

// Guarda (o actualiza) un pago de MP. Si ya estaba clasificado a mano, respeta esa clasificación.
export async function registrarPago(pg: Pago, ctx?: { pag: Pagador[]; al: Alumno[] }) {
  if (!pg || !pg.id || pg.status !== "approved") return null;
  if (Number(pg.transaction_amount) <= 0) return null;
  const _id = "mp-" + pg.id;
  const prev = (await q("FinIngresos").eq("_id", _id).limit(1).find()).items[0] as Ingreso | undefined;
  const c = prev && prev.tipo !== "Por clasificar" ? { tipo: prev.tipo, alumnoId: prev.alumnoId || "", key: prev.pagador || clavePagador(pg) } : await clasificar(pg, ctx);
  const fecha = fechaAR(pg.date_approved || pg.date_created || new Date().toISOString());
  const it: Ingreso = { _id, title: nombrePagador(pg), email: String((pg.payer || {}).email || "").toLowerCase(), fecha, mes: fecha.slice(0, 7), monto: Number(pg.transaction_amount) || 0, neto: Number((pg.transaction_details || {}).net_received_amount) || 0, tipo: c.tipo, origen: "Mercado Pago", alumnoId: c.alumnoId, pagador: c.key, descripcion: String(pg.description || "").slice(0, 300), estado: pg.status, nota: (prev && prev.nota) || "", por: "Mercado Pago" };
  await guardar("FinIngresos", it as unknown as Record<string, unknown>);
  if (!prev && SIEMBRA.includes(it.tipo) && it.email) await desdePago({ email: it.email, nombre: it.title || "", monto: it.monto, recurrente: it.tipo === "Siembra automática", fecha });
  return it;
}

export async function porId(id: string) {
  const tk = await token();
  if (!tk) throw new Error("Falta MP_ACCESS_TOKEN en el gestor de claves.");
  return registrarPago(await mp("/v1/payments/" + encodeURIComponent(id), tk));
}

// Trae los pagos de los últimos días (red de seguridad por si un aviso no llegó, y carga inicial).
export async function traer(dias: number) {
  const tk = await token();
  if (!tk) return { error: "Falta MP_ACCESS_TOKEN en el gestor de claves de Wix." };
  const ctx = { pag: await todos<Pagador>("FinPagadores"), al: await todos<Alumno>("TutAlumnos") };
  let offset = 0, nuevos = 0, vistos = 0;
  for (let i = 0; i < 10; i++) {
    const r = await mp(`/v1/payments/search?sort=date_created&criteria=desc&range=date_created&begin_date=NOW-${Math.min(dias, 365)}DAYS&end_date=NOW&status=approved&limit=100&offset=${offset}`, tk);
    const L = (r.results || []) as Pago[];
    for (const pg of L) { vistos++; const ya = (await q("FinIngresos").eq("_id", "mp-" + pg.id).limit(1).find()).items.length; await registrarPago(pg, ctx); if (!ya) nuevos++; }
    offset += L.length;
    if (L.length < 100 || offset >= ((r.paging || {}).total || 0)) break;
  }
  return { vistos, nuevos };
}

// Clasificación a mano desde Finanzas; con "recordar", los próximos pagos de esa persona se clasifican solos.
export async function reclasificar(id: string, tipo: string, alumnoId: string, recordar: boolean, por: string) {
  const it = (await q("FinIngresos").eq("_id", id).limit(1).find()).items[0] as Ingreso | undefined;
  if (!it) throw new Error("No existe ese ingreso.");
  const nuevo = { ...it, tipo, alumnoId: tipo === "Cuota de alumno (MP)" ? alumnoId : "", por };
  await guardar("FinIngresos", nuevo as unknown as Record<string, unknown>);
  if (recordar && it.pagador && tipo !== "Por clasificar") {
    await guardar("FinPagadores", { _id: it.pagador, title: it.title || "", tipo, alumnoId: nuevo.alumnoId });
    // los otros pagos pendientes de la misma persona se ordenan solos
    const otros = (await todos<Ingreso>("FinIngresos")).filter((x) => x.pagador === it.pagador && x.tipo === "Por clasificar" && x._id !== id);
    for (const o of otros) await guardar("FinIngresos", { ...o, tipo, alumnoId: nuevo.alumnoId, por } as unknown as Record<string, unknown>);
  }
  if (SIEMBRA.includes(tipo) && !SIEMBRA.includes(it.tipo) && it.email) await desdePago({ email: it.email, nombre: it.title || "", monto: it.monto, recurrente: tipo === "Siembra automática", fecha: it.fecha });
  return nuevo;
}

// Aviso diario: repasa los últimos 3 días y, si quedó algo por clasificar, avisa a quienes llevan Finanzas.
export async function finanzasDiario(hoy: string, dry: boolean, remitente: string) {
  const r = dry ? { dry: true } : await traer(3).catch((e) => ({ error: String((e as Error).message || e) }));
  const pend = (await todos<Ingreso>("FinIngresos")).filter((x) => x.tipo === "Por clasificar");
  const ayer = new Date(Date.parse(hoy + "T12:00:00Z") - 864e5).toISOString().slice(0, 10);
  const nuevos = pend.filter((x) => x.fecha >= ayer);
  let avisados = 0;
  if (nuevos.length && !dry) {
    const fin = ((await q("TutTutores").eq("gastos", true).limit(20).find()).items as { title?: string; email?: string }[]).filter((t) => t.email);
    const lista = `<ul style="font:16px/1.7 Arial">${nuevos.slice(0, 15).map((x) => `<li>${esc(x.title)} · $ ${Number(x.monto).toLocaleString("es-AR")} · ${esc(x.fecha)}</li>`).join("")}</ul>`;
    for (const t of fin) { await mandar(t.email as string, `Finanzas: ${pend.length} ingreso${pend.length === 1 ? "" : "s"} de Mercado Pago por clasificar`, marco("Habitat · Finanzas", "Entraron pagos para clasificar", `${p("Estos pagos de Mercado Pago todavía no tienen tipo:")}${lista}<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/finanzas.html#ingresos" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Clasificarlos</a></p>${p("Al clasificar podés marcar «recordar a esta persona» y sus próximos pagos se ordenan solos.")}`), remitente); avisados++; }
  }
  return { mp: r, porClasificar: pend.length, avisados, hoy: hoyAR() };
}
