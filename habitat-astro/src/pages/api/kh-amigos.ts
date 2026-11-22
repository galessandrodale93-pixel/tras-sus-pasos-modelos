// Kids & Hero: amigos del camino, regalos entre amigos y desafío en equipo de la semana.
// POST (lo manda el juego, CORS abierto, como text/plain): { k, perfil, socio, ... }
// Seguridad (son chicos): no hay texto libre (los regalos y las frases salen de listas fijas), no se busca gente:
// una amistad nace solo cuando los dos la aceptan estando juntos en una sala, y solo entre amigos hay regalos e invitaciones.
// Quién manda cada pedido se confirma con la colección Perfiles: el perfil tiene que ser de ese socio (dueño del ítem).
// Colecciones (solo administrador): KhAmigos (pareja a__b), KhRegalos (buzón: regalos e invitaciones), KhEquipos.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const rem = auth.elevate(items.remove);

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
const ID = /^[a-zA-Z0-9-]{8,60}$/;
const limpio = (x: Record<string, unknown>) => { const { _createdDate, _updatedDate, _owner, ...y } = x; return y; };
const guardar = (col: string, it: Record<string, unknown>) => save(col, limpio(it) as any);
const uno = async (col: string, id: string) => ((await q(col).eq("_id", id).limit(1).find()).items[0] || null) as Record<string, any> | null;
const parse = <T>(s: unknown, d: T): T => { try { return s ? JSON.parse(String(s)) : d; } catch { return d; } };

// día y semana de Argentina (UTC-3); la semana arranca el lunes
const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
function semanaAR() { const d = new Date(Date.now() - 3 * 3600e3); const dia = (d.getUTCDay() + 6) % 7; const lun = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dia)); return lun.toISOString().slice(0, 10); }
const semN = (s: string) => Math.floor(Date.parse(s + "T00:00:00Z") / (7 * 864e5));

// el desafío de la semana: el mismo para todos los equipos de cada rama, rota cada lunes (sin sorteo)
// [evento, ícono, texto, cuánto aporta cada integrante, unidad]
const METAS: Record<string, [string, string, string, number, string][]> = {
  hero: [["camina", "🚶", "Caminen juntos por la tierra de Jesús", 1500, "metros"], ["junta", "🧺", "Junten trabajando en los oficios", 40, "cosas"], ["ora", "🙏", "Oren", 4, "veces"],
    ["charla", "💬", "Charlen con la gente del camino", 4, "charlas"], ["parada", "📖", "Completen paradas de la historia", 2, "paradas"], ["saluda", "👋", "Saluden a la gente", 6, "saludos"]],
  kids: [["camina", "🚶", "Caminen juntos por la tierra de Jesús", 800, "metros"], ["ora", "🙏", "Oren", 4, "veces"], ["brilla", "🌟", "Hagan brillar su lámpara", 3, "veces"],
    ["charla", "💬", "Charlen con la gente del camino", 3, "charlas"], ["parada", "📖", "Completen paradas de la historia", 2, "paradas"], ["saluda", "👋", "Saluden a la gente", 6, "saludos"]],
};
const metaDe = (rama: string, sem: string) => { const L = METAS[rama] || METAS.kids, m = L[semN(sem) % L.length]; return { k: m[0], ic: m[1], t: m[2], por: m[3], u: m[4] }; };
const MAXEQ = 5, MAXREG = 5, MAXAMIGOS = 30;
const REGALOS = { hero: ["canasta", "denarios", "pescado"], kids: ["estrella", "luz", "sobre"] } as Record<string, string[]>;
const NOMBRES_EQ = 14, FRASES = 8;

