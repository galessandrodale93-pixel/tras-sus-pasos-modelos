// Intercesión y ayuno: lo ve todo el equipo de voluntarios (y la dirección, que además publica la rotación de ayuno).
import type { APIRoute } from "astro";
import { q, todos, guardar, hoyAR, mandar, marco, p } from "../../lib/sem";
import { esc } from "../../lib/vol";
import { FOCOS, NTV, TIPOS_AYUNO, SALUD, delDia, asegurarTurnos, publicarAyuno, pedidosDeProfes, larga, type Turno, type Ayuno } from "../../lib/oracion";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).trim().slice(0, max);
const DIA = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
type Vol = { _id: string; title?: string; email?: string; clave?: string; activo?: boolean };

async function who(request: Request) {
  const tk = request.headers.get("x-habitat-auth");
  if (!tk) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: tk } });
  if (!mr.ok) return null;
  const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
  if (!email) return null;
  const [v, t] = await Promise.all([q("VolVoluntarios").contains("email", email).limit(1).find(), q("TutTutores").eq("email", email).limit(1).find()]);
  const vol = v.items[0] as Vol | undefined, tu = t.items[0] as { title?: string; rol?: string; org?: boolean } | undefined;
  const admin = !!tu && (tu.rol === "director" || !!tu.org);
  return vol || admin ? { vol, admin, nombre: (vol && vol.title) || (tu && tu.title) || "" } : null;
}
async function remitente() { const c = (await q("TutConfig").eq("_id", "remitente").limit(1).find()).items[0] as { valor?: string } | undefined; return (c && c.valor) || "galessandrodale.93@gmail.com"; }

