// Proyecto Sembradores: lista (formulario "Quiero sembrar", Mercado Pago y carga a mano), mails de bienvenida,
// testimonios por foco y el mail trimestral que la dirección aprueba antes de que salga.
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { esc } from "./vol";

export const q = auth.elevate(items.query);
export const save = auth.elevate(items.save);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);

export const FORM_SEMBRAR = "d2efee89-ab87-4a18-9d0d-e4f1756b3a82";
// Destinos del proyecto (los mismos de la página Sembradores). "General" = donde más se necesite.
export const FOCOS = ["General", "Becas", "Misioneros", "Ayuda humanitaria", "Otros ministerios"];
export const TIPOS = ["Mensual", "Puntual", "Interesado"];
const WEB = "https://www.habitat-cfm.org";

export type Sembrador = { _id: string; title?: string; email?: string; telefono?: string; foco?: string; tipo?: string; monto?: number; origen?: string; activo?: boolean; alta?: string; bienvenida?: string; nota?: string };
export type Testimonio = { _id: string; title?: string; alumnoId?: string; texto?: string; video?: string; foco?: string; becado?: boolean; permiso?: boolean; estado?: string; fecha?: string };
export type Envio = { _id: string; title?: string; tipo?: string; estado?: string; fecha?: string; testimonios?: string; destinatarios?: string; por?: string };

export const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
export const slug = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 70);
export const idDe = (email: string, nombre: string) => (email ? "e-" + slug(email) : "n-" + slug(nombre));
export const trimestre = (f: string) => f.slice(0, 4) + "-T" + (Math.floor((+f.slice(5, 7) - 1) / 3) + 1);

export async function todos<T>(col: string): Promise<T[]> {
  const out: T[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as T[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as T[])); }
  return out;
}
const limpio = <T extends Record<string, unknown>>(x: T) => { const { _createdDate, _updatedDate, _owner, ...y } = x; return y; };
export async function guardar(col: string, it: Record<string, unknown>) { return save(col, limpio(it)); }

async function config() {
  const cfg = (await q("TutConfig").limit(80).find()).items as { _id: string; valor?: string }[];
  return Object.fromEntries(cfg.map((c) => [c._id, c.valor || ""])) as Record<string, string>;
}

