// Campus del alumno: el material de sus clases, opinar sobre la última clase y un buzón de ideas.
// La dirección ve nombre y texto; el profe lo ve sin nombre.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { esClase, emailDe, hoyAR, json, masDias, q, s, todos, type Clase } from "../../lib/profe";
import { progsDe } from "../../lib/vol";

const save = auth.elevate(items.save);

async function contexto(request: Request) {
  const me = await emailDe(request);
  if (!me.email) return null;
  const alu = (await q("TutAlumnos").eq("email", me.email).limit(1).find()).items[0] as { _id: string; title?: string; carreras?: string } | undefined;
  return { ...me, nombre: (alu && alu.title) || me.nombre, progs: alu ? progsDe(alu.carreras) : [] };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const me = await contexto(request);
    if (!me) return json({ ok: false });
    const hoy = hoyAR();
    const [clases, mats, mias] = await Promise.all([
      todos<Clase>("TutClases"), todos<{ _id: string; title?: string; claseId: string; url?: string; mime?: string; para?: string }>("ProfMaterial").then((L) => L.filter((m) => m.para !== "equipo")),
      q("AluOpina").eq("email", me.email).limit(500).find().then((r) => r.items as { claseId?: string }[]),
    ]);
    const mis = clases.filter((c) => esClase(c) && (!me.progs.length || progsDe(c.programa).some((p) => me.progs.includes(p))));
    const hechas = new Set(mias.map((o) => o.claseId).filter(Boolean));
    // clases de la última semana que todavía no opinó
    const pendientes = mis.filter((c) => c.fecha <= hoy && c.fecha >= masDias(hoy, -7) && !hechas.has(c._id)).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 2)
      .map((c) => ({ id: c._id, fecha: c.fecha, programa: c.programa, title: c.title, profe: c.profe }));
    const materiales = mis.filter((c) => (c.fecha >= masDias(hoy, -45) && c.fecha <= masDias(hoy, 14)) || mats.some((m) => m.claseId === c._id && /^video/.test(String(m.mime || "")))).sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((c) => ({ id: c._id, fecha: c.fecha, programa: c.programa, title: c.title, profe: c.profe, items: mats.filter((m) => m.claseId === c._id).map((m) => ({ title: m.title, url: m.url, mime: m.mime })) }))
      .filter((c) => c.items.length);
    return json({ ok: true, pendientes, materiales });
  } catch (e) {
    console.error("opina", e);
    return json({ ok: false });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const me = await contexto(request);
    if (!me) return json({ error: "Entrá con tu cuenta." }, 401);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const gusto = s(x.gusto, 1500), mejora = s(x.mejora, 1500), animo = s(x.animo, 4);
    if (!gusto && !mejora && !animo) return json({ error: "Escribí algo antes de enviar." }, 400);
    const hoy = hoyAR();
    if (x.tipo === "clase") {
      const c = (await q("TutClases").eq("_id", s(x.claseId, 80)).limit(1).find()).items[0] as Clase | undefined;
      if (!c || c.fecha > hoy) return json({ error: "Esa clase todavía no fue." }, 400);
      await save("AluOpina", { _id: c._id + "|" + me.email.replace(/[^a-z0-9]/g, "-"), title: s(c.title, 200), tipo: "clase", claseId: c._id, fecha: c.fecha, programa: s(c.programa, 60), email: me.email, nombre: me.nombre, animo, gusto, mejora });
      return json({ ok: true });
    }
    await save("AluOpina", { title: "Buzón", tipo: "buzon", fecha: hoy, programa: me.progs.join(", "), email: me.email, nombre: me.nombre, animo, gusto, mejora });
    return json({ ok: true });
  } catch (e) {
    console.error("opina POST", e);
    return json({ error: "No pudimos guardar." }, 500);
  }
};
