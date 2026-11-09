// Aviso automático de Mercado Pago (webhook). En Mercado Pago → Tus integraciones → Webhooks:
// URL https://www.habitat-cfm.org/api/mp (y en la otra cuenta https://www.habitat-cfm.org/api/mp?c=2), evento "Pagos". Si cargás MP_WEBHOOK_SECRET en el gestor de claves,
// además se verifica la firma. De todos modos el pago se vuelve a pedir a Mercado Pago con la clave propia.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { secrets } from "@wix/secrets";
import { porId } from "../../lib/mp";

const getSecret = auth.elevate(secrets.getSecretValue);
const ok = (b: unknown = { ok: true }, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

async function firmaValida(request: Request, dataId: string, c: number) {
  let sec = "";
  try { sec = ((await getSecret(c === 1 ? "MP_WEBHOOK_SECRET" : "MP_WEBHOOK_SECRET_" + c)) || {}).value || ""; } catch { /* sin secreto: no se verifica */ }
  if (!sec) return true;
  const sig = request.headers.get("x-signature") || "", rid = request.headers.get("x-request-id") || "";
  const parts = Object.fromEntries(sig.split(",").map((x) => x.trim().split("=")));
  if (!parts.ts || !parts.v1) return false;
  const man = `id:${dataId.toLowerCase()};request-id:${rid};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sec), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const h = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(man)))).map((b) => b.toString(16).padStart(2, "0")).join("");
  return h === parts.v1;
}

async function manejar(request: Request, url: URL) {
  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* aviso por parámetros */ }
  const tipo = String(body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic") || "");
  const id = String(((body.data as Record<string, unknown>) || {}).id || url.searchParams.get("data.id") || url.searchParams.get("id") || "");
  if (!/payment/.test(tipo) || !/^\d+$/.test(id)) return ok({ ignorado: true });
  const c = url.searchParams.get("c") === "2" ? 2 : 1;
  if (!(await firmaValida(request, url.searchParams.get("data.id") || id, c))) return ok({ error: "firma" }, 401);
  try { const it = await porId(id, c); return ok({ ok: true, tipo: it && it.tipo }); }
  catch (e) { console.error("mp", e); return ok({ error: String((e as Error).message || e) }, 500); }
}

export const POST: APIRoute = async ({ request, url }) => manejar(request, url);
export const GET: APIRoute = async ({ request, url }) => manejar(request, url);
