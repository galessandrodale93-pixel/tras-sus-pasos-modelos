// Encuentro de fin de año del equipo (dirección, tutores y voluntarios; sin profes ni músicos).
// La fecha vive en VolEventos (tipo "equipo"); cada persona tiene su ficha en EqFin: si viene, a quién le escribe (amigo invisible de palabras), su carta y sus votos.
import { mandar as mandar0, marco as marco0, p, q, save, todos } from "./sem";
import { esc } from "./vol";

export const WEB = "https://www.habitat-cfm.org";
export const EV_ID = "equipo|2026-12-05";
export const COL = "EqFin";
export const CATEGORIAS = [
  ["siervo", "🙌🏽", "Corazón de siervo", "Siempre dispuesto, aunque nadie lo vea"],
  ["abrazo", "🤗", "El abrazo del año", "Con quien todos se sintieron en casa"],
  ["puntual", "⏰", "Siempre llega primero", "El que abre la puerta y prende las luces"],
  ["risa", "😂", "El que más nos hizo reír", "Alegría pura en cada servicio"],
  ["fuego", "🔥", "Fuego en la adoración", "Nos contagió las ganas de buscar a Dios"],
  ["revelacion", "🌱", "Revelación del año", "Llegó y se hizo imprescindible"],
] as const;
// fin de año: pocos mails y cortos. Solo la invitación (la manda la dirección) y un recordatorio el día anterior.
export const PISTAS: { fecha: string; asunto: string; titulo: string; texto: string }[] = [
  { fecha: "2026-12-04", asunto: "Mañana nos vemos 🎉", titulo: "¡Mañana! 🎉", texto: "Traé algo que te represente este año y muchas ganas de celebrar." },
];
const marco = (k: string, t: string, c: string) => marco0(k, t, c, `<a href="${WEB}/equipo-fin.html" style="color:#b8904f">habitat-cfm.org/equipo-fin</a>`);
export const mandar = (to: string, asunto: string, html: string, remitente: string) => mandar0(to, asunto, html, remitente, "Habitat CFM · Equipo");

export type Ficha = { _id: string; title?: string; email?: string; origen?: string; clave?: string; va?: string; para?: string; carta?: string; cartaFecha?: string; votos?: string; invitado?: string; pistas?: string; activo?: string };
export type Ev = { _id: string; tipo?: string; fecha: string; title?: string; hora?: string; lugar?: string; nota?: string; sorteo?: string };

