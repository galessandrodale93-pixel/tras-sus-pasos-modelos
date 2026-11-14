// Avisos por mail a los voluntarios. Lo llama un disparador programado:
// · Todos los días (sin parámetros): avisos a profes, Sembradores y músicos de la Zarza (3 días antes y el mismo día). A los voluntarios ya no se les manda nada a diario.
// · Domingo a la noche (?semana=1): a cada voluntario, un solo mail con todo lo que le toca de lunes a domingo,
//   incluidas las fechas especiales (Zarza, tiempo de mesa por Zoom y Selah con sus versículos).
// GET /api/avisos[?semana=1]  ·  prueba: ?k=<TutConfig.cronKey>&dry=1[&fecha=YYYY-MM-DD][&semana=1]
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { animo, esc, grupos, type Ev, type Grupo } from "../../lib/vol";
import { avisarProfes } from "../../lib/profeAviso";
import { sembradoresDiario } from "../../lib/sem";
import { testimoniosDiario } from "../../lib/tes";
import { finanzasDiario } from "../../lib/mp";
import { debiDiario } from "../../lib/debi";
import { edicionDiario } from "../../lib/edicion";
import { oracionAviso } from "../../lib/oracion";
import { zarzaDiario } from "../../lib/zarza";
import { especialesSemana, materialDiario } from "../../lib/material";
import { cobranzaDiario } from "../../lib/cobranza";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const mas = (f: string, d: number) => new Date(Date.parse(f + "T12:00:00Z") + d * 864e5).toISOString().slice(0, 10);
const diaDe = (f: string) => DIAS[new Date(f + "T12:00:00Z").getUTCDay()] + " " + f.slice(8, 10) + "/" + f.slice(5, 7);

function bloque(g: Grupo) {
  return `<div style="padding:8px 0 4px">
<p style="font:700 16px Arial;margin:0 0 4px">${g.icono} ${esc(g.titulo)}</p>
<ul style="font:600 16px/1.7 Arial;margin:0 0 6px">${g.tareas.map((t) => "<li>" + esc(t) + "</li>").join("")}</ul>
<p style="font:16px/1.6 Arial;margin:0 0 6px">${g.llegada ? (g.tipo === "clase" ? `Te esperamos a las <b>${g.llegada}</b> (la clase empieza a las ${g.inicio}), así podés preparar todo con tranquilidad.` : `Empieza a las <b>${g.inicio}</b>${g.lugar ? " · " + esc(g.lugar) : ""}.`) : "El horario te lo confirmamos pronto."}</p>
${g.link ? `<p style="font:15px/1.6 Arial;margin:0 0 6px">Link: <a href="${esc(g.link)}" style="color:#b8904f">${esc(g.link)}</a></p>` : ""}
${g.versiculos ? `<p style="font:15px/1.6 Arial;margin:0 0 6px"><b>Versículos para este tiempo:</b><br>${esc(g.versiculos).replace(/\n/g, "<br>")}</p>` : g.tipo === "selah" && g.encargado ? `<p style="font:15px/1.6 Arial;color:#5d6b64;margin:0 0 6px">Estás a cargo: cargá los versículos en «Mi servicio» y les llegan a los voluntarios.</p>` : ""}
${g.notas.length ? `<p style="font:15px/1.6 Arial;color:#5d6b64;margin:0 0 6px">${esc(g.notas.join(" · "))}</p>` : ""}</div>`;
}

