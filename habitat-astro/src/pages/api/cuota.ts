// Campus: «Mi cuota». El alumno ve cómo paga cada escuela y si cada mes figura pagado.
// GET con x-habitat-auth. Solo devuelve datos del propio alumno (por el email de su cuenta).
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { emailDe } from "../../lib/profe";
import { estadoMes, type Plan, type Cobro } from "../../lib/fin";

const q = auth.elevate(items.query);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });

export const GET: APIRoute = async ({ request }) => {
  try {
    const me = await emailDe(request);
    if (!me.email) return json({ ok: false }, 401);
    const al = (await q("TutAlumnos").eq("email", me.email).limit(1).find()).items[0] as { _id: string; title?: string; activo?: boolean } | undefined;
    if (!al || al.activo === false) return json({ ok: true, alumno: false });
    const [planes, cobros, debi] = await Promise.all([
      q("FinPlanes").eq("alumnoId", al._id).limit(10).find().then((r) => r.items as unknown as (Plan & { formaPago?: string })[]),
      q("FinCobros").eq("alumnoId", al._id).limit(500).find().then((r) => r.items as unknown as Cobro[]),
      q("FinDebi").eq("alumnoId", al._id).limit(200).find().then((r) => r.items as unknown as { fecha: string; mes: string; estado: string; monto: number }[]),
    ]);
    const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), hoyMes = hoy.slice(0, 7), y = hoy.slice(0, 4);
    const escuelas = planes.map((p) => {
      const meses: { mes: string; estado: string }[] = [];
      for (let m = 1; m <= 12; m++) {
        const mes = y + "-" + String(m).padStart(2, "0");
        if (mes > hoyMes) break;
        const e = estadoMes(p, cobros, mes, hoyMes);
        if (e !== "nada") meses.push({ mes, estado: e });
      }
      return { escuela: p.escuela, formaPago: p.formaPago || "", debito: /d[eé]bito/i.test(p.formaPago || ""), meses, debe: meses.filter((x) => x.estado === "debe").length };
    });
    const ult = debi.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    return json({ ok: true, alumno: true, nombre: al.title, escuelas, ultimoDebito: ult ? { fecha: ult.fecha, mes: ult.mes, estado: ult.estado === "approved" ? "aprobado" : ult.estado === "rejected" ? "rechazado" : "pendiente", monto: ult.monto } : null, alias: "habitatcfm" });
  } catch (e) {
    console.error("cuota", e);
    return json({ ok: false }, 500);
  }
};
