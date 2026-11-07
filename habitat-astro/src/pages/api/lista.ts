// Tomar lista desde «Mi servicio»: el voluntario con turno de Asistencia (presencial u online) carga los presentes de su clase.
// GET  → las clases recientes donde le toca tomar lista (hoy y hasta 3 días atrás), con sus alumnos y lo ya marcado.
// POST { fecha, alumnoId, estado: P|Z|A|"" , tarde, mesa } → guarda en TutAsistencia (lo mismo que ve el panel de tutores).
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { alumnosLista, esLista, modoLista } from "../../lib/vol";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const rem = auth.elevate(items.remove);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const DATE = /^\d{4}-\d{2}-\d{2}$/, ID = /^[a-z0-9-]{2,80}$/;
const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const menos = (f: string, d: number) => new Date(Date.parse(f + "T12:00:00Z") - d * 864e5).toISOString().slice(0, 10);

async function quien(request: Request) {
  const token = request.headers.get("x-habitat-auth");
  if (!token) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
  if (!mr.ok) return null;
  const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
  if (!email) return null;
  return ((await q("VolVoluntarios").contains("email", email).limit(1).find()).items[0] as { _id: string; title?: string } | undefined) || null;
}
// turnos de lista del voluntario entre desde y hasta
async function turnosLista(vid: string, desde: string, hasta: string) {
  const r = await q("VolTurnos").eq("voluntarioId", vid).ge("fecha", desde).le("fecha", hasta).limit(50).find();
  return (r.items as { fecha: string; tarea: string }[]).filter((t) => esLista(t.tarea));
}
async function todos(col: string) {
  const out: Record<string, unknown>[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as Record<string, unknown>[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as Record<string, unknown>[])); }
  return out;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const v = await quien(request);
    if (!v) return json({ clases: [] });
    const hoy = hoyAR();
    const ts = await turnosLista(v._id, menos(hoy, 3), hoy);
    if (!ts.length) return json({ clases: [] });
    const [alumnos, clases] = await Promise.all([todos("TutAlumnos"), todos("TutClases")]);
    const out = [];
    for (const t of ts.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))) {
      const modo = modoLista(t.tarea);
      const L = alumnosLista(alumnos, clases as { fecha?: string; programa?: string }[], t.fecha, modo);
      const asis = (await q("TutAsistencia").eq("fecha", t.fecha).limit(1000).find()).items as { alumnoId: string; estado: string; tarde?: boolean; mesa?: boolean; por?: string }[];
      const by = Object.fromEntries(asis.map((x) => [x.alumnoId, { estado: x.estado, tarde: !!x.tarde, mesa: !!x.mesa, por: x.por || "" }]));
      out.push({ fecha: t.fecha, tarea: t.tarea, modo, alumnos: L, marcas: by });
    }
    return json({ clases: out });
  } catch (e) {
    console.error("lista GET", e);
    return json({ clases: [], error: "No pudimos cargar la lista." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const v = await quien(request);
    if (!v) return json({ error: "Tu cuenta no está en el equipo de voluntarios." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const f = String(x.fecha || "").slice(0, 10), alu = String(x.alumnoId || "").slice(0, 80), est = String(x.estado || "").slice(0, 1);
    if (!DATE.test(f) || !ID.test(alu)) return json({ error: "datos" }, 400);
    const hoy = hoyAR();
    if (f > hoy || f < menos(hoy, 3)) return json({ error: "La lista de esa clase ya se cerró. Si hay que corregirla, avisale a Raquel." }, 403);
    const t = (await turnosLista(v._id, f, f))[0];
    if (!t) return json({ error: "Esta lista la carga quien tiene el turno de asistencia ese día." }, 403);
    const modo = modoLista(t.tarea);
    const okEst = modo === "Zoom" ? /^[ZA]?$/ : /^[PA]?$/;
    if (!okEst.test(est)) return json({ error: "estado" }, 400);
    const _id = alu + "|" + f;
    if (!est) { await rem("TutAsistencia", _id).catch(() => null); return json({ ok: true }); }
    const vino = est === "P" || est === "Z";
    const it = { _id, alumnoId: alu, fecha: f, estado: est, tarde: vino && (x.tarde === true), mesa: vino && (x.mesa === true), por: (v.title || "Voluntario") + " (" + t.tarea + ")" };
    await save("TutAsistencia", it);
    return json({ ok: true, item: it });
  } catch (e) {
    console.error("lista POST", e);
    return json({ error: "No pudimos guardar." }, 500);
  }
};
