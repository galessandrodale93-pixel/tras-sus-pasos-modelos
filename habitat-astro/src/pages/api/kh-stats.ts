// Estadísticas del juego Kids & Hero.
// POST (lo manda el juego, otro dominio: CORS abierto; viene como text/plain para no pedir permiso previo)
//      → guarda o actualiza la fila de esa sesión en KhStats. No llegan nombres ni mails: el jugador es un id de cuenta o de aparato.
// GET  ?dias=7|30|90|0 [&tester=1] → los indicadores ya calculados. Solo directores y quienes estén en TutConfig «juegoStats»
//      (ids de TutTutores separados por coma; si no existe, Cristian Castriota).
import type { APIRoute } from "astro";
import { q, guardar, todos } from "../../lib/sem";

const COL = "KhStats";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const json = (b: unknown, status = 200, cors = false) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(cors ? CORS : {}) } });
const s = (v: unknown, max = 80) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
const n = (v: unknown, max = 1e7) => { const x = Number(v); return isFinite(x) ? Math.max(0, Math.min(max, Math.round(x * 100) / 100)) : 0; };
const arr = (v: unknown, k = 40, len = 60) => (Array.isArray(v) ? v.slice(0, k).map((x) => s(x, len)).filter(Boolean) : []);
const ISO = (v: unknown) => { const t = s(v, 30); return /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(t) ? t : ""; };
const DEF_ACCESO = ["cristian-castriota"];

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request }) => {
  let x: Record<string, unknown> = {};
  try { x = JSON.parse((await request.text()).slice(0, 20000)); } catch { return json({ error: "datos" }, 400, true); }
  const sid = s(x.sid, 40);
  if (!/^s[a-z0-9]{8,30}$/.test(sid)) return json({ error: "sesion" }, 400, true);
  const inicio = ISO(x.inicio), fin = ISO(x.fin);
  if (!inicio || !fin) return json({ error: "fechas" }, 400, true);
  const ar = new Date(Date.parse(inicio) - 3 * 3600e3);
  const juegos: Record<string, number> = {};
  if (x.juegos && typeof x.juegos === "object") Object.entries(x.juegos as Record<string, unknown>).slice(0, 30).forEach(([k, v]) => { const kk = s(k, 60); if (kk) juegos[kk] = n(v, 999); });
  const it = {
    _id: sid, title: s(x.u, 60), cuenta: x.cuenta === true, perfil: s(x.perfil, 60), rama: x.rama === "hero" ? "hero" : "kids",
    inicio, fin, fecha: ar.toISOString().slice(0, 10), hora: ar.getUTCHours(), dia: ar.getUTCDay(), minutos: Math.round(n(x.seg, 86400) / 6) / 10,
    disp: s(x.disp, 12), so: s(x.so, 12), calidad: s(x.calidad, 30), fps: n(x.fps, 240),
    modelo: s(x.modelo, 50), soVer: s(x.soVer, 24), nav: s(x.nav, 24), placa: s(x.placa, 60), mem: n(x.mem, 64), nucleos: n(x.nucleos, 64), pantalla: s(x.pantalla, 24), cortes: n(x.cortes, 99), corteAntes: x.corteAntes === true,
    etapaIni: s(x.etapaIni, 30), lugarIni: s(x.lugarIni, 60), etapa: s(x.etapa, 30), etapaMax: s(x.etapaMax, 30),
    lugares: JSON.stringify(arr(x.lugares)), misiones: JSON.stringify(arr(x.misiones, 40, 70)), examenes: JSON.stringify(arr(x.examenes, 12, 30)), juegos: JSON.stringify(juegos),
    lore: n(x.lore, 999), sellos: n(x.sellos, 999), sala: x.sala === true, amigos: n(x.amigos, 50), nivelIni: n(x.nivelIni, 200), nivelFin: n(x.nivelFin, 200), horas: n(x.horas, 5000),
    pase: ["activo", "cerrado", "libre"].includes(String(x.pase)) ? String(x.pase) : "libre", cierre: x.cierre === true, cierreAt: ISO(x.cierreAt), pagoAt: ISO(x.pagoAt), cierreVeces: n(x.cierreVeces, 9999),
    nuevo: x.nuevo === true, tester: x.tester === true,
    zonas: JSON.stringify((Array.isArray(x.zonas) ? x.zonas : []).slice(0, 12).map((o: any) => ({ z: s(o && o.z, 60), fps: n(o && o.fps, 240), n: n(o && o.n, 99999), lento: n(o && o.lento, 100) })).filter((o) => o.z && o.n)),
  };
  try { await guardar(COL, it); return json({ ok: true }, 200, true); }
  catch (e) { console.error("kh-stats guardar", e); return json({ error: "guardar" }, 500, true); }
};

