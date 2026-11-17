// Link de los mails de cuota: /api/pagar?a=<alumnoId>&m=<YYYY-MM>&s=<firma> → Mercado Pago con el monto ya puesto.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { firma, preferencia, type AlumnoPago } from "../../lib/pagoCuota";

const q = auth.elevate(items.query);
const pagina = (t: string) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagar cuota · Habitat</title><body style="font-family:Arial;background:#fbf8f2;color:#10251d;display:grid;place-items:center;min-height:90vh;margin:0;padding:20px;text-align:center"><div><h1 style="font-family:Georgia">Habitat</h1><p style="font-size:17px;max-width:34ch">${t}</p><p><a href="https://www.habitat-cfm.org/campus.html#cuotaSec" style="color:#b8904f">Ir a mi cuota en el Campus</a></p></div>`, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

export const GET: APIRoute = async ({ url }) => {
  try {
    const a = String(url.searchParams.get("a") || "").slice(0, 80), m = String(url.searchParams.get("m") || ""), s = String(url.searchParams.get("s") || "");
    if (!a || !/^\d{4}-\d{2}$/.test(m) || s !== (await firma(a, m))) return pagina("Este link de pago no es válido. Entrá al Campus para pagar tu cuota.");
    const al = (await q("TutAlumnos").eq("_id", a).limit(1).find()).items[0] as (AlumnoPago & { activo?: boolean }) | undefined;
    if (!al || al.activo === false) return pagina("No encontramos tu cuota. Escribinos y lo vemos.");
    return Response.redirect(await preferencia(al, m), 302);
  } catch (e) {
    console.error("pagar", e);
    return pagina(String((e as Error).message || "No pudimos abrir Mercado Pago. Probá de nuevo en un ratito."));
  }
};
