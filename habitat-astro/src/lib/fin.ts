// Estado de pago de cada mes, con las mismas reglas que usaba el Excel de Raquel.
export type Plan = { alumnoId: string; escuela: string; formaPago?: string; inicio?: number; especial?: string; desde?: number | null; hasta?: number | null };
export type Cobro = { alumnoId: string; escuela: string; mes: string; monto?: number; estado?: string };

export function estadoMes(p: Plan, cobros: Cobro[], mes: string, hoyMes: string) {
  const m = +mes.slice(5, 7), esp = String(p.especial || "").toLowerCase();
  if (/becad/i.test(p.formaPago || "") || esp.includes("becad")) return "becado";
  if (m < (p.inicio || 3)) return "nada";
  const dentro = p.desde != null && m >= (p.desde || 0) && m <= (p.hasta || 12);
  if (esp.includes("baja") && dentro) return "baja";
  if (esp && dentro) return "especial";
  const pago = cobros.filter((c) => c.alumnoId === p.alumnoId && c.escuela === p.escuela && c.mes === mes && (c.estado || "Aprobado") === "Aprobado").reduce((a, c) => a + (c.monto || 0), 0);
  if (pago > 0) return "pago";
  return mes < hoyMes ? "debe" : mes === hoyMes ? "pendiente" : "futuro";
}

// Para el panel de tutores: un sí/no por alumno y mes (al día si todas sus escuelas están cubiertas).
export function pagosTutor(planes: Plan[], cobros: Cobro[], hoyMes: string) {
  const year = hoyMes.slice(0, 4), out: { _id: string; alumnoId: string; mes: string; pagado: boolean; por: string }[] = [];
  const by: Record<string, Plan[]> = {};
  planes.forEach((p) => (by[p.alumnoId] = by[p.alumnoId] || []).push(p));
  for (const [a, ps] of Object.entries(by)) {
    for (let m = 3; m <= 12; m++) {
      const mes = year + "-" + String(m).padStart(2, "0");
      if (mes > hoyMes) break;
      const es = ps.map((p) => estadoMes(p, cobros, mes, hoyMes));
      if (es.every((e) => e === "nada")) continue;
      if (es.every((e) => e === "becado" || e === "nada")) continue;
      out.push({ _id: a + "|" + mes, alumnoId: a, mes, pagado: es.every((e) => e !== "debe" && e !== "pendiente"), por: "Finanzas" });
    }
  }
  return out;
}
