// Campus: el voluntario ve sus próximos turnos de servicio (por el email de su cuenta).
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { horario, animo } from "../../lib/vol";

const q = auth.elevate(items.query);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const GET: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get("x-habitat-auth");
    if (!token) return json({ voluntario: null });
    const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
    if (!mr.ok) return json({ voluntario: null });
    const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
    if (!email) return json({ voluntario: null });
    const v = (await q("VolVoluntarios").contains("email", email).limit(1).find()).items[0] as { _id: string; title?: string; clave?: string } | undefined;
    if (!v) return json({ voluntario: null });
    const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const r = await q("VolTurnos").eq("voluntarioId", v._id).ge("fecha", hoy).ascending("fecha").limit(100).find();
    const porDia: Record<string, string[]> = {};
    (r.items as { fecha: string; tarea: string }[]).forEach((t) => (porDia[t.fecha] = porDia[t.fecha] || []).push(t.tarea));
    const turnos = Object.keys(porDia).sort().slice(0, 12).map((f) => ({ fecha: f, tareas: porDia[f], ...horario(f) }));
    // servicio de todo el equipo (este mes y el próximo) y cuántas veces sirvió este año
    const ini = hoy.slice(0, 7) + "-01";
    const [eq, vs, hist] = await Promise.all([
      q("VolTurnos").ge("fecha", ini).ascending("fecha").limit(1000).find(),
      q("VolVoluntarios").limit(200).find(),
      q("VolTurnos").eq("voluntarioId", v._id).ge("fecha", hoy.slice(0, 4) + "-01-01").lt("fecha", hoy).limit(1000).find(),
    ]);
    const nombres = Object.fromEntries((vs.items as { _id: string; title?: string }[]).map((x) => [x._id, x.title || ""]));
    const equipo = (eq.items as { fecha: string; tarea: string; voluntarioId: string }[]).map((t) => ({ fecha: t.fecha, tarea: t.tarea, quien: nombres[t.voluntarioId] || "", yo: t.voluntarioId === v._id }));
    const dias = new Set((hist.items as { fecha: string }[]).map((t) => t.fecha)).size;
    return json({ voluntario: { nombre: v.title, ics: "https://www.habitat-cfm.org/api/voluntario.ics?v=" + v._id + "&k=" + v.clave }, turnos, equipo, servido: { dias, tareas: hist.items.length }, animo: animo(hoy + v._id) });
  } catch (e) {
    console.error("voluntario", e);
    return json({ voluntario: null });
  }
};