export const GET: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Esta página es del equipo de voluntarios de Habitat." }, 403);
    const hoy = hoyAR();
    await asegurarTurnos(45).catch(() => 0);
    await pedidosDeProfes().catch(() => 0);
    const [vols, T, A, P] = await Promise.all([todos<Vol>("VolVoluntarios"), todos<Turno>("IntTurnos"), todos<Ayuno>("IntAyuno"), todos<Record<string, unknown>>("IntPedidos")]);
    const NM = Object.fromEntries(vols.map((v) => [v._id, v.title || ""]));
    const turnos = T.filter((t) => t.fecha >= hoy && t.fecha <= DIA(hoy, 28)).sort((a, b) => a.fecha.localeCompare(b.fecha)).map((t) => ({ fecha: t.fecha, responsableId: t.responsableId, responsable: NM[t.responsableId] || "", sumados: (JSON.parse(t.sumados || "[]") as string[]).map((id) => NM[id] || ""), foco: delDia(t.fecha).foco }));
    const mesA = hoy.slice(0, 7), ayuno = A.filter((a) => a.mes >= mesA).sort((a, b) => a.fecha.localeCompare(b.fecha)).map((a) => ({ id: a._id, fecha: a.fecha, mes: a.mes, voluntarioId: a.voluntarioId, nombre: NM[a.voluntarioId] || a.title || "", tipo: a.tipo || "" }));
    const pedidos = P.filter((x) => x.estado !== "Respondida" || String(x.respondida || "") >= DIA(hoy, -60)).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).map(({ _createdDate, _updatedDate, _owner, ...x }) => x);
    const v = me.vol;
    return json({
      me: { nombre: me.nombre, id: v ? v._id : "", admin: me.admin, ics: v && v.clave ? "https://www.habitat-cfm.org/api/voluntario.ics?v=" + v._id + "&k=" + v.clave : "" },
      hoy: delDia(hoy), manana: delDia(DIA(hoy, 1)), focos: FOCOS.map((f) => f.titulo), ntv: NTV,
      turnos, ayuno, pedidos, tiposAyuno: TIPOS_AYUNO, salud: SALUD,
      voluntarios: vols.filter((x) => x.activo !== false).map((x) => ({ id: x._id, nombre: x.title || "" })),
    });
  } catch (e) { console.error("oracion GET", e); return json({ error: "No pudimos cargar la intercesión." }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Sin acceso." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const hoy = hoyAR(), yo = me.vol ? me.vol._id : "";
    switch (x.op) {
      case "sumarme": {
        if (!yo) return json({ error: "Tenés que estar en la lista de voluntarios." }, 400);
        const f = /^\d{4}-\d{2}-\d{2}$/.test(s(x.fecha)) ? s(x.fecha) : hoy;
        const t = (await q("IntTurnos").eq("_id", f).limit(1).find()).items[0] as Turno | undefined;
        if (!t) return json({ error: "Ese día todavía no tiene turno." }, 400);
        const L: string[] = JSON.parse(t.sumados || "[]"); if (!L.includes(yo) && t.responsableId !== yo) L.push(yo);
        await guardar("IntTurnos", { ...t, sumados: JSON.stringify(L) });
        return json({ ok: true });
      }
      case "cambiar": { // intercambia el turno de `fecha` con el de `con`
        const f1 = s(x.fecha, 10), f2 = s(x.con, 10);
        const [a, b] = await Promise.all([q("IntTurnos").eq("_id", f1).limit(1).find(), q("IntTurnos").eq("_id", f2).limit(1).find()]);
        const t1 = a.items[0] as Turno | undefined, t2 = b.items[0] as Turno | undefined;
        if (!t1 || !t2 || f1 < hoy || f2 < hoy) return json({ error: "Elegí dos días que vengan." }, 400);
        if (!me.admin && t1.responsableId !== yo) return json({ error: "Solo podés cambiar tu propio turno." }, 403);
        await guardar("IntTurnos", { ...t1, responsableId: t2.responsableId, avisoNoche: "", avisoManana: "" });
        await guardar("IntTurnos", { ...t2, responsableId: t1.responsableId, avisoNoche: "", avisoManana: "" });
        const otro = (await q("VolVoluntarios").eq("_id", t2.responsableId).limit(1).find()).items[0] as Vol | undefined;
        if (otro && otro.email) await mandar(String(otro.email).split(/[,;\s]+/)[0], "Cambio de turno de intercesión", marco("Habitat · Intercesión", "Tu turno cambió", `${p(`Hola ${esc(String(otro.title || "").split(/\s+/)[0])}! ${esc(me.nombre)} intercambió su turno con vos: ahora te toca el <b>${esc(larga(f1))}</b> (antes era el ${esc(larga(f2))}).`)}${p("Si no te queda bien, entrá a la página y cambialo de nuevo.")}`), await remitente()).catch(() => null);
        return json({ ok: true });
      }
      case "pedido": {
        const t = s(x.texto, 1000); if (t.length < 4) return json({ error: "Escribí el pedido." }, 400);
        const it = { _id: "p-" + Date.now().toString(36), title: s(x.de, 80) || me.nombre, texto: t, fecha: hoy, estado: "Activo", fuente: "Equipo", respondida: "", por: me.nombre };
        await guardar("IntPedidos", it); return json({ ok: true, item: it });
      }
      case "respondida": {
        const it = (await q("IntPedidos").eq("_id", s(x.id, 80)).limit(1).find()).items[0] as Record<string, unknown> | undefined;
        if (!it) return json({ error: "No existe." }, 404);
        const n = { ...it, estado: x.deshacer ? "Activo" : "Respondida", respondida: x.deshacer ? "" : hoy };
        await guardar("IntPedidos", n); return json({ ok: true });
      }
      case "tipoAyuno": {
        const it = (await q("IntAyuno").eq("_id", s(x.id, 120)).limit(1).find()).items[0] as Ayuno | undefined;
        if (!it || (it.voluntarioId !== yo && !me.admin)) return json({ error: "Ese día no es tuyo." }, 403);
        await guardar("IntAyuno", { ...it, tipo: TIPOS_AYUNO.some((t) => t.id === s(x.tipo)) ? s(x.tipo) : "" }); return json({ ok: true });
      }
      case "publicarAyuno": {
        if (!me.admin) return json({ error: "Lo publica la dirección." }, 403);
        const mes = /^\d{4}-\d{2}$/.test(s(x.mes)) ? s(x.mes) : DIA(hoy, 20).slice(0, 7);
        return json({ ok: true, resultado: await publicarAyuno(mes, s(x.meses) === "3" ? 3 : 1) });
      }
    }
    return json({ error: "op" }, 400);
  } catch (e) { console.error("oracion POST", e); return json({ error: "No pudimos guardar." }, 500); }
};
