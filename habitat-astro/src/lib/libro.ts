// Libro Asombro: pedidos desde libro.html, mail con el costo y la transferencia, y datos listos para Andreani.
import { mandar as mandar0, marco as marco0, p, q, save } from "./sem";
import { esc } from "./vol";

export const WEB = "https://www.habitat-cfm.org";
export const PRECIO = 22000;
export const ENVIO = 11000; // Andreani (más lejos)
export const ENVIO_CERCA = 10000; // repartidor de Uber (CABA y alrededores)
export const ALIAS = "habitatcfm";
export const WA = "5491171637995";
const marco = (k: string, t: string, c: string) => marco0(k, t, c, `<a href="${WEB}/libro.html" style="color:#b8904f">habitat-cfm.org/libro</a>`);
export const mandar = (to: string, asunto: string, html: string, remitente: string) => mandar0(to, asunto, html, remitente, "Habitat CFM · Libro Asombro");

export type Pedido = {
  _id: string; title?: string; nombre?: string; apellido?: string; email?: string; telefono?: string; dni?: string;
  entrega?: string; calle?: string; numero?: string; piso?: string; depto?: string; cp?: string; localidad?: string; provincia?: string; referencia?: string;
  cantidad?: number; total?: number; estado?: string; fecha?: string; pagado?: string; tracking?: string; despachado?: string; nota?: string; mail?: string;
  canal?: string; perfil?: string; origen?: string; clave?: string; pagoId?: string; pagoDe?: string; probable?: string; comprobante?: string; compFecha?: string;
  lat?: number; lng?: number; km?: number; via?: string;
};
/* Cómo lo mandamos (lo decide el equipo, el comprador solo marca su casa en el mapa): en CABA y alrededores, con un repartidor de Uber; más lejos, por Andreani. */
export const HAB = { lat: -34.6332, lng: -58.5037 }; // Av. Juan Bautista Justo 8177, CABA
export const RADIO_UBER = 25; // km en línea recta desde Habitat
export const kmDe = (lat: number, lng: number) => { const R = 6371, r = Math.PI / 180, dLa = (lat - HAB.lat) * r, dLo = (lng - HAB.lng) * r, a = Math.sin(dLa / 2) ** 2 + Math.cos(HAB.lat * r) * Math.cos(lat * r) * Math.sin(dLo / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10; };
export const viaDe = (x: Pedido) => (x.km != null && isFinite(x.km) ? (x.km <= RADIO_UBER ? "uber" : "andreani") : x.provincia === "CABA" ? "uber" : "andreani");
export const VIA: Record<string, string> = { uber: "Uber", andreani: "Andreani" };
export const CANALES = ["Soy alumno de Habitat", "Instagram / redes", "Me lo recomendaron", "En mi iglesia o un evento", "Otro"];
export const PERFILES = ["Alumno", "Ex alumno", "Equipo Habitat", "Sembrador", "Externo"];
export const ESTADOS = ["Nuevo", "Pagado", "Despachado", "Entregado", "Cancelado"];
export const PROVINCIAS = ["CABA", "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"];

export const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
export const envioDe = (via?: string) => (via === "uber" ? ENVIO_CERCA : ENVIO);
export const totalDe = (cant: number, envio: boolean, via?: string) => cant * PRECIO + (envio ? envioDe(via) : 0);
export const domicilio = (x: Pedido) => [[x.calle, x.numero].filter(Boolean).join(" "), x.piso ? "piso " + x.piso : "", x.depto ? "depto " + x.depto : ""].filter(Boolean).join(", ") + (x.localidad || x.provincia ? " · " + [x.localidad, x.provincia].filter(Boolean).join(", ") : "") + (x.cp ? " (CP " + x.cp + ")" : "");

const nom = (x: Pedido) => esc(String(x.nombre || x.title || "").split(/\s+/)[0]);
const caja = (t: string) => `<div style="background:#fff;border:1px solid #e6dccb;border-radius:14px;padding:14px 16px;margin:0 0 14px;font:15px/1.7 Arial">${t}</div>`;

export function mailPedido(x: Pedido) {
  const envio = x.entrega === "envio", cant = x.cantidad || 1;
  const det = `${cant} ${cant === 1 ? "ejemplar" : "ejemplares"} de <b>Asombro</b> × ${pesos(PRECIO)}${envio ? `<br>Envío a domicilio${(x.via || viaDe(x)) === "uber" ? " (CABA y alrededores)" : " (Andreani)"}: ${pesos(envioDe(x.via || viaDe(x)))}` : `<br>Retiro en Habitat: sin costo de envío`}<br><b style="font-size:18px">Total: ${pesos(x.total || totalDe(cant, envio, x.via || viaDe(x)))}</b>`;
  return marco("Habitat · Libro Asombro", "¡Gracias por tu pedido! 📖", [
    p(`Hola ${nom(x)}! Recibimos tu pedido del libro <i>Asombro</i>. Te dejamos el detalle y cómo pagarlo.`),
    caja(det),
    p(`<b>Cómo pagar:</b> transferí <b>${pesos(x.total || 0)}</b> al alias <b style="font-size:18px">${ALIAS}</b> (Mercado Pago). Cuando nos llega la transferencia te avisamos por mail.`),
    x.clave ? `<p style="margin:18px 0"><a href="${linkComprobante(x)}" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Subir el comprobante</a></p>` : "",
    p(`Si preferís, mandanos el comprobante respondiendo este mail o por <a href="https://wa.me/${WA}" style="color:#b8904f">WhatsApp</a>.`),
    envio
      ? p(`<b>Envío:</b> apenas se acredite el pago te lo mandamos a <b>${esc(domicilio(x))}</b> y te avisamos por mail cuando salga.`)
      : p(`<b>Retiro:</b> lo podés retirar en Habitat, Av. Juan Bautista Justo 8177, CABA. Te avisamos cuando esté listo.`),
    p("Que estas páginas te lleven a mirar a Jesús hasta quedar rendido ante Su belleza 🙌🏽"),
  ].join(""));
}
export function mailDespacho(x: Pedido) {
  return marco("Habitat · Libro Asombro", "Tu libro ya está en camino 📦", [
    (x.via || viaDe(x)) === "uber"
      ? p(`Hola ${nom(x)}! Tu ejemplar de <i>Asombro</i> ya salió con un repartidor hacia ${esc(domicilio(x))}. Te llega en el transcurso del día.`)
      : p(`Hola ${nom(x)}! Despachamos tu ejemplar de <i>Asombro</i> por Andreani a ${esc(domicilio(x))}.`),
    (x.via || viaDe(x)) !== "uber" && x.tracking ? caja(`Número de seguimiento: <b style="font-size:18px">${esc(x.tracking)}</b><br>Lo podés seguir en <a href="https://www.andreani.com/" style="color:#b8904f">andreani.com</a> → «Seguí tu envío».`) : "",
    p("¡Que lo disfrutes!"),
  ].join(""));
}
export function mailListo(x: Pedido) {
  return marco("Habitat · Libro Asombro", "Tu libro te espera en Habitat 📖", p(`Hola ${nom(x)}! Ya recibimos tu pago. Tu ejemplar de <i>Asombro</i> está listo para retirar en Habitat, Av. Juan Bautista Justo 8177, CABA.`));
}
export function mailAviso(x: Pedido) {
  const envio = x.entrega === "envio";
  return marco("Libro Asombro · nuevo pedido", `${esc(x.title || "")} pidió ${x.cantidad || 1} ${(x.cantidad || 1) === 1 ? "libro" : "libros"}`, [
    caja(`<b>${esc(x.title || "")}</b><br>${esc(x.email || "")} · ${esc(x.telefono || "")}${x.dni ? "<br>DNI " + esc(x.dni) : ""}<br>${envio ? "Envío a " + esc(domicilio(x)) + "<br>Sugerido: <b>" + (VIA[x.via || viaDe(x)] || "") + "</b>" + (x.km != null ? " (" + String(x.km).replace(".", ",") + " km de Habitat)" : "") : "Retira en Habitat"}<br><b>Total ${pesos(x.total || 0)}</b>`),
    p(envio ? "Los datos para el envío están listos en el panel." : "Cuando pague, marcalo como pagado en el panel y le avisamos que lo puede retirar."),
    `<p style="margin:18px 0"><a href="${WEB}/libro-panel.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir pedidos del libro</a></p>`,
  ].join(""));
}

// ---------- pagos ----------
export const linkComprobante = (x: Pedido) => WEB + "/libro.html?p=" + encodeURIComponent(x._id) + "&k=" + encodeURIComponent(x.clave || "") + "#comprobante";
const nrm = (t: unknown) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const limpio = (x: Record<string, unknown>) => { const { _createdDate, _updatedDate, _owner, ...r } = x; return r; };
async function remitente() {
  const r = (await q("TutConfig").eq("_id", "remitente").limit(1).find()).items[0] as { valor?: string } | undefined;
  return (r && r.valor) || "galessandrodale.93@gmail.com";
}
export function mailPagoOk(x: Pedido) {
  const envio = x.entrega === "envio";
  return marco("Habitat · Libro Asombro", "¡Recibimos tu pago! 🙌🏽", [
    p(`Hola ${nom(x)}! Ya nos llegó tu transferencia de <b>${pesos(x.total || 0)}</b> por el libro <i>Asombro</i>. ¡Gracias!`),
    envio ? p(`Lo despachamos por Andreani a <b>${esc(domicilio(x))}</b> y te mandamos el número de seguimiento apenas salga.${x.dni ? "" : " Si todavía no nos pasaste tu <b>DNI</b>, respondé este mail con él: lo pide Andreani."}`)
          : p("Tu ejemplar ya está listo para retirar en Habitat, Av. Juan Bautista Justo 8177, CABA."),
  ].join(""));
}
const mailNos = (titulo: string, cuerpo: string) => marco("Libro Asombro · pagos", titulo, cuerpo + `<p style="margin:18px 0"><a href="${WEB}/libro-panel.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir pedidos del libro</a></p>`);

// Marca un pedido como pagado: avisa al comprador y a Habitat.
export async function marcarPagado(x: Pedido, de: { id?: string; quien?: string; fecha?: string }, avisarNos = true) {
  const it = limpio(x as unknown as Record<string, unknown>) as unknown as Pedido;
  it.estado = "Pagado"; it.pagado = de.fecha || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); it.pagoId = de.id || ""; it.pagoDe = de.quien || ""; it.probable = "";
  await save("LibPedidos", it as unknown as Record<string, unknown>);
  const rmt = await remitente();
  if (it.email) await mandar(it.email, it.entrega === "envio" ? "Recibimos tu pago del libro Asombro 📦" : "Tu libro Asombro te espera en Habitat 📖", mailPagoOk(it), rmt).catch(() => null);
  if (avisarNos) await mandar(rmt, "Pagó el libro: " + (it.title || "") + " (" + pesos(it.total || 0) + ")", mailNos(`${esc(it.title || "")} pagó el libro`, p(`Entró por Mercado Pago una transferencia de <b>${pesos(it.total || 0)}</b>${de.quien ? " de " + esc(de.quien) : ""} y la marcamos sola como pagada. Ya le avisamos por mail.`) + p(it.entrega === "envio" ? `Queda para despachar por Andreani${it.dni ? "" : " (todavía falta su DNI)"}.` : "Lo retira en Habitat.")), rmt).catch(() => null);
  return it;
}

