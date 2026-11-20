// Link de los mails de cuota: /api/pagar?a=<alumnoId>&m=<YYYY-MM>&s=<firma> → Mercado Pago con el monto ya puesto.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { firma, MESES_RE, preferencia, type AlumnoPago } from "../../lib/pagoCuota";

const q = auth.elevate(items.query);
const pagina = (t: string) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagar cuota · Habitat</title><body style="font-family:Arial;background:#fbf8f2;color:#10251d;display:grid;place-items:center;min-height:90vh;margin:0;padding:20px;text-align:center"><div><h1 style="font-family:Georgia">Habitat</h1><p style="font-size:17px;max-width:34ch">${t}</p><p><a href="https://www.habitat-cfm.org/campus.html#cuotaSec" style="color:#b8904f">Ir a mi cuota en el Campus</a></p></div>`, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

export const GET: APIRoute = async ({ url }) => {
  try {
    const a = String(url.searchParams.get("a") || "").slice(0, 80), m = String(url.searchParams.get("m") || ""), s = String(url.searchParams.get("s") || "");
    // &t=<total>: monto fijo acordado; va dentro de la firma, así nadie lo puede cambiar
    const t = /^\d{3,7}$/.test(String(url.searchParams.get("t") || "")) ? Number(url.searchParams.get("t")) : 0;
    if (!a || !MESES_RE.test(m) || s !== (await firma(a, t ? m + "|" + t : m))) return pagina("Este link de pago no es válido. Entrá al Campus para pagar tu cuota.");
    const al = (await q("TutAlumnos").eq("_id", a).limit(1).find()).items[0] as (AlumnoPago & { activo?: boolean }) | undefined;
    if (!al || al.activo === false) return pagina("No encontramos tu cuota. Escribinos y lo vemos.");
    const link = await preferencia(al, m, t);
    if (url.searchParams.get("ver") === "1") return new Response(JSON.stringify({ ok: true, link }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    // Response.redirect() trae los encabezados bloqueados y el servidor de Wix falla al agregarles los suyos («inmutable»)
    return new Response(null, { status: 302, headers: { Location: link, "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("pagar", e);
    return pagina(String((e as Error).message || "No pudimos abrir Mercado Pago. Probá de nuevo en un ratito."));
  }
};
