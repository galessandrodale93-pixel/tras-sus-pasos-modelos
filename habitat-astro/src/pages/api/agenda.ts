// Agenda del alumno: sus clases (por carrera) y las fechas especiales abiertas a todos (Zarza y Selah).
// GET /api/agenda?c=Maranata,Liderazgo   (sin c: todas las carreras)
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { horario, progsDe } from "../../lib/vol";

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
    .map((c) => { const h = horario(c.fecha).clase; return { _id: "cl-" + c._id, tipo: /examen/i.test(c.tipo || "") ? "Examen" : "Clase", curso: c.programa || "", title: c.title || "Clase", descripcion: "", inicio: iso(c.fecha, h), fin: iso(c.fecha, h, 150), lugar: "Habitat CFM" }; });
  const esp = ev.filter((e) => e.tipo === "zarza" || e.tipo === "selah")
    .map((e) => { const h = /^\d{2}:\d{2}$/.test(e.hora || "") ? (e.hora as string) : "19:30"; return { _id: "esp-" + e._id, tipo: e.tipo === "zarza" ? "Zarza" : "Selah", curso: "", title: e.title || (e.tipo === "zarza" ? "Zarza" : "Selah"), descripcion: e.tipo === "zarza" ? "Noche de adoración. ¡Vení y traé a alguien!" : "Un tiempo para orar y meditar en la Palabra.", inicio: iso(e.fecha, h), fin: iso(e.fecha, h, 150), lugar: e.lugar || "Habitat CFM", link: e.link || "", destacado: true }; });
  return [...clases, ...esp].sort((a, b) => a.inicio.localeCompare(b.inicio));
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const c = progsDe(url.searchParams.get("c") || "");
    return json({ ok: true, eventos: await agendaAlumno(c) });
  } catch (e) {
    console.error("agenda", e);
    return json({ ok: false, eventos: [] });
  }
};