/* ---------------- mails ---------------- */
export async function mandar(to: string, asunto: string, html: string, remitente: string, nombre = "Habitat CFM · Sembradores") {
  const body = {
    emailTransmission: { emailSubject: asunto, emailHtmlContent: html, senderName: nombre, senderEmailAddress: remitente, toRecipients: [{ emailAddress: String(to).split(/[,;\s]+/)[0] }], type: "TRANSACTIONAL" },
    idempotencyKey: crypto.randomUUID(),
  };
  const r = await fetchAuth("https://www.wixapis.com/email-transmissions/v1/email-transmissions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, status: r.status, resp: r.ok ? "ok" : (await r.text()).slice(0, 300) };
}

export const marco = (kick: string, titulo: string, cuerpo: string, pie = `<a href="${WEB}/sembradores.html" style="color:#b8904f">habitat-cfm.org/sembradores</a>`) => `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#10251d;background:#fbf8f2;padding:28px;border-radius:16px">
<p style="font:600 12px Arial;letter-spacing:.14em;color:#b8904f;text-transform:uppercase;margin:0 0 10px">${kick}</p>
<h1 style="font-size:26px;margin:0 0 14px">${titulo}</h1>
${cuerpo}
<p style="font:14px/1.6 Arial;color:#5d6b64;margin:22px 0 0">Habitat CFM · Centro de Formación Ministerial<br>${pie}</p>
</div>`;
export const p = (t: string) => `<p style="font:16px/1.6 Arial;margin:0 0 12px">${t}</p>`;
const nom = (s: Sembrador) => esc(String(s.title || "").split(/\s+/)[0] || "");

const DESTINO: Record<string, string> = {
  General: "allí donde hoy más se necesita: becas, misioneros, ayuda humanitaria y otros ministerios",
  Becas: "las becas de estudiantes que quieren formarse y todavía no tienen el recurso",
  Misioneros: "el sostén de misioneros que llevan el Evangelio a otras ciudades y naciones",
  "Ayuda humanitaria": "la ayuda humanitaria que enviamos a lugares golpeados por catástrofes",
  "Otros ministerios": "otros ministerios que trabajan por la extensión del Reino",
};

export function htmlBienvenida(s: Sembrador) {
  const foco = DESTINO[s.foco || "General"] || DESTINO.General;
  const tipo = s.tipo || "Interesado";
  const paso = tipo === "Mensual"
    ? p(`Tu siembra mensual${s.monto ? " de <b>$ " + Number(s.monto).toLocaleString("es-AR") + "</b>" : ""} va a ${foco}. Cada mes se convierte en formación, cuidado y envío.`)
    : tipo === "Puntual"
      ? p(`Tu siembra va a ${foco}. Gracias por esta ofrenda: llega a personas concretas con nombre y con historia.`)
      : p(`En los próximos días te escribimos para contarte cómo concretar tu siembra. Tu corazón ya está puesto en ${foco}.`);
  return marco("Proyecto Sembradores", "Gracias por sembrar con nosotros 🌱", `
${p(`Hola ${nom(s)}! Te damos la bienvenida a Proyecto Sembradores.`)}
${p("Este proyecto nació para acompañar, preparar y equipar líderes y ministerios en nuestra generación, para servir a Dios en las iglesias, las ciudades y las naciones. Desde hoy sos parte activa de esa visión.")}
${paso}
${p("Esto es lo que vas a recibir como sembrador:")}
<ul style="font:16px/1.7 Arial;margin:0 0 12px">${["Un informe cada tres meses con novedades y avances", "Testimonios de alumnos y de lo que Dios hace con tu siembra", "La invitación a nuestra reunión anual de visión"].map((x) => "<li>" + x + "</li>").join("")}</ul>
<p style="font:italic 17px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">«El que siembra generosamente, generosamente también cosechará.» 2 Corintios 9:6 (NTV)</p>
${p("Si querés contarnos algo o cambiar el destino de tu siembra, respondé este mail y te leemos.")}`);
}

function bloqueTestimonio(t: Testimonio) {
  const quien = esc(t.title || "Un alumno de Habitat") + (t.becado ? " · alumno becado" : "");
  return `<div style="border-top:1px solid #e6dccb;padding:16px 0 6px">
<p style="font:700 16px Arial;margin:0 0 8px">${quien}</p>
${t.texto ? `<p style="font:italic 17px/1.6 Georgia;margin:0 0 10px">«${esc(t.texto).replace(/\n/g, "<br>")}»</p>` : ""}
${t.video ? `<p style="margin:10px 0"><a href="${esc(t.video)}" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:11px 18px;border-radius:999px;text-decoration:none">Ver su testimonio en video ▶</a></p>` : ""}
</div>`;
}

export function htmlTestimonio(s: Sembrador, t: Testimonio) {
  const intro = s.foco === "Becas" || t.becado
    ? "Queremos que conozcas a una de las personas que hoy estudian en Habitat gracias a una beca. Tu siembra hace posible historias como esta."
    : "Queremos compartirte lo que Dios está haciendo en la vida de nuestros alumnos. Tu siembra es parte de esta historia.";
  return marco("Proyecto Sembradores · Testimonio", "Esto es fruto de tu siembra 🌾", `${p(`Hola ${nom(s)}!`)}${p(intro)}${bloqueTestimonio(t)}${p("Gracias por creer en esta generación y por sembrar en ella.")}`);
}

export const TEXTO_TRIMESTRAL = `Queremos contarte cómo sigue creciendo lo que sembramos juntos.
Este trimestre seguimos formando líderes, adoradores y servidores en nuestras carreras y escuelas, con alumnos que cursan presencial, por Zoom y a su ritmo desde el Campus. Cada clase, cada tutoría y cada encuentro de oración es tierra trabajada para que la Palabra dé fruto.
Tu siembra sostiene becas, acompaña misioneros, suma ayuda humanitaria y abre puertas a nuevos ministerios. Más abajo te dejamos algunas voces de quienes hoy están siendo formados.
Gracias por ser parte. Oramos por vos y por tu familia, y te esperamos en nuestra próxima reunión de visión.`;

export function htmlTrimestral(s: Sembrador, texto: string, ts: Testimonio[], tri: string) {
  const mios = ts.filter((t) => !s.foco || s.foco === "General" || t.foco === s.foco || t.foco === "General");
  const lista = (mios.length ? mios : ts).slice(0, 3);
  const [y, k] = tri.split("-T");
  return marco("Proyecto Sembradores · Informe " + ["", "primer", "segundo", "tercer", "cuarto"][+k] + " trimestre " + y, "Lo que Dios hizo con tu siembra", `
${p(`Hola ${nom(s)}!`)}
${String(texto || TEXTO_TRIMESTRAL).split(/\n+/).filter(Boolean).map((x) => p(esc(x))).join("")}
${lista.length ? `<p style="font:700 13px Arial;letter-spacing:.12em;color:#b8904f;text-transform:uppercase;margin:22px 0 4px">Testimonios</p>${lista.map(bloqueTestimonio).join("")}` : ""}
<p style="font:italic 17px/1.6 Georgia;border-left:3px solid #b8904f;padding-left:14px;margin:20px 0">«Yo planté la semilla en sus corazones, y Apolos la regó, pero fue Dios quien la hizo crecer.» 1 Corintios 3:6 (NTV)</p>`);
}

/* ---------------- altas automáticas ---------------- */
// Trae las respuestas del formulario "Quiero sembrar" y suma a quien todavía no está en la lista.
export async function desdeFormulario() {
  const r = await fetchAuth("https://www.wixapis.com/form-submission-service/v4/submissions/namespace/query", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: { filter: { namespace: "wix.form_app.form", formId: FORM_SEMBRAR }, sort: [{ fieldName: "createdDate", order: "DESC" }], cursorPaging: { limit: 100 } } }),
  });
  if (!r.ok) return { error: r.status };
  const subs = ((await r.json()).submissions || []) as { id: string; createdDate?: string; submissions?: Record<string, unknown> }[];
  const ya = new Set((await todos<Sembrador>("SemSembradores")).map((x) => x._id));
  let nuevos = 0;
  for (const sb of subs) {
    const v = sb.submissions || {};
    const pick = (pre: string) => String(Object.entries(v).find(([k]) => k.startsWith(pre))?.[1] ?? "").trim();
    const email = pick("email").toLowerCase(), nombre = [pick("nombre"), pick("apellido")].filter(Boolean).join(" ");
    if (!email && !nombre) continue;
    const _id = idDe(email, nombre);
    if (ya.has(_id)) continue;
    ya.add(_id);
    await guardar("SemSembradores", { _id, title: nombre, email, telefono: pick("telefono"), foco: "General", tipo: "Interesado", monto: 0, origen: "Formulario", activo: true, alta: String(sb.createdDate || hoyAR()).slice(0, 10), bienvenida: "", nota: "" });
    nuevos++;
  }
  return { nuevos };
}

// Para el aviso de Mercado Pago (tanda de Finanzas): suma o actualiza al sembrador que pagó.
export async function desdePago(x: { email: string; nombre: string; monto: number; recurrente: boolean; fecha: string }) {
  const email = x.email.toLowerCase(), _id = idDe(email, x.nombre);
  // busca primero por email (puede estar cargado a mano con otro id) y después por id
  const prev = ((email && (await q("SemSembradores").eq("email", email).limit(1).find()).items[0]) || (await q("SemSembradores").eq("_id", _id).limit(1).find()).items[0]) as Sembrador | undefined;
  const it: Sembrador = prev
    ? { ...prev, tipo: x.recurrente ? "Mensual" : prev.tipo === "Mensual" ? "Mensual" : "Puntual", monto: x.monto || prev.monto, activo: prev.activo !== false, origen: prev.origen === "Manual" ? "Manual" : "Mercado Pago" }
    : { _id, title: x.nombre, email: x.email.toLowerCase(), foco: "General", tipo: x.recurrente ? "Mensual" : "Puntual", monto: x.monto, origen: "Mercado Pago", activo: true, alta: x.fecha, bienvenida: "" };
  await guardar("SemSembradores", it as Record<string, unknown>);
  return it;
}

/* ---------------- tareas del aviso diario ---------------- */
async function yaEnviado(id: string) { return (await q("SemEnvios").eq("_id", id).limit(1).find()).items.length > 0; }

export async function bienvenida(s: Sembrador, remitente: string) {
  if (!s.email || s.bienvenida || s.activo === false) return null;
  const r = await mandar(s.email, "Te damos la bienvenida a Proyecto Sembradores 🌱", htmlBienvenida(s), remitente);
  if (r.ok) await guardar("SemSembradores", { ...s, bienvenida: hoyAR() });
  return r;
}

export async function mandarTestimonio(s: Sembrador, t: Testimonio, remitente: string) {
  const id = "test|" + t._id + "|" + s._id;
  if (!s.email || (await yaEnviado(id))) return null;
  const r = await mandar(s.email, s.foco === "Becas" || t.becado ? "Conocé a un alumno becado gracias a tu siembra" : "Un testimonio de Habitat para vos", htmlTestimonio(s, t), remitente);
  if (r.ok) await guardar("SemEnvios", { _id: id, title: t.title || "Testimonio", tipo: "testimonio", estado: "enviado", fecha: hoyAR(), testimonios: t._id, destinatarios: s._id, por: "automático" });
  return r;
}

// Un testimonio aprobado le llega a cada sembrador cuyo foco coincide (Becas recibe los de alumnos becados).
export const leToca = (s: Sembrador, t: Testimonio) => {
  const f = s.foco || "General";
  if (f === "General") return false; // los de foco general lo reciben en el informe trimestral
  return t.foco === f || (f === "Becas" && !!t.becado);
};

export async function sembradoresDiario(hoy: string, dry: boolean, remitente: string) {
  const out: Record<string, unknown> = {};
  try { out.formulario = dry ? "dry" : await desdeFormulario(); } catch (e) { out.formulario = String((e as Error).message || e); }
  const [ss, ts] = await Promise.all([todos<Sembrador>("SemSembradores"), todos<Testimonio>("SemTestimonios")]);
  const activos = ss.filter((s) => s.activo !== false && s.email);
  const bv: unknown[] = [], tv: unknown[] = [];
  for (const s of activos) {
    if (!s.bienvenida) { bv.push(dry ? s.title : { s: s.title, r: await bienvenida(s, remitente) }); continue; }
    for (const t of ts.filter((t) => t.estado === "Aprobado" && leToca(s, t))) {
      if (dry) { if (!(await yaEnviado("test|" + t._id + "|" + s._id))) tv.push(s.title + " ← " + t.title); continue; }
      const r = await mandarTestimonio(s, t, remitente);
      if (r) tv.push({ s: s.title, t: t.title, r });
    }
  }
  out.bienvenidas = bv; out.testimonios = tv;
  // Al empezar cada trimestre se arma el borrador del informe y se avisa a la dirección para que lo apruebe.
  const tri = trimestre(hoy), idTri = "tri|" + tri;
  if (+hoy.slice(5, 7) % 3 === 1 && !(await yaEnviado(idTri))) {
    const desde = new Date(Date.parse(hoy + "T12:00:00Z") - 120 * 864e5).toISOString().slice(0, 10);
    const sug = ts.filter((t) => t.estado === "Aprobado" && (t.fecha || "") >= desde).slice(0, 3).map((t) => t._id);
    out.trimestral = dry ? { borrador: idTri, sug } : await borradorTrimestral(tri, sug, remitente);
  }
  return out;
}

export async function borradorTrimestral(tri: string, testimonios: string[], remitente: string, avisar = true) {
  const _id = "tri|" + tri;
  const prev = (await q("SemEnvios").eq("_id", _id).limit(1).find()).items[0] as Envio | undefined;
  if (prev) return { ya: prev.estado };
  await guardar("SemEnvios", { _id, title: "Informe " + tri, tipo: "trimestral", estado: "borrador", fecha: hoyAR(), testimonios: JSON.stringify(testimonios), destinatarios: "[]", por: "" });
  if (!avisar) return { borrador: _id, avisados: 0 };
  const dirs = ((await q("TutTutores").eq("rol", "director").limit(20).find()).items as { title?: string; email?: string }[]).filter((d) => d.email);
  for (const d of dirs) {
    await mandar(d.email as string, "Para aprobar: informe trimestral de Sembradores", marco("Proyecto Sembradores · Dirección", "El informe del trimestre está listo para revisar", `${p(`Hola ${esc(String(d.title || "").split(/\s+/)[0])}!`)}${p("Armamos el borrador del mail trimestral a los sembradores. El texto es el de siempre; elegí los testimonios, miralo como lo van a recibir y aprobalo para que salga.")}<p style="margin:18px 0"><a href="${WEB}/sembradores-panel.html#informe" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Revisar y aprobar</a></p>`), remitente);
  }
  return { borrador: _id, avisados: dirs.length };
}

export async function enviarTrimestral(tri: string, por: string, remitente: string) {
  const _id = "tri|" + tri;
  const e = (await q("SemEnvios").eq("_id", _id).limit(1).find()).items[0] as Envio | undefined;
  if (!e) throw new Error("No hay borrador para " + tri);
  const C = await config();
  const ids: string[] = JSON.parse(e.testimonios || "[]"), hechos = new Set<string>(JSON.parse(e.destinatarios || "[]"));
  const ts = (await todos<Testimonio>("SemTestimonios")).filter((t) => ids.includes(t._id));
  const ss = (await todos<Sembrador>("SemSembradores")).filter((s) => s.activo !== false && s.email && !hechos.has(s._id));
  const [y, k] = tri.split("-T");
  let ok = 0, fallas = 0;
  for (const s of ss) {
    const r = await mandar(s.email as string, "Sembradores · informe del " + ["", "primer", "segundo", "tercer", "cuarto"][+k] + " trimestre " + y, htmlTrimestral(s, C.semTexto || TEXTO_TRIMESTRAL, ts, tri), remitente);
    if (r.ok) { hechos.add(s._id); ok++; } else fallas++;
  }
  await guardar("SemEnvios", { ...e, estado: fallas ? "enviado en parte" : "enviado", destinatarios: JSON.stringify([...hechos]), por, fecha: hoyAR() });
  return { ok, fallas };
}
