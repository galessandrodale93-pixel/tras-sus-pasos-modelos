// Encuentro de fin de año del equipo.
// Cada uno (link personal ?k= o su cuenta):  GET  ·  POST { op: "va" | "carta" | "votos" }
// Dirección:  GET ?admin=1  ·  POST { op: "invitar" | "sortear" | "evento" }  ·  GET ?numeros=1 (también para el equipo)
import type { APIRoute } from "astro";
import { emailDe } from "../../lib/profe";
import { q, save } from "../../lib/sem";
import { CATEGORIAS, COL, EV_ID, evento, mailInvitacion, mandar, numeros, plantel, sortear, titulo, type Ev, type Ficha } from "../../lib/equipoFin";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max);
const limpio = (x: Record<string, unknown>) => { const { _createdDate, _updatedDate, _owner, ...r } = x; return r; };
const votosDe = (f?: Ficha): Record<string, string> => { try { return JSON.parse((f && f.votos) || "{}"); } catch { return {}; } };
const nombre = (f?: Ficha) => String((f && f.title) || "");

async function remitente() {
  const r = (await q("TutConfig").eq("_id", "remitente").limit(1).find()).items[0] as { valor?: string } | undefined;
  return (r && r.valor) || "info@habitat-cfm.org";
}
async function quien(request: Request, k: string, L: Ficha[]) {
  if (k) return L.find((f) => f.clave === k);
  const me = await emailDe(request);
  return me.email ? L.find((f) => f.email === me.email) : undefined;
}
async function esDir(request: Request) {
  const me = await emailDe(request);
  if (!me.email) return false;
  const t = (await q("TutTutores").eq("email", me.email).limit(1).find()).items[0] as { rol?: string } | undefined;
  return !!t && t.rol === "director";
}
const vistaEv = (e?: Ev) => e ? { titulo: titulo(e), fecha: e.fecha, hora: e.hora || "11:00", lugar: e.lugar || "", nota: e.nota || "" } : null;

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const [L, e] = await Promise.all([plantel(), evento()]);
    const anio = (e && e.fecha.slice(0, 4)) || new Date().toISOString().slice(0, 4);
    if (url.searchParams.get("admin") === "1") {
      if (!(await esDir(request))) return json({ error: "Esto lo ve la dirección." }, 403);
      const por = Object.fromEntries(L.map((f) => [f._id, f.title]));
      const tally: Record<string, Record<string, number>> = {};
      L.forEach((f) => Object.entries(votosDe(f)).forEach(([c, id]) => { if (por[id]) { tally[c] = tally[c] || {}; tally[c][id] = (tally[c][id] || 0) + 1; } }));
      return json({
        evento: vistaEv(e), categorias: CATEGORIAS,
        equipo: L.map((f) => ({ id: f._id, nombre: f.title, email: f.email || "", origen: f.origen, va: f.va || "", para: por[f.para || ""] || "", carta: !!f.carta, votos: Object.keys(votosDe(f)).length, invitado: f.invitado || "", link: "https://www.habitat-cfm.org/equipo-fin.html?k=" + f.clave })),
        cartas: L.filter((f) => f.carta && f.para).map((f) => ({ para: por[f.para as string] || "", texto: f.carta })),
        premios: CATEGORIAS.map(([c, ic, t]) => ({ c, ic, t, ranking: Object.entries(tally[c] || {}).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ nombre: por[id], n })) })),
        sorteado: L.some((f) => f.para),
      });
    }
    const yo = await quien(request, s(url.searchParams.get("k"), 40), L);
    if (url.searchParams.get("numeros") === "1") {
      if (!yo && !(await esDir(request))) return json({ error: "Esto lo ve el equipo." }, 403);
      return json({ anio, numeros: await numeros(anio) });
    }
    if (!yo) return json({ error: request.headers.get("x-habitat-auth") ? "Tu cuenta no figura en el equipo de este año. Pedile el link a la dirección." : "Este link no es válido. Pedile uno nuevo a la dirección." }, 404);
    const para = L.find((f) => f._id === yo.para);
    const vienen = L.filter((f) => f.va === "si").map((f) => String(f.title || "").split(/\s+/)[0]);
    return json({
      evento: vistaEv(e), categorias: CATEGORIAS,
      yo: { id: yo._id, nombre: yo.title, va: yo.va || "", carta: yo.carta || "", votos: votosDe(yo) },
      para: para ? { nombre: nombre(para), origen: para.origen } : null,
      equipo: L.filter((f) => f._id !== yo._id).map((f) => ({ id: f._id, nombre: f.title })),
      vienen,
    });
  } catch (err) {
    console.error("equipo-fin GET", err);
    return json({ error: "No pudimos cargar el encuentro." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const op = s(x.op, 20);
    const L = await plantel();
    if (op === "va" || op === "carta" || op === "votos") {
      const yo = await quien(request, s(x.k, 40), L);
      if (!yo) return json({ error: "No pudimos reconocerte. Abrí el link que te llegó por mail." }, 404);
      const it = limpio(yo as unknown as Record<string, unknown>) as unknown as Ficha;
      if (op === "va") it.va = ["si", "no", "quizas"].includes(s(x.va, 10)) ? s(x.va, 10) : "";
      if (op === "carta") { it.carta = s(x.texto, 4000); it.cartaFecha = new Date().toISOString().slice(0, 10); }
      if (op === "votos") {
        const ids = new Set(L.map((f) => f._id)); const v: Record<string, string> = {};
        const raw = (x.votos && typeof x.votos === "object" ? x.votos : {}) as Record<string, unknown>;
        CATEGORIAS.forEach(([c]) => { const id = s(raw[c], 80); if (id && ids.has(id) && id !== yo._id) v[c] = id; });
        it.votos = JSON.stringify(v);
      }
      await save(COL, it as unknown as Record<string, unknown>);
      return json({ ok: true, va: it.va || "", carta: it.carta || "", votos: votosDe(it) });
    }
    if (!(await esDir(request))) return json({ error: "Esto lo maneja la dirección." }, 403);
    if (op === "evento") {
      const cur = await evento();
      const it = { ...(cur ? limpio(cur as unknown as Record<string, unknown>) : { _id: EV_ID, tipo: "equipo", fecha: EV_ID.split("|")[1] }), title: s(x.titulo, 80) || titulo(cur), hora: /^\d{2}:\d{2}$/.test(s(x.hora, 5)) ? s(x.hora, 5) : (cur && cur.hora) || "11:00", lugar: s(x.lugar, 120), nota: s(x.nota, 300) };
      await save("VolEventos", it);
      return json({ ok: true, evento: vistaEv(it as unknown as Ev) });
    }
    if (op === "sortear") { await sortear(L); return json({ ok: true }); }
    if (op === "invitar") {
      const e = await evento();
      if (!e) return json({ error: "Primero guardá la fecha y el lugar." }, 400);
      const solo = s(x.id, 80), rmt = await remitente();
      let ok = 0, de = 0;
      for (const f of L) {
        if (!f.email || (solo && f._id !== solo) || (!solo && f.invitado)) continue;
        de++;
        const r = await mandar(f.email, titulo(e) + " 🎉", mailInvitacion(f, e), rmt);
        if (r.ok) { ok++; await save(COL, { ...limpio(f as unknown as Record<string, unknown>), invitado: new Date().toISOString().slice(0, 10) }); }
      }
      return json({ ok: true, enviados: ok, de, sinMail: L.filter((f) => !f.email).map((f) => f.title) });
    }
    return json({ error: "op" }, 400);
  } catch (err) {
    console.error("equipo-fin POST", err);
    return json({ error: "No pudimos guardar. Probá de nuevo." }, 500);
  }
};