// Cada pago nuevo de Mercado Pago (transferencias al alias habitatcfm) se cruza con los pedidos del libro sin pagar.
// Coincide el monto y el mail o el nombre: se marca solo. Si solo coincide el monto con un único pedido: avisamos para confirmar.
type Ing = { _id: string; title?: string; email?: string; monto: number; fecha: string; tipo: string };
export async function libroDesdeIngreso(it: Ing) {
  if (!it || !(it.monto > 0) || !/Por clasificar|Libros|Cuota de alumno/.test(it.tipo)) return null;
  const L = ((await q("LibPedidos").eq("estado", "Nuevo").limit(500).find()).items as Pedido[]).filter((x) => Math.round(x.total || 0) === Math.round(it.monto) && !x.pagoId);
  if (!L.length) return null;
  const em = String(it.email || "").toLowerCase(), pn = nrm(it.title).split(" ");
  const fuerte = L.filter((x) => (em && String(x.email || "").toLowerCase() === em) || (nrm(x.apellido).split(" ").filter((t) => t.length > 2).some((t) => pn.includes(t)) && nrm(x.nombre).split(" ").filter(Boolean).slice(0, 1).every((t) => pn.includes(t))));
  if (fuerte.length === 1) { const x = await marcarPagado(fuerte[0], { id: it._id, quien: it.title, fecha: it.fecha }); return { pedido: x._id, auto: true }; }
  if (L.length === 1 || fuerte.length > 1) {
    const C = fuerte.length ? fuerte : L;
    for (const x of C) await save("LibPedidos", { ...limpio(x as unknown as Record<string, unknown>), probable: it._id + "|" + (it.title || "") + "|" + it.fecha });
    const rmt = await remitente();
    await mandar(rmt, "¿Es el pago de un libro? " + pesos(it.monto) + " de " + (it.title || ""), mailNos("Entró un pago que puede ser de un libro", p(`Entró por Mercado Pago una transferencia de <b>${pesos(it.monto)}</b> de <b>${esc(it.title || "")}</b> el ${esc(it.fecha.split("-").reverse().join("/"))}.`) + p(`Coincide con el pedido de ${C.map((x) => "<b>" + esc(x.title || "") + "</b>").join(" o ")}, pero el nombre no es el mismo. Si es ese, entrá al panel y tocá «Es este pago».`)), rmt).catch(() => null);
    return { pedido: C.map((x) => x._id), auto: false };
  }
  return null;
}
