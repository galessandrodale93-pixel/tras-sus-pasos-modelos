// Agenda del alumno: sus clases (por carrera) y las fechas especiales abiertas a todos (Zarza y Selah).
// GET /api/agenda?c=Maranata,Liderazgo   (sin c: todas las carreras)
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { horario, progsDe } from "../../lib/vol";
import { emailDe } from "../../lib/profe";

const q = auth.elevate(items.query);
const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const mas = (f: string, n: number) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const iso = (f: string, h: string, min = 0) => { const d = new Date(f + "T" + h + ":00-03:00"); return new Date(d.getTime() + min * 60000).toISOString(); };
type Clase = { _id: string; fecha: string; programa?: string; title?: string; profe?: string; tipo?: string };
type Esp = { _id: string; tipo: string; fecha: string; title?: string; hora?: string; lugar?: string; link?: string };

export async function agendaAlumno(carreras: string[], dias = 60) {
  const hoy = hoyAR(), hasta = mas(hoy, dias);
  const [cl, ev] = await Promise.all([
    q("TutClases").ge("fecha", mas(hoy, -1)).le("fecha", hasta).limit(500).find().then((r) => r.items as Clase[]),
    q("VolEventos").ge("fecha", mas(hoy, -1)).le("fecha", hasta).limit(100).find().then((r) => r.items as Esp[]),
  ]);
  const clases = cl.filter((c) => !/receso/i.test(c.tipo || "") && (!carreras.length || progsDe(c.programa).some((p) => carreras.includes(p))))
    .map((c) => { const h = horario(c.fecha).clase; return { _id: "cl-" + c._id, tipo: /examen/i.test(c.tipo || "") ? "Examen" : /entrega/i.test(c.tipo || "") ? "Entrega" : "Clase", curso: c.programa || "", title: c.title || "Clase", descripcion: "", inicio: iso(c.fecha, h), fin: iso(c.fecha, h, 150), lugar: "Habitat CFM" }; });
  const esp = ev.filter((e) => e.tipo === "zarza" || e.tipo === "selah")
    .map((e) => { const h = /^\d{2}:\d{2}$/.test(e.hora || "") ? (e.hora as string) : "19:30"; return { _id: "esp-" + e._id, tipo: e.tipo === "zarza" ? "Zarza" : "Selah", curso: "", title: e.title || (e.tipo === "zarza" ? "Zarza" : "Selah"), descripcion: e.tipo === "zarza" ? "Noche de adoración. ¡Vení y traé a alguien!" : "Un tiempo para orar y meditar en la Palabra.", inicio: iso(e.fecha, h), fin: iso(e.fecha, h, 150), lugar: e.lugar || "Habitat CFM", link: e.link || "", destacado: true }; });
  return [...clases, ...esp].sort((a, b) => a.inicio.localeCompare(b.inicio));
}

// link personal del calendario (para suscribirse desde Google o el iPhone sin cuenta): ?u=<email en base64url>.<firma>
const save = auth.elevate(items.save);
const b64 = (t: string) => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const de64 = (t: string) => { try { return decodeURIComponent(escape(atob(t.replace(/-/g, "+").replace(/_/g, "/")))); } catch { return ""; } };
async function secreto() {
  const r = (await q("TutConfig").eq("_id", "calSecret").limit(1).find()).items[0] as { valor?: string } | undefined;
  if (r && r.valor) return r.valor;
  const v = crypto.randomUUID() + crypto.randomUUID();
  await save("TutConfig", { _id: "calSecret", title: "Clave de los calendarios personales", valor: v });
  return v;
}
async function firma(email: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email + "|" + (await secreto())));
  return [...new Uint8Array(d)].slice(0, 9).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function linkCal(email: string) { return "https://www.habitat-cfm.org/api/calendario.ics?u=" + b64(email) + "." + (await firma(email)); }
export async function emailDeClave(u: string) {
  const [a, f] = String(u || "").split(".");
  const email = de64(a || "").toLowerCase();
  return email && f && f === (await firma(email)) ? email : "";
}

// con la cuenta: la carrera sale de su ficha; el equipo (tutores y dirección) ve todas las cursadas; si además sirve, se suman sus turnos de servicio
export async function personal(request: Request) {
  const me = await emailDe(request);
  return me.email ? personalDe(me.email) : null;
}
export async function personalDe(email: string) {
  const me = { email };
  const [al, vo, tu] = await Promise.all([
    q("TutAlumnos").eq("email", me.email).limit(1).find().then((r) => r.items[0] as { carreras?: string } | undefined),
    q("VolVoluntarios").contains("email", me.email).limit(1).find().then((r) => r.items[0] as { _id: string } | undefined),
    q("TutTutores").eq("email", me.email).limit(1).find().then((r) => r.items[0] as { title?: string; rol?: string } | undefined),
  ]);
  const hoy = hoyAR();
  const turnos = vo ? ((await q("VolTurnos").eq("voluntarioId", vo._id).ge("fecha", hoy).le("fecha", mas(hoy, 60)).limit(200).find()).items as unknown as { fecha: string; tarea: string }[]) : [];
  const porDia: Record<string, string[]> = {};
  turnos.forEach((t) => (porDia[t.fecha] = porDia[t.fecha] || []).push(t.tarea));
  const servicio = Object.entries(porDia).map(([f, ts]) => { const h = horario(f).llegada; return { _id: "srv-" + f, tipo: "Tu servicio", curso: "", title: [...new Set(ts)].join(" · "), descripcion: "Llegá a las " + h, inicio: iso(f, h), fin: iso(f, h, 180), lugar: "Habitat CFM" }; });
  // el encuentro de fin de año del equipo (solo para dirección, tutores y voluntarios)
  if (tu || vo) {
    const eqs = (await q("VolEventos").eq("tipo", "equipo").ge("fecha", hoy).limit(5).find()).items as Esp[];
    eqs.forEach((e) => { const h = /^\d{2}:\d{2}$/.test(e.hora || "") ? (e.hora as string) : "11:00"; servicio.push({ _id: "eq-" + e._id, tipo: "Equipo", curso: "", title: e.title || "Encuentro de fin de año", descripcion: "Encuentro del equipo de Habitat", inicio: iso(e.fecha, h), fin: iso(e.fecha, h, 240), lugar: e.lugar || "", link: "https://www.habitat-cfm.org/equipo-fin.html" } as unknown as (typeof servicio)[number]); });
  }
  return { carreras: tu ? [] : al ? progsDe(al.carreras) : null, equipo: !!tu, servicio };
}

export const GET: APIRoute = async ({ url, request }) => {
  try {
    if (url.searchParams.get("link") === "1") {
      const me = await emailDe(request);
      if (!me.email) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ ok: true, url: await linkCal(me.email) }), { headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });
    }
    const yo = request.headers.get("x-habitat-auth") ? await personal(request).catch(() => null) : null;
    // la carrera de la ficha manda; si no hay ficha, la que diga el Campus
    const c = yo && yo.equipo ? [] : yo && yo.carreras && yo.carreras.length ? yo.carreras : progsDe(url.searchParams.get("c") || "");
    const ev = await agendaAlumno(c, 100);
    const todo = yo ? [...ev, ...yo.servicio].sort((a, b) => a.inicio.localeCompare(b.inicio)) : ev;
    return new Response(JSON.stringify({ ok: true, carreras: c, eventos: todo }), { headers: { "Content-Type": "application/json", "Cache-Control": yo ? "private, no-store" : "public, max-age=300" } });
  } catch (e) {
    console.error("agenda", e);
    return json({ ok: false, eventos: [] });
  }
};
