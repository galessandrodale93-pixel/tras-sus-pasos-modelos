// Avisos de intercesión. Lo dispara GitHub Actions: a la noche (?cuando=noche, avisa al responsable de mañana)
// y a la mañana (?cuando=manana, al de hoy, más el recordatorio de ayuno 3 días antes). Cada aviso sale una sola vez.
import type { APIRoute } from "astro";
import { q, hoyAR } from "../../lib/sem";
import { oracionAviso } from "../../lib/oracion";

export const GET: APIRoute = async ({ url }) => {
  try {
    const c = (await q("TutConfig").limit(80).find()).items as { _id: string; valor?: string }[];
    const C = Object.fromEntries(c.map((x) => [x._id, x.valor || ""]));
    const dry = url.searchParams.get("dry") === "1";
    if (dry && url.searchParams.get("k") !== C.cronKey) return new Response(JSON.stringify({ error: "no" }), { status: 401 });
    const cuando = url.searchParams.get("cuando") === "noche" ? "noche" : "manana";
    const r = await oracionAviso(cuando, hoyAR(), dry, C.remitente || "galessandrodale.93@gmail.com");
    return new Response(JSON.stringify({ ok: true, cuando, ...r }), { headers: { "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500 }); }
};