type Fila = { zonas?: string; _id: string; title?: string; cuenta?: boolean; perfil?: string; rama?: string; inicio?: string; fin?: string; fecha?: string; hora?: number; dia?: number; minutos?: number; disp?: string; so?: string; calidad?: string; fps?: number; modelo?: string; soVer?: string; nav?: string; placa?: string; mem?: number; nucleos?: number; pantalla?: string; cortes?: number; corteAntes?: boolean; etapaIni?: string; lugarIni?: string; etapa?: string; etapaMax?: string; lugares?: string; misiones?: string; examenes?: string; juegos?: string; lore?: number; sellos?: number; sala?: boolean; amigos?: number; nivelIni?: number; nivelFin?: number; horas?: number; pase?: string; cierre?: boolean; cierreAt?: string; pagoAt?: string; cierreVeces?: number; nuevo?: boolean; tester?: boolean };

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
  const c = (await q("TutConfig").eq("_id", "juegoStats").limit(1).find()).items[0] as { valor?: string } | undefined;
  const ids = c && c.valor ? String(c.valor).split(/[,\s]+/).filter(Boolean) : DEF_ACCESO;
  return ids.includes(String(t._id)) ? t : null;
}

const ETAPAS = ["Nacimiento", "Infancia", "Bautismo", "Galilea", "Milagros", "Parábolas", "Jerusalén", "La cruz", "Resurrección"];
const J = <T>(t: string | undefined, d: T): T => { try { return t ? (JSON.parse(t) as T) : d; } catch { return d; } };
const top = (m: Record<string, number>, k = 12) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, k);
const inc = (m: Record<string, number>, k: string, v = 1) => { if (k) m[k] = (m[k] || 0) + v; };
const med = (L: number[]) => { if (!L.length) return 0; const a = L.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
const r1 = (v: number) => Math.round(v * 10) / 10;

function calcular(F: Fila[]) {
  const ses = F.filter((f) => (f.minutos || 0) >= .3);
  const jug: Record<string, Fila[]> = {};
  ses.forEach((f) => (jug[f.title || "?"] = jug[f.title || "?"] || []).push(f));
  const J1 = Object.values(jug).map((L) => L.sort((a, b) => String(a.inicio).localeCompare(String(b.inicio))));
  const min = ses.map((f) => f.minutos || 0), totMin = min.reduce((a, b) => a + b, 0);
  const horas = new Array(24).fill(0), dias = new Array(7).fill(0), porFecha: Record<string, { s: number; j: Set<string> }> = {};
  const lug: Record<string, number> = {}, mis: Record<string, number> = {}, jue: Record<string, number> = {}, exa: Record<string, number> = {};
  const arr0: Record<string, number> = {}, lug0: Record<string, number> = {}, disp: Record<string, number> = {}, so: Record<string, number> = {}, cal: Record<string, number> = {};
  const fpsD: Record<string, number[]> = {};
  const zon: Record<string, { s: number; n: number; lento: number; ses: number; cel: number }> = {}; // cuadros por zona del mapa, sumando todas las sesiones
  let sala = 0, amigosMax = 0, hero = 0;
  // cada aparato: cuántas sesiones, cómo le anda y si se corta (la placa se reinició o la sesión anterior terminó sin cerrarse)
  type Ap = { ses: number; jug: Set<string>; fps: number[]; cortes: number; caidas: number; so: string; nav: string; placa: string; mem: number; disp: string };
  const apar: Record<string, Ap> = {};
  ses.forEach((f) => {
    horas[f.hora || 0] += f.minutos || 0; dias[f.dia || 0] += f.minutos || 0;
    const pf = (porFecha[f.fecha || ""] = porFecha[f.fecha || ""] || { s: 0, j: new Set() }); pf.s++; pf.j.add(f.title || "?");
    J<string[]>(f.lugares, []).forEach((x) => inc(lug, x)); J<string[]>(f.misiones, []).forEach((x) => inc(mis, x)); J<string[]>(f.examenes, []).forEach((x) => inc(exa, x));
    Object.entries(J<Record<string, number>>(f.juegos, {})).forEach(([k, v]) => inc(jue, k, v || 1));
    inc(disp, f.disp || "?"); inc(so, f.so || "?"); inc(cal, (f.calidad || "?").replace(/^Auto · /, ""));
    if (f.fps) (fpsD[f.disp || "?"] = fpsD[f.disp || "?"] || []).push(f.fps);
    J<{ z: string; fps: number; n: number; lento: number }[]>(f.zonas, []).forEach((o) => { const e = (zon[o.z] = zon[o.z] || { s: 0, n: 0, lento: 0, ses: 0, cel: 0 }); e.s += o.fps * o.n; e.n += o.n; e.lento += o.lento * o.n / 100; e.ses++; if (f.disp === "celular") e.cel++; });
    { const k = f.modelo || (f.disp === "pc" ? "Computadora" : "Celular") + " sin modelo"; const a = (apar[k] = apar[k] || { ses: 0, jug: new Set(), fps: [], cortes: 0, caidas: 0, so: "", nav: "", placa: "", mem: 0, disp: f.disp || "" });
      a.ses++; a.jug.add(f.title || "?"); if (f.fps) a.fps.push(f.fps); a.cortes += f.cortes || 0; if (f.corteAntes) a.caidas++; a.so = f.soVer || a.so || f.so || ""; a.nav = f.nav || a.nav; a.placa = f.placa || a.placa; a.mem = f.mem || a.mem; }
    if (f.sala) sala++; amigosMax = Math.max(amigosMax, f.amigos || 0); if (f.rama === "hero") hero++;
  });
  // por dónde arrancan: la primera sesión de cada jugador
  J1.forEach((L) => { const a = L[0]; inc(arr0, a.etapaIni || "?"); inc(lug0, a.lugarIni || "Todavía en el camino"); });
  // progresión y retorno, por jugador
  const etapaN = (e?: string) => Math.max(0, ETAPAS.indexOf(e || ""));
  const embudo = ETAPAS.map((e, i) => [e, J1.filter((L) => Math.max(...L.map((f) => etapaN(f.etapaMax))) >= i).length] as [string, number]);
  const niveles: Record<string, number> = {}, horasJ: number[] = [], diasDist: number[] = [];
  J1.forEach((L) => { const lv = Math.max(...L.map((f) => f.nivelFin || 1)); inc(niveles, lv >= 20 ? "20+" : lv >= 10 ? "10-19" : lv >= 5 ? "5-9" : String(lv)); horasJ.push(Math.max(...L.map((f) => f.horas || 0))); diasDist.push(new Set(L.map((f) => f.fecha)).size); });
  // el cierre del pase: cuántos llegan, cuántos pagan, cuánto tardan y cuántos dejan de volver
  const cierre = J1.map((L) => { const c = L.map((f) => f.cierreAt).filter(Boolean).sort()[0] || ""; const pg = L.map((f) => f.pagoAt).filter(Boolean).sort()[0] || ""; const vistas = Math.max(...L.map((f) => f.cierreVeces || 0)); const ult = L.map((f) => f.fin || "").sort().pop() || ""; return { c, pg, vistas, ult }; }).filter((x) => x.c);
  const pagos = cierre.filter((x) => x.pg), demoras = pagos.map((x) => (Date.parse(x.pg) - Date.parse(x.c)) / 36e5).filter((h) => h >= 0);
  const ahora = Date.now(), sinVolver = cierre.filter((x) => !x.pg && ahora - Date.parse(x.ult) > 7 * 864e5).length, esperando = cierre.filter((x) => !x.pg && ahora - Date.parse(x.ult) <= 7 * 864e5).length;
  const fechas = Object.keys(porFecha).sort().slice(-60).map((d) => [d, porFecha[d].s, porFecha[d].j.size]);
  return {
    resumen: { jugadores: J1.length, conCuenta: J1.filter((L) => L.some((f) => f.cuenta)).length, sesiones: ses.length, horas: r1(totMin / 60), minProm: r1(ses.length ? totMin / ses.length : 0), minMed: r1(med(min)),
      sesPorJugador: r1(J1.length ? ses.length / J1.length : 0), hero, kids: ses.length - hero, conAmigos: sala, amigosMax, vuelven: diasDist.filter((d) => d >= 2).length, diasProm: r1(diasDist.length ? diasDist.reduce((a, b) => a + b, 0) / diasDist.length : 0), horasJugadorMed: r1(med(horasJ)) },
    horas: horas.map(r1), dias: dias.map(r1), fechas,
    arranque: { etapa: top(arr0, 9), lugar: top(lug0, 8) }, lugares: top(lug, 15), misiones: top(mis, 15), juegos: top(jue, 12), examenes: top(exa, 9),
    embudo, niveles: top(niveles, 10),
    pase: { llegaron: cierre.length, pagaron: pagos.length, horasHastaPagarMed: r1(med(demoras)), pagaronEn24h: demoras.filter((h) => h <= 24).length, dejaron: sinVolver, esperando, vistasProm: r1(cierre.length ? cierre.reduce((a, x) => a + x.vistas, 0) / cierre.length : 0) },
    modelos: Object.entries(apar).sort((a, b) => b[1].ses - a[1].ses).slice(0, 40).map(([k, a]) => ({ modelo: k, disp: a.disp, ses: a.ses, jugadores: a.jug.size, fps: Math.round(med(a.fps)), cortes: a.cortes, caidas: a.caidas, so: a.so, nav: a.nav, placa: a.placa, mem: a.mem })),
    zonas: Object.entries(zon).filter(([, e]) => e.n >= 10).map(([z, e]) => ({ z, fps: Math.round(e.s / e.n), lento: Math.round(e.lento / e.n * 100), ses: e.ses, cel: e.cel })).sort((a, b) => a.fps - b.fps).slice(0, 15),
    aparatos: { disp: top(disp, 4), so: top(so, 6), calidad: top(cal, 6), fps: Object.fromEntries(Object.entries(fpsD).map(([k, L]) => [k, Math.round(med(L))])) },
  };
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const me = await acceso(request);
    if (!me) return json({ error: "Las estadísticas del juego las ve la dirección." }, 403);
    const dias = Math.max(0, Math.min(3650, Number(url.searchParams.get("dias") || 30) || 0)), conTester = url.searchParams.get("tester") === "1";
    const desde = dias ? new Date(Date.now() - 3 * 3600e3 - dias * 864e5).toISOString().slice(0, 10) : "";
    const F = (await todos<Fila>(COL)).filter((f) => (conTester || !f.tester) && (!desde || String(f.fecha || "") >= desde));
    return json({ me: { title: me.title }, periodo: dias, conTester, actualizado: new Date().toISOString(), ...calcular(F) });
  } catch (e) {
    console.error("kh-stats GET", e);
    return json({ error: "No pudimos cargar las estadísticas." }, 500);
  }
};
