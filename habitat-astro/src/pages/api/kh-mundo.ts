// Kids & Hero · Multijugador de Hero: la entrada (el «pase al mundo»), los reportes y las suspensiones.
// El servidor del mundo (Worker «tsp-mundo» de Cloudflare) no conoce cuentas: solo deja entrar a quien trae un pase
// firmado acá. El pase se firma con una clave propia (ECDSA P-256) que se crea sola la primera vez y queda en la
// colección KhClaves (solo administrador); la parte pública se publica en GET ?pub=1 para que el mundo verifique.
//
// POST (lo manda el juego; cabecera x-habitat-auth con el token del socio, que se confirma con Wix):
//   { k:'pase', perfil }                     → { pase, nombre } si: es socio de verdad, el perfil es suyo, es de Hero,
//                                               llegó al nivel mínimo (o es tester) y no está suspendido.
//   { k:'reporte', perfil, contra, motivo }  → guarda el reporte en KhDenuncias para que lo revise el equipo.
// GET  ?k=panel  (dirección y quienes ven las estadísticas del juego) → reportes y suspensiones.
// POST { k:'suspender', socio, dias, motivo } / { k:'levantar', socio } (dirección) → KhBan, y le avisa al mundo
//      con una orden firmada para que lo saque al instante.
import type { APIRoute } from "astro";
import { q, guardar, todos } from "../../lib/sem";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";

const rem = auth.elevate(items.remove);
const MUNDO = "https://tsp-mundo.galessandrodale-93.workers.dev";
const NIVEL_MIN = 5;
const MOTIVOS = ["Se comporta mal", "Molesta o persigue a otros", "Nombre o aspecto inapropiado", "Hace trampa"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-habitat-auth" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS } });
const ID = /^[a-zA-Z0-9-]{8,60}$/;
const s = (v: unknown, max = 80) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
const uno = async (col: string, id: string) => ((await q(col).eq("_id", id).limit(1).find()).items[0] || null) as Record<string, any> | null;
const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = (o: unknown) => b64u(new TextEncoder().encode(JSON.stringify(o)));

/* la clave de firma: se crea una sola vez y queda guardada */
let CLAVE: { priv: CryptoKey; pub: JsonWebKey } | null = null;
async function clave() {
  if (CLAVE) return CLAVE;
  let it = await uno("KhClaves", "mundo");
  if (!it || !it.priv) {
    const k = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const priv = await crypto.subtle.exportKey("jwk", k.privateKey), pub = await crypto.subtle.exportKey("jwk", k.publicKey);
    await guardar("KhClaves", { _id: "mundo", title: "Firma de los pases al multijugador", priv: JSON.stringify(priv), pub: JSON.stringify(pub) });
    it = await uno("KhClaves", "mundo"); /* si dos pedidos la crearon a la vez, queda una sola: la que se guardó */
  }
  const pj = JSON.parse(String(it!.priv)), pub = JSON.parse(String(it!.pub));
  CLAVE = { priv: await crypto.subtle.importKey("jwk", pj, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]), pub };
  return CLAVE;
}
async function firmar(o: Record<string, unknown>) {
  const c = await clave(), body = enc(o);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, c.priv, new TextEncoder().encode(body));
  return body + "." + b64u(sig);
}

/* quién es: el token del socio se confirma con Wix (no se cree lo que diga el juego) */
async function socioDe(request: Request) {
  const token = request.headers.get("x-habitat-auth");
  if (!token) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
  if (!mr.ok) return null;
  const m = ((await mr.json()).member || {}) as Record<string, any>;
  return m.id ? { id: String(m.id), email: String(m.loginEmail || "").toLowerCase() } : null;
}
async function direccion(email: string) {
  if (!email) return null;
  const t = (await q("TutTutores").eq("email", email).limit(1).find()).items[0] as { _id: string; title?: string; rol?: string } | undefined;
  if (!t) return null;
  if (t.rol === "director") return t;
  const c = (await q("TutConfig").eq("_id", "juegoStats").limit(1).find()).items[0] as { valor?: string } | undefined;
  const ids = c && c.valor ? String(c.valor).split(/[,\s]+/).filter(Boolean) : [];
  return ids.includes(String(t._id)) ? t : null;
}
async function suspendido(socio: string) {
  const b = await uno("KhBan", socio);
  if (!b) return null;
  if (b.hasta && b.hasta !== "siempre" && Date.parse(String(b.hasta)) < Date.now()) return null;
  return b;
}
/* orden firmada al mundo: sacar (o dejar volver) a un socio en todos los servidores */
async function ordenMundo(cmd: string, socio: string, hasta: string) {
  try { await fetch(MUNDO + "/orden", { method: "POST", body: await firmar({ cmd, m: socio, hasta, exp: Date.now() + 5 * 60e3 }) }); } catch { /* si el mundo no responde, igual el pase ya no se entrega */ }
}

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });

