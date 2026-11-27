// Reportes de errores de los testers de Kids & Hero (página habitat-cfm.org/reportar.html, que mandamos por link).
// POST → guarda el reporte en KhReportes y avisa por mail a Gui y a Cristian (ids de TutTutores en TutConfig «reportesA»).
// GET  → la lista para el panel «Juego» (directores y los de TutConfig «juegoStats»).
// PATCH { id, estado } → marcar «Pendiente» o «Resuelto».
import type { APIRoute } from "astro";
import { q, guardar, mandar, marco, p } from "../../lib/sem";
import { esc } from "../../lib/vol";

const COL = "KhReportes";
const DEF_A = ["gui", "cristian-castriota"];
const DEF_ACCESO = ["cristian-castriota"];
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
/* el juego también manda reportes desde adentro (botón 🛟 Soporte): puede venir de otro dominio (sitio de prueba, programa de compu) */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const jsonC = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });
const s = (v: unknown, max = 200) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
const hoyISO = () => new Date().toISOString();

type Rep = { _id: string; title?: string; rama?: string; donde?: string; texto?: string; contacto?: string; disp?: string; captura?: string; estado?: string; fecha?: string; nota?: string; _createdDate?: string };

async function cfg(id: string) {
  const c = (await q("TutConfig").eq("_id", id).limit(1).find()).items[0] as { valor?: string } | undefined;
  return c && c.valor ? String(c.valor) : "";
}

async function acceso(request: Request) {
  const token = request.headers.get("x-habitat-auth");
  if (!token) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
  if (!mr.ok) return null;
  const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
  if (!email) return null;
  const t = (await q("TutTutores").eq("email", email).limit(1).find()).items[0] as { _id: string; title?: string; rol?: string } | undefined;
  if (!t) return null;
  if (t.rol === "director") return t;
  const v = await cfg("juegoStats");
  const ids = v ? v.split(/[,\s]+/).filter(Boolean) : DEF_ACCESO;
  return ids.includes(String(t._id)) ? t : null;
}

async function avisar(r: Rep) {
  const v = await cfg("reportesA");
  const ids = v ? v.split(/[,\s]+/).filter(Boolean) : DEF_A;
  const [rmt, tut] = await Promise.all([cfg("remitente"), Promise.all(ids.map((id) => q("TutTutores").eq("_id", id).limit(1).find().then((x) => x.items[0] as { email?: string } | undefined).catch(() => undefined)))]);
  const to = tut.map((t) => String((t && t.email) || "").split(/[,;\s]+/)[0]).filter(Boolean);
  if (!to.length || !rmt) return 0;
  const html = marco("Kids & Hero · Reportes", "Llegó un reporte nuevo 🛠️",
    p(`<b>${esc(r.title || "Sin nombre")}</b> · ${esc(r.rama === "hero" ? "Hero" : r.rama === "kids" ? "Kids" : "Sin rama")}${r.donde ? " · " + esc(r.donde) : ""}`) +
    p(esc(r.texto || "").replace(/\n/g, "<br>")) +
    (r.contacto ? p(`Contacto: ${esc(r.contacto)}`) : "") +
    p(`<span style="color:#5d6b64;font-size:14px">${esc(r.disp || "")}${r.captura ? " · trae captura" : ""}</span>`) +
    p(`<a href="https://www.habitat-cfm.org/juego.html#reportes" style="color:#b8904f">Ver todos los reportes en el panel</a>`),
    `<a href="https://www.habitat-cfm.org/juego.html#reportes" style="color:#b8904f">habitat-cfm.org/juego</a>`);
  const res = await Promise.all(to.map((m) => mandar(m, "Reporte del juego: " + s(r.texto, 60), html, rmt, "Habitat CFM · Kids & Hero").catch(() => ({ ok: false }))));
  return res.filter((x) => x.ok).length;
}

export const POST: APIRoute = async ({ request }) => {
  let x: Record<string, unknown> = {};
  try { x = JSON.parse((await request.text()).slice(0, 700000)); } catch { return jsonC({ error: "No pudimos leer el reporte." }, 400); }
  if (s(x.web, 10)) return jsonC({ ok: true }); // campo trampa: lo completan solo los robots
  const texto = s(x.texto, 3000);
  if (texto.length < 5) return jsonC({ error: "Contanos qué pasó." }, 400);
  let captura = s(x.captura, 600000);
  if (captura && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(captura)) captura = "";
  const r: Rep = {
    _id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: s(x.nombre, 80), rama: ["kids", "hero"].includes(String(x.rama)) ? String(x.rama) : "", donde: s(x.donde, 200), texto,
    contacto: s(x.contacto, 120), disp: s(x.disp, 300), captura, estado: "Pendiente", fecha: hoyISO(),
  };
  try { await guardar(COL, r); }
  catch (e) { console.error("kh-reporte guardar", e); return jsonC({ error: "No pudimos guardar el reporte. Probá de nuevo." }, 500); }
  try { await avisar(r); } catch (e) { console.error("kh-reporte mail", e); }
  return jsonC({ ok: true });
};

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!(await acceso(request))) return json({ error: "Este panel es de la dirección." }, 403);
    const L: Rep[] = [];
    let r = await q(COL).descending("fecha").limit(200).find();
    L.push(...(r.items as Rep[]));
    while (r.hasNext() && L.length < 600) { r = await r.next(); L.push(...(r.items as Rep[])); }
    return json({ ok: true, items: L.map((x) => ({ id: x._id, nombre: x.title || "", rama: x.rama || "", donde: x.donde || "", texto: x.texto || "", contacto: x.contacto || "", disp: x.disp || "", captura: x.captura || "", estado: x.estado || "Pendiente", fecha: x.fecha || x._createdDate || "" })) });
  } catch (e) {
    console.error("kh-reporte GET", e);
    return json({ error: "No se pudo cargar." }, 500);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    if (!(await acceso(request))) return json({ error: "Este panel es de la dirección." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const id = s(x.id, 40), estado = x.estado === "Resuelto" ? "Resuelto" : "Pendiente";
    const it = (await q(COL).eq("_id", id).limit(1).find()).items[0] as Rep | undefined;
    if (!it) return json({ error: "No encontramos ese reporte." }, 404);
    await guardar(COL, { ...it, estado });
    return json({ ok: true });
  } catch (e) {
    console.error("kh-reporte PATCH", e);
    return json({ error: "No se pudo guardar." }, 500);
  }
};
