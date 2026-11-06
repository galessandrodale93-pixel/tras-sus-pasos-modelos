// Panel del tutor (reemplaza al Excel de seguimiento).
// Solo entran los miembros cuyo email está en la colección TutTutores.
// Roles: "director" (todo), "tutor" (todo menos pagos y equipo), "pagos" (además marca pagos).
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const ins = auth.elevate(items.insert);
const rem = auth.elevate(items.remove);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Habitat-Auth, Authorization",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max);
const b = (v: unknown) => v === true || v === "true" || v === 1;
const asc = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const DATE = /^\d{4}-\d{2}-\d{2}$/, MES = /^\d{4}-\d{2}$/, ID = /^[a-z0-9-]{2,80}$/;

type Tutor = { _id: string; title?: string; email?: string; pareja?: string; rol?: string };

async function all(col: string) {
  const out: Record<string, unknown>[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as Record<string, unknown>[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as Record<string, unknown>[])); }
  return out.map(({ _createdDate, _updatedDate, _owner, ...x }) => x);
}

async function who(request: Request): Promise<Tutor | null> {
  const token = request.headers.get("x-habitat-auth") || request.headers.get("authorization");
  if (!token) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
  if (!mr.ok) return null;
  const m = (await mr.json()).member || {};
  const email = String(m.loginEmail || (m.contact && m.contact.emails && m.contact.emails[0]) || "").toLowerCase();
  if (!email) return null;
  const r = await q("TutTutores").eq("email", email).limit(1).find();
  const t = r.items[0] as Tutor | undefined;
  return t ? { ...t, rol: t.rol || "tutor" } : null;
}

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });

