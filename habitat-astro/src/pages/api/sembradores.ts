// Panel Sembradores (solo directores): lista, testimonios, bienvenidas y el informe trimestral con aprobación.
// GET            → todo el panel
// GET ?ver=bienvenida|testimonio|trimestral&s=<id>[&t=<id>][&tri=YYYY-Tn] → HTML del mail tal como lo recibe esa persona
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import {
  FOCOS, TIPOS, TEXTO_TRIMESTRAL, q, todos, guardar, hoyAR, idDe, slug, trimestre,
  desdeFormulario, bienvenida, mandarTestimonio, borradorTrimestral, enviarTrimestral,
  htmlBienvenida, htmlTestimonio, htmlTrimestral,
  type Sembrador, type Testimonio, type Envio,
} from "../../lib/sem";

const rem = auth.elevate(items.remove);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max);
const n = (v: unknown) => { const x = Number(String(v ?? "").replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); return isFinite(x) ? Math.round(x) : 0; };
const b = (v: unknown) => v === true || v === "true" || v === 1;
const TRI = /^\d{4}-T[1-4]$/;

async function cfg() {
  const c = (await q("TutConfig").limit(80).find()).items as { _id: string; valor?: string }[];
  return Object.fromEntries(c.map((x) => [x._id, x.valor || ""])) as Record<string, string>;
}

