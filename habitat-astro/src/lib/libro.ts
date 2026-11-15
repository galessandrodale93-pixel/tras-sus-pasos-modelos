// Libro Asombro: pedidos desde libro.html, mail con el costo y la transferencia, y datos listos para Andreani.
import { mandar as mandar0, marco as marco0, p } from "./sem";
import { esc } from "./vol";

export const WEB = "https://www.habitat-cfm.org";
export const PRECIO = 22000;
export const ENVIO = 11000;
export const ALIAS = "habitatcfm";
export const WA = "5491171637995";
const marco = (k: string, t: string, c: string) => marco0(k, t, c, `<a href="${WEB}/libro.html" style="color:#b8904f">habitat-cfm.org/libro</a>`);
export const mandar = (to: string, asunto: string, html: string, remitente: string) => mandar0(to, asunto, html, remitente, "Habitat CFM · Libro Asombro");

export type Pedido = {
  _id: string; title?: string; nombre?: string; apellido?: string; email?: string; telefono?: string; dni?: string;
  entrega?: string; calle?: string; numero?: string; piso?: string; depto?: string; cp?: string; localidad?: string; provincia?: string; referencia?: string;
  cantidad?: number; total?: number; estado?: string; fecha?: string; pagado?: string; tracking?: string; despachado?: string; nota?: string; mail?: string;
  canal?: string; perfil?: string; origen?: string;
};
export const CANALES = ["Soy alumno de Habitat", "Instagram / redes", "Me lo recomendaron", "En mi iglesia o un evento", "Otro"];
export const PERFILES = ["Alumno", "Ex alumno", "Equipo Habitat", "Sembrador", "Externo"];
export const ESTADOS = ["Nuevo", "Pagado", "Despachado", "Entregado", "Cancelado"];
export const PROVINCIAS = ["CABA", "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"];

export const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
export const totalDe = (cant: number, envio: boolean) => cant * PRECIO + (envio ? ENVIO : 0);
export const domicilio = (x: Pedido) => [[x.calle, x.numero].filter(Boolean).join(" "), x.piso ? "piso " + x.piso : "", x.depto ? "depto " + x.depto : ""].filter(Boolean).join(", ") + (x.localidad || x.provincia ? " · " + [x.localidad, x.provincia].filter(Boolean).join(", ") : "") + (x.cp ? " (CP " + x.cp + ")" : "");

const nom = (x: Pedido) => esc(String(x.nombre || x.title || "").split(/\s+/)[0]);
const caja = (t: string) => `<div style="background:#fff;border:1px solid #e6dccb;border-radius:14px;padding:14px 16px;margin:0 0 14px;font:15px/1.7 Arial">${t}</div>`;

export function mailPedido(x: Pedido) {
  const envio = x.entrega === "envio", cant = x.cantidad || 1;
  const det = `${cant} ${cant === 1 ? "ejemplar" : "ejemplares"} de <b>Asombro</b> × ${pesos(PRECIO)}${envio ? `<br>Envío por Andreani a domicilio: ${pesos(ENVIO)}` : `<br>Retiro en Habitat: sin costo de envío`}<br><b style="font-size:18px">Total: ${pesos(x.total || totalDe(cant, envio))}</b>`;
  return marco("Habitat · Libro Asombro", "¡Gracias por tu pedido! 📖", [
    p(`Hola ${nom(x)}! Recibimos tu pedido del libro <i>Asombro</i>. Te dejamos el detalle y cómo pagarlo.`),
    caja(det),
    p(`<b>Cómo pagar:</b> transferí <b>${pesos(x.total || 0)}</b> al alias <b style="font-size:18px">${ALIAS}</b>. Después mandanos el comprobante respondiendo este mail o por <a href="https://wa.me/${WA}" style="color:#b8904f">WhatsApp</a>.`),
    envio
      ? p(`<b>Envío:</b> apenas se acredite el pago lo despachamos por Andreani a <b>${esc(domicilio(x))}</b> y te mandamos el número de seguimiento.`)
      : p(`<b>Retiro:</b> lo podés retirar en Habitat, Av. Juan Bautista Justo 8177, CABA. Te avisamos cuando esté listo.`),
    p("Que estas páginas te lleven a mirar a Jesús hasta quedar rendido ante Su belleza 🙌🏽"),
  ].join(""));
}
export function mailDespacho(x: Pedido) {
  return marco("Habitat · Libro Asombro", "Tu libro ya está en camino 📦", [
    p(`Hola ${nom(x)}! Despachamos tu ejemplar de <i>Asombro</i> por Andreani a ${esc(domicilio(x))}.`),
    x.tracking ? caja(`Número de seguimiento: <b style="font-size:18px">${esc(x.tracking)}</b><br>Lo podés seguir en <a href="https://www.andreani.com/" style="color:#b8904f">andreani.com</a> → «Seguí tu envío».`) : "",
    p("¡Que lo disfrutes!"),
  ].join(""));
}
export function mailListo(x: Pedido) {
  return marco("Habitat · Libro Asombro", "Tu libro te espera en Habitat 📖", p(`Hola ${nom(x)}! Ya recibimos tu pago. Tu ejemplar de <i>Asombro</i> está listo para retirar en Habitat, Av. Juan Bautista Justo 8177, CABA.`));
}
export function mailAviso(x: Pedido) {
  const envio = x.entrega === "envio";
  return marco("Libro Asombro · nuevo pedido", `${esc(x.title || "")} pidió ${x.cantidad || 1} ${(x.cantidad || 1) === 1 ? "libro" : "libros"}`, [
    caja(`<b>${esc(x.title || "")}</b><br>${esc(x.email || "")} · ${esc(x.telefono || "")}${x.dni ? "<br>DNI " + esc(x.dni) : ""}<br>${envio ? "Envío a " + esc(domicilio(x)) : "Retira en Habitat"}<br><b>Total ${pesos(x.total || 0)}</b>`),
    p(envio ? "Los datos para cargar el envío en Andreani están listos en el panel." : "Cuando pague, marcalo como pagado en el panel y le avisamos que lo puede retirar."),
    `<p style="margin:18px 0"><a href="${WEB}/libro-panel.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir pedidos del libro</a></p>`,
  ].join(""));
}
