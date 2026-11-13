// Panel de profesores: sus clases, el material, la reflexión después de cada clase y lo que dijeron los alumnos (sin nombres).
// Quien organiza (director o permiso "org") administra los profes y ve todo el feedback con nombres: GET ?admin=1.
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { esClase, esDe, emailDe, hoyAR, json, organiza, profeDe, q, s, todos, type Clase, type Profe } from "../../lib/profe";
import { animo, esc, progsDe } from "../../lib/vol";

const save = auth.elevate(items.save);
const rem = auth.elevate(items.remove);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const clean = <T extends Record<string, unknown>>(x: T) => { const { _createdDate, _updatedDate, _owner, ...r } = x; return r; };
type Mat = { _id: string; title?: string; claseId: string; profeId?: string; url?: string; mime?: string; fecha?: string };
type Op = { _id: string; tipo?: string; claseId?: string; fecha?: string; programa?: string; email?: string; nombre?: string; animo?: string; gusto?: string; mejora?: string; _createdDate?: unknown };

async function bienvenidaProfe(p: Profe) {
  const C = Object.fromEntries(((await q("TutConfig").limit(50).find()).items as { _id: string; valor?: string }[]).map((c) => [c._id, c.valor || ""]));
  const email = String(p.email || "").split(/[,;\s]+/)[0];
  const nom = esc(String(p.title || "").split(/\s+/)[0]);
  const P = (t: string) => `<p style="font:16px/1.6 Arial;margin:0 0 12px">${t}</p>`;
  const html = `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#10251d;background:#fbf8f2;padding:28px;border-radius:16px">
<p style="font:600 12px Arial;letter-spacing:.14em;color:#b8904f;text-transform:uppercase;margin:0 0 10px">Habitat · Profesores</p>
<h1 style="font-size:26px;margin:0 0 14px">Te damos la bienvenida al Campus de Habitat 🎓</h1>
${P(`Hola ${nom}! Ya tenés tu lugar como profe en el Campus de Habitat. Ahí vas a ver tus próximas clases, vas a poder subir el material para los alumnos y dejar tu reflexión después de cada clase.`)}
${P(`<b>Cómo entrar:</b> en <a href="https://www.habitat-cfm.org/ingresar.html" style="color:#b8904f">habitat-cfm.org/ingresar</a> tocá «Entrar con Google» con <b>${esc(email)}</b>. Si preferís usar contraseña, poné ese mismo mail y tocá «¿Olvidaste tu contraseña?» para crear una. Es importante que sea este mail: así el Campus te reconoce como profe y te lleva directo a tu panel.`)}
<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/profesor.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir mi panel de profe</a></p>
${P("Una semana antes de cada clase te va a llegar un recordatorio por mail.")}
<p style="font:italic 17px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">Gracias por sembrar la Palabra en esta generación.</p>
</div>`;
  const body = { emailTransmission: { emailSubject: "Bienvenido al Campus de Habitat 🎓", emailHtmlContent: html, senderName: "Habitat CFM", senderEmailAddress: C.remitente || "galessandrodale.93@gmail.com", toRecipients: [{ emailAddress: email }], type: "TRANSACTIONAL" }, idempotencyKey: crypto.randomUUID() };
  const r = await fetchAuth("https://www.wixapis.com/email-transmissions/v1/email-transmissions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, status: r.status };
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const me = await emailDe(request);
    const org = await organiza(me.email);
    if (url.searchParams.get("admin") === "1") {
      if (!org) return json({ error: "Esto lo ve quien organiza Habitat." }, 403);
      const [profes, clases, ops, refl] = await Promise.all([todos<Profe>("Profes"), todos<Clase>("TutClases"), todos<Op>("AluOpina"), todos<Record<string, unknown>>("ProfReflexion")]);
      const nombres = [...new Set(clases.map((c) => s(c.profe)).filter(Boolean))].sort();
      const hoy = hoyAR();
      return json({
        profes: profes.map((p) => ({ ...clean(p), clases: clases.filter((c) => esDe(c, p)).length, proxima: clases.filter((c) => esDe(c, p) && c.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))[0] || null })),
        nombres,
        clases: Object.fromEntries(clases.map((c) => [c._id, { fecha: c.fecha, programa: c.programa, title: c.title, profe: c.profe }])),
        opiniones: ops.map(clean).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))),
        reflexiones: refl.map(clean).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))),
      });
    }
    const p = await profeDe(me.email);
    if (!p) return json({ profe: null, org });
    const hoy = hoyAR();
    const [clasesT, mats, refl, ops, asis, alus] = await Promise.all([
      todos<Clase>("TutClases"), todos<Mat>("ProfMaterial"), q("ProfReflexion").eq("profeId", p._id).limit(500).find().then((r) => r.items as Record<string, unknown>[]),
      todos<Op>("AluOpina"), todos<{ fecha: string; alumnoId: string; estado?: string }>("TutAsistencia"), todos<{ _id: string; carreras?: string }>("TutAlumnos"),
    ]);
    const mias = clasesT.filter((c) => esDe(c, p) && esClase(c)).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const ids = new Set(mias.map((c) => c._id));
    const carr = Object.fromEntries(alus.map((a) => [a._id, progsDe(a.carreras)]));
    const pinta = (c: Clase) => {
      const presentes = new Set(asis.filter((a) => a.fecha === c.fecha && (a.estado === "P" || a.estado === "Z") && (carr[a.alumnoId] || []).some((x) => progsDe(c.programa).includes(x))).map((a) => a.alumnoId));
      const O = ops.filter((o) => o.claseId === c._id);
      return {
        ...c,
        materiales: mats.filter((m) => m.claseId === c._id).map(clean),
        reflexion: refl.find((r) => r.claseId === c._id) ? clean(refl.find((r) => r.claseId === c._id) as Record<string, unknown>) : null,
        presentes: presentes.size,
        // lo que dijeron los alumnos, sin nombres
        opiniones: O.map((o) => ({ animo: o.animo || "", gusto: o.gusto || "", mejora: o.mejora || "" })),
      };
    };
    const proximas = mias.filter((c) => c.fecha >= hoy).slice(0, 12).map(pinta);
    const pasadas = mias.filter((c) => c.fecha < hoy).reverse().slice(0, 20).map(pinta);
    const anio = mias.filter((c) => c.fecha < hoy && c.fecha >= hoy.slice(0, 4) + "-01-01").map(pinta);
    const gustos = ops.filter((o) => o.claseId && ids.has(o.claseId) && o.gusto).map((o) => o.gusto as string).slice(-12).reverse();
    return json({
      org,
      profe: { id: p._id, nombre: p.title, gracias: p.gracias || "", ics: "https://www.habitat-cfm.org/api/profe.ics?p=" + p._id + "&k=" + p.clave },
      proximas, pasadas,
      siembra: { clases: anio.length, horas: anio.length * 2, alumnos: anio.reduce((n, c) => n + c.presentes, 0), comentarios: anio.reduce((n, c) => n + c.opiniones.length, 0) },
      gustos,
      animo: animo(hoy + p._id),
    });
  } catch (e) {
    console.error("profe", e);
    return json({ error: "No pudimos cargar el panel." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const me = await emailDe(request);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const op = s(x.op, 30);
    // administración de profes (quien organiza)
    if (op === "guardarProfe" || op === "borrarProfe") {
      if (!(await organiza(me.email))) return json({ error: "Esto lo maneja quien organiza Habitat." }, 403);
      if (op === "borrarProfe") { await rem("Profes", s(x.id, 80)); return json({ ok: true }); }
      const id = s(x.id, 80);
      const cur = id ? ((await q("Profes").eq("_id", id).limit(1).find()).items[0] as Profe | undefined) : undefined;
      const it = { ...(cur ? clean(cur as unknown as Record<string, unknown>) : {}), title: s(x.title, 120), email: s(x.email, 200).toLowerCase(), gracias: s(x.gracias, 2000), activo: x.activo === "no" ? "no" : "si", clave: (cur && cur.clave) || crypto.randomUUID().replace(/-/g, "") } as Record<string, unknown>;
      if (!it.title) return json({ error: "Falta el nombre tal como figura en las clases." }, 400);
      if (id) it._id = id;
      const r = await save("Profes", it);
      // profe nuevo (o que recién tiene email): le llega la bienvenida al Campus con cómo entrar a su panel
      let bienvenida: unknown = null;
      if (it.email && it.activo !== "no" && (!cur || !cur.email)) bienvenida = await bienvenidaProfe(it as unknown as Profe).catch((e) => String((e as Error).message || e));
      return json({ ok: true, item: r, bienvenida });
    }
    const p = await profeDe(me.email);
    if (!p) return json({ error: "Tu cuenta no figura como profe de Habitat." }, 403);
    const claseId = s(x.claseId, 80);
    const clase = claseId ? ((await q("TutClases").eq("_id", claseId).limit(1).find()).items[0] as Clase | undefined) : undefined;
    if (op !== "quitar" && (!clase || !esDe(clase, p))) return json({ error: "Esa clase no figura a tu nombre." }, 403);
    if (op === "subir") {
      const r = await fetchAuth("https://www.wixapis.com/site-media/v1/files/generate-upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mimeType: s(x.mime, 120) || "application/octet-stream", fileName: s(x.nombre, 160) || "material" }) });
      const b = await r.json();
      if (!r.ok || !b.uploadUrl) return json({ error: "No pudimos preparar la subida." }, 500);
      return json({ ok: true, uploadUrl: b.uploadUrl });
    }
    if (op === "material") {
      const u = s(x.url, 600);
      if (!/^https:\/\/[^\s]+$/.test(u)) return json({ error: "Falta el archivo." }, 400);
      const it = await save("ProfMaterial", { title: s(x.nombre, 160) || "Material", claseId, profeId: p._id, url: u, mime: s(x.mime, 120), fecha: (clase as Clase).fecha });
      return json({ ok: true, item: it });
    }
    if (op === "quitar") {
      const m = (await q("ProfMaterial").eq("_id", s(x.id, 80)).limit(1).find()).items[0] as Mat | undefined;
      if (!m || m.profeId !== p._id) return json({ error: "Ese material no es tuyo." }, 403);
      await rem("ProfMaterial", m._id);
      return json({ ok: true });
    }
    if (op === "reflexion") {
      const c = clase as Clase;
      if (c.fecha > hoyAR()) return json({ error: "La reflexión se completa después de dar la clase." }, 400);
      const it = { _id: c._id + "|" + p._id, title: s(c.title, 200), claseId: c._id, profeId: p._id, fecha: c.fecha, animo: s(x.animo, 4), bien: s(x.bien, 2000), mejorar: s(x.mejorar, 2000), grupo: s(x.grupo, 2000), aprendi: s(x.aprendi, 2000), oracion: s(x.oracion, 1000) };
      await save("ProfReflexion", it);
      return json({ ok: true, item: it });
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    console.error("profe POST", e);
    return json({ error: "No pudimos guardar." }, 500);
  }
};

