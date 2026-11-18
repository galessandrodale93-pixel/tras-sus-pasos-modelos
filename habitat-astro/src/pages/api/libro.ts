// Libro Asombro · pedidos.
// Público:  POST { op: "pedido", nombre, apellido, email, telefono, cantidad, entrega: "retiro"|"envio", dni, calle, numero, piso, depto, cp, localidad, provincia, referencia }
// Dirección y permiso «libro»:  GET ?admin=1  ·  POST { op: "estado" | "reenviar" | "borrar", id, ... }
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { emailDe, veLibro } from "../../lib/profe";
import { AVISOS_A, kmDe, viaDe, VIA, CANALES, ENVIO, ENVIO_CERCA, ESTADOS, PERFILES, PRECIO, PROVINCIAS, mailAviso, mailDespacho, mailPedido, mandar, marcarPagado, pesos, totalDe, type Pedido } from "../../lib/libro";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const rem = auth.elevate(items.remove);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const COL = "LibPedidos";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 200) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const clean = <T extends Record<string, unknown>>(x: T) => { const { _createdDate, _updatedDate, _owner, ...r } = x; return r; };
const ahoraAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
const hoyAR = () => ahoraAR().slice(0, 10);

async function remitente() {
  const r = (await q("TutConfig").eq("_id", "remitente").limit(1).find()).items[0] as { valor?: string } | undefined;
  return (r && r.valor) || "info@habitat-cfm.org";
}
async function todos(): Promise<Pedido[]> {
  const out: Pedido[] = [];
  let r = await q(COL).descending("_createdDate").limit(1000).find();
  out.push(...(r.items as Pedido[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as Pedido[])); }
  return out;
}

// quién es cada comprador: alumno, ex alumno, equipo, sembrador o externo (por email o nombre y apellido)
const nrm = (t: unknown) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const cel = (t: unknown) => String(t || "").replace(/\D/g, "").slice(-8);
type Gente = { _id: string; title?: string; email?: string; telefono?: string; activo?: unknown };
async function lista(col: string): Promise<Gente[]> { try { return (await q(col).limit(1000).find()).items as Gente[]; } catch { return []; } }
async function perfiles() {
  const [al, vol, tut, sem] = await Promise.all([lista("TutAlumnos"), lista("VolVoluntarios"), lista("TutTutores"), lista("SemSembradores")]);
  const G: [string, Gente[]][] = [["Alumno", al.filter((a) => a.activo !== false)], ["Ex alumno", al.filter((a) => a.activo === false)], ["Equipo Habitat", [...tut, ...vol]], ["Sembrador", sem]];
  return (x: Pedido) => {
    if (x.perfil && PERFILES.includes(x.perfil)) return x.perfil;
    const em = String(x.email || "").toLowerCase(), nm = nrm(x.title), tel = cel(x.telefono);
    const toks = nm.split(" ").filter((t) => t.length > 2);
    for (const [k, L] of G) if (L.some((g) => (em && String(g.email || "").toLowerCase().split(/[,;\s]+/).includes(em)) || (tel.length === 8 && cel(g.telefono) === tel) || (toks.length >= 2 && toks.every((t) => nrm(g.title).split(" ").includes(t))))) return k;
    return "Externo";
  };
}