export const GET: APIRoute = async ({ request, url }) => {
  try {
    if (url.searchParams.get("pub") === "1") { const c = await clave(); return json({ pub: c.pub }); }
    if (url.searchParams.get("k") === "panel") {
      const yo = await socioDe(request), d = yo && (await direccion(yo.email));
      if (!d) return json({ error: "La moderación del multijugador la ve la dirección." }, 403);
      const R = (await todos<Record<string, any>>("KhDenuncias")).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 400);
      const B = (await todos<Record<string, any>>("KhBan")).filter((b) => b.hasta === "siempre" || Date.parse(String(b.hasta)) > Date.now());
      const por: Record<string, any> = {};
      for (const r of R) {
        const k = String(r.socio || r.perfil); const g = por[k] || (por[k] = { socio: r.socio, perfil: r.perfil, nombre: r.title, n: 0, sinVer: 0, motivos: {}, ultimo: r.fecha, quienes: [] as string[] });
        g.n++; if (!r.visto) g.sinVer++; g.motivos[r.motivo] = (g.motivos[r.motivo] || 0) + 1; if (g.quienes.length < 6 && !g.quienes.includes(r.porNom)) g.quienes.push(r.porNom);
      }
      return json({ me: { title: d.title }, reportados: Object.values(por).sort((a: any, b: any) => b.sinVer - a.sinVer || b.n - a.n), suspendidos: B.map((b) => ({ socio: b._id, nombre: b.title, hasta: b.hasta, motivo: b.motivo, por: b.por })), motivos: MOTIVOS });
    }
    return json({ error: "pedido" }, 400);
  } catch (e) {
    return json({ error: "servidor", d: String((e as Error).message || e).slice(0, 200) }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  let x: Record<string, any> = {};
  try { x = JSON.parse((await request.text()).slice(0, 4000)); } catch { return json({ error: "datos" }, 400); }
  try {
    const yo = await socioDe(request);
    if (!yo) return json({ error: "cuenta", msg: "Para entrar al multijugador hace falta iniciar sesión con tu cuenta." }, 401);
    const k = String(x.k || "");

    if (k === "pase") {
      const perfil = s(x.perfil, 60); if (!ID.test(perfil)) return json({ error: "perfil" }, 400);
      const pf = await uno("Perfiles", perfil);
      if (!pf || pf._owner !== yo.id) return json({ error: "perfil", msg: "Ese personaje no es de tu cuenta." }, 403);
      if (pf.rama !== "ados") return json({ error: "rama", msg: "El multijugador es de Hero." }, 403);
      const ban = await suspendido(yo.id);
      if (ban) return json({ error: "suspendido", hasta: ban.hasta, msg: ban.hasta === "siempre" ? "Tu cuenta no puede entrar al multijugador." : "Tu cuenta no puede entrar al multijugador hasta el " + new Date(String(ban.hasta)).toLocaleDateString("es-AR") + "." }, 403);
      const j = await uno("KhJugadores", perfil), nivel = Number((j && j.nivel) || 0), tester = !!(j && j.tester);
      if (!tester && nivel < NIVEL_MIN) return json({ error: "nivel", min: NIVEL_MIN, nivel, msg: "El multijugador se abre en el nivel " + NIVEL_MIN + ". ¡Seguí jugando en tu mundo y volvé!" }, 403);
      const nombre = s(pf.apodo, 16) || "Jugador";
      /* amigos del camino (los dos se aceptaron jugando juntos en una sala): solo con ellos hay voz en el multijugador */
      const [ra, rb] = await Promise.all([q("KhAmigos").eq("a", perfil).limit(60).find(), q("KhAmigos").eq("b", perfil).limit(60).find()]);
      const amigos = [...ra.items, ...rb.items].filter((it: any) => it.aOk && it.bOk).map((it: any) => (it.a === perfil ? it.b : it.a)).filter((id: string) => ID.test(id)).slice(0, 40);
      const pase = await firmar({ m: yo.id, p: perfil, n: nombre, lv: nivel, t: tester ? 1 : 0, a: amigos, exp: Date.now() + 15 * 60e3 });
      return json({ pase, nombre, motivos: MOTIVOS });
    }

    if (k === "reporte") {
      const perfil = s(x.perfil, 60), contra = s(x.contra, 60), motivo = MOTIVOS[Math.floor(Number(x.motivo))] || "";
      if (!ID.test(perfil) || !ID.test(contra) || !motivo || perfil === contra) return json({ error: "datos" }, 400);
      const pf = await uno("Perfiles", perfil); if (!pf || pf._owner !== yo.id) return json({ error: "perfil" }, 403);
      const po = await uno("Perfiles", contra); if (!po) return json({ error: "otro" }, 404);
      const id = (yo.id + "_" + contra + "_" + new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10)).slice(0, 120); /* uno por día por persona reportada */
      await guardar("KhDenuncias", { _id: id, title: s(po.apodo, 16) || "Jugador", socio: String(po._owner || ""), perfil: contra, por: yo.id, porNom: s(pf.apodo, 16), motivo, fecha: new Date().toISOString(), visto: false });
      return json({ ok: true });
    }

    if (k === "suspender" || k === "levantar" || k === "visto") {
      const d = await direccion(yo.email); if (!d) return json({ error: "permiso" }, 403);
      const socio = s(x.socio, 60); if (!ID.test(socio)) return json({ error: "datos" }, 400);
      if (k === "visto") {
        const R = (await todos<Record<string, any>>("KhDenuncias")).filter((r) => r.socio === socio && !r.visto);
        for (const r of R) await guardar("KhDenuncias", { ...r, visto: true });
        return json({ ok: true, n: R.length });
      }
      if (k === "levantar") { try { await rem("KhBan", socio); } catch { /* ya no estaba */ } await ordenMundo("levantar", socio, ""); return json({ ok: true }); }
      const dias = Math.floor(Number(x.dias)), hasta = dias > 0 ? new Date(Date.now() + Math.min(dias, 3650) * 864e5).toISOString() : "siempre";
      const R = (await todos<Record<string, any>>("KhDenuncias")).find((r) => r.socio === socio);
      await guardar("KhBan", { _id: socio, title: s(x.nombre, 16) || (R && R.title) || "Jugador", perfil: (R && R.perfil) || "", hasta, motivo: s(x.motivo, 200), por: String(d.title || "") });
      await ordenMundo("suspender", socio, hasta);
      return json({ ok: true, hasta });
    }
    return json({ error: "pedido" }, 400);
  } catch (e) {
    return json({ error: "servidor", d: String((e as Error).message || e).slice(0, 200) }, 500);
  }
};
