// Kids & Hero: Pase familiar ($12.000 por mes, toda la familia) con suscripción de Mercado Pago (cuenta 1 de Habitat).
// El pago se hace en el checkout de un plan de MP: paga quien tenga la cuenta o la tarjeta (no tiene que coincidir con el mail del juego).
// Al volver del checkout, el juego manda el preapproval_id y queda vinculado al socio del juego en la colección KhPases.
// Si no vuelve (cerró la pestaña), estado() lo vincula solo buscando la suscripción nueva del plan (ver recuperar).
// El juego pregunta si su socio tiene un pase activo: se consulta el estado real de la suscripción en MP.
import { q, guardar } from "./sem";
import { token } from "./mp";

const COL = "KhPases";
export const PRECIO = 12000;
export const MOTIVO = "Kids & Hero · Pase familiar";
export const JUEGO = "https://headless-tjfrhnexbhw-galessandrodale93-1411.wix-site-host.com/";

type Pase = { _id: string; title?: string; email?: string; estado?: string; rama?: string; alta?: string; revisado?: string };

async function mp(path: string, tk: string, init?: RequestInit) {
  const r = await fetch("https://api.mercadopago.com" + path, { ...init, headers: { authorization: "Bearer " + tk, "content-type": "application/json", ...((init && init.headers) || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error("Mercado Pago respondió " + r.status + " " + t.slice(0, 200));
  return t ? JSON.parse(t) : {};
}
async function tk() { const t = await token(1); if (!t) throw new Error("Falta MP_ACCESS_TOKEN en el gestor de claves."); return t; }

// el plan se crea una sola vez y su id queda en TutConfig (khPlan). El de prueba (khPlanTest, $50) solo lo usa el modo ?khprueba=1 del juego.
export const PRECIO_PRUEBA = 50;
async function plan(t: string, prueba = false) {
  const key = prueba ? "khPlanTest" : "khPlan";
  const it = (await q("TutConfig").eq("_id", key).limit(1).find()).items[0] as { _id: string; valor?: string } | undefined;
  if (it && it.valor) return JSON.parse(it.valor) as { id: string; init_point: string };
  const p = await mp("/preapproval_plan", t, { method: "POST", body: JSON.stringify({
    reason: prueba ? MOTIVO + " (prueba)" : MOTIVO, back_url: JUEGO + "?kh=vuelta",
    auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: prueba ? PRECIO_PRUEBA : PRECIO, currency_id: "ARS" },
  }) });
  const v = { id: String(p.id), init_point: String(p.init_point) };
  await guardar("TutConfig", { _id: key, title: "Plan de Mercado Pago del Pase Kids & Hero" + (prueba ? " (prueba)" : ""), valor: JSON.stringify(v) });
  return v;
}
async function planes(t: string) { const a = await plan(t), b = await plan(t, true).catch(() => null); return b ? [a, b] : [a]; }

// cuando alguien toca Pagar se anota quién fue y a qué hora: si paga pero cierra la pestaña antes de volver al juego,
// estado() busca la suscripción nueva de ese plan y la vincula sola
const iniId = (socio: string) => "ini-" + socio;
export async function iniciar(socio = "", prueba = false) {
  const t = await tk(); const p = await plan(t, prueba);
  if (socio) await guardar(COL, { _id: iniId(socio), title: "ini:" + socio, estado: "iniciado", rama: p.id, alta: new Date().toISOString(), revisado: "" });
  return { url: p.init_point };
}

const ACTIVOS = ["authorized"];
export async function vincular(socio: string, email: string, pid: string, rama: string) {
  if (!socio || !/^[\w-]{8,80}$/.test(pid)) throw new Error("datos");
  const t = await tk(), ids = (await planes(t)).map((p) => p.id);
  const s = await mp("/preapproval/" + encodeURIComponent(pid), t);
  if (!ids.includes(String(s.preapproval_plan_id || ""))) throw new Error("La suscripción no es del Pase Kids & Hero.");
  const prev = (await q(COL).eq("_id", pid).limit(1).find()).items[0] as Pase | undefined;
  if (prev && prev.title && prev.title !== socio) throw new Error("Esta suscripción ya está vinculada a otra cuenta.");
  await guardar(COL, { _id: pid, title: socio, email: (email || "").toLowerCase(), estado: String(s.status || ""), rama: rama || "", alta: (prev && prev.alta) || new Date().toISOString(), revisado: new Date().toISOString() });
  return { activo: ACTIVOS.includes(String(s.status || "")) };
}

// pagó pero no volvió al juego: suscripciones autorizadas del plan creadas después de tocar Pagar y sin dueño. Se vincula solo si hay una sola.
async function recuperar(socio: string, t: string) {
  const ini = (await q(COL).eq("_id", iniId(socio)).limit(1).find()).items[0] as Pase | undefined;
  if (!ini || !ini.alta || !ini.rama) return false;
  const desde = new Date(ini.alta).getTime() - 120000;
  if (Date.now() - desde > 3 * 864e5) return false;
  const r = await mp("/preapproval/search?preapproval_plan_id=" + encodeURIComponent(ini.rama) + "&status=authorized&limit=50", t);
  const cand: { id: string }[] = [];
  for (const s of (r.results || []) as { id: string; date_created?: string }[]) {
    if (new Date(String(s.date_created || 0)).getTime() < desde) continue;
    const ya = (await q(COL).eq("_id", String(s.id)).limit(1).find()).items[0] as Pase | undefined;
    if (!ya || !ya.title) cand.push(s);
  }
  if (cand.length !== 1) return false;
  const v = await vincular(socio, "", String(cand[0].id), "");
  if (v.activo) await guardar(COL, { ...ini, estado: "vinculado", revisado: new Date().toISOString() });
  return v.activo;
}

export async function estado(socio: string) {
  if (!socio) return { activo: false };
  const ps = ((await q(COL).eq("title", socio).limit(20).find()).items as Pase[]);
  const t = await tk();
  let activo = false;
  for (const it of ps) {
    let st = it.estado || "";
    try { st = String((await mp("/preapproval/" + encodeURIComponent(it._id), t)).status || st); } catch { /* si MP no responde se usa lo último que se supo */ }
    if (st !== it.estado) await guardar(COL, { ...it, estado: st, revisado: new Date().toISOString() });
    if (ACTIVOS.includes(st)) activo = true;
  }
  if (!activo) { try { activo = await recuperar(socio, t); } catch (e) { console.error("kh recuperar", e); } }
  return { activo };
}
