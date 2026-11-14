// Material de las clases: aviso por mail a los alumnos cuando hay material nuevo (lo suba el profe o la dirección).
// Lo que se marca "para el equipo" (la presentación para proyectar) no lo ven ni reciben los alumnos.
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { mandar, marco, p } from "./sem";
import { esc, progsDe } from "./vol";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
type Mat = { _id: string; title?: string; claseId: string; url?: string; mime?: string; para?: string; avisado?: string; fecha?: string };
type Clase = { _id: string; fecha: string; programa?: string; title?: string; profe?: string; tipo?: string };
type Alumno = { _id: string; title?: string; email?: string; carreras?: string; activo?: boolean };
const DL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const larga = (f: string) => { const d = new Date(f + "T12:00:00Z"); return DL[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MS[d.getUTCMonth()]; };
const mas = (f: string, n: number) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);

async function todos<T>(col: string): Promise<T[]> {
  const out: T[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as T[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as T[])); }
  return out;
}
const ico = (m?: string) => (/pdf/.test(m || "") ? "📄" : /presentation|powerpoint/.test(m || "") ? "🖥️" : /video/.test(m || "") ? "🎬" : /audio/.test(m || "") ? "🎧" : /image/.test(m || "") ? "🖼️" : "📎");

// email de cada alumno: el de su ficha o, si no tiene, el de su débito de Debi
async function emails(al: Alumno[]) {
  const deb = await todos<{ alumnoId?: string; email?: string }>("FinDebi");
  const out: Record<string, string> = {};
  for (const a of al) out[a._id] = String(a.email || (deb.find((d) => d.alumnoId === a._id && d.email) || {}).email || "").toLowerCase();
  return out;
}

export async function materialDiario(hoy: string, dry: boolean, remitente: string) {
  const mats = (await todos<Mat>("ProfMaterial")).filter((m) => m.para !== "equipo" && !m.avisado && !/^video/.test(m.mime || ""));
  if (!mats.length) return { material: "nada" };
  const clases = await todos<Clase>("TutClases");
  const porClase: Record<string, Mat[]> = {};
  for (const m of mats) (porClase[m.claseId] = porClase[m.claseId] || []).push(m);
  const al = (await todos<Alumno>("TutAlumnos")).filter((a) => a.activo !== false);
  const em = await emails(al);
  const out: unknown[] = [];
  for (const [cid, L] of Object.entries(porClase)) {
    const c = clases.find((x) => x._id === cid);
    // solo clases de los próximos 14 días o de los últimos 2 (lo viejo no se avisa)
    if (!c || c.fecha < mas(hoy, -2) || c.fecha > mas(hoy, 14)) { if (c && c.fecha < mas(hoy, -2) && !dry) for (const m of L) await save("ProfMaterial", { ...m, avisado: "viejo" }); continue; }
    const progs = progsDe(c.programa);
    const dest = al.filter((a) => progsDe(a.carreras).some((x) => progs.includes(x)) && em[a._id]);
    if (dry) { out.push({ clase: cid, archivos: L.length, alumnos: dest.length }); continue; }
    const cuando = c.fecha === hoy ? "de hoy" : c.fecha === mas(hoy, 1) ? "de mañana" : "del " + larga(c.fecha);
    const lista = `<ul style="font:16px/1.8 Arial;margin:0 0 12px;padding-left:20px">${L.map((m) => `<li>${ico(m.mime)} <a href="${esc(m.url)}" style="color:#b8904f">${esc(m.title || "Material")}</a></li>`).join("")}</ul>`;
    let ok = 0;
    for (const a of dest) {
      const html = marco("Habitat · Tu clase", "Ya está el material de tu clase 📚", `${p(`Hola ${esc(String(a.title || "").split(/\s+/)[0])}! Ya podés ver el material de la clase ${cuando}${c.title ? ": <b>" + esc(c.title) + "</b>" : ""}${c.profe ? " (con " + esc(c.profe) + ")" : ""}.`)}${lista}<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/campus.html#material" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Verlo en el Campus</a></p>${p("Lo tenés siempre en el Campus, en «Material de tus clases».")}`, `<a href="https://www.habitat-cfm.org/campus.html" style="color:#b8904f">habitat-cfm.org/campus</a>`);
      const r = await mandar(em[a._id], "Material de la clase " + cuando + (c.title ? ": " + c.title : ""), html, remitente, "Habitat CFM");
      if (r.ok) ok++;
    }
    for (const m of L) await save("ProfMaterial", { ...m, avisado: hoy });
    out.push({ clase: cid, archivos: L.length, enviados: ok, de: dest.length });
  }
  return out;
}

