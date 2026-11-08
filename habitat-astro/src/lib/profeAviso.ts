// Recordatorio por mail a cada profe, una semana antes de su clase. Lo dispara el mismo aviso diario de /api/avisos.
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { esClase, esDe, masDias, q, todos, type Clase, type Profe } from "./profe";
import { esc, horario } from "./vol";

const save = auth.elevate(items.save);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const DL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const larga = (f: string) => { const d = new Date(f + "T12:00:00Z"); return DL[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MS[d.getUTCMonth()]; };

function html(p: Profe, cs: Clase[]) {
  const nom = String(p.title || "").split(/\s+/)[0];
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#10251d;background:#fbf8f2;padding:28px;border-radius:16px">
<p style="font:600 12px Arial;letter-spacing:.14em;color:#b8904f;text-transform:uppercase;margin:0 0 10px">Habitat · Profesores</p>
<h1 style="font-size:26px;margin:0 0 14px">En una semana enseñás en Habitat 📖</h1>
<p style="font:16px/1.6 Arial">Hola ${esc(nom)}! Te recordamos tu próxima clase:</p>
${cs.map((c) => `<div style="border-top:1px solid #e6dccb;padding:14px 0 4px"><p style="font:700 17px Arial;margin:0 0 6px">${esc(larga(c.fecha))} · ${horario(c.fecha).clase} h</p><p style="font:16px/1.6 Arial;margin:0">${esc((c.programa ? c.programa + " · " : "") + (c.title || "Clase"))}${c.bloque ? " (" + esc(c.bloque) + ")" : ""}</p>${c.nota ? `<p style="font:15px/1.6 Arial;color:#5d6b64;margin:4px 0 0">${esc(c.nota)}</p>` : ""}</div>`).join("")}
<p style="font:16px/1.6 Arial;margin:18px 0 6px">Si tenés material para los alumnos (diapositivas, PDF, lecturas), subilo en tu panel y les aparece en el Campus.</p>
<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/profesor.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir mi panel de profe</a></p>
<p style="font:italic 17px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">Gracias por sembrar la Palabra en esta generación. Lo que enseñás con amor da fruto mucho más allá del aula.</p>
</div>`;
}

export async function avisarProfes(hoy: string, dry: boolean, remitente: string) {
  const objetivo = masDias(hoy, 7);
  const [profes, clases] = await Promise.all([todos<Profe>("Profes"), todos<Clase>("TutClases")]);
  const delDia = clases.filter((c) => c.fecha === objetivo && esClase(c));
  const out: unknown[] = [];
  for (const p of profes) {
    if (p.activo === "no" || !p.email) continue;
    const cs = delDia.filter((c) => esDe(c, p));
    if (!cs.length) continue;
    const key = objetivo + "|" + p._id;
    if ((await q("ProfAvisos").eq("_id", key).limit(1).find()).items.length) continue;
    if (dry) { out.push({ profe: p.title, email: p.email, clases: cs.map((c) => c.title) }); continue; }
    const body = {
      emailTransmission: {
        emailSubject: "En una semana enseñás en Habitat: " + cs.map((c) => c.title || c.programa).join(" · "),
        emailHtmlContent: html(p, cs),
        senderName: "Habitat CFM",
        senderEmailAddress: remitente,
        toRecipients: [{ emailAddress: String(p.email).split(/[,;\s]+/)[0] }],
        type: "TRANSACTIONAL",
      },
      idempotencyKey: crypto.randomUUID(),
    };
    const r = await fetchAuth("https://www.wixapis.com/email-transmissions/v1/email-transmissions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) await save("ProfAvisos", { _id: key, title: String(p.title || ""), fecha: objetivo });
    out.push({ profe: p.title, status: r.status });
  }
  return out;
}
