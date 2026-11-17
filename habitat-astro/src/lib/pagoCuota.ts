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
// link para mails: no hace falta entrar a la cuenta
export async function linkPago(a: AlumnoPago, mes: string) {
  if (!montoDe(a)) return "";
  return `${WEB}/api/pagar?a=${encodeURIComponent(a._id)}&m=${mes}&s=${await firma(a._id, mes)}`;
}
export const refDe = (ref: unknown) => { const m = /^cuota\|([^|]+)\|(\d{4}-\d{2})$/.exec(String(ref || "")); return m ? { alumnoId: m[1], mes: m[2] } : null; };

// crea el pago en Mercado Pago (cuenta de Habitat) y devuelve el link para pagar
export async function preferencia(a: AlumnoPago, mes: string) {
  const monto = montoDe(a);
  if (!monto) throw new Error("Tu cuota no tiene un monto cargado. Escribinos y lo vemos.");
  const tk = await token(1);
  if (!tk) throw new Error("Falta la clave de Mercado Pago.");
  const mesTxt = MS[+mes.slice(5, 7) - 1] || mes;
  const body = {
    items: [{ id: "cuota-" + mes, title: `Cuota de ${mesTxt} · Habitat${a.cuotaCon ? " (compartida)" : ""}`, description: String(a.title || ""), quantity: 1, unit_price: monto, currency_id: "ARS" }],
    payer: a.email ? { email: a.email } : undefined,
    external_reference: `cuota|${a._id}|${mes}`,
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