const nrm = (t: unknown) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const slug = (t: string) => nrm(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const limpio = (x: Record<string, unknown>) => { const { _createdDate, _updatedDate, _owner, ...r } = x; return r; };
export const linkDe = (f: Ficha) => WEB + "/equipo-fin.html?k=" + f.clave;
export const titulo = (e?: Ev) => (e && e.title) || "Encuentro de fin de año";
const DL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const larga = (f: string) => { const d = new Date(f + "T12:00:00Z"); return DL[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MS[d.getUTCMonth()]; };

export async function evento() { return (await q("VolEventos").eq("_id", EV_ID).limit(1).find()).items[0] as Ev | undefined; }

// El equipo: dirección y tutores + voluntarios activos, sin profes ni músicos. Crea o actualiza la ficha de cada uno.
export async function plantel(): Promise<Ficha[]> {
  const [tu, vo, pr, mu, ya] = await Promise.all([todos<Record<string, unknown>>("TutTutores"), todos<Record<string, unknown>>("VolVoluntarios"), todos<Record<string, unknown>>("Profes"), todos<Record<string, unknown>>("ZarMusicos"), todos<Ficha>(COL)]);
  const fuera = new Set([...pr, ...mu].flatMap((x) => String(x.email || "").toLowerCase().split(/[,;\s]+/)).filter(Boolean));
  const L: { title: string; email: string; origen: string }[] = [];
  const visto = new Set<string>();
  const sumar = (x: Record<string, unknown>, origen: string) => {
    const email = String(x.email || "").toLowerCase().split(/[,;\s]+/)[0] || "", title = String(x.title || "").trim();
    if (!title || x.activo === false || x.activo === "no") return;
    if (email && fuera.has(email) && origen === "voluntario") return;
    const k = email || "n-" + slug(title);
    if (visto.has(k)) return; visto.add(k);
    L.push({ title, email, origen });
  };
  tu.forEach((x) => sumar(x, String(x.rol) === "director" ? "dirección" : "tutor"));
  vo.forEach((x) => sumar(x, "voluntario"));
  const out: Ficha[] = [];
  for (const x of L) {
    const id = "p-" + slug(x.email || x.title);
    const cur = ya.find((f) => f._id === id);
    if (cur && cur.title === x.title && cur.email === x.email && cur.origen === x.origen && cur.activo !== "no") { out.push(cur); continue; }
    const it: Ficha = { ...(cur ? (limpio(cur as unknown as Record<string, unknown>) as Ficha) : { _id: id }), title: x.title, email: x.email, origen: x.origen, activo: "si", clave: (cur && cur.clave) || crypto.randomUUID().replace(/-/g, "").slice(0, 20) };
    await save(COL, it as unknown as Record<string, unknown>);
    out.push(it);
  }
  // quien ya no está en el equipo queda inactivo (no se borra su carta)
  for (const f of ya) if (!out.some((o) => o._id === f._id) && f.activo !== "no") await save(COL, { ...limpio(f as unknown as Record<string, unknown>), activo: "no" });
  return out.sort((a, b) => String(a.title).localeCompare(String(b.title)));
}

// amigo invisible de palabras: cada uno le escribe a otra persona, nadie a sí mismo, nadie sin carta
export async function sortear(L: Ficha[]) {
  if (L.length < 2) throw new Error("Hace falta al menos dos personas.");
  const ids = L.map((f) => f._id);
  // un solo ciclo al azar: nadie se escribe a sí mismo y nadie se queda sin carta
  const orden = ids.slice(); for (let i = orden.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
  const para: Record<string, string> = {}; orden.forEach((id, i) => (para[id] = orden[(i + 1) % orden.length]));
  for (const f of L) { f.para = para[f._id]; await save(COL, { ...limpio(f as unknown as Record<string, unknown>), para: f.para }); }
  return para;
}

const btn = (href: string, t: string) => `<p style="margin:18px 0"><a href="${href}" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">${t}</a></p>`;
const nom = (f: Ficha) => esc(String(f.title || "").split(/\s+/)[0]);
const cuando = (e: Ev) => `<b>${esc(larga(e.fecha))}</b> a las <b>${esc(e.hora || "11:00")}</b>${e.lugar ? ` en <b>${esc(e.lugar)}</b>` : ""}`;
export const mailInvitacion = (f: Ficha, e: Ev) => marco("Habitat · Equipo", `${esc(titulo(e))} 🎉`, [
  p(`Hola ${nom(f)}! Queremos cerrar el año juntos y agradecerte todo lo que diste. Te esperamos el ${cuando(e)}.`),
  p("Tocá el botón para confirmar. Ahí te espera una pequeña sorpresa (si tenés ganas, nada obligatorio) 🙌🏽"),
  btn(linkDe(f), "Confirmar"),
].join(""));
export const mailPista = (f: Ficha, e: Ev, pi: (typeof PISTAS)[number]) => marco("Habitat · Equipo", pi.titulo, [
  p(`Hola ${nom(f)}! Te esperamos mañana a las <b>${esc(e.hora || "11:00")}</b>${e.lugar ? " en <b>" + esc(e.lugar) + "</b>" : ""}. ${esc(pi.texto)}`),
  btn(linkDe(f), "Ver la dirección"),
].join(""));

// diario (desde /api/avisos): manda la pista del día a todo el equipo, una sola vez por persona
export async function equipoDiario(hoy: string, dry: boolean, remitente: string) {
  const pi = PISTAS.find((x) => x.fecha === hoy);
  if (!pi) return { equipo: "nada" };
  const e = await evento();
  if (!e) return { equipo: "sin fecha" };
  const L = (await plantel()).filter((f) => f.email && f.va !== "no");
  let ok = 0;
  for (const f of L) {
    const ya = String(f.pistas || "").split(",");
    if (ya.includes(hoy)) continue;
    if (dry) { ok++; continue; }
    const r = await mandar(f.email as string, pi.asunto, mailPista(f, e, pi), remitente);
    if (r.ok) { ok++; await save(COL, { ...limpio(f as unknown as Record<string, unknown>), pistas: [...ya.filter(Boolean), hoy].join(",") }); }
  }
  return { pista: pi.titulo, enviados: ok };
}

// «Habitat en números»: lo que vivimos este año
export async function numeros(anio: string) {
  const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const [al, cl, ve, ce, vt, vo, lp, pr, mu, se, mat] = await Promise.all(["TutAlumnos", "TutClases", "VolEventos", "CampusEventos", "VolTurnos", "VolVoluntarios", "LibPedidos", "Profes", "ZarMusicos", "SemSembradores", "ProfMaterial"].map((c) => todos<Record<string, unknown>>(c).catch(() => [] as Record<string, unknown>[])));
  const enAnio = (f: unknown) => String(f || "").slice(0, 4) === anio && String(f || "").slice(0, 10) <= hoy;
  const clases = cl.filter((c) => enAnio(c.fecha) && (!c.tipo || /clase/i.test(String(c.tipo))));
  const examenes = cl.filter((c) => enAnio(c.fecha) && /examen/i.test(String(c.tipo || "")));
  const esp = ve.filter((e) => enAnio(e.fecha) && (e.tipo === "zarza" || e.tipo === "selah"));
  const selahCampus = ce.filter((e) => /selah|zarza/i.test(String(e.title || "")) && String((e.inicio as { $date?: string })?.$date || e.inicio || "").slice(0, 4) === anio);
  const turnos = vt.filter((t) => enAnio(t.fecha));
  const libros = lp.filter((x) => x.estado !== "Cancelado").reduce((a, x) => a + (Number(x.cantidad) || 1), 0);
  return [
    { n: al.filter((a) => a.activo !== false).length, t: "alumnos cursando con nosotros" },
    { n: clases.length, t: "clases dadas" },
    { n: examenes.length, t: "exámenes y tiempos de mesa" },
    { n: Math.max(esp.length, selahCampus.length), t: "noches de Zarza y Selah" },
    { n: turnos.length, t: "turnos de servicio cubiertos" },
    { n: new Set(turnos.map((t) => t.voluntarioId)).size || vo.length, t: "voluntarios sirviendo" },
    { n: pr.filter((x) => x.activo !== "no").length, t: "profes que enseñaron" },
    { n: mu.filter((x) => x.activo !== "no").length, t: "músicos en Zarza" },
    { n: mat.length, t: "materiales compartidos con los alumnos" },
    { n: libros, t: "libros «Asombro» que salieron" },
    { n: se.length, t: "sembradores que nos acompañan" },
  ].filter((x) => x.n > 0);
}
