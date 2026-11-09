// Aviso por mail, a la mañana siguiente de cada clase, al voluntario que tenía que tomar lista:
// si todavía no la cargó en «Mi servicio» (o le faltan alumnos por marcar), se lo recordamos. Si está completa, no se manda nada.
// Lo llama un disparador programado todos los días a la mañana: mira los turnos de asistencia de ayer.
// Una sola vez por turno (queda marcado en VolTurnos.avisoLista).
// GET /api/lista-aviso   ·  prueba: ?k=<TutConfig.cronKey>&dry=1[&fecha=YYYY-MM-DD]  (fecha = el día del aviso; revisa la clase del día anterior)
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { alumnosLista, esc, esLista, modoLista } from "../../lib/vol";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const mas = (f: string, d: number) => new Date(Date.parse(f + "T12:00:00Z") + d * 864e5).toISOString().slice(0, 10);
const diaDe = (f: string) => DIAS[new Date(f + "T12:00:00Z").getUTCDay()];

async function todos(col: string) {
  const out: Record<string, unknown>[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as Record<string, unknown>[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as Record<string, unknown>[])); }
  return out;
}

type Falta = { tarea: string; esperados: number; faltan: string[] };

function html(nombre: string, clase: string, F: Falta[], cierre: string) {
  const nada = F.every((f) => f.faltan.length === f.esperados);
  const det = F.map((f) => (f.faltan.length === f.esperados
    ? `<li><b>${esc(f.tarea)}</b>: todavía no hay nadie marcado.</li>`
    : `<li><b>${esc(f.tarea)}</b>: te ${f.faltan.length === 1 ? "falta 1 alumno" : "faltan " + f.faltan.length + " alumnos"} (${esc(f.faltan.slice(0, 12).join(", "))}${f.faltan.length > 12 ? "…" : ""}).</li>`)).join("");
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#10251d;background:#fbf8f2;padding:28px;border-radius:16px">
<p style="font:600 12px Arial;letter-spacing:.14em;color:#b8904f;text-transform:uppercase;margin:0 0 10px">Habitat · Voluntarios</p>
<h1 style="font-size:26px;margin:0 0 14px">${nada ? "¿Pudiste tomar lista? 📋" : "Te falta completar la lista 📋"}</h1>
<p style="font:16px/1.6 Arial">Hola ${esc(nombre.split(" ")[0])}! ${nada ? `En la clase del ${clase} estabas a cargo de la asistencia y todavía no vemos la lista cargada en la web.` : `Gracias por cargar la lista de la clase del ${clase}. Quedaron algunos alumnos sin marcar:`}</p>
<ul style="font:16px/1.7 Arial;margin:0 0 8px">${det}</ul>
<p style="font:16px/1.6 Arial">Entrás a «Mi servicio», tocás a cada alumno y se guarda solo (si no vino, marcalo como ausente). Tenés tiempo hasta el <b>${cierre}</b>.</p>
<p style="margin:22px 0"><a href="https://www.habitat-cfm.org/voluntario.html#lista" style="background:#10251d;color:#fbf8f2;font:700 16px Arial;padding:14px 22px;border-radius:999px;text-decoration:none">Cargar la lista</a></p>
<p style="font:14px/1.6 Arial;color:#5d6b64">Si no hubo clase o no pudiste tomarla, avisale a Raquel así lo resuelve ella.</p>
<p style="font:italic 16px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">Gracias por cuidar a cada alumno: detrás de cada nombre hay alguien que Dios está formando.</p>
</div>`;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const C = Object.fromEntries(((await q("TutConfig").limit(50).find()).items as { _id: string; valor?: string }[]).map((c) => [c._id, c.valor || ""]));
    const prueba = url.searchParams.has("fecha") || url.searchParams.has("dry");
    if (prueba && (!C.cronKey || url.searchParams.get("k") !== C.cronKey)) return json({ error: "no" }, 401);
    const hoy = url.searchParams.get("fecha") || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const ayer = mas(hoy, -1), marca = "falta:" + ayer;
    const dry = url.searchParams.get("dry") === "1";
    const tur = ((await q("VolTurnos").eq("fecha", ayer).limit(500).find()).items as Record<string, unknown>[]).filter((t) => esLista(String(t.tarea)));
    if (!tur.length) return json({ ok: true, hoy, clase: ayer, enviados: [] });
    const vols = Object.fromEntries(((await q("VolVoluntarios").limit(200).find()).items as { _id: string; title?: string; email?: string; activo?: boolean }[]).map((v) => [v._id, v]));
    const [alumnos, clases] = await Promise.all([todos("TutAlumnos"), todos("TutClases")]);
    const marcados = new Set(((await q("TutAsistencia").eq("fecha", ayer).limit(1000).find()).items as unknown as { alumnoId: string }[]).map((x) => x.alumnoId));
    const por: Record<string, Record<string, unknown>[]> = {};
    tur.forEach((t) => (por[String(t.voluntarioId)] = por[String(t.voluntarioId)] || []).push(t));
    const out: unknown[] = [];
    for (const [vid, ts] of Object.entries(por)) {
      const v = vols[vid];
      if (!v || v.activo === false) continue;
      if (ts.every((t) => t.avisoLista === marca)) continue;
      const F: Falta[] = ts.map((t) => {
        const L = alumnosLista(alumnos, clases as { fecha?: string; programa?: string }[], ayer, modoLista(String(t.tarea)));
        return { tarea: String(t.tarea), esperados: L.length, faltan: L.filter((a) => !marcados.has(a._id)).map((a) => a.title) };
      }).filter((f) => f.esperados && f.faltan.length);
      if (!F.length) { out.push({ vid, completa: true }); continue; }
      if (!v.email) { out.push({ vid, sinEmail: true }); continue; }
      if (dry) { out.push({ vid, email: v.email, faltas: F.map((f) => f.tarea + ": faltan " + f.faltan.length + " de " + f.esperados) }); continue; }
      const nada = F.every((f) => f.faltan.length === f.esperados);
      const body = {
        emailTransmission: {
          emailSubject: nada ? "¿Pudiste tomar lista en la clase del " + diaDe(ayer) + "? 📋" : "Te faltan alumnos por marcar en la lista del " + diaDe(ayer) + " 📋",
          emailHtmlContent: html(v.title || "", diaDe(ayer), F, diaDe(mas(ayer, 3))),
          senderName: "Habitat CFM",
          senderEmailAddress: C.remitente || "galessandrodale.93@gmail.com",
          toRecipients: [{ emailAddress: String(v.email).split(/[,;\s]+/)[0] }],
          type: "TRANSACTIONAL",
        },
        idempotencyKey: crypto.randomUUID(),
      };
      const r = await fetchAuth("https://www.wixapis.com/email-transmissions/v1/email-transmissions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const txt = await r.text();
      if (r.ok) for (const t of ts) { const { _createdDate, _updatedDate, _owner, ...rest } = t; await save("VolTurnos", { ...rest, avisoLista: marca }); }
      out.push({ vid, status: r.status, resp: r.ok ? "ok" : txt.slice(0, 300) });
    }
    return json({ ok: true, hoy, clase: ayer, enviados: out });
  } catch (e) {
    console.error("lista-aviso", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
};
