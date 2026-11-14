// Pase Kids & Hero. Lo llama el juego (otro dominio, por eso CORS abierto):
// GET  ?u=<socio>                         → { activo }
// POST { accion: "iniciar", u, prueba }   → { url } del checkout de Mercado Pago (prueba: plan de $50)
// POST { accion: "vincular", u, e, pid, rama } al volver del checkout → { activo }
import type { APIRoute } from "astro";
import { iniciar, vincular, estado } from "../../lib/kh";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const res = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });
export const GET: APIRoute = async ({ url }) => {
  try { return res(await estado(String(url.searchParams.get("u") || "").slice(0, 80))); }
  catch (e) { console.error("kh estado", e); return res({ activo: false, error: "estado" }, 500); }
};
export const POST: APIRoute = async ({ request }) => {
  let b: Record<string, unknown> = {};
  try { b = await request.json(); } catch { /* vacío */ }
  try {
    if (b.accion === "iniciar") return res(await iniciar(String(b.u || "").slice(0, 80), b.prueba === true));
    if (b.accion === "vincular") return res(await vincular(String(b.u || "").slice(0, 80), String(b.e || "").slice(0, 120), String(b.pid || ""), String(b.rama || "")));
    return res({ error: "accion" }, 400);
  } catch (e) { console.error("kh", e); return res({ error: String((e as Error).message || e) }, 400); }
};