type Me = { _id: string; title?: string; email?: string; rol?: string };
async function who(request: Request): Promise<Me | null> {
  const token = request.headers.get("x-habitat-auth");
  if (!token) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
  if (!mr.ok) return null;
  const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
  if (!email) return null;
  const t = (await q("TutTutores").eq("email", email).limit(1).find()).items[0] as Me | undefined;
  return t && t.rol === "director" ? t : null;
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "El panel de Sembradores es solo para la dirección." }, 403);
    const C = await cfg();
    const [ss, ts, es] = await Promise.all([todos<Sembrador>("SemSembradores"), todos<Testimonio>("SemTestimonios"), todos<Envio>("SemEnvios")]);
    const ver = url.searchParams.get("ver");
    if (ver) {
      const sid = url.searchParams.get("s") || "";
      const sem = ss.find((x) => x._id === sid) || { _id: "x", title: "Nombre Apellido", foco: url.searchParams.get("foco") || "General", tipo: "Mensual" };
      let html = "";
      if (ver === "bienvenida") html = htmlBienvenida(sem);
      else if (ver === "testimonio") { const t = ts.find((x) => x._id === url.searchParams.get("t")); if (!t) return json({ error: "testimonio" }, 404); html = htmlTestimonio(sem, t); }
      else {
        const tri = url.searchParams.get("tri") || trimestre(hoyAR());
        const e = es.find((x) => x._id === "tri|" + tri);
        const ids: string[] = (() => { try { return JSON.parse(url.searchParams.get("ts") || (e && e.testimonios) || "[]"); } catch { return []; } })();
        html = htmlTrimestral(sem, C.semTexto || TEXTO_TRIMESTRAL, ts.filter((t) => ids.includes(t._id)), tri);
      }
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    const clean = <T,>(L: T[]) => L.map((x) => { const { _createdDate, _updatedDate, _owner, ...y } = x as Record<string, unknown>; return y; });
    return json({ me: { title: me.title }, focos: FOCOS, tipos: TIPOS, texto: C.semTexto || TEXTO_TRIMESTRAL, trimestre: trimestre(hoyAR()), sembradores: clean(ss), testimonios: clean(ts), envios: clean(es) });
  } catch (e) {
    console.error("sembradores GET", e);
    return json({ error: "No pudimos cargar el panel." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "El panel de Sembradores es solo para la dirección." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const C = await cfg(), remitente = C.remitente || "galessandrodale.93@gmail.com", por = me.title || me.email || "";
    switch (x.op) {
      case "sembrador": {
        const id = s(x.id, 90);
        if (x.borrar) { await rem("SemSembradores", id); return json({ ok: true }); }
        const nombre = s(x.title, 120), email = s(x.email, 160).toLowerCase();
        if (!nombre) return json({ error: "Poné el nombre." }, 400);
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Revisá el email." }, 400);
        const prev = id ? ((await q("SemSembradores").eq("_id", id).limit(1).find()).items[0] as Sembrador | undefined) : undefined;
        const it: Sembrador = {
          _id: id || idDe(email, nombre), title: nombre, email, telefono: s(x.telefono, 40),
          foco: FOCOS.includes(s(x.foco)) ? s(x.foco) : "General", tipo: TIPOS.includes(s(x.tipo)) ? s(x.tipo) : "Interesado",
          monto: n(x.monto), origen: prev ? prev.origen : "Manual", activo: x.activo === undefined ? true : b(x.activo),
          alta: (prev && prev.alta) || hoyAR(), bienvenida: (prev && prev.bienvenida) || "", nota: s(x.nota, 1000),
        };
        await guardar("SemSembradores", it as Record<string, unknown>);
        // La bienvenida sale sola apenas hay email (o se puede postergar destildando "mandar ahora").
        let mail: unknown = null;
        if (x.bienvenidaYa !== false && it.email && !it.bienvenida && it.activo !== false) { mail = await bienvenida(it, remitente); if (mail && (mail as { ok: boolean }).ok) it.bienvenida = hoyAR(); }
        return json({ ok: true, item: it, mail });
      }
      case "bienvenida": {
        const it = (await q("SemSembradores").eq("_id", s(x.id, 90)).limit(1).find()).items[0] as Sembrador | undefined;
        if (!it || !it.email) return json({ error: "Falta el email." }, 400);
        const r = await bienvenida({ ...it, bienvenida: "" }, remitente);
        return json({ ok: !!r && r.ok, item: { ...it, bienvenida: r && r.ok ? hoyAR() : it.bienvenida } });
      }
      case "testimonio": {
        const id = s(x.id, 90);
        if (x.borrar) { await rem("SemTestimonios", id); return json({ ok: true }); }
        const alumno = s(x.title, 120);
        if (!alumno) return json({ error: "Poné el nombre del alumno." }, 400);
        const video = s(x.video, 500);
        if (video && !/^https:\/\//.test(video)) return json({ error: "El link del video tiene que empezar con https://" }, 400);
        const it: Testimonio = {
          _id: id || "t-" + slug(alumno) + "-" + Date.now().toString(36), title: alumno, alumnoId: s(x.alumnoId, 80), texto: s(x.texto, 2000), video,
          foco: FOCOS.includes(s(x.foco)) ? s(x.foco) : "General", becado: b(x.becado), permiso: b(x.permiso),
          estado: ["Pendiente", "Aprobado", "Archivado"].includes(s(x.estado)) ? s(x.estado) : "Pendiente", fecha: s(x.fecha, 10) || hoyAR(),
        };
        await guardar("SemTestimonios", it as Record<string, unknown>);
        return json({ ok: true, item: it });
      }
      case "mandarTestimonio": {
        const [sm, t] = await Promise.all([q("SemSembradores").eq("_id", s(x.s, 90)).limit(1).find(), q("SemTestimonios").eq("_id", s(x.t, 90)).limit(1).find()]);
        if (!sm.items[0] || !t.items[0]) return json({ error: "Elegí sembrador y testimonio." }, 400);
        const r = await mandarTestimonio(sm.items[0] as Sembrador, t.items[0] as Testimonio, remitente);
        return json({ ok: !!r && r.ok, ya: r === null });
      }
      case "texto": {
        const t = s(x.texto, 6000);
        if (t.length < 40) return json({ error: "El texto quedó muy corto." }, 400);
        await guardar("TutConfig", { _id: "semTexto", valor: t });
        return json({ ok: true, texto: t });
      }
      case "borrador": {
        const tri = s(x.tri, 7);
        if (!TRI.test(tri)) return json({ error: "tri" }, 400);
        const ids = Array.isArray(x.testimonios) ? (x.testimonios as unknown[]).map((v) => s(v, 90)).slice(0, 6) : [];
        const prev = (await q("SemEnvios").eq("_id", "tri|" + tri).limit(1).find()).items[0] as Envio | undefined;
        if (prev && prev.estado !== "borrador") return json({ error: "Ese informe ya salió." }, 400);
        if (!prev) await borradorTrimestral(tri, ids, remitente, false);
        const it = { ...(prev || { _id: "tri|" + tri, title: "Informe " + tri, tipo: "trimestral", estado: "borrador", fecha: hoyAR(), destinatarios: "[]", por: "" }), testimonios: JSON.stringify(ids) };
        await guardar("SemEnvios", it as Record<string, unknown>);
        return json({ ok: true, item: it });
      }
      case "aprobar": {
        const tri = s(x.tri, 7);
        if (!TRI.test(tri)) return json({ error: "tri" }, 400);
        const r = await enviarTrimestral(tri, por, remitente);
        return json({ ok: true, enviados: r.ok, fallas: r.fallas });
      }
      case "sync": {
        const f = await desdeFormulario();
        return json({ ok: true, ...f });
      }
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    console.error("sembradores POST", e);
    return json({ error: "No pudimos guardar el cambio." }, 500);
  }
};
