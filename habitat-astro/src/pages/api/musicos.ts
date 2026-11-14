// Zarza · músicos.
// Músico (link personal, sin cuenta):  GET ?k=<clave>  ·  POST { k, op: "yo", fecha, va, ensayadas, nota }
// Quien organiza (director o permiso org):  GET ?admin=1  ·  POST { op: "musico" | "borrarMusico" | "repertorio" | "avisar" | "zarza" }
import type { APIRoute } from "astro";
import { emailDe, organiza } from "../../lib/profe";
import { canciones, ensayadas, hoyAR, linkDe, llegada, mailBienvenida, mailRepertorio, mandar, proximas, q, rem, save, todos, HORA, type Cancion, type Ensayo, type Musico, type Zarza } from "../../lib/zarza";

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max);
const clean = <T extends Record<string, unknown>>(x: T) => { const { _createdDate, _updatedDate, _owner, ...r } = x; return r; };
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TONO = /^[A-G](#|b)?m?$/;

async function remitente() {
  const r = (await q("TutConfig").eq("_id", "remitente").limit(1).find()).items[0] as { valor?: string } | undefined;
  return (r && r.valor) || "galessandrodale.93@gmail.com";
}
async function porClave(k: string) {
  if (!/^[a-f0-9]{16,40}$/.test(k)) return undefined;
  const m = (await q("ZarMusicos").eq("clave", k).limit(1).find()).items[0] as Musico | undefined;
  return m && m.activo !== "no" ? m : undefined;
}
// el músico entra con su link personal o con su cuenta (Google o mail), por el email
async function musicoDe(request: Request, k: string) {
  if (k) return porClave(k);
  const me = await emailDe(request);
  if (!me.email) return undefined;
  const ms = (await q("ZarMusicos").contains("email", me.email).limit(5).find()).items as Musico[];
  return ms.find((m) => m.activo !== "no" && String(m.email || "").toLowerCase() === me.email);
}
const vistaZarza = (z: Zarza) => ({ fecha: z.fecha, title: z.title || "Zarza", hora: z.hora || HORA, llegada: llegada(z), lugar: z.lugar || "", nota: z.nota || "", canciones: canciones(z) });

export const GET: APIRoute = async ({ request, url }) => {
  try {
    if (url.searchParams.get("admin") === "1") {
      const me = await emailDe(request);
      if (!(await organiza(me.email))) return json({ error: "Esto lo ve quien organiza Habitat." }, 403);
      const zs = await proximas(new Date(Date.now() - 3 * 3600e3 - 14 * 864e5).toISOString().slice(0, 10));
      const [ms, ens] = await Promise.all([todos<Musico>("ZarMusicos"), zs.length ? q("ZarEnsayos").ge("fecha", zs[0].fecha).limit(1000).find().then((r) => r.items as Ensayo[]) : Promise.resolve([] as Ensayo[])]);
      return json({
        hoy: hoyAR(),
        musicos: ms.sort((a, b) => String(a.title).localeCompare(String(b.title))).map((m) => ({ ...clean(m as unknown as Record<string, unknown>), link: linkDe(m) })),
        zarzas: zs.map((z) => ({ ...vistaZarza(z), avisoRep: z.avisoRep || "" })),
        ensayos: ens.map((e) => ({ fecha: e.fecha, musicoId: e.musicoId, va: e.va || "", ensayadas: ensayadas(e), nota: e.nota || "" })),
      });
    }
    const m = await musicoDe(request, s(url.searchParams.get("k"), 60));
    if (!m) return json({ error: request.headers.get("x-habitat-auth") ? "Tu cuenta no figura como músico de la Zarza. Pedile a Agustina que te sume con este mail." : "Este link no es válido. Pedile uno nuevo a Agustina." }, 404);
    const zs = (await proximas()).slice(0, 3);
    const ens = zs.length ? ((await q("ZarEnsayos").eq("musicoId", m._id).ge("fecha", zs[0].fecha).limit(20).find()).items as Ensayo[]) : [];
    // quiénes van (sin datos de contacto)
    const todosEns = zs.length ? ((await q("ZarEnsayos").eq("fecha", zs[0].fecha).limit(500).find()).items as Ensayo[]) : [];
    const ms = (await todos<Musico>("ZarMusicos")).filter((x) => x.activo !== "no");
    const equipo = zs.length ? ms.map((x) => { const e = todosEns.find((y) => y.musicoId === x._id); return { nombre: String(x.title || "").split(/\s+/)[0], instrumento: x.instrumento || "", va: (e && e.va) || "", yo: x._id === m._id }; }) : [];
    return json({
      musico: { nombre: m.title, instrumento: m.instrumento || "" },
      zarzas: zs.map((z) => { const e = ens.find((x) => x.fecha === z.fecha); return { ...vistaZarza(z), va: (e && e.va) || "", ensayadas: ensayadas(e), nota: (e && e.nota) || "" }; }),
      equipo,
    });
  } catch (e) {
    console.error("musicos GET", e);
    return json({ error: "No pudimos cargar la Zarza." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const op = s(x.op, 30);
    if (op === "yo") {
      const m = await musicoDe(request, s(x.k, 60));
      if (!m) return json({ error: "No pudimos reconocerte como músico." }, 404);
      const f = s(x.fecha, 10);
      if (!DATE.test(f)) return json({ error: "fecha" }, 400);
      const z = (await q("VolEventos").eq("_id", "zarza|" + f).limit(1).find()).items[0] as Zarza | undefined;
      if (!z) return json({ error: "Esa Zarza ya no está en el calendario." }, 404);
      const ids = new Set(canciones(z).map((c) => c.id));
      const ens = Array.isArray(x.ensayadas) ? (x.ensayadas as unknown[]).map((v) => s(v, 20)).filter((v) => ids.has(v)) : [];
      const va = ["si", "no", "quizas"].includes(s(x.va, 10)) ? s(x.va, 10) : "";
      const it = { _id: f + "|" + m._id, title: m.title || "", fecha: f, musicoId: m._id, va, ensayadas: JSON.stringify([...new Set(ens)]), nota: s(x.nota, 300) };
      await save("ZarEnsayos", it);
      return json({ ok: true, va, ensayadas: [...new Set(ens)] });
    }
    // de acá para abajo: quien organiza
    const me = await emailDe(request);
    if (!(await organiza(me.email))) return json({ error: "Esto lo maneja quien organiza Habitat." }, 403);
    switch (op) {
      case "musico": {
        const id = s(x.id, 80);
        const cur = id ? ((await q("ZarMusicos").eq("_id", id).limit(1).find()).items[0] as Musico | undefined) : undefined;
        const it: Musico = { ...(cur ? (clean(cur as unknown as Record<string, unknown>) as unknown as Musico) : { _id: "" }), title: s(x.title, 100), email: s(x.email, 160).toLowerCase(), instrumento: s(x.instrumento, 60), telefono: s(x.telefono, 40), activo: x.activo === "no" ? "no" : "si", clave: (cur && cur.clave) || crypto.randomUUID().replace(/-/g, "") };
        if (!it.title) return json({ error: "Poné el nombre." }, 400);
        if (it.email && !/^\S+@\S+\.\S+$/.test(it.email)) return json({ error: "Revisá el email." }, 400);
        it._id = id || crypto.randomUUID();
        let bienvenida: unknown = null;
        if (it.email && it.activo !== "no" && (!cur || !cur.bienvenida || x.reenviar)) {
          const z = (await proximas())[0];
          const r = await mandar(it.email, "Bienvenido al equipo de músicos de la Zarza 🎶", mailBienvenida(it, z), await remitente());
          if (r.ok) it.bienvenida = hoyAR();
          bienvenida = r.ok;
        }
        await save("ZarMusicos", it as unknown as Record<string, unknown>);
        return json({ ok: true, item: { ...it, link: linkDe(it) }, bienvenida });
      }
      case "borrarMusico": { await rem("ZarMusicos", s(x.id, 80)); return json({ ok: true }); }
      case "repertorio": {
        const f = s(x.fecha, 10);
        const z = (await q("VolEventos").eq("_id", "zarza|" + f).limit(1).find()).items[0] as Zarza | undefined;
        if (!z) return json({ error: "No encontramos esa Zarza." }, 404);
        const L: Cancion[] = (Array.isArray(x.canciones) ? (x.canciones as Record<string, unknown>[]) : []).slice(0, 40).map((c) => ({ id: s(c.id, 20) || crypto.randomUUID().slice(0, 8), t: s(c.t, 120), tono: TONO.test(s(c.tono, 4)) ? s(c.tono, 4) : "", link: /^https?:\/\//.test(s(c.link, 400)) ? s(c.link, 400) : "", nota: s(c.nota, 200) })).filter((c) => c.t);
        const it = { ...clean(z as unknown as Record<string, unknown>), canciones: JSON.stringify(L) };
        if (x.llegada !== undefined) (it as Record<string, unknown>).llegada = /^\d{2}:\d{2}$/.test(s(x.llegada, 5)) ? s(x.llegada, 5) : "";
        await save("VolEventos", it);
        return json({ ok: true, zarza: vistaZarza(it as unknown as Zarza) });
      }
      case "avisar": {
        const f = s(x.fecha, 10);
        const z = (await q("VolEventos").eq("_id", "zarza|" + f).limit(1).find()).items[0] as Zarza | undefined;
        if (!z) return json({ error: "No encontramos esa Zarza." }, 404);
        if (!canciones(z).length) return json({ error: "Primero cargá las canciones." }, 400);
        const ms = (await todos<Musico>("ZarMusicos")).filter((m) => m.activo !== "no" && m.email);
        const rmt = await remitente();
        let ok = 0;
        for (const m of ms) { const r = await mandar(m.email as string, "Ya está el repertorio de la Zarza 🎶", mailRepertorio(m, z), rmt); if (r.ok) ok++; }
        await save("VolEventos", { ...clean(z as unknown as Record<string, unknown>), avisoRep: hoyAR() });
        return json({ ok: true, enviados: ok, de: ms.length });
      }
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    console.error("musicos POST", e);
    return json({ error: "No pudimos guardar el cambio." }, 500);
  }
};
