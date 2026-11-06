// Campus: el voluntario ve sus próximos turnos de servicio (por el email de su cuenta).
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { animo, grupos, type Ev } from "../../lib/vol";
const save = auth.elevate(items.save);

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
    const porDia: Record<string, { tarea: string; nota?: string }[]> = {};
    (r.items as { fecha: string; tarea: string; nota?: string }[]).forEach((t) => (porDia[t.fecha] = porDia[t.fecha] || []).push(t));
    const evs = (await q("VolEventos").ge("fecha", hoy).limit(200).find()).items as Ev[];
    const turnos = Object.keys(porDia).sort().flatMap((f) => grupos(f, porDia[f], evs)).slice(0, 14);
    // servicio de todo el equipo (este mes y el próximo) y cuántas veces sirvió este año
    const ini = hoy.slice(0, 7) + "-01";
    const [eq, vs, hist] = await Promise.all([
      q("VolTurnos").ge("fecha", ini).ascending("fecha").limit(1000).find(),
      q("VolVoluntarios").limit(200).find(),
      q("VolTurnos").eq("voluntarioId", v._id).ge("fecha", hoy.slice(0, 4) + "-01-01").lt("fecha", hoy).limit(1000).find(),
    ]);
    const nombres = Object.fromEntries((vs.items as { _id: string; title?: string }[]).map((x) => [x._id, x.title || ""]));
    const equipo = (eq.items as { fecha: string; tarea: string; voluntarioId: string; nota?: string }[]).map((t) => ({ fecha: t.fecha, tarea: t.tarea, nota: t.nota || "", quien: nombres[t.voluntarioId] || "", yo: t.voluntarioId === v._id }));
    const dias = new Set((hist.items as { fecha: string }[]).map((t) => t.fecha)).size;
    return json({ eventos: evs, voluntario: { nombre: v.title, ics: "https://www.habitat-cfm.org/api/voluntario.ics?v=" + v._id + "&k=" + v.clave }, turnos, equipo, servido: { dias, tareas: hist.items.length }, animo: animo(hoy + v._id) });
  } catch (e) {
    console.error("voluntario", e);
    return json({ voluntario: null });
  }
};

// El encargado de Selah carga los versículos que van a leer los voluntarios de ese día.
export const POST: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get("x-habitat-auth");
    if (!token) return json({ error: "Entrá con tu cuenta." }, 401);
    const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
    const email = mr.ok ? String(((await mr.json()).member || {}).loginEmail || "").toLowerCase() : "";
    const v = email ? ((await q("VolVoluntarios").contains("email", email).limit(1).find()).items[0] as { _id: string } | undefined) : undefined;
    if (!v) return json({ error: "Tu cuenta no está en el equipo de voluntarios." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const f = String(x.fecha || "").slice(0, 10);
    if (x.op !== "versiculos" || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return json({ error: "op" }, 400);
    const enc = (await q("VolTurnos").eq("fecha", f).eq("voluntarioId", v._id).limit(20).find()).items.some((t) => String((t as { tarea: string }).tarea) === "Selah · Encargado");
    if (!enc) return json({ error: "Los versículos los carga quien está a cargo de Selah ese día." }, 403);
    const cur = (await q("VolEventos").eq("_id", "selah|" + f).limit(1).find()).items[0] as Record<string, unknown> | undefined;
    const { _createdDate, _updatedDate, _owner, ...rest } = cur || {};
    const it = { ...rest, _id: "selah|" + f, tipo: "selah", fecha: f, title: (rest.title as string) || "Selah", versiculos: String(x.versiculos || "").replace(/[\u0000-\u0008\u000b-\u001f]/g, "").slice(0, 4000) };
    await save("VolEventos", it);
    return json({ ok: true, item: it });
  } catch (e) {
    console.error("voluntario POST", e);
    return json({ error: "No pudimos guardar." }, 500);
  }
};