// el pago de Mercado Pago confirmado a mano pasa a «Libros» en Finanzas (y deja de contar como cuota, si se había tomado así)
async function aLibros(ingId: string) {
  try {
    const I = (await q("FinIngresos").eq("_id", ingId).limit(1).find()).items[0] as Record<string, unknown> | undefined;
    if (!I) return;
    await save("FinIngresos", { ...clean(I), tipo: "Libros", alumnoId: "" });
    await rem("FinCobros", "mp-" + ingId).catch(() => null);
  } catch (e) { console.error("libro aLibros", e); }
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    if (url.searchParams.get("admin") !== "1") return json({ precio: PRECIO, envio: ENVIO, envioCerca: ENVIO_CERCA, provincias: PROVINCIAS, canales: CANALES });
    const me = await emailDe(request);
    if (!(await veLibro(me.email))) return json({ error: "Esto lo ve la dirección de Habitat." }, 403);
    const [P, perfilDe] = await Promise.all([todos(), perfiles()]);
    const L = P.map((x) => ({ ...clean(x as unknown as Record<string, unknown>), quien: perfilDe(x), manual: !!x.perfil }));
    return json({ hoy: hoyAR(), precio: PRECIO, envio: ENVIO, estados: ESTADOS, perfiles: PERFILES, canales: CANALES, pedidos: L });
  } catch (e) {
    console.error("libro GET", e);
    return json({ error: "No pudimos cargar los pedidos." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const op = s(x.op, 20);

    if (op === "pedido") {
      if (s(x.web)) return json({ ok: true }); // trampa para bots
      const envio = s(x.entrega) === "envio";
      const cant = Math.min(10, Math.max(1, Math.floor(Number(x.cantidad) || 1)));
      const it: Pedido = {
        _id: hoyAR() + "-" + crypto.randomUUID().slice(0, 8),
        nombre: s(x.nombre, 60), apellido: s(x.apellido, 60), email: s(x.email, 120).toLowerCase(), telefono: s(x.telefono, 30).replace(/[^\d+ ]/g, ""),
        dni: s(x.dni, 12).replace(/\D/g, ""), entrega: envio ? "envio" : "retiro",
        calle: envio ? s(x.calle, 80) : "", numero: envio ? s(x.numero, 10) : "", piso: envio ? s(x.piso, 6) : "", depto: envio ? s(x.depto, 6) : "",
        cp: envio ? s(x.cp, 8).toUpperCase() : "", localidad: envio ? s(x.localidad, 60) : "", provincia: envio ? s(x.provincia, 40) : "", referencia: envio ? s(x.referencia, 160) : "",
        cantidad: cant, total: totalDe(cant, envio), estado: "Nuevo", fecha: ahoraAR(), nota: s(x.nota, 300),
        canal: CANALES.includes(s(x.canal, 40)) ? s(x.canal, 40) : "", origen: "web", clave: crypto.randomUUID().replace(/-/g, "").slice(0, 20),
      };
      // la casa marcada en el mapa: con eso sugerimos cómo mandarlo (Uber cerca, Andreani lejos)
      { const la = Number(x.lat), lo = Number(x.lng); if (envio && isFinite(la) && isFinite(lo) && la < -21 && la > -56 && lo < -53 && lo > -74) { it.lat = Math.round(la * 1e5) / 1e5; it.lng = Math.round(lo * 1e5) / 1e5; it.km = kmDe(la, lo); } if (envio) it.via = viaDe(it); it.total = totalDe(cant, envio, it.via); }
      it.title = (it.nombre + " " + it.apellido).trim();
      const falta: string[] = [];
      if (!it.nombre) falta.push("nombre");
      if (!it.apellido) falta.push("apellido");
      if (!/^\S+@\S+\.\S+$/.test(it.email || "")) falta.push("un email válido");
      if ((it.telefono || "").replace(/\D/g, "").length < 8) falta.push("tu celular");
      if (envio) {
        if (!/^\d{7,9}$/.test(it.dni || "")) falta.push("DNI");
        if (!it.calle) falta.push("calle");
        if (!it.numero) falta.push("número");
        if (!/^[A-Z]?\d{4}[A-Z]{0,3}$/.test(it.cp || "")) falta.push("código postal");
        if (!it.localidad) falta.push("localidad");
        if (!PROVINCIAS.includes(it.provincia || "")) falta.push("provincia");
      }
      if (falta.length) return json({ error: "Falta completar: " + falta.join(", ") + "." }, 400);
      const rmt = await remitente();
      const r = await mandar(it.email as string, "Tu pedido del libro Asombro 📖", mailPedido(it), rmt);
      it.mail = r.ok ? ahoraAR() : "";
      await save(COL, it as unknown as Record<string, unknown>);
      await mandar(AVISOS_A, "Nuevo pedido del libro: " + it.title + (envio ? " (envío)" : " (retira)"), mailAviso(it), rmt).catch(() => null);
      return json({ ok: true, total: it.total, mail: r.ok, email: it.email, entrega: it.entrega, id: it._id, k: it.clave });
    }

    if (op === "comprobante" || op === "ver") {
      const P = (await q(COL).eq("_id", s(x.id, 60)).limit(1).find()).items[0] as Pedido | undefined;
      if (!P || !P.clave || s(x.k, 40) !== P.clave) return json({ error: "Este link no es válido. Escribinos por WhatsApp y lo vemos." }, 404);
      const pub = { nombre: P.nombre, total: P.total, entrega: P.entrega, estado: P.estado, comprobante: !!P.comprobante };
      if (op === "ver") return json({ ok: true, pedido: pub });
      if (P.estado !== "Nuevo") return json({ ok: true, pedido: pub, ya: true });
      if (typeof x.archivo !== "string") return json({ error: "Elegí la foto o el PDF del comprobante." }, 400);
      const mime = s(x.mime, 120) || "application/octet-stream", nombre = s(x.nombre, 160) || "comprobante";
      const bytes = Uint8Array.from(atob(String(x.archivo).replace(/^data:[^,]*,/, "")), (c) => c.charCodeAt(0));
      if (bytes.length > 8e6) return json({ error: "El archivo es muy pesado (máximo 8 MB). Probá con una captura de pantalla." }, 400);
      const g = await fetchAuth("https://www.wixapis.com/site-media/v1/files/generate-upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mimeType: mime, fileName: "libro-" + P._id + "-" + nombre }) });
      const gj = await g.json().catch(() => ({}));
      if (!g.ok || !gj.uploadUrl) { console.error("libro upload-url", g.status, JSON.stringify(gj).slice(0, 300)); return json({ error: "No pudimos preparar la subida. Probá de nuevo." }, 500); }
      const up = await fetch(gj.uploadUrl + (gj.uploadUrl.includes("?") ? "&" : "?") + "filename=" + encodeURIComponent(nombre), { method: "PUT", headers: { "Content-Type": mime }, body: bytes });
      const uj = await up.json().catch(() => ({}));
      const u = (uj && uj.file && uj.file.url) || "";
      if (!up.ok || !u) { console.error("libro upload", up.status, JSON.stringify(uj).slice(0, 300)); return json({ error: "No se pudo subir el archivo. Probá con una captura de pantalla." }, 500); }
      const it = clean(P as unknown as Record<string, unknown>) as unknown as Pedido;
      it.comprobante = u; it.compFecha = ahoraAR();
      await save(COL, it as unknown as Record<string, unknown>);
      const rmt = await remitente();
      await mandar(AVISOS_A, "Comprobante del libro: " + (it.title || "") + " (" + pesos(it.total || 0) + ")", `<div style="font-family:Arial;max-width:560px;margin:auto;color:#10251d"><p style="font:16px/1.6 Arial"><b>${(it.title || "").replace(/[<>&]/g, "")}</b> subió el comprobante de <b>${pesos(it.total || 0)}</b> por el libro Asombro.</p><p><a href="${u}" style="color:#b8904f">Ver comprobante</a></p><p><a href="https://www.habitat-cfm.org/libro-panel.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Revisarlo y marcar pagado</a></p></div>`, rmt).catch(() => null);
      return json({ ok: true, pedido: { ...pub, comprobante: true } });
    }

    const me = await emailDe(request);
    if (!(await veLibro(me.email))) return json({ error: "Esto lo maneja la dirección de Habitat." }, 403);
    if (op === "venta") {
      const cant = Math.min(50, Math.max(1, Math.floor(Number(x.cantidad) || 1)));
      const tot = x.total === "" || x.total == null ? NaN : Number(x.total);
      const it: Pedido = { _id: hoyAR() + "-" + crypto.randomUUID().slice(0, 8), nombre: s(x.nombre, 60), apellido: s(x.apellido, 60), email: s(x.email, 120).toLowerCase(), telefono: s(x.telefono, 30), entrega: "retiro", cantidad: cant, total: Number.isFinite(tot) && tot >= 0 ? Math.round(tot) : cant * PRECIO, estado: "Entregado", fecha: ahoraAR(), pagado: hoyAR(), origen: "mano", canal: CANALES.includes(s(x.canal, 40)) ? s(x.canal, 40) : "", perfil: PERFILES.includes(s(x.perfil, 30)) ? s(x.perfil, 30) : "", nota: s(x.nota, 300) };
      it.title = (it.nombre + " " + it.apellido).trim();
      if (!it.title) return json({ error: "Poné el nombre de quién lo compró." }, 400);
      await save(COL, it as unknown as Record<string, unknown>);
      const perfilDe = await perfiles();
      return json({ ok: true, item: { ...it, quien: perfilDe(it), manual: !!it.perfil } });
    }
    const id = s(x.id, 60);
    const cur = (await q(COL).eq("_id", id).limit(1).find()).items[0] as Pedido | undefined;
    if (!cur) return json({ error: "No encontramos ese pedido." }, 404);
    const it = clean(cur as unknown as Record<string, unknown>) as unknown as Pedido;

    if (op === "borrar") { await rem(COL, id); return json({ ok: true }); }
    if (op === "reenviar") {
      const r = await mandar(it.email as string, "Tu pedido del libro Asombro 📖", mailPedido(it), await remitente());
      if (!r.ok) return json({ error: "No se pudo mandar el mail." }, 502);
      it.mail = ahoraAR(); await save(COL, it as unknown as Record<string, unknown>);
      return json({ ok: true, item: it });
    }
    if (op === "estado") {
      const est = s(x.estado, 20), antes = it.estado;
      if (est && !ESTADOS.includes(est)) return json({ error: "estado" }, 400);
      if (est) it.estado = est;
      if (x.tracking !== undefined) it.tracking = s(x.tracking, 40);
      if (x.nota !== undefined) it.nota = s(x.nota, 300);
      if (x.dni !== undefined) it.dni = s(x.dni, 12).replace(/\D/g, "");
      if (x.perfil !== undefined) it.perfil = PERFILES.includes(s(x.perfil, 30)) ? s(x.perfil, 30) : "";
      if (x.canal !== undefined) it.canal = CANALES.includes(s(x.canal, 40)) ? s(x.canal, 40) : "";
      if (x.via !== undefined && VIA[s(x.via, 10)]) it.via = s(x.via, 10);
      if (est === "Pagado" && antes !== "Pagado") {
        let pid = "", quien = "";
        if (x.probable && it.probable) { [pid, quien] = it.probable.split("|"); }
        const y = await marcarPagado(it, { id: pid, quien, fecha: hoyAR() }, false);
        if (pid) await aLibros(pid);
        const perfilDe = await perfiles();
        return json({ ok: true, item: { ...clean(y as unknown as Record<string, unknown>), quien: perfilDe(y), manual: !!y.perfil }, aviso: !!y.email });
      }
      if (est === "Despachado" && !it.despachado) it.despachado = hoyAR();
      let aviso: boolean | null = null;
      if (est && est !== antes && it.email) {
        if (est === "Despachado" && it.entrega === "envio") aviso = (await mandar(it.email, "Tu libro Asombro ya está en camino 📦", mailDespacho(it), await remitente())).ok;
      }
      await save(COL, it as unknown as Record<string, unknown>);
      const perfilDe = await perfiles();
      return json({ ok: true, item: { ...it, quien: perfilDe(it), manual: !!it.perfil }, aviso });
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    console.error("libro POST", e);
    return json({ error: "No pudimos guardar el pedido. Probá de nuevo en un ratito." }, 500);
  }
};
