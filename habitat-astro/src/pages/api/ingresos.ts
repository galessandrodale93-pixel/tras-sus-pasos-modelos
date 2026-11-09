// Finanzas · ingresos: Mercado Pago (automático), efectivo cargado a mano y la lista "Por clasificar".
// Acceso: quienes tienen el permiso de Finanzas (TutTutores.gastos).
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { q, todos, guardar, hoyAR } from "../../lib/sem";
import { TIPOS_ING, NO_SUMA, reclasificar, traer, token, type Ingreso } from "../../lib/mp";
import { TIPOS_SAL, CATS, clasificarSalida, type Salida } from "../../lib/salidas";

const rem = auth.elevate(items.remove);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).trim().slice(0, max);
const n = (v: unknown) => { const x = Number(String(v ?? "").replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")); return isFinite(x) ? Math.round(x * 100) / 100 : 0; };

async function who(request: Request) {
  const tk = request.headers.get("x-habitat-auth");
  if (!tk) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: tk } });
  if (!mr.ok) return null;
  const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
  const t = email ? ((await q("TutTutores").eq("email", email).limit(1).find()).items[0] as { title?: string; gastos?: boolean } | undefined) : undefined;
  return t && t.gastos ? t : null;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    if (!(await who(request))) return json({ error: "Tu cuenta no tiene acceso a Finanzas." }, 403);
    const [ing, pag, sal] = await Promise.all([todos<Ingreso>("FinIngresos"), todos<{ _id: string; title?: string; tipo: string }>("FinPagadores"), todos<Salida>("FinSalidas")]);
    const clean = (L: Record<string, unknown>[]) => L.map(({ _createdDate, _updatedDate, _owner, ...x }) => x);
    return json({ tipos: TIPOS_ING, mp: !!(await token()), noSuma: NO_SUMA, tiposSal: TIPOS_SAL, cats: CATS, salidas: clean(sal as unknown as Record<string, unknown>[]), ingresos: clean(ing as unknown as Record<string, unknown>[]), pagadores: clean(pag as unknown as Record<string, unknown>[]) });
  } catch (e) { console.error("ingresos GET", e); return json({ error: "No pudimos cargar los ingresos." }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Tu cuenta no tiene acceso a Finanzas." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const por = me.title || "";
    switch (x.op) {
      case "manual": {
        const id = s(x.id, 80);
        if (x.borrar) { if (!/^man-/.test(id)) return json({ error: "Solo se borran los cargados a mano." }, 400); await rem("FinIngresos", id); return json({ ok: true }); }
        const f = s(x.fecha, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return json({ error: "Revisá la fecha." }, 400);
        const monto = n(x.monto); if (!(monto > 0)) return json({ error: "Poné el monto." }, 400);
        const tipo = TIPOS_ING.includes(s(x.tipo)) ? s(x.tipo) : "Efectivo";
        const it: Ingreso = { _id: id || "man-" + Date.now().toString(36), title: s(x.title, 120) || "Efectivo", fecha: f, mes: f.slice(0, 7), monto, neto: monto, tipo, origen: "A mano", alumnoId: s(x.alumnoId, 80), pagador: "", descripcion: "", estado: "", nota: s(x.nota, 500), por };
        await guardar("FinIngresos", it as unknown as Record<string, unknown>);
        return json({ ok: true, item: it });
      }
      case "clasificar": {
        const tipo = s(x.tipo, 40);
        if (!TIPOS_ING.includes(tipo)) return json({ error: "Elegí el tipo." }, 400);
        const it = await reclasificar(s(x.id, 80), tipo, s(x.alumnoId, 80), x.recordar !== false, por);
        return json({ ok: true, item: it });
      }
      case "salida": {
        const tipo = s(x.tipo, 40);
        if (!TIPOS_SAL.includes(tipo)) return json({ error: "Elegí el tipo." }, 400);
        const it = await clasificarSalida(s(x.id, 80), tipo, s(x.categoria, 40), x.recordar !== false, por);
        return json({ ok: true, item: it });
      }
      case "traer": {
        const r = await traer(Math.max(1, Math.min(365, Math.round(n(x.dias) || 60))));
        return json(r.error ? { error: r.error } : { ok: true, ...r }, r.error ? 400 : 200);
      }
    }
    return json({ error: "op" }, 400);
  } catch (e) { console.error("ingresos POST", e); return json({ error: "No pudimos guardar el cambio." }, 500); }
};
