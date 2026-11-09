// Qué paneles ve el miembro conectado: tutor (y su rol) y/o voluntario.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";

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
    const [t, v, p, ed] = await Promise.all([q("TutTutores").eq("email", email).limit(1).find(), q("VolVoluntarios").contains("email", email).limit(1).find(), q("Profes").contains("email", email).limit(5).find(), q("TutConfig").eq("_id", "editores").limit(1).find()]);
    const tu = t.items[0] as { _id?: string; rol?: string; org?: boolean; gastos?: boolean } | undefined;
    const editores = String(((ed.items[0] || {}) as { valor?: string }).valor || "").split(/[,\s]+/);
    const profe = (p.items as { email?: string; activo?: string }[]).some((x) => x.activo !== "no" && String(x.email || "").toLowerCase().split(/[,;\s]+/).includes(email));
    return json({ tutor: tu ? tu.rol || "tutor" : null, org: !!tu && !!tu.org, finanzas: !!tu && !!tu.gastos, sembradores: !!tu && tu.rol === "director", edicion: !!tu && (tu.rol === "director" || editores.includes(String(tu._id))), profe, voluntario: !!v.items[0] });
  } catch (e) {
    console.error("rol", e);
    return json({});
  }
};
