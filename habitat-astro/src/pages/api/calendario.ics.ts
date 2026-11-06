// Campus Habitat: calendario suscribible (Google, iPhone, Outlook).
// Lee la colección CampusEventos y la entrega como .ics con recordatorios,
// así cada alumno recibe las notificaciones en su propio teléfono.
// ?p=<programId> incluye solo los eventos generales y los de ese curso.
import type { APIRoute } from "astro";
import { items } from "@wix/data";

type Ev = {
  _id: string; title?: string; tipo?: string; inicio?: string | Date; fin?: string | Date;
  descripcion?: string; link?: string; programId?: string; curso?: string; lugar?: string; _updatedDate?: string | Date;
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const dt = (d: string | Date | undefined) => {
  const x = d ? new Date(d) : new Date();
  return x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};
// Las líneas de un .ics no pueden pasar de 75 octetos.
const fold = (line: string) => {
  const out: string[] = []; let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur); return out.join("\r\n");
};

export const GET: APIRoute = async ({ url }) => {
  const p = url.searchParams.get("p") || "";
  let evs: Ev[] = [];
  try {
    const desde = new Date(Date.now() - 60 * 864e5);
    const r = await items.query("CampusEventos").ge("inicio", desde).ascending("inicio").limit(200).find();
    evs = (r.items as Ev[]).filter((e) => !e.programId || !p || e.programId === p);
  } catch (e) { console.error("calendario", e); }

  const L: string[] = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Habitat CFM//Campus//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Habitat · Campus", "X-WR-TIMEZONE:America/Argentina/Buenos_Aires",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H",
  ];
  for (const e of evs) {
    if (!e.inicio) continue;
    const ini = new Date(e.inicio);
    const fin = e.fin ? new Date(e.fin) : new Date(ini.getTime() + 90 * 60000);
    const desc = [e.descripcion, e.curso ? "Curso: " + e.curso : "", e.link ? "Link: " + e.link : ""].filter(Boolean).join("\n\n");
    L.push(
      "BEGIN:VEVENT", "UID:" + e._id + "@habitat-cfm.org", "DTSTAMP:" + dt(e._updatedDate),
      "DTSTART:" + dt(ini), "DTEND:" + dt(fin),
      fold("SUMMARY:" + esc((e.tipo && !/aviso/i.test(e.tipo) ? e.tipo + " · " : "") + (e.title || "Habitat"))),
    );
    if (desc) L.push(fold("DESCRIPTION:" + esc(desc)));
    if (e.lugar || e.link) L.push(fold("LOCATION:" + esc(e.lugar || e.link)));
    if (e.link) L.push(fold("URL:" + e.link));
    L.push(
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT1H", fold("DESCRIPTION:" + esc(e.title || "Habitat")), "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-P1D", fold("DESCRIPTION:" + esc("Mañana: " + (e.title || "Habitat"))), "END:VALARM",
      "END:VEVENT",
    );
  }
  L.push("END:VCALENDAR");
  return new Response(L.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="habitat-campus.ics"',
      "Cache-Control": "public, max-age=900",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