// para el equipo: lo que hay que proyectar en las clases de los próximos días
export async function paraProyectar(hoy: string) {
  const [mats, clases] = await Promise.all([todos<Mat>("ProfMaterial"), todos<Clase>("TutClases")]);
  return clases.filter((c) => c.fecha >= hoy && c.fecha <= mas(hoy, 7))
    .map((c) => ({ fecha: c.fecha, programa: c.programa || "", title: c.title || "", items: mats.filter((m) => m.claseId === c._id && m.para === "equipo").map((m) => ({ title: m.title, url: m.url, mime: m.mime })) }))
    .filter((c) => c.items.length).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Domingo: a los alumnos, invitación a la Zarza y al Selah de la semana que empieza (lunes a domingo).
type Esp = { _id: string; tipo: string; fecha: string; title?: string; hora?: string; lugar?: string; link?: string; nota?: string; avisoAlumnos?: string };
export async function especialesSemana(lun: string, dry: boolean, remitente: string) {
  const fin = mas(lun, 6);
  const evs = ((await q("VolEventos").ge("fecha", lun).le("fecha", fin).limit(50).find()).items as Esp[]).filter((e) => (e.tipo === "zarza" || e.tipo === "selah") && !e.avisoAlumnos).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (!evs.length) return { especiales: "nada" };
  const al = (await todos<Alumno>("TutAlumnos")).filter((a) => a.activo !== false);
  const em = await emails(al);
  const dest = al.filter((a) => em[a._id]);
  if (dry) return { eventos: evs.map((e) => e._id), alumnos: dest.length };
  const QUE: Record<string, [string, string]> = { zarza: ["🔥", "Una noche de adoración para encontrarnos con Su presencia. ¡Vení y traé a alguien!"], selah: ["📖", "Un tiempo para detenernos, orar y meditar en la Palabra juntos."] };
  const bloque = (e: Esp) => `<div style="border-top:1px solid #e6dccb;padding:14px 0 4px"><p style="font:700 18px Arial;margin:0 0 4px">${QUE[e.tipo][0]} ${esc(e.title || (e.tipo === "zarza" ? "Zarza" : "Selah"))}</p><p style="font:16px/1.6 Arial;margin:0 0 6px"><b>${esc(larga(e.fecha))}</b>${e.hora ? " a las <b>" + esc(e.hora) + "</b>" : e.tipo === "zarza" ? " a las <b>19:30</b>" : ""}${e.lugar ? " · " + esc(e.lugar) : ""}</p><p style="font:16px/1.6 Arial;margin:0 0 6px">${QUE[e.tipo][1]}</p>${e.link ? `<p style="font:15px/1.6 Arial;margin:0 0 6px"><a href="${esc(e.link)}" style="color:#b8904f">${esc(e.link)}</a></p>` : ""}</div>`;
  const titulo = evs.map((e) => (e.tipo === "zarza" ? "Zarza" : "Selah")).filter((x, i, L) => L.indexOf(x) === i).join(" y ");
  let ok = 0;
  for (const a of dest) {
    const html = marco("Habitat · Esta semana", "Esta semana: " + titulo + " 🙌🏽", `${p(`Hola ${esc(String(a.title || "").split(/\s+/)[0])}! Te invitamos a lo que viene esta semana en Habitat:`)}${evs.map(bloque).join("")}${p("¡Te esperamos!")}`, `<a href="https://www.habitat-cfm.org/campus.html" style="color:#b8904f">habitat-cfm.org/campus</a>`);
    const r = await mandar(em[a._id], "Esta semana en Habitat: " + titulo, html, remitente, "Habitat CFM");
    if (r.ok) ok++;
  }
  for (const e of evs) { const { _createdDate, _updatedDate, _owner, ...rest } = e as Esp & Record<string, unknown>; await save("VolEventos", { ...rest, avisoAlumnos: lun }); }
  return { eventos: evs.map((e) => e._id), enviados: ok, de: dest.length };
}
