// Progreso de cada personaje de Kids & Hero para el panel de tutores.
// POST (lo manda el juego desde su dominio, por eso CORS abierto; viene como text/plain):
//   { perfil, socio, email, apodo, rama, edad, campus, tester } → guarda el progreso en KhJugadores
//   y respeta lo que carga el equipo (pareja de tutores, WhatsApp de la familia, nota y la última afirmación).
import type { APIRoute } from "astro";
import { q, guardar } from "../../lib/sem";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
const s = (v: unknown, max = 80) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
const n = (v: unknown, max = 1e6) => { const x = Number(v); return isFinite(x) ? Math.max(0, Math.min(max, Math.round(x * 10) / 10)) : 0; };

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request }) => {
  let x: Record<string, unknown> = {};
  try { x = JSON.parse((await request.text()).slice(0, 30000)); } catch { return json({ error: "datos" }, 400); }
  const id = s(x.perfil, 60), socio = s(x.socio, 60);
  if (!/^[a-zA-Z0-9-]{8,60}$/.test(id) || !/^[a-zA-Z0-9-]{8,60}$/.test(socio)) return json({ error: "perfil" }, 400);
  const c = (x.campus && typeof x.campus === "object" ? x.campus : {}) as Record<string, unknown>;
  try {
    const cur = ((await q("KhJugadores").eq("_id", id).limit(1).find()).items[0] || {}) as Record<string, unknown>;
    if (cur.socio && cur.socio !== socio) return json({ error: "perfil" }, 403);
    const it = {
      ...cur, _id: id, title: s(x.apodo, 40) || String(cur.title || "Jugador"), socio, email: s(x.email, 120).toLowerCase() || String(cur.email || ""),
      rama: x.rama === "hero" ? "hero" : "kids", edad: n(x.edad, 99), tester: x.tester === true,
      nivel: n(c.nivel, 999), horas: n(c.horas, 99999), etapas: n(c.etapas, 99), puntos: n(c.puntos, 1e9),
      campus: JSON.stringify(c).slice(0, 20000), ult: new Date().toISOString(), alta: String(cur.alta || new Date().toISOString()),
    };
    const { _createdDate, _updatedDate, _owner, ...limpio } = it as Record<string, unknown>;
    await guardar("KhJugadores", limpio);
    return json({ ok: true });
  } catch (e) { console.error("kh-jugador", e); return json({ error: "guardar" }, 500); }
};
