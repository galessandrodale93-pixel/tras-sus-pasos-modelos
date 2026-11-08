// Avisos por mail a los voluntarios. Lo llama un disparador programado una vez por día:
// Lo de la tarde/noche se avisa el mismo día; lo de la mañana (el sábado, Selah temprano, fechas sin hora), el día anterior.
// Incluye las fechas especiales: Zarza, tiempo de mesa por Zoom y Selah (con sus versículos).
// GET /api/avisos?k=<TutConfig.cronKey>[&dry=1][&fecha=YYYY-MM-DD]
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { animo, esc, grupos, type Ev, type Grupo } from "../../lib/vol";
import { avisarProfes } from "../../lib/profeAviso";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function html(nombre: string, gs: Grupo[], hoy: string) {
  const dia = (f: string) => (f === hoy ? "Hoy" : "Mañana");
  const bloque = (g: Grupo) => `<div style="border-top:1px solid #e6dccb;padding:14px 0 4px">
<p style="font:700 17px Arial;margin:0 0 6px">${g.icono} ${esc(g.titulo)} · ${dia(g.fecha).toLowerCase()}</p>
<ul style="font:600 16px/1.7 Arial;margin:0 0 8px">${g.tareas.map((t) => "<li>" + esc(t) + "</li>").join("")}</ul>
<p style="font:16px/1.6 Arial;margin:0 0 6px">${g.llegada ? (g.tipo === "clase" ? `Te esperamos a las <b>${g.llegada}</b> (la clase empieza a las ${g.inicio}), así podés preparar todo con tranquilidad.` : `Empieza a las <b>${g.inicio}</b>${g.lugar ? " · " + esc(g.lugar) : ""}.`) : "El horario te lo confirmamos pronto."}</p>
${g.link ? `<p style="font:15px/1.6 Arial;margin:0 0 6px">Link: <a href="${esc(g.link)}" style="color:#b8904f">${esc(g.link)}</a></p>` : ""}
${g.versiculos ? `<p style="font:15px/1.6 Arial;margin:0 0 6px"><b>Versículos para este tiempo:</b><br>${esc(g.versiculos).replace(/\n/g, "<br>")}</p>` : g.tipo === "selah" && g.encargado ? `<p style="font:15px/1.6 Arial;color:#5d6b64;margin:0 0 6px">Estás a cargo: cargá los versículos en «Mi servicio» y les llegan a los voluntarios.</p>` : ""}
${g.notas.length ? `<p style="font:15px/1.6 Arial;color:#5d6b64;margin:0 0 6px">${esc(g.notas.join(" · "))}</p>` : ""}</div>`;
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#10251d;background:#fbf8f2;padding:28px;border-radius:16px">
<p style="font:600 12px Arial;letter-spacing:.14em;color:#b8904f;text-transform:uppercase;margin:0 0 10px">Habitat · Voluntarios</p>
<h1 style="font-size:26px;margin:0 0 14px">${dia(gs[0].fecha)} servís en Habitat 🙌🏽</h1>
<p style="font:16px/1.6 Arial">Hola ${esc(nombre.split(" ")[0])}! Esto es lo que te toca:</p>
${gs.map(bloque).join("")}
<p style="font:italic 17px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">${esc(animo(gs[0].fecha + nombre))}</p>
<p style="font:14px/1.6 Arial;color:#5d6b64">Tus próximos turnos están en el Campus: <a href="https://www.habitat-cfm.org/voluntario.html" style="color:#b8904f">habitat-cfm.org/voluntario</a></p>
</div>`;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const cfg = (await q("TutConfig").limit(50).find()).items as { _id: string; valor?: string }[];
    const C = Object.fromEntries(cfg.map((c) => [c._id, c.valor || ""]));
    // Sin parámetros cualquiera puede dispararlo: solo manda los avisos de hoy y una sola vez (queda marcado).
    // Probar con otra fecha o en seco requiere la clave interna.
    const prueba = url.searchParams.has("fecha") || url.searchParams.has("dry");
    if (prueba && (!C.cronKey || url.searchParams.get("k") !== C.cronKey)) return json({ error: "no" }, 401);
    const hoy = url.searchParams.get("fecha") || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const man = new Date(Date.parse(hoy + "T12:00:00Z") + 864e5).toISOString().slice(0, 10);
    const dry = url.searchParams.get("dry") === "1";
    const tur = ((await q("VolTurnos").ge("fecha", hoy).le("fecha", man).limit(500).find()).items) as { _id: string; fecha: string; tarea: string; voluntarioId: string; nota?: string; avisado?: string }[];
    const evs = (await q("VolEventos").ge("fecha", hoy).le("fecha", man).limit(50).find()).items as Ev[];
    const vols = Object.fromEntries(((await q("VolVoluntarios").limit(200).find()).items as { _id: string; title?: string; email?: string; activo?: boolean }[]).map((v) => [v._id, v]));
    const por: Record<string, typeof tur> = {};
    tur.forEach((t) => (por[t.voluntarioId] = por[t.voluntarioId] || []).push(t));
    const out: unknown[] = [];
    for (const [vid, ts] of Object.entries(por)) {
      const v = vols[vid];
      if (!v || v.activo === false) continue;
      // qué grupos corresponden avisar hoy
      const gs: { g: Grupo; ts: typeof tur }[] = [];
      for (const f of [hoy, man]) {
        const del = ts.filter((t) => t.fecha === f);
        for (const g of grupos(f, del, evs)) {
          if ((f === hoy && g.manana) || (f === man && !g.manana)) continue;
          const mine = del.filter((t) => grupos(f, [t], evs)[0].tipo === g.tipo);
          if (mine.every((t) => t.avisado === "mail:" + f)) continue;
          gs.push({ g, ts: mine });
        }
      }
      if (!gs.length) continue;
      if (!v.email) { out.push({ vid, sinEmail: true }); continue; }
      const G = gs.map((x) => x.g), first = G[0];
      const body = {
        emailTransmission: {
          emailSubject: (first.fecha === hoy ? "Hoy" : "Mañana") + " servís en Habitat: " + G.map((g) => (g.tipo === "clase" ? g.tareas.join(", ") : g.titulo)).join(" · "),
          emailHtmlContent: html(v.title || "", G, hoy),
          senderName: "Habitat CFM",
          senderEmailAddress: C.remitente || "galessandrodale.93@gmail.com",
          toRecipients: [{ emailAddress: String(v.email).split(/[,;\s]+/)[0] }],
          type: "TRANSACTIONAL",
        },
        idempotencyKey: crypto.randomUUID(),
      };
      if (dry) { out.push({ vid, email: v.email, grupos: G.map((g) => g.titulo + ": " + g.tareas.join(", ")) }); continue; }
      const r = await fetchAuth("https://www.wixapis.com/email-transmissions/v1/email-transmissions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const t = await r.text();
      if (r.ok) for (const x of gs) for (const y of x.ts) await save("VolTurnos", { _id: y._id, fecha: y.fecha, tarea: y.tarea, voluntarioId: y.voluntarioId, nota: y.nota || "", avisado: "mail:" + y.fecha });
      out.push({ vid, status: r.status, resp: r.ok ? "ok" : t.slice(0, 300) });
    }
    let profes: unknown = [];
    try { profes = await avisarProfes(hoy, dry, C.remitente || "galessandrodale.93@gmail.com"); } catch (e) { profes = String((e as Error).message || e); }
    return json({ ok: true, hoy, enviados: out, profes });
  } catch (e) {
    console.error("avisos", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
};