type Eq = { _id: string; title?: string; rama?: string; ids?: string; miembros?: string; aportes?: string; cobrados?: string; semanas?: number; alta?: string };
function eqVista(e: Eq, yo: string) {
  const sem = semanaAR(), mi = parse<{ id: string; nom: string }[]>(e.miembros, []), ap = parse<Record<string, Record<string, number>>>(e.aportes, {})[sem] || {};
  const m = metaDe(e.rama || "kids", sem), meta = m.por * Math.max(2, mi.length), total = mi.reduce((a, x) => a + Math.min(ap[x.id] || 0, m.por * 2), 0);
  const cob = parse<Record<string, string[]>>(e.cobrados, {});
  return { id: e._id, nombre: Number(e.title) || 0, rama: e.rama, semana: sem, miembros: mi.map((x) => ({ id: x.id, nom: x.nom, n: Math.min(ap[x.id] || 0, m.por * 2) })),
    meta: { ...m, total: meta }, hecho: Math.min(total, meta), cumplido: total >= meta && mi.length >= 2, cobrado: (cob[sem] || []).includes(yo), semanas: e.semanas || 0 };
}
const semAnt = (s: string) => new Date(Date.parse(s + "T00:00:00Z") - 7 * 864e5).toISOString().slice(0, 10);
async function miEquipo(id: string) { return ((await q("KhEquipos").contains("ids", "|" + id + "|").limit(1).find()).items[0] || null) as Eq | null; }
async function amistad(a: string, b: string) { const [x, y] = [a, b].sort(); const it = await uno("KhAmigos", x + "__" + y); return it && it.aOk && it.bOk ? it : null; }

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request }) => {
  let x: Record<string, any> = {};
  try { x = JSON.parse((await request.text()).slice(0, 4000)); } catch { return json({ error: "datos" }, 400); }
  const yo = String(x.perfil || ""), socio = String(x.socio || "");
  if (!ID.test(yo) || !ID.test(socio)) return json({ error: "perfil" }, 400);
  try {
    const pf = await uno("Perfiles", yo);
    if (!pf || pf._owner !== socio) return json({ error: "perfil" }, 403);
    const rama = pf.rama === "ados" ? "hero" : "kids", nom = String(pf.apodo || "Jugador").slice(0, 16);
    const k = String(x.k || "estado");

    if (k === "estado") {
      const [ra, rb, buz, env, eq] = await Promise.all([
        q("KhAmigos").eq("a", yo).limit(60).find(), q("KhAmigos").eq("b", yo).limit(60).find(),
        q("KhRegalos").eq("para", yo).eq("abierto", false).limit(40).find(), q("KhRegalos").eq("de", yo).eq("dia", hoyAR()).limit(40).find(), miEquipo(yo)]);
      const amigos = [...ra.items, ...rb.items].map((it: any) => { const soyA = it.a === yo; return { id: soyA ? it.b : it.a, nom: soyA ? it.bNom : it.aNom, ok: !!(it.aOk && it.bOk) }; }).filter((a) => a.ok).map(({ id, nom }) => ({ id, nom }));
      const buzon = buz.items.map((it: any) => ({ id: it._id, tipo: it.tipo, de: it.de, deNom: it.deNom, regalo: it.regalo, frase: it.frase || 0, equipo: it.equipo || "", dia: it.dia }));
      const enviados = env.items.filter((it: any) => it.tipo === "regalo").map((it: any) => it.para);
      return json({ ok: true, hoy: hoyAR(), amigos, buzon, enviados, maxReg: MAXREG, equipo: eq ? eqVista(eq, yo) : null, meta: metaDe(rama, semanaAR()) });
    }

    if (k === "amigo") { // los dos lo aceptan estando juntos en la sala: cada uno manda su parte
      const otro = String(x.otro || ""); if (!ID.test(otro) || otro === yo) return json({ error: "otro" }, 400);
      const po = await uno("Perfiles", otro); if (!po) return json({ error: "otro" }, 404);
      if ((po.rama === "ados" ? "hero" : "kids") !== rama) return json({ error: "rama" }, 400);
      const [a, b] = [yo, otro].sort(), id = a + "__" + b, cur = (await uno("KhAmigos", id)) || { _id: id, a, b, alta: new Date().toISOString(), rama };
      if (!cur.aOk || !cur.bOk) { const n = (await q("KhAmigos").eq(a === yo ? "a" : "b", yo).limit(100).find()).items.length; if (n >= MAXAMIGOS + 20) return json({ error: "muchos" }, 400); }
      const it = { ...cur, title: nom + " · " + String(po.apodo || ""), aNom: a === yo ? nom : String(po.apodo || "Jugador").slice(0, 16), bNom: b === yo ? nom : String(po.apodo || "Jugador").slice(0, 16), [a === yo ? "aOk" : "bOk"]: true };
      await guardar("KhAmigos", it);
      return json({ ok: true, mutuo: !!(it.aOk && it.bOk) });
    }

    if (k === "quitar") {
      const otro = String(x.otro || ""); if (!ID.test(otro)) return json({ error: "otro" }, 400);
      const [a, b] = [yo, otro].sort(); try { await rem("KhAmigos", a + "__" + b); } catch {}
      return json({ ok: true });
    }

    if (k === "regalo") { // uno por amigo por día, hasta 5 por día; el regalo y la frase salen de listas fijas
      const para = String(x.para || ""), reg = String(x.regalo || ""), fr = Math.floor(Number(x.frase) || 0);
      if (!ID.test(para) || !(REGALOS[rama] || []).includes(reg) || fr < 0 || fr >= FRASES) return json({ error: "datos" }, 400);
      if (!(await amistad(yo, para))) return json({ error: "amigo" }, 403);
      const dia = hoyAR(), env = (await q("KhRegalos").eq("de", yo).eq("dia", dia).limit(40).find()).items.filter((it: any) => it.tipo === "regalo");
      if (env.length >= MAXREG) return json({ error: "limite" }, 400);
      if (env.some((it: any) => it.para === para)) return json({ error: "hoy" }, 400);
      await guardar("KhRegalos", { _id: crypto.randomUUID(), title: nom + " → regalo", tipo: "regalo", de: yo, deNom: nom, para, regalo: reg, frase: fr, dia, abierto: false, rama });
      return json({ ok: true, quedan: MAXREG - env.length - 1 });
    }

    if (k === "abrir") { // marca como abiertos los regalos del buzón y devuelve cuáles eran (el juego da el premio)
      const ids = (Array.isArray(x.ids) ? x.ids : []).map(String).filter((s: string) => ID.test(s) || /^[0-9a-f-]{36}$/.test(s)).slice(0, 40);
      const out: unknown[] = [];
      for (const id of ids) { const it = await uno("KhRegalos", id); if (!it || it.para !== yo || it.abierto || it.tipo !== "regalo") continue; await guardar("KhRegalos", { ...it, abierto: true }); out.push({ id, regalo: it.regalo, deNom: it.deNom, frase: it.frase || 0, de: it.de }); }
      return json({ ok: true, abiertos: out });
    }

    if (k === "equipo-crear") {
      if (await miEquipo(yo)) return json({ error: "ya" }, 400);
      const n = Math.max(0, Math.min(NOMBRES_EQ - 1, Math.floor(Number(x.nombre) || 0)));
      const e: Eq = { _id: crypto.randomUUID(), title: String(n), rama, ids: "|" + yo + "|", miembros: JSON.stringify([{ id: yo, nom }]), aportes: "{}", cobrados: "{}", semanas: 0, alta: new Date().toISOString() };
      await guardar("KhEquipos", e as any);
      return json({ ok: true, equipo: eqVista(e, yo) });
    }

    if (k === "equipo-invitar") {
      const para = String(x.para || ""); if (!ID.test(para)) return json({ error: "datos" }, 400);
      const e = await miEquipo(yo); if (!e) return json({ error: "sinequipo" }, 400);
      if (parse<unknown[]>(e.miembros, []).length >= MAXEQ) return json({ error: "lleno" }, 400);
      if (!(await amistad(yo, para))) return json({ error: "amigo" }, 403);
      if (String(e.ids || "").includes("|" + para + "|")) return json({ error: "yaesta" }, 400);
      const pend = (await q("KhRegalos").eq("para", para).eq("abierto", false).limit(40).find()).items.some((it: any) => it.tipo === "equipo" && it.equipo === e._id);
      if (!pend) await guardar("KhRegalos", { _id: crypto.randomUUID(), title: nom + " → invitación", tipo: "equipo", de: yo, deNom: nom, para, equipo: e._id, frase: Number(e.title) || 0, dia: hoyAR(), abierto: false, rama });
      return json({ ok: true });
    }

    if (k === "equipo-responder") { // aceptar o no una invitación del buzón; aceptar deja el equipo anterior
      const inv = await uno("KhRegalos", String(x.id || "")); if (!inv || inv.para !== yo || inv.tipo !== "equipo" || inv.abierto) return json({ error: "inv" }, 400);
      await guardar("KhRegalos", { ...inv, abierto: true });
      if (!x.si) return json({ ok: true });
      const e = (await uno("KhEquipos", String(inv.equipo))) as Eq | null; if (!e) return json({ error: "noexiste" }, 404);
      const mi = parse<{ id: string; nom: string }[]>(e.miembros, []); if (mi.length >= MAXEQ) return json({ error: "lleno" }, 400);
      const viejo = await miEquipo(yo); if (viejo && viejo._id !== e._id) await salir(viejo, yo);
      if (!mi.some((m) => m.id === yo)) mi.push({ id: yo, nom });
      const nu = { ...e, miembros: JSON.stringify(mi), ids: "|" + mi.map((m) => m.id).join("|") + "|" };
      await guardar("KhEquipos", nu as any);
      return json({ ok: true, equipo: eqVista(nu, yo) });
    }

    if (k === "equipo-salir") { const e = await miEquipo(yo); if (e) await salir(e, yo); return json({ ok: true }); }

    if (k === "aporte") { // lo que hizo desde el último envío; cada uno suma como mucho el doble de su parte
      const e = await miEquipo(yo); if (!e) return json({ ok: true, equipo: null });
      const sem = semanaAR(), m = metaDe(e.rama || "kids", sem), n = Math.max(0, Math.min(m.por * 2, Math.floor(Number(x.n) || 0)));
      if (String(x.ev || "") === m.k && n > 0 && (x.semana === sem)) {
        const ap = parse<Record<string, Record<string, number>>>(e.aportes, {}); for (const s of Object.keys(ap)) if (s < semAnt(sem)) delete ap[s];
        const w = ap[sem] || (ap[sem] = {}); w[yo] = Math.min(m.por * 2, (w[yo] || 0) + n); e.aportes = JSON.stringify(ap);
        await guardar("KhEquipos", e as any);
      }
      return json({ ok: true, equipo: eqVista(e, yo) });
    }

    if (k === "cobrar") { // el premio de la semana, una vez por integrante
      const e = await miEquipo(yo); if (!e) return json({ error: "sinequipo" }, 400);
      const v = eqVista(e, yo); if (!v.cumplido) return json({ error: "falta" }, 400); if (v.cobrado) return json({ error: "cobrado" }, 400);
      const cob = parse<Record<string, string[]>>(e.cobrados, {}); for (const s of Object.keys(cob)) if (s < semAnt(v.semana)) delete cob[s];
      const pri = !(cob[v.semana] || []).length; cob[v.semana] = (cob[v.semana] || []).concat(yo); e.cobrados = JSON.stringify(cob);
      if (pri) e.semanas = (e.semanas || 0) + 1; // la semana cuenta una vez para el equipo
      await guardar("KhEquipos", e as any);
      const todos = v.miembros.length >= 2 && v.miembros.every((m) => m.n > 0);
      return json({ ok: true, todos, semanas: e.semanas, equipo: eqVista(e, yo) });
    }

    return json({ error: "k" }, 400);
  } catch (e) { console.error("kh-amigos", e); return json({ error: "servidor" }, 500); }
};

async function salir(e: Eq, yo: string) {
  const mi = parse<{ id: string; nom: string }[]>(e.miembros, []).filter((m) => m.id !== yo);
  if (!mi.length) { try { await rem("KhEquipos", e._id); } catch {} return; }
  await guardar("KhEquipos", { ...e, miembros: JSON.stringify(mi), ids: "|" + mi.map((m) => m.id).join("|") + "|" } as any);
}
