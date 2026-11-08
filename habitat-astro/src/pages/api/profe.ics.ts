// Calendario personal de cada profe: sus clases, con aviso una semana antes y el día anterior.
import type { APIRoute } from "astro";
import { esClase, esDe, masDias, q, todos, type Clase, type Profe } from "../../lib/profe";
import { horario } from "../../lib/vol";

const e = (t: unknown) => String(t ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => { const out: string[] = []; let cur = ""; for (const ch of line) { if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = " " + ch; } else cur += ch; } out.push(cur); return out.join("\r\n"); };
const loc = (f: string, hm: string) => f.replace(/-/g, "") + "T" + hm.replace(":", "") + "00";

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("p") || "", k = url.searchParams.get("k") || "";
  const p = (await q("Profes").eq("_id", id).limit(1).find()).items[0] as Profe | undefined;
  if (!p || !p.clave || p.clave !== k) return new Response("no", { status: 404 });
  const desde = masDias(new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), -60);
  const clases = (await todos<Clase>("TutClases")).filter((c) => c.fecha >= desde && esDe(c, p) && esClase(c));
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Habitat CFM//Profes//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Habitat · Mis clases", "X-WR-TIMEZONE:America/Argentina/Buenos_Aires", "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "BEGIN:VTIMEZONE", "TZID:America/Argentina/Buenos_Aires", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:-0300", "TZOFFSETTO:-0300", "TZNAME:-03", "END:STANDARD", "END:VTIMEZONE"];
  const stamp = "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  for (const c of clases) {
    const h = horario(c.fecha), sab = h.dia === "sábado";
    const fin = sab ? "12:30" : "22:00";
    const tit = (c.programa ? c.programa + " · " : "") + (c.title || "Clase");
    const msg = `Tu clase en Habitat: ${tit}${c.bloque ? " (" + c.bloque + ")" : ""}. Empieza a las ${h.clase}. Podés subir el material y, después de la clase, dejar tu reflexión en habitat-cfm.org/profesor.html. ¡Gracias por enseñar!`;
    L.push("BEGIN:VEVENT", "UID:prof-" + p._id + "-" + c._id + "@habitat-cfm.org", stamp,
      "DTSTART;TZID=America/Argentina/Buenos_Aires:" + loc(c.fecha, h.clase), "DTEND;TZID=America/Argentina/Buenos_Aires:" + loc(c.fecha, fin),
      fold("SUMMARY:" + e("Enseñás en Habitat · " + tit)), fold("DESCRIPTION:" + e(msg)), "LOCATION:" + e("Habitat CFM"),
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-P7D", fold("DESCRIPTION:" + e("En una semana enseñás en Habitat: " + tit)), "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:" + (sab ? "-PT14H" : "-PT6H"), fold("DESCRIPTION:" + e((sab ? "Mañana" : "Hoy") + " enseñás en Habitat: " + tit)), "END:VALARM",
      "END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return new Response(L.join("\r\n") + "\r\n", { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "public, max-age=900" } });
};
