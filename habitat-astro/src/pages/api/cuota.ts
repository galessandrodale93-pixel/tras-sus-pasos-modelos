// Campus: «Mi cuota». El alumno ve cómo paga cada escuela, si cada mes figura pagado,
// y puede subir el comprobante de su transferencia (queda «En revisión» hasta que Finanzas lo registra).
// GET / POST con x-habitat-auth. Solo datos del propio alumno (por el email de su cuenta).
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { emailDe } from "../../lib/profe";
import { estadoMes, type Plan, type Cobro } from "../../lib/fin";
import { activa, VENCE } from "../../lib/cobranza";
import { mandar, marco, p } from "../../lib/sem";
import { esc } from "../../lib/vol";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max);
const MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
type Comp = { _id: string; alumnoId: string; meses?: string; estado?: string; fecha?: string; monto?: number; url?: string };

async function alumnoDe(request: Request) {
  const me = await emailDe(request);
  if (!me.email) return null;
  const al = (await q("TutAlumnos").eq("email", me.email).limit(1).find()).items[0] as { _id: string; title?: string; activo?: boolean } | undefined;
  return al && al.activo !== false ? al : undefined;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const al = await alumnoDe(request);
    if (al === null) return json({ ok: false }, 401);
    if (!al) return json({ ok: true, alumno: false });
    const [planes, cobros, debi, comps] = await Promise.all([
      q("FinPlanes").eq("alumnoId", al._id).limit(10).find().then((r) => r.items as unknown as (Plan & { formaPago?: string })[]),
      q("FinCobros").eq("alumnoId", al._id).limit(500).find().then((r) => r.items as unknown as Cobro[]),
      q("FinDebi").eq("alumnoId", al._id).limit(200).find().then((r) => r.items as unknown as { fecha: string; mes: string; estado: string; monto: number }[]),
      q("FinComprobantes").eq("alumnoId", al._id).limit(100).find().then((r) => r.items as unknown as Comp[]).catch(() => [] as Comp[]),
    ]);
    const transf = await activa().catch(() => false);
    const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), hoyMes = hoy.slice(0, 7), y = hoy.slice(0, 4);
    const revision = new Set(comps.filter((c) => c.estado !== "Rechazado").flatMap((c) => { try { return JSON.parse(c.meses || "[]") as string[]; } catch { return []; } }));
    const escuelas = planes.map((pl) => {
      const meses: { mes: string; estado: string }[] = [];
      for (let m = 1; m <= 12; m++) {
        const mes = y + "-" + String(m).padStart(2, "0");
        if (mes > hoyMes) break;
        let e = estadoMes(pl, cobros, mes, hoyMes);
        if ((e === "debe" || e === "pendiente") && revision.has(pl.escuela + "|" + mes)) e = "revision";
        if (e !== "nada") meses.push({ mes, estado: e });
      }
      return { escuela: pl.escuela, formaPago: transf ? "Transferencia al alias habitatcfm" : pl.formaPago || "", debito: !transf && /d[eé]bito/i.test(pl.formaPago || ""), meses, debe: meses.filter((x) => x.estado === "debe").length };
    });
    const ult = debi.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    return json({ ok: true, alumno: true, nombre: al.title, hoy, escuelas, ultimoDebito: ult ? { fecha: ult.fecha, mes: ult.mes, estado: ult.estado === "approved" ? "aprobado" : ult.estado === "rejected" ? "rechazado" : "pendiente", monto: ult.monto } : null, alias: "habitatcfm", transferencia: transf, vence: VENCE });
  } catch (e) {
    console.error("cuota", e);
    return json({ ok: false }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const al = await alumnoDe(request);
    if (!al) return json({ error: "Entrá con tu cuenta de alumno." }, 401);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    if (x.op === "subir") {
      const r = await fetchAuth("https://www.wixapis.com/site-media/v1/files/generate-upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mimeType: s(x.mime, 120) || "application/octet-stream", fileName: s(x.nombre, 160) || "comprobante" }) });
      const j = await r.json();
      if (!r.ok || !j.uploadUrl) return json({ error: "No pudimos preparar la subida." }, 500);
      return json({ ok: true, uploadUrl: j.uploadUrl });
    }
    if (x.op === "comprobante") {
      const u = s(x.url, 600);
      if (!/^https:\/\//.test(u)) return json({ error: "No se subió el archivo." }, 400);
      const meses = (Array.isArray(x.meses) ? (x.meses as unknown[]) : []).map((m) => s(m, 40)).filter((m) => /^[^|]+\|\d{4}-\d{2}$/.test(m)).slice(0, 12);
      if (!meses.length) return json({ error: "Elegí qué meses pagaste." }, 400);
      const hoy = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
      const it = { _id: crypto.randomUUID(), title: al.title || "", alumnoId: al._id, meses: JSON.stringify(meses), monto: Number(String(x.monto || "").replace(/[^\d]/g, "")) || 0, url: u, estado: "En revisión", fecha: hoy, nota: s(x.nota, 300) };
      await save("FinComprobantes", it);
      // aviso a quienes llevan Finanzas
      const fin = ((await q("TutTutores").eq("gastos", true).limit(20).find()).items as { email?: string }[]).filter((t) => t.email);
      const C = Object.fromEntries(((await q("TutConfig").limit(50).find()).items as { _id: string; valor?: string }[]).map((c) => [c._id, c.valor || ""]));
      const txt = meses.map((m) => { const [e, mm] = m.split("|"); return e + " · " + MS[+mm.slice(5, 7) - 1]; }).join(", ");
      for (const t of fin) await mandar(t.email as string, "Comprobante de cuota: " + (al.title || ""), marco("Habitat · Finanzas", "Llegó un comprobante de cuota", `${p(`<b>${esc(al.title)}</b> subió el comprobante de: ${esc(txt)}${it.monto ? " · $ " + it.monto.toLocaleString("es-AR") : ""}.`)}${it.nota ? p(esc(it.nota)) : ""}${p(`<a href="${esc(u)}" style="color:#b8904f">Ver el comprobante</a>`)}<p style="margin:18px 0"><a href="https://www.habitat-cfm.org/finanzas.html" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">Registrar el cobro en Finanzas</a></p>`), C.remitente || "galessandrodale.93@gmail.com", "Habitat CFM").catch(() => null);
      return json({ ok: true, meses });
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    console.error("cuota POST", e);
    return json({ error: "No pudimos guardar el comprobante." }, 500);
  }
};
