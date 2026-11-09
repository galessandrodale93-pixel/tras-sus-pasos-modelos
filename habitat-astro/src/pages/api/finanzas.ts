// Panel de finanzas: cobros de alumnos (reemplaza el Excel de pagos) y gastos de Habitat.
// Entran solo los miembros de TutTutores con el permiso "gastos" (hoy: Raquel y Gui).
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);
const ins = auth.elevate(items.insert);
const rem = auth.elevate(items.remove);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max);
const n = (v: unknown) => { const x = Number(String(v ?? "").replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); return isFinite(x) ? Math.round(x * 100) / 100 : 0; };
const b = (v: unknown) => v === true || v === "true" || v === 1;
const asc = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const DATE = /^\d{4}-\d{2}-\d{2}$/, MES = /^\d{4}-\d{2}$/, ID = /^[a-z0-9-]{2,80}$/;
const ESC = ["Maranata", "Liderazgo", "Adoración"];

async function all(col: string) {
  const out: Record<string, unknown>[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as Record<string, unknown>[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as Record<string, unknown>[])); }
  return out.map(({ _createdDate, _updatedDate, _owner, ...x }) => x);
}

type Me = { _id: string; title?: string; email?: string; gastos?: boolean };
async function who(request: Request): Promise<Me | null> {
  const token = request.headers.get("x-habitat-auth") || request.headers.get("authorization");
  if (!token) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
  if (!mr.ok) return null;
  const m = (await mr.json()).member || {};
  const email = String(m.loginEmail || (m.contact && m.contact.emails && m.contact.emails[0]) || "").toLowerCase();
  if (!email) return null;
  const t = (await q("TutTutores").eq("email", email).limit(1).find()).items[0] as Me | undefined;
  return t && t.gastos ? t : null;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Tu cuenta no tiene acceso a Finanzas." }, 403);
    const [alumnos, planes, cobros, gastos, cfg] = await Promise.all(["TutAlumnos", "FinPlanes", "FinCobros", "FinGastos", "TutConfig"].map(all));
    const fijos = (() => { try { return JSON.parse(String((cfg.find((c) => c._id === "gastosFijos") || {}).valor || "[]")); } catch { return []; } })();
    return json({
      me: { title: me.title, email: me.email },
      alumnos: alumnos.map((a) => ({ _id: a._id, title: a.title, carreras: a.carreras, modalidad: a.modalidad, tutores: a.tutores, activo: a.activo, formaPago: a.formaPago, telefono: a.telefono })),
      planes, cobros, gastos, fijos,
    });
  } catch (e) {
    console.error("finanzas GET", e);
    return json({ error: "No pudimos cargar Finanzas." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Tu cuenta no tiene acceso a Finanzas." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const por = me.title || me.email || "";
    switch (x.op) {
      case "plan": {
        const alu = s(x.alumnoId, 80), esc = s(x.escuela, 30);
        if (!ID.test(alu) || ESC.indexOf(esc) < 0) return json({ error: "Elegí alumno y escuela." }, 400);
        const _id = alu + "|" + asc(esc);
        if (x.borrar) { await rem("FinPlanes", _id); return json({ ok: true }); }
        const mes = (v: unknown) => { const k = Math.round(n(v)); return k >= 1 && k <= 12 ? k : null; };
        const it = { _id, title: s(x.title, 120), alumnoId: alu, escuela: esc, formaPago: s(x.formaPago, 40), inicio: mes(x.inicio) || 3, especial: s(x.especial, 40), desde: mes(x.desde), hasta: mes(x.hasta), nota: s(x.nota, 1000) };
        await save("FinPlanes", it); return json({ ok: true, item: it });
      }
      case "cobro": {
        if (x.borrar) { await rem("FinCobros", s(x.id, 120)); return json({ ok: true }); }
        const alu = s(x.alumnoId, 80), esc = s(x.escuela, 30), f = s(x.fecha, 10), m = s(x.mes, 7);
        if (!ID.test(alu)) return json({ error: "Elegí el alumno." }, 400);
        if (ESC.indexOf(esc) < 0) return json({ error: "Elegí la escuela." }, 400);
        if (!DATE.test(f)) return json({ error: "Revisá la fecha." }, 400);
        if (!MES.test(m)) return json({ error: "Elegí a qué mes corresponde." }, 400);
        const monto = n(x.monto); if (!(monto > 0)) return json({ error: "Poné el monto." }, 400);
        const data = { title: s(x.title, 120), alumnoId: alu, escuela: esc, compartido: s(x.compartido, 120), fecha: f, mes: m, montoTotal: n(x.montoTotal) || monto, monto, estado: s(x.estado, 20) || "Aprobado", medio: s(x.medio, 40) || "Transferencia", concepto: s(x.concepto, 40) || "Cuota", respuesta: s(x.respuesta, 200), nota: s(x.nota, 1000), por };
        if (x.id) { const it = { _id: s(x.id, 120), ...data }; await save("FinCobros", it); return json({ ok: true, item: it }); }
        return json({ ok: true, item: await ins("FinCobros", data) });
      }
      case "gasto": {
        const concepto = s(x.concepto, 120), m = s(x.mes, 7);
        if (!MES.test(m)) return json({ error: "mes" }, 400);
        const _id = s(x.id, 160) || asc(concepto) + "|" + m;
        if (x.borrar) { await rem("FinGastos", _id).catch(() => null); return json({ ok: true }); }
        if (!concepto) return json({ error: "Poné el concepto." }, 400);
        const it = { _id, title: concepto, concepto, categoria: s(x.categoria, 60) || "Otros", mes: m, monto: n(x.monto), moneda: s(x.moneda, 3) === "USD" ? "USD" : "ARS", fijo: b(x.fijo), pagado: b(x.pagado), nota: s(x.nota, 500), por };
        await save("FinGastos", it); return json({ ok: true, item: it });
      }
      case "fijos": {
        const L = Array.isArray(x.fijos) ? (x.fijos as Record<string, unknown>[]).slice(0, 80).map((f) => ({ concepto: s(f.concepto, 120), monto: n(f.monto), moneda: s(f.moneda, 3) === "USD" ? "USD" : "ARS", categoria: s(f.categoria, 60) || "Otros" })).filter((f) => f.concepto) : [];
        await save("TutConfig", { _id: "gastosFijos", valor: JSON.stringify(L) });
        return json({ ok: true, fijos: L });
      }
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    console.error("finanzas POST", e);
    return json({ error: "No pudimos guardar el cambio." }, 500);
  }
};
