// Calendario personal de cada voluntario, con avisos en el teléfono:
// miércoles y jueves al mediodía del mismo día; sábados el viernes a la noche.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { horario, animo } from "../../lib/vol";

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
  const porDia: Record<string, string[]> = {};
  (r.items as { fecha: string; tarea: string }[]).forEach((t) => (porDia[t.fecha] = porDia[t.fecha] || []).push(t.tarea));
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Habitat CFM//Voluntarios//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Habitat · Mi servicio", "X-WR-TIMEZONE:America/Argentina/Buenos_Aires", "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "BEGIN:VTIMEZONE", "TZID:America/Argentina/Buenos_Aires", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:-0300", "TZOFFSETTO:-0300", "TZNAME:-03", "END:STANDARD", "END:VTIMEZONE"];
  for (const f of Object.keys(porDia).sort()) {
    const h = horario(f), sab = h.dia === "sábado";
    const tareas = porDia[f].join(", ");
    const msg = `Hoy servís en Habitat: ${tareas}. Te esperamos a las ${h.llegada} (la clase empieza a las ${h.clase}). ${animo(f + v._id)}`;
    L.push("BEGIN:VEVENT", "UID:vol-" + v._id + "-" + f + "@habitat-cfm.org", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""),
      "DTSTART;TZID=America/Argentina/Buenos_Aires:" + loc(f, h.llegada), "DTEND;TZID=America/Argentina/Buenos_Aires:" + loc(f, sab ? "12:30" : "22:00"),
      fold("SUMMARY:" + e("Servicio en Habitat · " + tareas)), fold("DESCRIPTION:" + e(msg)), "LOCATION:Habitat CFM",
      "BEGIN:VALARM", "ACTION:DISPLAY", sab ? "TRIGGER:-PT14H30M" : "TRIGGER:-PT7H", fold("DESCRIPTION:" + e((sab ? "Mañana sábado servís: " : "Hoy servís: ") + tareas + ". Llegá a las " + h.llegada + ".")), "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT1H", fold("DESCRIPTION:" + e("En una hora: " + tareas)), "END:VALARM", "END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return new Response(L.join("\r\n") + "\r\n", { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "public, max-age=900" } });
};
