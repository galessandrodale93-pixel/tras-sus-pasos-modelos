// Salidas de Mercado Pago: todo lo que pagan o transfieren las cuentas. Cada una se clasifica como
// gasto de Habitat (se copia sola a Gastos), personal (queda afuera de las cuentas de Habitat) o entre cuentas propias.
// Con "recordar", los próximos pagos al mismo destino se clasifican solos.
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { q, todos, guardar, slug } from "./sem";

const rem = auth.elevate(items.remove);
export const TIPOS_SAL = ["Gasto de Habitat", "Personal", "Entre cuentas propias", "Por clasificar"];
export const CATS = ["Edificio", "Herramientas digitales", "Comisiones", "Materiales", "Eventos", "Otros"];
export type Salida = { _id: string; title?: string; fecha: string; mes: string; monto: number; tipo: string; categoria?: string; destino?: string; descripcion?: string; origen?: string; nota?: string; por?: string };
type Destino = { _id: string; title?: string; tipo: string; alumnoId?: string };

// deno-lint-ignore no-explicit-any
type Pago = any;
const fechaAR = (iso: string) => new Date(Date.parse(iso) - 3 * 3600e3).toISOString().slice(0, 10);
const clave = (pg: Pago) => { const c = pg.collector_id || (pg.collector && pg.collector.id); const d = String(pg.description || "").replace(/[\d$.,]+/g, " ").trim(); return c ? "c-" + c : d ? "d-" + slug(d).slice(0, 50) : ""; };

// Copia (o quita) el gasto en FinGastos, para que aparezca en la pestaña Gastos.
async function aGastos(s: Salida) {
  const id = "g-" + s._id;
  if (s.tipo !== "Gasto de Habitat") { await rem("FinGastos", id).catch(() => null); return; }
  await guardar("FinGastos", { _id: id, title: s.title || "Mercado Pago", concepto: s.title || "Mercado Pago", categoria: s.categoria || "Otros", mes: s.mes, monto: s.monto, moneda: "ARS", fijo: false, pagado: true, nota: "Pagado por Mercado Pago" + (s.nota ? " · " + s.nota : ""), por: s.por || "Mercado Pago" });
}

export async function registrarSalida(pg: Pago, c: number, propias: { id: string; email: string }[], dest: Destino[]) {
  if (!pg || !pg.id || pg.status !== "approved" || !(Number(pg.transaction_amount) > 0)) return null;
  const _id = (c === 1 ? "ms-" : "ms" + c + "-") + pg.id;
  const prev = (await q("FinSalidas").eq("_id", _id).limit(1).find()).items[0] as Salida | undefined;
  const key = clave(pg), recordado = dest.find((d) => d._id === "sal|" + key);
  const aPropia = propias.some((u) => u.id && String(pg.collector_id || "") === u.id);
  const tipo = prev && prev.tipo !== "Por clasificar" ? prev.tipo : aPropia ? "Entre cuentas propias" : recordado ? recordado.tipo : "Por clasificar";
  const fecha = fechaAR(pg.date_approved || pg.date_created || new Date().toISOString());
  const s: Salida = { _id, title: String(pg.description || "Pago").slice(0, 120), fecha, mes: fecha.slice(0, 7), monto: Number(pg.transaction_amount) || 0, tipo, categoria: (prev && prev.categoria) || (recordado && recordado.alumnoId) || "Otros", destino: key, descripcion: String(pg.description || "").slice(0, 300), origen: c === 1 ? "Mercado Pago" : "Mercado Pago (cuenta " + c + ")", nota: (prev && prev.nota) || "", por: (prev && prev.por) || "Mercado Pago" };
  await guardar("FinSalidas", s as unknown as Record<string, unknown>);
  await aGastos(s);
  return s;
}

// Clasificación a mano. En el recuerdo del destino, "alumnoId" guarda la categoría del gasto.
export async function clasificarSalida(id: string, tipo: string, categoria: string, recordar: boolean, por: string) {
  const it = (await q("FinSalidas").eq("_id", id).limit(1).find()).items[0] as Salida | undefined;
  if (!it) throw new Error("No existe esa salida.");
  const cat = CATS.includes(categoria) ? categoria : "Otros";
  const L = recordar && it.destino ? (await todos<Salida>("FinSalidas")).filter((x) => x.destino === it.destino) : [it];
  for (const x of L) { const n = { ...x, tipo, categoria: cat, por }; await guardar("FinSalidas", n as unknown as Record<string, unknown>); await aGastos(n); }
  if (recordar && it.destino && tipo !== "Por clasificar") await guardar("FinPagadores", { _id: "sal|" + it.destino, title: it.title || "", tipo, alumnoId: cat });
  return { ...it, tipo, categoria: cat, por, cambiados: L.length };
}
