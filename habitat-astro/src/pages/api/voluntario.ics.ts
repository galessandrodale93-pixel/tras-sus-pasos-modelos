// Calendario personal de cada voluntario, con avisos en el teléfono:
// miércoles y jueves al mediodía del mismo día; sábados el viernes a la noche.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { animo, esLista, grupos, type Ev } from "../../lib/vol";
import { delDia } from "../../lib/oracion";

const q = auth.elevate(items.query);
const e = (s: unknown) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => { const out: string[] = []; let cur = ""; for (const ch of line) { if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = " " + ch; } else cur += ch; } out.push(cur); return out.join("\r\n"); };
const loc = (f: string, hm: string) => f.replace(/-/g, "") + "T" + hm.replace(":", "") + "00";

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("v") || "", k = url.searchParams.get("k") || "";
  const v = (await q("VolVoluntarios").eq("_id", id).limit(1).find()).items[0] as { _id: string; title?: string; clave?: string } | undefined;
  if (!v || !v.clave || v.clave !== k) return new Response("no", { status: 404 });
  const desde = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const r = await q("VolTurnos").eq("voluntarioId", v._id).ge("fecha", desde).ascending("fecha").limit(500).find();
  const porDia: Record<string, { tarea: string; nota?: string }[]> = {};
  (r.items as { fecha: string; tarea: string; nota?: string }[]).forEach((t) => (porDia[t.fecha] = porDia[t.fecha] || []).push(t));
  const evs = (await q("VolEventos").ge("fecha", desde).limit(500).find()).items as Ev[];
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Habitat CFM//Voluntarios//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Habitat · Mi servicio", "X-WR-TIMEZONE:America/Argentina/Buenos_Aires", "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "BEGIN:VTIMEZONE", "TZID:America/Argentina/Buenos_Aires", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:-0300", "TZOFFSETTO:-0300", "TZNAME:-03", "END:STANDARD", "END:VTIMEZONE"];
  const stamp = "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  for (const f of Object.keys(porDia).sort()) for (const g of grupos(f, porDia[f], evs)) {
    const tareas = g.tareas.join(", "), clase = g.tipo === "clase";
    const cuando = g.llegada ? (clase ? `Te esperamos a las ${g.llegada} (la clase empieza a las ${g.inicio}).` : `Empieza a las ${g.inicio}.`) : "El horario se confirma pronto.";
    const msg = `${g.titulo}: ${tareas}. ${cuando}${g.link ? " " + g.link : ""}${g.versiculos ? " Versículos: " + g.versiculos : ""} ${animo(f + v._id)}`;
    const ini = g.llegada ? "DTSTART;TZID=America/Argentina/Buenos_Aires:" + loc(f, g.llegada) : "DTSTART;VALUE=DATE:" + f.replace(/-/g, "");
    const h0 = g.llegada ? +g.llegada.slice(0, 2) : 0;
    const fin = g.llegada ? "DTEND;TZID=America/Argentina/Buenos_Aires:" + loc(f, clase ? (g.manana ? "12:30" : "22:00") : String(Math.min(23, h0 + 2)).padStart(2, "0") + g.llegada.slice(2)) : "DTEND;VALUE=DATE:" + new Date(Date.parse(f + "T12:00:00Z") + 864e5).toISOString().slice(0, 10).replace(/-/g, "");
    L.push("BEGIN:VEVENT", "UID:vol-" + v._id + "-" + g.tipo + "-" + f + "@habitat-cfm.org", stamp, ini, fin,
      fold("SUMMARY:" + e((clase ? "Servicio en Habitat · " : g.titulo + " · ") + tareas)), fold("DESCRIPTION:" + e(msg)), "LOCATION:" + e(g.lugar),
      "BEGIN:VALARM", "ACTION:DISPLAY", g.manana ? "TRIGGER:-PT14H30M" : "TRIGGER:-PT7H", fold("DESCRIPTION:" + e((g.manana ? "Mañana: " : "Hoy: ") + g.titulo + " · " + tareas + (g.llegada ? ". A las " + g.llegada + "." : "."))), "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT1H", fold("DESCRIPTION:" + e("En una hora: " + g.titulo)), "END:VALARM");
    // quien toma lista: aviso durante la clase para cargar los presentes
    if (clase && g.llegada && g.tareas.some(esLista)) L.push("BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:PT1H", fold("DESCRIPTION:" + e("Cuando tomes lista, cargala en la web: habitat-cfm.org/voluntario.html#lista")), "END:VALARM");
    L.push("END:VEVENT");
  }
  // intercesión (días a cargo) y ayuno (días publicados por adelantado), con recordatorio
  const dia = (f: string) => f.replace(/-/g, ""), sig = (f: string) => new Date(Date.parse(f + "T12:00:00Z") + 864e5).toISOString().slice(0, 10).replace(/-/g, "");
  const [it, ay] = await Promise.all([q("IntTurnos").eq("responsableId", v._id).ge("fecha", desde).limit(200).find(), q("IntAyuno").eq("voluntarioId", v._id).ge("fecha", desde).limit(100).find()]);
  for (const t of it.items as { fecha: string }[]) {
    const d = delDia(t.fecha);
    L.push("BEGIN:VEVENT", "UID:int-" + v._id + "-" + t.fecha + "@habitat-cfm.org", stamp, "DTSTART;VALUE=DATE:" + dia(t.fecha), "DTEND;VALUE=DATE:" + sig(t.fecha),
      fold("SUMMARY:" + e("Intercesión por Habitat · " + d.foco)), fold("DESCRIPTION:" + e("Hoy estás a cargo de la intercesión. " + d.verso.ref + " (NTV). Devocional y oración guiada: habitat-cfm.org/intercesion.html")),
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT3H", fold("DESCRIPTION:" + e("Mañana estás a cargo de la intercesión: " + d.foco)), "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:PT8H", fold("DESCRIPTION:" + e("Hoy intercedés por " + d.foco)), "END:VALARM", "END:VEVENT");
  }
  for (const a of ay.items as { fecha: string }[]) {
    L.push("BEGIN:VEVENT", "UID:ayuno-" + v._id + "-" + a.fecha + "@habitat-cfm.org", stamp, "DTSTART;VALUE=DATE:" + dia(a.fecha), "DTEND;VALUE=DATE:" + sig(a.fecha),
      fold("SUMMARY:" + e("Día de ayuno por Habitat")), fold("DESCRIPTION:" + e("Elegí el tipo de ayuno que mejor te quede. Guía: habitat-cfm.org/intercesion.html#ayuno")),
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-P3D", fold("DESCRIPTION:" + e("En 3 días es tu día de ayuno por Habitat")), "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT3H", fold("DESCRIPTION:" + e("Mañana es tu día de ayuno por Habitat")), "END:VALARM", "END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return new Response(L.join("\r\n") + "\r\n", { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "public, max-age=900" } });
};
