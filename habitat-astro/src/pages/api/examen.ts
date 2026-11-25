// Entrada a los exámenes de Tally desde la web: /examen.html?f=<formId> (el QR apunta ahí).
// Solo deja pasar a quien entró con su cuenta y no tiene el acceso en pausa por cuotas (lib/bloqueo).
// GET ?f=<formId> con x-habitat-auth → { ok, url } o { bloqueado, vencidos }.
import type { APIRoute } from "astro";
import { emailDe, json, q } from "../../lib/profe";
import { bloqueoDe } from "../../lib/bloqueo";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const f = String(url.searchParams.get("f") || "");
    if (!/^[A-Za-z0-9]{5,12}$/.test(f)) return json({ error: "Ese examen no existe." }, 400);
    const cfg = (await q("TutConfig").eq("_id", "tallyForms").limit(1).find()).items[0] as { valor?: string } | undefined;
    const forms = String((cfg && cfg.valor) || "").split(/[\s,]+/).filter(Boolean);
    if (!forms.includes(f)) return json({ error: "Ese examen no está habilitado." }, 404);
    const me = await emailDe(request);
    if (!me.email) return json({ error: "Entrá con tu cuenta." }, 401);
    const al = (await q("TutAlumnos").eq("email", me.email).limit(1).find()).items[0] as { _id: string; title?: string; email?: string; activo?: boolean } | undefined;
    if (al && al.activo === false) return json({ error: "Tu cuenta de alumno no está activa. Escribinos y lo vemos." }, 403);
    if (al) {
      const bq = await bloqueoDe(al);
      if (bq.bloqueado) return json({ ok: false, bloqueado: true, vencidos: bq.meses });
    }
    const p = new URLSearchParams({ email: me.email });
    if (al) p.set("alumno", al._id);
    return json({ ok: true, url: "https://tally.so/r/" + f + "?" + p.toString() });
  } catch (e) {
    console.error("examen", e);
    return json({ error: "No pudimos abrir el examen. Probá de nuevo en un ratito." }, 500);
  }
};
