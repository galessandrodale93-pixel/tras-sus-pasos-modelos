// Qué paneles ve el miembro conectado: tutor (y su rol) y/o voluntario.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { lista as edLista } from "../../lib/edicion";

const q = auth.elevate(items.query);
const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const GET: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get("x-habitat-auth");
    if (!token) return json({});
    const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
    if (!mr.ok) return json({});
    const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
    if (!email) return json({});
    const [t, v, p, ed, al, mu] = await Promise.all([q("TutTutores").eq("email", email).limit(1).find(), q("VolVoluntarios").contains("email", email).limit(1).find(), q("Profes").contains("email", email).limit(5).find(), q("TutConfig").eq("_id", "editores").limit(1).find(), q("TutAlumnos").eq("email", email).limit(1).find().catch(() => ({ items: [] })), q("ZarMusicos").eq("email", email).limit(1).find().catch(() => ({ items: [] }))]);
    const tu = t.items[0] as { _id?: string; rol?: string; org?: boolean; gastos?: boolean } | undefined;
    const editores = String(((ed.items[0] || {}) as { valor?: string }).valor || "").split(/[,\s]+/);
    const profe = (p.items as { email?: string; activo?: string }[]).some((x) => x.activo !== "no" && String(x.email || "").toLowerCase().split(/[,;\s]+/).includes(email));
    const R = { musico: (mu.items as { activo?: string }[]).some((x) => x.activo !== "no"), alumno: al.items.length > 0, tutor: tu ? tu.rol || "tutor" : null, org: !!tu && !!tu.org, finanzas: !!tu && !!tu.gastos, sembradores: !!tu && tu.rol === "director", edicion: !!tu && (tu.rol === "director" || editores.includes(String(tu._id))), profe, voluntario: !!v.items[0], intercesion: !!v.items[0] || (!!tu && (tu.rol === "director" || !!tu.org)) };
    if (new URL(request.url).searchParams.get("resumen")) {
      // Un dato en vivo para cada tarjeta del Campus («Mi servicio en Habitat»). Cada uno falla por separado sin romper el resto.
      const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), vid = v.items[0] ? String((v.items[0] as { _id: string })._id) : "";
      const cnt = (c: string, f: string, val: string) => q(c).eq(f, val).count().catch(() => -1);
      const [ora, ay, fi, fs, sem, ed] = await Promise.all([
        vid ? q("IntTurnos").eq("responsableId", vid).ge("fecha", hoy).ascending("fecha").limit(1).find().then((r) => (r.items[0] as { fecha?: string } | undefined)?.fecha || "").catch(() => "") : Promise.resolve(""),
        vid ? q("IntAyuno").eq("voluntarioId", vid).ge("fecha", hoy).ascending("fecha").limit(1).find().then((r) => (r.items[0] as { fecha?: string } | undefined)?.fecha || "").catch(() => "") : Promise.resolve(""),
        R.finanzas ? cnt("FinIngresos", "tipo", "Por clasificar") : Promise.resolve(-1),
        R.finanzas ? cnt("FinSalidas", "tipo", "Por clasificar") : Promise.resolve(-1),
        R.sembradores ? q("SemSembradores").ne("activo", false).count().catch(() => -1) : Promise.resolve(-1),
        R.edicion ? edLista().then((L) => { const n = (e: string) => (L as { estado: string }[]).filter((x) => x.estado === e).length; return { entregar: n("Para entregar"), edicion: n("En edición"), editadas: n("Editada") }; }).catch(() => null) : Promise.resolve(null),
      ]);
      return json({ ...R, datos: { oracion: ora, ayuno: ay, porClasificar: fi >= 0 ? fi + Math.max(0, fs) : -1, sembradores: sem, edicion: ed } });
    }
    return json({ musico: (mu.items as { activo?: string }[]).some((x) => x.activo !== "no"), alumno: al.items.length > 0, tutor: tu ? tu.rol || "tutor" : null, org: !!tu && !!tu.org, finanzas: !!tu && !!tu.gastos, sembradores: !!tu && tu.rol === "director", edicion: !!tu && (tu.rol === "director" || editores.includes(String(tu._id))), profe, voluntario: !!v.items[0], intercesion: !!v.items[0] || (!!tu && (tu.rol === "director" || !!tu.org)) });
  } catch (e) {
    console.error("rol", e);
    return json({});
  }
};
