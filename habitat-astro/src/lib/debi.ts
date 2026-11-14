// Debi (débitos automáticos de las cuotas). El recorrido de la plata es Debi → Payway → banco de Agustina.
// La web distingue dos cosas: el alumno PAGÓ (Debi aprobó el débito, entra solo en Cobros) y la plata LLEGÓ
// (Payway la depositó en el banco; se marca a mano por lote). Si pasa la fecha estimada de acreditación
// que informa Debi y el lote no está marcado, queda "Demorado" y se avisa a quienes llevan Finanzas.
// Clave: DEBI_SECRET_KEY en el gestor de claves de Wix.
import { auth } from "@wix/essentials";
import { secrets } from "@wix/secrets";
import { estadoMes, type Plan, type Cobro } from "./fin";
import { q, todos, guardar, hoyAR, mandar, marco, p } from "./sem";
import { esc } from "./vol";

const getSecret = auth.elevate(secrets.getSecretValue);
export type DebiCobro = { _id: string; title?: string; email?: string; cliente?: string; alumnoId?: string; fecha: string; mes: string; monto: number; estado: string; acreditacion?: string; llego?: string; cobroId?: string; avisado?: string; descripcion?: string };
type Alumno = { _id: string; title?: string; email?: string; activo?: boolean };
const nrm = (t: unknown) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const DIA = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);

export async function claveDebi() { try { const r = await getSecret("DEBI_SECRET_KEY"); return (r && r.value) || ""; } catch { return ""; } }
async function api(path: string, k: string) {
  const r = await fetch("https://api.debi.pro" + path, { headers: { authorization: "Bearer " + k, accept: "application/json" } });
  if (!r.ok) throw new Error("Debi respondió " + r.status);
  return r.json();
}

// Cuenta como cuota aprobada en Cobros (si no estaba ya cargada a mano para ese alumno y mes).
async function aCobros(d: DebiCobro, planes: Plan[], cobros: Cobro[]) {
  if (!d.alumnoId || d.estado !== "approved" || d.cobroId) return d.cobroId || "";
  const ps = planes.filter((x) => x.alumnoId === d.alumnoId);
  if (ps.length !== 1) return ""; // con varias escuelas (o ninguna) lo asigna Raquel
  const esc0 = ps[0].escuela;
  const ya = cobros.find((c) => c.alumnoId === d.alumnoId && c.escuela === esc0 && c.mes === d.mes && (c.estado || "Aprobado") === "Aprobado");
  if (ya) return "manual";
  const it = { _id: "debi-" + d._id, title: d.title || "", alumnoId: d.alumnoId, escuela: esc0, compartido: "", fecha: d.fecha, mes: d.mes, montoTotal: d.monto, monto: d.monto, estado: "Aprobado", medio: "Débito", concepto: "Cuota", respuesta: "Debi", nota: "Cargado solo desde Debi", por: "Debi" };
  await guardar("FinCobros", it);
  return it._id;
}