function html(nombre: string, gs: Grupo[], lun: string) {
  const fechas = [...new Set(gs.map((g) => g.fecha))].sort();
  const dia = (f: string) => `<div style="border-top:1px solid #e6dccb;padding:14px 0 4px">
<p style="font:600 12px Arial;letter-spacing:.12em;color:#b8904f;text-transform:uppercase;margin:0 0 4px">${diaDe(f)}</p>
${gs.filter((g) => g.fecha === f).map(bloque).join("")}</div>`;
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#10251d;background:#fbf8f2;padding:28px;border-radius:16px">
<p style="font:600 12px Arial;letter-spacing:.14em;color:#b8904f;text-transform:uppercase;margin:0 0 10px">Habitat · Voluntarios</p>
<h1 style="font-size:26px;margin:0 0 14px">Tu servicio de esta semana 🙌🏽</h1>
<p style="font:16px/1.6 Arial">Hola ${esc(nombre.split(" ")[0])}! Esto es lo que te toca del ${diaDe(lun).toLowerCase()} al ${diaDe(mas(lun, 6)).toLowerCase()}:</p>
${fechas.map(dia).join("")}
<p style="font:italic 17px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">${esc(animo(lun + nombre))}</p>
<p style="font:14px/1.6 Arial;color:#5d6b64">Si algún día no podés, avisá cuanto antes así lo reorganizamos. Tus turnos están en el Campus: <a href="https://www.habitat-cfm.org/voluntario.html" style="color:#b8904f">habitat-cfm.org/voluntario</a></p>
</div>`;
}

type Turno = { _id: string; fecha: string; tarea: string; voluntarioId: string; nota?: string; avisado?: string };

// Resumen semanal: un mail por voluntario con lo que le toca de lunes (lun) a domingo, una sola vez por semana.
async function semanal(lun: string, dry: boolean, remitente: string) {
  const dom = mas(lun, 6), marca = "sem:" + lun;
  const tur = (await q("VolTurnos").ge("fecha", lun).le("fecha", dom).limit(1000).find()).items as Turno[];
  const evs = (await q("VolEventos").ge("fecha", lun).le("fecha", dom).limit(100).find()).items as unknown as Ev[];
  const vols = Object.fromEntries(((await q("VolVoluntarios").limit(200).find()).items as { _id: string; title?: string; email?: string; activo?: boolean }[]).map((v) => [v._id, v]));
  const por: Record<string, Turno[]> = {};
  tur.forEach((t) => (por[t.voluntarioId] = por[t.voluntarioId] || []).push(t));
  const out: unknown[] = [];
  for (const [vid, ts] of Object.entries(por)) {
    const v = vols[vid];
    if (!v || v.activo === false) continue;
    if (ts.every((t) => t.avisado === marca)) continue;
    if (!v.email) { out.push({ vid, sinEmail: true }); continue; }
    const fechas = [...new Set(ts.map((t) => t.fecha))].sort();
    const G = fechas.flatMap((f) => grupos(f, ts.filter((t) => t.fecha === f), evs));
    if (dry) { out.push({ vid, email: v.email, grupos: G.map((g) => g.fecha + " " + g.titulo + ": " + g.tareas.join(", ")) }); continue; }
    const body = {
      emailTransmission: {
        emailSubject: "Tu servicio en Habitat esta semana: " + fechas.map((f) => diaDe(f).split(" ")[0].toLowerCase()).join(", "),
        emailHtmlContent: html(v.title || "", G, lun),
        senderName: "Habitat CFM",
        senderEmailAddress: remitente,
        toRecipients: [{ emailAddress: String(v.email).split(/[,;\s]+/)[0] }],
        type: "TRANSACTIONAL",
      },
      idempotencyKey: crypto.randomUUID(),
    };
    const r = await fetchAuth("https://www.wixapis.com/email-transmissions/v1/email-transmissions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const t = await r.text();
    if (r.ok) for (const y of ts) await save("VolTurnos", { _id: y._id, fecha: y.fecha, tarea: y.tarea, voluntarioId: y.voluntarioId, nota: y.nota || "", avisado: marca });
    out.push({ vid, status: r.status, resp: r.ok ? "ok" : t.slice(0, 300) });
  }
  return out;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const cfg = (await q("TutConfig").limit(50).find()).items as { _id: string; valor?: string }[];
    const C = Object.fromEntries(cfg.map((c) => [c._id, c.valor || ""]));
    // Sin parámetros cualquiera puede dispararlo: solo manda lo que toca hoy y una sola vez (queda marcado).
    // Probar con otra fecha o en seco requiere la clave interna.
    const prueba = url.searchParams.has("fecha") || url.searchParams.has("dry");
    if (prueba && (!C.cronKey || url.searchParams.get("k") !== C.cronKey)) return json({ error: "no" }, 401);
    const hoy = url.searchParams.get("fecha") || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    const dry = url.searchParams.get("dry") === "1";
    const remitente = C.remitente || "galessandrodale.93@gmail.com";
    if (url.searchParams.get("semana") === "1") {
      // el resumen semanal sale el domingo (hora de Argentina) y cubre del lunes siguiente al domingo
      if (new Date(hoy + "T12:00:00Z").getUTCDay() !== 0) return json({ ok: true, hoy, semana: "solo los domingos", enviados: [] });
      const lun = mas(hoy, 1);
      let alumnos: unknown = {};
      try { alumnos = await especialesSemana(lun, dry, remitente); } catch (e) { alumnos = String((e as Error).message || e); }
      return json({ ok: true, hoy, semana: lun + " a " + mas(lun, 6), enviados: await semanal(lun, dry, remitente), alumnos });
    }
    let profes: unknown = [];
    try { profes = await avisarProfes(hoy, dry, remitente); } catch (e) { profes = String((e as Error).message || e); }
    let sembradores: unknown = {};
    try { sembradores = await sembradoresDiario(hoy, dry, remitente); } catch (e) { sembradores = String((e as Error).message || e); }
    let videos: unknown = [];
    try { videos = await testimoniosDiario(hoy, dry, remitente); } catch (e) { videos = String((e as Error).message || e); }
    let finanzas: unknown = {};
    try { finanzas = await finanzasDiario(hoy, dry, remitente); } catch (e) { finanzas = String((e as Error).message || e); }
    let debi: unknown = {};
    try { debi = await debiDiario(hoy, dry, remitente); } catch (e) { debi = String((e as Error).message || e); }
    let edicion: unknown = {};
    try { edicion = await edicionDiario(hoy, dry, remitente); } catch (e) { edicion = String((e as Error).message || e); }
    let intercesion: unknown = {};
    try { intercesion = await oracionAviso("manana", hoy, dry, remitente); } catch (e) { intercesion = String((e as Error).message || e); }
    let zarza: unknown = {};
    try { zarza = await zarzaDiario(hoy, dry, remitente); } catch (e) { zarza = String((e as Error).message || e); }
    let material: unknown = {};
    try { material = await materialDiario(hoy, dry, remitente); } catch (e) { material = String((e as Error).message || e); }
    let cobranza: unknown = {};
    try { cobranza = await cobranzaDiario(hoy, dry, remitente); } catch (e) { cobranza = String((e as Error).message || e); }
    return json({ ok: true, hoy, enviados: [], profes, sembradores, videos, finanzas, debi, edicion, intercesion, zarza, material, cobranza });
  } catch (e) {
    console.error("avisos", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
};
