// Avisos por mail a los voluntarios. Lo llama un disparador programado una vez por día:
// miércoles y jueves avisa el servicio del mismo día; el viernes avisa el del sábado.
// GET /api/avisos?k=<TutConfig.cronKey>[&dry=1][&fecha=YYYY-MM-DD]
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { horario, animo, esc } from "../../lib/vol";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function html(nombre: string, f: string, tareas: string[], extra: string) {
  const h = horario(f), sab = h.dia === "sábado";
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#10251d;background:#fbf8f2;padding:28px;border-radius:16px">
<p style="font:600 12px Arial;letter-spacing:.14em;color:#b8904f;text-transform:uppercase;margin:0 0 10px">Habitat · Voluntarios</p>
<h1 style="font-size:26px;margin:0 0 14px">${sab ? "Mañana sábado" : "Hoy " + h.dia} servís en Habitat 🙌🏽</h1>
<p style="font:16px/1.6 Arial">Hola ${esc(nombre.split(" ")[0])}! ${sab ? "Mañana" : "Hoy"} te toca:</p>
<ul style="font:600 16px/1.7 Arial;margin:0 0 14px">${tareas.map((t) => "<li>" + esc(t) + "</li>").join("")}</ul>
<p style="font:16px/1.6 Arial">Te esperamos a las <b>${h.llegada}</b> (la clase empieza a las ${h.clase}), así podés preparar todo con tranquilidad.</p>
${extra ? `<p style="font:15px/1.6 Arial;color:#5d6b64">${esc(extra)}</p>` : ""}
<p style="font:italic 17px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">${esc(animo(f + nombre))}</p>
<p style="font:14px/1.6 Arial;color:#5d6b64">Tus próximos turnos están en el Campus: <a href="https://www.habitat-cfm.org/campus.html" style="color:#b8904f">habitat-cfm.org/campus</a></p>
</div>`;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const cfg = (await q("TutConfig").limit(50).find()).items as { _id: string; valor?: string }[];
    const C = Object.fromEntries(cfg.map((c) => [c._id, c.valor || ""]));
    if (!C.cronKey || url.searchParams.get("k") !== C.cronKey) return json({ error: "no" }, 401);
    const hoy = url.searchParams.get("fecha") || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const dow = new Date(hoy + "T12:00:00-03:00").getUTCDay();
    const target = dow === 3 || dow === 4 ? hoy : dow === 5 ? new Date(Date.parse(hoy + "T12:00:00Z") + 864e5).toISOString().slice(0, 10) : "";
    if (!target) return json({ ok: true, hoy, nada: "Hoy no corresponde avisar." });
    const dry = url.searchParams.get("dry") === "1";
    const tur = (await q("VolTurnos").eq("fecha", target).limit(200).find()).items as { _id: string; tarea: string; voluntarioId: string; nota?: string; avisado?: string }[];
    const vols = Object.fromEntries(((await q("VolVoluntarios").limit(200).find()).items as { _id: string; title?: string; email?: string; activo?: boolean }[]).map((v) => [v._id, v]));
    const por: Record<string, typeof tur> = {};
    tur.forEach((t) => (por[t.voluntarioId] = por[t.voluntarioId] || []).push(t));
    const out: unknown[] = [];
    for (const [vid, ts] of Object.entries(por)) {
      const v = vols[vid];
      if (!v || v.activo === false) continue;
      if (ts.every((t) => t.avisado === "mail:" + target)) { out.push({ vid, ya: true }); continue; }
      if (!v.email) { out.push({ vid, sinEmail: true }); continue; }
      const tareas = ts.map((t) => t.tarea), extra = ts.map((t) => t.nota).filter(Boolean).join(" · ");
      const h = horario(target);
      const body = {
        emailTransmission: {
          emailSubject: (h.dia === "sábado" ? "Mañana sábado" : "Hoy " + h.dia) + " servís en Habitat: " + tareas.join(", "),
          emailHtmlContent: html(v.title || "", target, tareas, extra),
          senderName: "Habitat CFM",
          senderEmailAddress: C.remitente || "galessandrodale.93@gmail.com",
          toRecipients: [{ emailAddress: v.email }],
          type: "TRANSACTIONAL",
        },
        idempotencyKey: crypto.randomUUID(),
      };
      if (dry) { out.push({ vid, email: v.email, tareas }); continue; }
      const r = await fetchAuth("https://www.wixapis.com/email-transmissions/v1/email-transmissions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const t = await r.text();
      if (r.ok) for (const x of ts) await save("VolTurnos", { _id: x._id, fecha: target, tarea: x.tarea, voluntarioId: x.voluntarioId, nota: x.nota || "", avisado: "mail:" + target });
      out.push({ vid, status: r.status, resp: r.ok ? "ok" : t.slice(0, 300) });
    }
    return json({ ok: true, hoy, target, enviados: out });
  } catch (e) {
    console.error("avisos", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
};
