// Webhook de Debi: en Debi → Desarrolladores → Webhooks, agregar https://www.habitat-cfm.org/api/debi.
// Ante cualquier novedad, la web vuelve a pedir a Debi los cobros de los últimos días (con la clave propia)
// y avisa por mail al alumno si un débito fue rechazado. Así el aviso sale en el momento.
import type { APIRoute } from "astro";
import { traerDebi, avisarRechazos } from "../../lib/debi";
import { q, hoyAR } from "../../lib/sem";

const ok = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async ({ request }) => {
  try {
    let ev: Record<string, unknown> = {};
    try { ev = await request.json(); } catch { /* sin cuerpo */ }
    if (!/payment/i.test(String(ev.type || ev.event || ""))) return ok({ ignorado: true });
    const cfg = (await q("TutConfig").eq("_id", "remitente").limit(1).find()).items[0] as { valor?: string } | undefined;
    const r = await traerDebi(5);
    const avisos = await avisarRechazos(hoyAR(), false, (cfg && cfg.valor) || "galessandrodale.93@gmail.com");
    return ok({ ok: true, r, avisos });
  } catch (e) { console.error("debi webhook", e); return ok({ error: String((e as Error).message || e) }, 500); }
};
export const GET: APIRoute = async () => ok({ ok: true });
