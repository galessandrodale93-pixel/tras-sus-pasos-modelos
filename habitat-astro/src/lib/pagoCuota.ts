// Pagar la cuota con un toque: link de Mercado Pago con el monto ya puesto.
// El pago vuelve con external_reference «cuota|<alumnoId>|<YYYY-MM>», así se registra solo en el mes correcto (aunque pague otra persona).
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { token } from "./mp";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
export const WEB = "https://www.habitat-cfm.org";
const MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export type AlumnoPago = { _id: string; title?: string; email?: string; cuota?: number; cuotaCon?: string; cuotaDetalle?: string };

async function secreto() {
  const r = (await q("TutConfig").eq("_id", "pagoSecret").limit(1).find()).items[0] as { valor?: string } | undefined;
  if (r && r.valor) return r.valor;
  const v = crypto.randomUUID() + crypto.randomUUID();
  await save("TutConfig", { _id: "pagoSecret", title: "Clave de los links de pago de cuotas", valor: v });
  return v;
}
export async function firma(alumnoId: string, mes: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(alumnoId + "|" + mes + "|" + (await secreto())));
  return [...new Uint8Array(d)].slice(0, 10).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const montoDe = (a: AlumnoPago) => (a.cuotaDetalle === "Becado" ? 0 : Number(a.cuota) || 0);
// recargo por mes de cuota vencida sin pagar (la cuota vence el 10 de cada mes)
export const RECARGO = 1500;
const VENCE_DIA = 10;
const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
export const vencida = (mes: string, hoy = hoyAR()) => mes < hoy.slice(0, 7) || (mes === hoy.slice(0, 7) && +hoy.slice(8, 10) > VENCE_DIA);
export const MESES_RE = /^\d{4}-\d{2}(,\d{4}-\d{2}){0,11}$/;
const lista = (meses: string | string[]) => (Array.isArray(meses) ? meses : String(meses).split(",")).filter((m) => /^\d{4}-\d{2}$/.test(m)).sort();
// total a pagar: cada mes su cuota, más el recargo si ya venció
export const totalDe = (a: AlumnoPago, meses: string | string[], hoy = hoyAR()) => lista(meses).reduce((t, m) => t + montoDe(a) + (vencida(m, hoy) ? RECARGO : 0), 0);
// link para mails y WhatsApp: no hace falta entrar a la cuenta. Puede llevar varios meses («2026-09,2026-10»).
export async function linkPago(a: AlumnoPago, meses: string | string[]) {
  if (!montoDe(a)) return "";
  const m = lista(meses).join(",");
  return `${WEB}/api/pagar?a=${encodeURIComponent(a._id)}&m=${m}&s=${await firma(a._id, m)}`;
}
export const refDe = (ref: unknown) => { const m = /^cuota\|([^|]+)\|(\d{4}-\d{2}(?:,\d{4}-\d{2})*)$/.exec(String(ref || "")); return m ? { alumnoId: m[1], mes: m[2] } : null; };

// crea el pago en Mercado Pago (cuenta de Habitat) y devuelve el link para pagar
// total: monto fijo acordado (link firmado desde la dirección, p. ej. cuando un mes fue compartido y otro individual)
export async function preferencia(a: AlumnoPago, meses: string | string[], total = 0) {
  const L = lista(meses);
  if (!L.length) throw new Error("Falta el mes de la cuota.");
  if (!montoDe(a) && !total) throw new Error("Tu cuota no tiene un monto cargado. Escribinos y lo vemos.");
  const monto = total > 0 ? total : totalDe(a, L);
  const tk = await token(1);
  if (!tk) throw new Error("Falta la clave de Mercado Pago.");
  const txt = (m: string) => MS[+m.slice(5, 7) - 1] || m;
  const nombres = L.length === 1 ? txt(L[0]) : L.slice(0, -1).map(txt).join(", ") + " y " + txt(L[L.length - 1]);
  const rec = L.filter((m) => vencida(m)).length;
  const body = {
    items: [{ id: "cuota-" + L.join("-"), title: `${L.length === 1 ? "Cuota" : "Cuotas"} de ${nombres} · Habitat${a.cuotaCon ? " (compartida)" : ""}${rec ? " · incluye recargo" : ""}`, description: String(a.title || ""), quantity: 1, unit_price: monto, currency_id: "ARS" }],
    payer: a.email ? { email: a.email } : undefined,
    external_reference: `cuota|${a._id}|${L.join(",")}`,
    back_urls: { success: `${WEB}/campus.html?pago=ok#cuotaSec`, pending: `${WEB}/campus.html?pago=pendiente#cuotaSec`, failure: `${WEB}/campus.html#cuotaSec` },
    auto_return: "approved",
    notification_url: `${WEB}/api/mp`,
    statement_descriptor: "HABITAT CFM",
  };
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", { method: "POST", headers: { authorization: "Bearer " + tk, "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.init_point) { console.error("mp preferencia", r.status, JSON.stringify(j).slice(0, 300)); throw new Error("Mercado Pago no respondió. Probá de nuevo en un ratito."); }
  return String(j.init_point);
}
