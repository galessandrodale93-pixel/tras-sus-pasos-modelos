// Campus Habitat: un alumno inscripto deja una pregunta en una clase.
// La respuesta la cargan los docentes desde el CMS (colección CampusPreguntas).
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";

const insert = auth.elevate(items.insert);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Habitat-Auth, Authorization",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const clean = (v: unknown, max: number) =>
  (typeof v === "string" ? v : "").replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max);

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get("x-habitat-auth") || request.headers.get("authorization");
    let body: Record<string, unknown> = {};
    try { body = await request.json(); } catch { /* vacío */ }
    const stepId = clean(body.stepId, 40);
    const programId = clean(body.programId, 40);
    const texto = clean(body.texto, 1500);
    if (!token || !/^[0-9a-f-]{36}$/i.test(stepId) || !/^[0-9a-f-]{36}$/i.test(programId)) return json({ error: "faltan datos" }, 400);
    if (texto.length < 5) return json({ error: "La pregunta es muy corta." }, 400);

    // Quién es: el token del alumno.
    const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
    if (!mr.ok) return json({ error: "sin sesión" }, 401);
    const m = (await mr.json()).member || {};
    const c = m.contact || {};
    const nombre = [c.firstName, c.lastName].filter(Boolean).join(" ") || (m.profile && m.profile.nickname) || "Alumno";

    // Solo puede preguntar quien tiene acceso a la clase.
    const sr = await fetch(
      "https://www.wixapis.com/online-programs/v3/steps/" + encodeURIComponent(stepId),
      { headers: { authorization: token } },
    );
    if (!sr.ok) return json({ error: "sin acceso" }, 403);

    const r = await insert("CampusPreguntas", {
      title: texto,
      programId,
      stepId,
      curso: clean(body.curso, 200),
      clase: clean(body.clase, 200),
      memberId: m.id || "",
      nombre,
      visible: true,
    });
    return json({ ok: true, id: (r as { _id?: string })._id || "" });
  } catch (e) {
    console.error("preguntas", e);
    return json({ error: "No pudimos guardar la pregunta." }, 500);
  }
};