export async function traerDebi(dias: number) {
  const k = await claveDebi();
  if (!k) return { error: "Falta DEBI_SECRET_KEY en el gestor de claves de Wix." };
  const [al, planes, cobros, rec] = await Promise.all([todos<Alumno>("TutAlumnos"), todos<Plan>("FinPlanes"), todos<Cobro>("FinCobros"), todos<{ _id: string; alumnoId?: string }>("FinPagadores")]);
  const desde = DIA(hoyAR(), -dias);
  let after = "", vistos = 0, nuevos = 0, aCob = 0;
  for (let i = 0; i < 30; i++) {
    const r = await api(`/v1/payments?limit=100&charge_date[gte]=${desde}${after ? "&starting_after=" + encodeURIComponent(after) : ""}`, k);
    const L = (r.data || []) as Record<string, any>[];
    for (const pg of L) {
      vistos++;
      const cu = typeof pg.customer === "object" && pg.customer ? pg.customer : { id: String(pg.customer || "") };
      const prev = (await q("FinDebi").eq("_id", pg.id).limit(1).find()).items[0] as DebiCobro | undefined;
      const recordado = rec.find((x) => x._id === "debi|" + cu.id);
      const a = (prev && prev.alumnoId) || (recordado && recordado.alumnoId) || (al.find((x) => (cu.email && nrm(x.email) === nrm(cu.email)) || (cu.name && nrm(x.title) === nrm(cu.name))) || { _id: "" })._id;
      const fecha = String(pg.effective_charged_date || pg.charge_date || pg.created_at || hoyAR()).slice(0, 10);
      const d: DebiCobro = { _id: pg.id, title: cu.name || cu.email || "Cliente de Debi", email: String(cu.email || "").toLowerCase(), cliente: cu.id, alumnoId: a, fecha, mes: String(pg.charge_date || fecha).slice(0, 7), monto: Number(pg.amount) || 0, estado: String(pg.status || ""), acreditacion: String(pg.estimated_accreditation_date || "").slice(0, 10), llego: (prev && prev.llego) || "", cobroId: (prev && prev.cobroId) || "", avisado: (prev && prev.avisado) || "", descripcion: String(pg.description || "").slice(0, 200) };
      const cid = await aCobros(d, planes, cobros);
      if (cid && cid !== d.cobroId) { d.cobroId = cid; if (cid !== "manual") aCob++; }
      await guardar("FinDebi", d as unknown as Record<string, unknown>);
      if (!prev) nuevos++;
    }
    if (L.length < 100) break;
    after = String(L[L.length - 1].id);
  }
  return { vistos, nuevos, aCobros: aCob };
}

export const demorado = (d: DebiCobro, hoy: string) => d.estado === "approved" && !d.llego && !!d.acreditacion && d.acreditacion < hoy;

// Asociar un cliente de Debi a un alumno (y recordarlo para los próximos débitos).
export async function asociar(id: string, alumnoId: string) {
  const d = (await q("FinDebi").eq("_id", id).limit(1).find()).items[0] as DebiCobro | undefined;
  if (!d) throw new Error("No existe ese cobro.");
  await guardar("FinPagadores", { _id: "debi|" + d.cliente, title: d.title || "", tipo: "Debi", alumnoId });
  const [planes, cobros] = await Promise.all([todos<Plan>("FinPlanes"), todos<Cobro>("FinCobros")]);
  const L = (await todos<DebiCobro>("FinDebi")).filter((x) => x.cliente === d.cliente);
  for (const x of L) { const n = { ...x, alumnoId }; n.cobroId = (await aCobros(n, planes, cobros)) || n.cobroId; await guardar("FinDebi", n as unknown as Record<string, unknown>); }
  return L.length;
}

// Marca un lote (todos los cobros con esa fecha estimada) como llegado al banco.
export async function llego(lote: string, fecha: string) {
  const L = (await todos<DebiCobro>("FinDebi")).filter((x) => x.acreditacion === lote && x.estado === "approved");
  for (const x of L) await guardar("FinDebi", { ...x, llego: fecha } as unknown as Record<string, unknown>);
  return L.length;
}