export const GET: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Tu cuenta no tiene acceso al panel de tutores." }, 403);
    const [alumnos, asistencia, pagos, evaluaciones, grupo, seguimientos, tutores] = await Promise.all(
      ["TutAlumnos", "TutAsistencia", "TutPagos", "TutEvaluaciones", "TutGrupo", "TutSeguimientos", "TutTutores"].map(all),
    );
    return json({ me, alumnos, asistencia, pagos, evaluaciones, grupo, seguimientos, tutores: tutores.map(({ email, ...t }) => (me.rol === "director" ? { email, ...t } : t)) });
  } catch (e) {
    console.error("tutor GET", e);
    return json({ error: "No pudimos cargar el panel." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Tu cuenta no tiene acceso al panel de tutores." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const por = me.title || me.email || "";
    const alu = s(x.alumnoId, 80);
    const needAlu = () => { if (!ID.test(alu)) throw new Error("alumno"); };
    switch (x.op) {
      case "asis": {
        needAlu(); const f = s(x.fecha, 10); if (!DATE.test(f)) return json({ error: "fecha" }, 400);
        const est = s(x.estado, 1);
        if (!est) { await rem("TutAsistencia", alu + "|" + f).catch(() => null); return json({ ok: true }); }
        if (!/^[PZVAJ]$/.test(est)) return json({ error: "estado" }, 400);
        const it = { _id: alu + "|" + f, alumnoId: alu, fecha: f, estado: est, tarde: b(x.tarde), mesa: b(x.mesa), por };
        await save("TutAsistencia", it); return json({ ok: true, item: it });
      }
      case "pago": {
        if (me.rol !== "pagos") return json({ error: "Los pagos los marca solo la encargada de pagos." }, 403);
        needAlu(); const m = s(x.mes, 7); if (!MES.test(m)) return json({ error: "mes" }, 400);
        const it = { _id: alu + "|" + m, alumnoId: alu, mes: m, pagado: b(x.pagado), por };
        await save("TutPagos", it); return json({ ok: true, item: it });
      }
      case "eval": {
        needAlu(); const pg = s(x.programa, 40), item = s(x.item, 40); if (!pg || !item) return json({ error: "item" }, 400);
        const _id = alu + "|" + asc(pg) + "|" + asc(item);
        if (!b(x.ok)) { await rem("TutEvaluaciones", _id).catch(() => null); return json({ ok: true }); }
        const it = { _id, alumnoId: alu, programa: pg, item, ok: true, por };
        await save("TutEvaluaciones", it); return json({ ok: true, item: it });
      }
      case "grupo": {
        needAlu(); const w = s(x.semana, 10); if (!DATE.test(w)) return json({ error: "semana" }, 400);
        const n = s(x.nivel, 10);
        if (!n) { await rem("TutGrupo", alu + "|" + w).catch(() => null); return json({ ok: true }); }
        if (!/^(activo|poco|nada)$/.test(n)) return json({ error: "nivel" }, 400);
        const it = { _id: alu + "|" + w, alumnoId: alu, semana: w, nivel: n, por };
        await save("TutGrupo", it); return json({ ok: true, item: it });
      }
      case "seg": {
        needAlu(); const f = s(x.fecha, 10) || new Date().toISOString().slice(0, 10); if (!DATE.test(f)) return json({ error: "fecha" }, 400);
        const nota = s(x.nota, 2000); if (!nota) return json({ error: "Escribí qué hablaron." }, 400);
        const data = { alumnoId: alu, fecha: f, tutor: por, motivo: s(x.motivo, 60) || "Seguimiento", nota, respondio: b(x.respondio) };
        if (x.id) { const id = s(x.id, 120); const it = { _id: id, ...data }; await save("TutSeguimientos", it); return json({ ok: true, item: it }); }
        const r = await ins("TutSeguimientos", data); return json({ ok: true, item: r });
      }
      case "seg-del": { await rem("TutSeguimientos", s(x.id, 120)); return json({ ok: true }); }
      case "alumno": {
        const nuevo = !alu;
        const title = s(x.title, 120); if (!title) return json({ error: "Falta el nombre." }, 400);
        const id = nuevo ? asc(title) : alu; if (!ID.test(id)) return json({ error: "nombre" }, 400);
        const cur = nuevo ? null : ((await q("TutAlumnos").eq("_id", id).limit(1).find()).items[0] as Record<string, unknown> | undefined);
        if (!nuevo && !cur) return json({ error: "No existe ese alumno." }, 404);
        const it: Record<string, unknown> = {
          ...(cur || {}), _id: id, title,
          carreras: s(x.carreras, 120), modalidad: s(x.modalidad, 30), tutores: s(x.tutores, 60), ciudad: s(x.ciudad, 80),
          email: s(x.email, 120), telefono: s(x.telefono, 40), cumple: s(x.cumple, 10), notas: s(x.notas, 2000),
          activo: x.activo === undefined ? true : b(x.activo),
        };
        if (me.rol === "pagos") { it.formaPago = s(x.formaPago, 40); it.matricula = b(x.matricula); }
        else if (nuevo) { it.formaPago = ""; it.matricula = false; }
        delete it._createdDate; delete it._updatedDate; delete it._owner;
        await save("TutAlumnos", it); return json({ ok: true, item: it });
      }
      case "tutor": {
        if (me.rol !== "director") return json({ error: "Solo los directores administran el equipo." }, 403);
        const email = s(x.email, 120).toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "email" }, 400);
        if (x.borrar) { await rem("TutTutores", s(x.id, 80)); return json({ ok: true }); }
        const it = { _id: s(x.id, 80) || asc(email), title: s(x.title, 80), email, pareja: s(x.pareja, 60), rol: /^(director|tutor|pagos)$/.test(s(x.rol, 20)) ? s(x.rol, 20) : "tutor" };
        await save("TutTutores", it); return json({ ok: true, item: it });
      }
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    if ((e as Error).message === "alumno") return json({ error: "alumno" }, 400);
    console.error("tutor POST", e);
    return json({ error: "No pudimos guardar el cambio." }, 500);
  }
};
