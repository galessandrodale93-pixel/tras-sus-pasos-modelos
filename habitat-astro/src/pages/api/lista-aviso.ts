// Aviso por mail, durante la clase, al voluntario que toma lista: que cargue los presentes en «Mi servicio».
// Lo llama un disparador programado los miércoles y jueves a la noche y los sábados a la mañana.
// Manda solo los de hoy y una sola vez por turno (queda marcado en VolTurnos.avisoLista).
// GET /api/lista-aviso   ·  prueba: ?k=<TutConfig.cronKey>&dry=1[&fecha=YYYY-MM-DD]
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { esc, esLista, horario } from "../../lib/vol";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function html(nombre: string, tareas: string[]) {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#10251d;background:#fbf8f2;padding:28px;border-radius:16px">
<p style="font:600 12px Arial;letter-spacing:.14em;color:#b8904f;text-transform:uppercase;margin:0 0 10px">Habitat · Voluntarios</p>
<h1 style="font-size:26px;margin:0 0 14px">Cargá la lista en la web 📋</h1>
<p style="font:16px/1.6 Arial">Hola ${esc(nombre.split(" ")[0])}! Hoy estás a cargo de <b>${esc(tareas.join(" y ").toLowerCase())}</b>. Cuando termines de tomar lista en la clase, volcala en la web: entrás a «Mi servicio», tocás a cada alumno y se guarda solo.</p>
<p style="margin:22px 0"><a href="https://www.habitat-cfm.org/voluntario.html#lista" style="background:#10251d;color:#fbf8f2;font:700 16px Arial;padding:14px 22px;border-radius:999px;text-decoration:none">Cargar la lista</a></p>
<p style="font:14px/1.6 Arial;color:#5d6b64">También podés marcar si llegó tarde o si se quedó al tiempo de mesa. Tenés hasta 3 días para completarla; después, cualquier corrección la hace Raquel.</p>
<p style="font:italic 16px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">Gracias por cuidar a cada alumno: detrás de cada nombre hay alguien que Dios está formando.</p>
</div>`;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const C = Object.fromEntries(((await q("TutConfig").limit(50).find()).items as { _id: string; valor?: string }[]).map((c) => [c._id, c.valor || ""]));
    const prueba = url.searchParams.has("fecha") || url.searchParams.has("dry");
    if (prueba && (!C.cronKey || url.searchParams.get("k") !== C.cronKey)) return json({ error: "no" }, 401);
    const hoy = url.searchParams.get("fecha") || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const dry = url.searchParams.get("dry") === "1";
    const tur = ((await q("VolTurnos").eq("fecha", hoy).limit(500).find()).items as Record<string, unknown>[]).filter((t) => esLista(String(t.tarea)));
    const vols = Object.fromEntries(((await q("VolVoluntarios").limit(200).find()).items as { _id: string; title?: string; email?: string; activo?: boolean }[]).map((v) => [v._id, v]));
    const por: Record<string, Record<string, unknown>[]> = {};
    tur.forEach((t) => (por[String(t.voluntarioId)] = por[String(t.voluntarioId)] || []).push(t));
    const out: unknown[] = [];
    for (const [vid, ts] of Object.entries(por)) {
      const v = vols[vid];
      if (!v || v.activo === false) continue;
      if (ts.every((t) => t.avisoLista === "mail:" + hoy)) continue;
      if (!v.email) { out.push({ vid, sinEmail: true }); continue; }
      const tareas = ts.map((t) => String(t.tarea));
      if (dry) { out.push({ vid, email: v.email, tareas, clase: horario(hoy).clase }); continue; }
      const body = {
        emailTransmission: {
          emailSubject: "Cuando tomes lista, cargala en la web 📋",
          emailHtmlContent: html(v.title || "", tareas),
          senderName: "Habitat CFM",
          senderEmailAddress: C.remitente || "galessandrodale.93@gmail.com",
          toRecipients: [{ emailAddress: String(v.email).split(/[,;\s]+/)[0] }],
          type: "TRANSACTIONAL",
        },
        idempotencyKey: crypto.randomUUID(),
      };
      const r = await fetchAuth("https://www.wixapis.com/email-transmissions/v1/email-transmissions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const txt = await r.text();
      if (r.ok) for (const t of ts) { const { _createdDate, _updatedDate, _owner, ...rest } = t; await save("VolTurnos", { ...rest, avisoLista: "mail:" + hoy }); }
      out.push({ vid, status: r.status, resp: r.ok ? "ok" : txt.slice(0, 300) });
    }
    return json({ ok: true, hoy, enviados: out });
  } catch (e) {
    console.error("lista-aviso", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
};
