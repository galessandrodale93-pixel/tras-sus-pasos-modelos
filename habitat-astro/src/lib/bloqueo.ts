// Acceso al campus en pausa por cuotas: con 3 o más meses vencidos (la cuota vence el 10) sin pagar,
// el alumno no ve las clases, el material ni puede rendir los exámenes hasta regularizar.
// No cuentan los meses con comprobante en revisión, becas, casos especiales ni bajas (estadoMes).
// Quedan afuera el equipo (voluntarios activos) y quien figure en TutConfig «bloqueoExcepto» (ids de alumno, separados por coma).
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { estadoMes, type Plan, type Cobro } from "./fin";
import { vencida } from "./pagoCuota";

const q = auth.elevate(items.query);
export const MESES_BLOQUEO = 3;
const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
type Comp = { alumnoId: string; meses?: string; estado?: string };
type Vol = { email?: string; activo?: boolean };
export type Bloqueo = { bloqueado: boolean; meses: string[] };

async function todos<T>(col: string): Promise<T[]> {
  const out: T[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as T[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as T[])); }
  return out;
}
const mails = (v: unknown) => String(v || "").toLowerCase().split(/[,;\s]+/).filter((x) => x.includes("@"));

// meses vencidos sin pagar de un alumno (sin repetir aunque curse dos escuelas)
export function vencidos(alumnoId: string, planes: Plan[], cobros: Cobro[], comps: Comp[], hoy = hoyAR()) {
  const hoyMes = hoy.slice(0, 7), y = hoy.slice(0, 4);
  const rev = new Set(comps.filter((c) => c.alumnoId === alumnoId && c.estado !== "Rechazado").flatMap((c) => { try { return JSON.parse(c.meses || "[]") as string[]; } catch { return []; } }));
  const out = new Set<string>();
  for (const pl of planes.filter((p) => p.alumnoId === alumnoId)) {
    for (let m = 1; m <= 12; m++) {
      const mes = y + "-" + String(m).padStart(2, "0");
      if (mes > hoyMes) break;
      const e = estadoMes(pl, cobros, mes, hoyMes);
      if ((e === "debe" || (e === "pendiente" && vencida(mes, hoy))) && !rev.has(pl.escuela + "|" + mes)) out.add(mes);
    }
  }
  return [...out].sort();
}

async function exentos() {
  const [vols, cfg] = await Promise.all([
    todos<Vol>("VolVoluntarios"),
    q("TutConfig").eq("_id", "bloqueoExcepto").limit(1).find().then((r) => r.items[0] as { valor?: string } | undefined),
  ]);
  return {
    emails: new Set(vols.filter((v) => v.activo !== false).flatMap((v) => mails(v.email))),
    ids: new Set(String((cfg && cfg.valor) || "").split(/[\s,;]+/).filter(Boolean)),
  };
}

// un alumno (campus, material, video, examen)
export async function bloqueoDe(al: { _id: string; email?: string }): Promise<Bloqueo> {
  const [ex, planes, cobros, comps] = await Promise.all([
    exentos(),
    q("FinPlanes").eq("alumnoId", al._id).limit(10).find().then((r) => r.items as unknown as Plan[]),
    q("FinCobros").eq("alumnoId", al._id).limit(500).find().then((r) => r.items as unknown as Cobro[]),
    q("FinComprobantes").eq("alumnoId", al._id).limit(100).find().then((r) => r.items as unknown as Comp[]).catch(() => [] as Comp[]),
  ]);
  if (ex.ids.has(al._id) || mails(al.email).some((m) => ex.emails.has(m))) return { bloqueado: false, meses: [] };
  const meses = vencidos(al._id, planes, cobros, comps);
  return { bloqueado: meses.length >= MESES_BLOQUEO, meses };
}

// todos los alumnos bloqueados (para no mandarles el material por mail)
export async function bloqueados(alumnos: { _id: string; email?: string }[]) {
  const [ex, planes, cobros, comps] = await Promise.all([exentos(), todos<Plan>("FinPlanes"), todos<Cobro>("FinCobros"), todos<Comp>("FinComprobantes").catch(() => [] as Comp[])]);
  const out = new Map<string, string[]>();
  for (const a of alumnos) {
    if (ex.ids.has(a._id) || mails(a.email).some((m) => ex.emails.has(m))) continue;
    const meses = vencidos(a._id, planes, cobros, comps);
    if (meses.length >= MESES_BLOQUEO) out.set(a._id, meses);
  }
  return out;
}