// Mail al alumno apenas Debi rechaza un débito (rechazos de los últimos 3 días). Debi reintenta el débito,
// así que se avisa una sola vez por persona y por mes, y no se avisa si ese mes ya terminó cobrándose.
const MESL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const ALIAS = "habitatcfm";
export function htmlRechazo(nom: string, mes: string, monto: number) {
  return marco("Habitat · Tu cuota", "No pudimos hacer el cobro de tu cuota", `${p(`Hola ${nom}! Te escribimos porque no pudimos cobrar el débito automático de tu cuota de <b>${esc(mes)}</b> por <b>$ ${Number(monto).toLocaleString("es-AR")}</b>.`)}${p("Suele pasar cuando la cuenta o la tarjeta no tenía saldo ese día, venció o se cambió. Para ponerte al día tenés dos opciones:")}<ul style="font:16px/1.7 Arial;margin:0 0 12px"><li><b>Cargar dinero en la cuenta</b> de donde se debita la cuota, así el próximo intento de débito se puede hacer.</li><li><b>Transferir</b> el monto al alias <b>${ALIAS}</b> y respondernos este mail con el comprobante, así no te lo volvemos a debitar.</li></ul>${p("Si cambiaste la tarjeta o la cuenta, respondé este mail y te ayudamos a actualizarla para que el débito vuelva a funcionar.")}${p("Gracias por ser parte de Habitat. Cualquier cosa, estamos para acompañarte 🙌🏽")}`);
}
export async function avisarRechazos(hoy: string, dry: boolean, remitente: string) {
  const lim = DIA(hoy, -3), out: unknown[] = [];
  const todosD = await todos<DebiCobro>("FinDebi");
  const L = todosD.filter((d) => d.estado === "rejected" && d.fecha >= lim && !d.avisado);
  if (!L.length) return out;
  const clave = (d: DebiCobro) => (d.cliente || d.email || d._id) + "|" + d.mes;
  const cobrado = new Set(todosD.filter((d) => d.estado === "approved").map(clave));
  const yaAvisado = new Set(todosD.filter((d) => d.estado === "rejected" && d.avisado).map(clave));
  const al = await todos<Alumno>("TutAlumnos");
  for (const d of L) {
    const k = clave(d);
    if (cobrado.has(k) || yaAvisado.has(k)) {
      if (!dry) await guardar("FinDebi", { ...d, avisado: hoy } as unknown as Record<string, unknown>);
      out.push({ d: d._id, omitido: cobrado.has(k) ? "ya cobrado" : "ya avisado este mes" });
      continue;
    }
    const a = al.find((x) => x._id === d.alumnoId), to = (a && a.email) || d.email;
    if (a && a.activo === false) { if (!dry) await guardar("FinDebi", { ...d, avisado: hoy } as unknown as Record<string, unknown>); out.push({ d: d._id, omitido: "dado de baja" }); continue; }
    const nom = esc(String((a && a.title) || d.title || "").split(/\s+/)[0]);
    if (!to) { out.push({ d: d._id, sinEmail: true }); continue; }
    if (dry) { out.push({ d: d._id, to }); yaAvisado.add(k); continue; }
    const mes = MESL[+d.mes.slice(5, 7) - 1] || "";
    const r = await mandar(to, "No pudimos cobrar tu cuota de " + mes + " en Habitat", htmlRechazo(nom, mes, d.monto), remitente);
    if (r.ok) { await guardar("FinDebi", { ...d, avisado: hoy } as unknown as Record<string, unknown>); yaAvisado.add(k); }
    out.push({ d: d._id, ok: r.ok });
  }
  return out;
}

export async function debiDiario(hoy: string, dry: boolean, remitente: string) {
  const r = dry ? { dry: true } : await traerDebi(20).catch((e) => ({ error: String((e as Error).message || e) }));
  const rechazos = await avisarRechazos(hoy, dry, remitente).catch((e) => String((e as Error).message || e));
  const dem = (await todos<DebiCobro>("FinDebi")).filter((d) => demorado(d, hoy) && !d.avisado);
  if (!dem.length || dry) return { debi: r, rechazos, demorados: dem.length };
  const lotes: Record<string, DebiCobro[]> = {};
  dem.forEach((d) => (lotes[d.acreditacion as string] = lotes[d.acreditacion as string] || []).push(d));
  const fin = ((await q("TutTutores").eq("gastos", true).limit(20).find()).items as { email?: string }[]).filter((t) => t.email);
  const cuerpo = Object.entries(lotes).map(([f, L]) => `<p style="font:700 16px Arial;margin:14px 0 4px">Lote del ${esc(f)} · $ ${L.reduce((a, x) => a + x.monto, 0).toLocaleString("es-AR")} · ${L.length} cobros</p><p style="font:14px/1.6 Arial;color:#5d6b64;margin:0">${L.map((x) => esc(x.title)).join(", ")}</p>`).join("");
  for (const t of fin) await mandar(t.email as string, "Finanzas: hay cobros de Debi demorados en llegar al banco", marco("Habitat · Finanzas", "Plata en camino que no llegó", `${p("Estos lotes de Debi pasaron la fecha estimada de acreditación y todavía no están marcados como llegados al banco de Agustina. Si ya llegaron, marcalos en Finanzas; si no, conviene reclamar a Payway.")}${cuerpo}<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/finanzas.html#debi" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir Debi en Finanzas</a></p>`), remitente);
  for (const d of dem) await guardar("FinDebi", { ...d, avisado: hoy } as unknown as Record<string, unknown>);
  return { debi: r, rechazos, demorados: dem.length, avisados: fin.length };
}
