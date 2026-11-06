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
    const [t, v] = await Promise.all([q("TutTutores").eq("email", email).limit(1).find(), q("VolVoluntarios").contains("email", email).limit(1).find()]);
    const tu = t.items[0] as { rol?: string } | undefined;
    return json({ tutor: tu ? tu.rol || "tutor" : null, voluntario: !!v.items[0] });
  } catch (e) {
    console.error("rol", e);
    return json({});
  }
};
