// Panel "Edición de videos": Cristian Castriota (TutConfig.editores) y los directores.
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { items } from "@wix/data";
import { q, guardar, hoyAR } from "../../lib/sem";
import { lista, plan, puedeEditar, avisarEntrega, avisarSubida, ESTADOS, FUENTES, PLAZO, PROGRAMAS, type EdVideo } from "../../lib/edicion";

const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const save = auth.elevate(items.save);
const rem = auth.elevate(items.remove);
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).trim().slice(0, max);
const DIA = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);

async function who(request: Request) {
  const tk = request.headers.get("x-habitat-auth");
  if (!tk) return null;
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: tk } });
  if (!mr.ok) return null;
  const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
  const t = email ? ((await q("TutTutores").eq("email", email).limit(1).find()).items[0] as { _id: string; title?: string; rol?: string } | undefined) : undefined;
  if (!t) return null;
  const dir = t.rol === "director", ed = await puedeEditar(t._id);
  return dir || ed ? { ...t, dir, ed } : null;
}
async function cfg() {
  const c = (await q("TutConfig").limit(80).find()).items as { _id: string; valor?: string }[];
  return Object.fromEntries(c.map((x) => [x._id, x.valor || ""])) as Record<string, string>;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Este panel es de edición de videos (Cris y la dirección)." }, 403);
    const C = await cfg(), L = await lista();
    return json({ me: { title: me.title, dir: me.dir, ed: me.ed }, estados: ESTADOS, fuentes: FUENTES, programas: PROGRAMAS, plazo: PLAZO, ritmoFijo: Number(C.edRitmo || 0), plan: plan(L, Number(C.edRitmo || 0)), videos: L });
  } catch (e) { console.error("edicion GET", e); return json({ error: "No pudimos cargar el panel." }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const me = await who(request);
    if (!me) return json({ error: "Sin acceso." }, 403);
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const C = await cfg(), remitente = C.remitente || "galessandrodale.93@gmail.com", hoy = hoyAR();
    const L = await lista(), by = Object.fromEntries(L.map((v) => [v._id, v]));
    const ids = (Array.isArray(x.ids) ? x.ids : [x.id]).map((v) => s(v, 80)).filter((v) => by[v]).slice(0, 80);
    switch (x.op) {
      case "entregar": { // solo la dirección marca que entregó el material
        if (!me.dir) return json({ error: "Lo marca la dirección." }, 403);
        if (!ids.length) return json({ error: "Elegí las clases." }, 400);
        const f = /^\d{4}-\d{2}-\d{2}$/.test(s(x.fecha)) ? s(x.fecha) : hoy, fuente = FUENTES.includes(s(x.fuente)) ? s(x.fuente) : FUENTES[0];
        const out: EdVideo[] = [];
        for (const id of ids) { const v = { ...by[id], estado: by[id].estado === "Subida" ? "Subida" : "En edición", entregado: f, limite: DIA(f, PLAZO), fuente, atraso: "" }; await guardar("EdVideos", v as unknown as Record<string, unknown>); out.push(v); }
        await avisarEntrega(out.filter((v) => v.estado !== "Subida"), remitente).catch(() => null);
        return json({ ok: true, items: out });
      }
      case "estado": {
        const est = s(x.estado, 20);
        if (!ESTADOS.includes(est)) return json({ error: "estado" }, 400);
        if (est === "Subida" && !me.dir && !(by[ids[0]] || {}).url) return json({ error: "Para marcarla como subida, subí el video." }, 400);
        const out: EdVideo[] = [];
        for (const id of ids) { const v = { ...by[id], estado: est, subido: est === "Subida" ? by[id].subido || hoy : by[id].subido || "", nota: x.nota !== undefined ? s(x.nota, 500) : by[id].nota || "" }; await guardar("EdVideos", v as unknown as Record<string, unknown>); out.push(v); }
        return json({ ok: true, items: out });
      }
      case "subir": {
        const mime = s(x.mime, 80);
        if (!/^video\//.test(mime)) return json({ error: "Elegí un archivo de video." }, 400);
        const v = by[ids[0]]; if (!v) return json({ error: "Clase" }, 400);
        const r = await fetchAuth("https://www.wixapis.com/site-media/v1/files/generate-upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mimeType: mime, fileName: (v.programa + "-" + v.fecha + "-" + (v.title || "clase")).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "-").slice(0, 90) + ".mp4" }) });
        const b = await r.json();
        if (!r.ok || !b.uploadUrl) return json({ error: "No pudimos preparar la subida." }, 500);
        return json({ ok: true, uploadUrl: b.uploadUrl });
      }
      case "video": { // el video ya subido: queda en el Campus como material de la clase
        const v = by[ids[0]], u = s(x.url, 600);
        if (!v || !/^https:\/\/\S+$/.test(u)) return json({ error: "No llegó el video." }, 400);
        const it = { ...v, estado: "Subida", url: u, subido: hoy };
        await guardar("EdVideos", it as unknown as Record<string, unknown>);
        await save("ProfMaterial", { _id: "ed-" + v._id, title: "Video de la clase", claseId: v._id, profeId: "edicion", url: u, mime: "video/mp4", fecha: v.fecha });
        await avisarSubida(it, remitente).catch(() => null);
        return json({ ok: true, item: it });
      }
      case "quitarVideo": {
        if (!me.dir) return json({ error: "Lo hace la dirección." }, 403);
        const v = by[ids[0]]; if (!v) return json({ error: "Clase" }, 400);
        await rem("ProfMaterial", "ed-" + v._id).catch(() => null);
        const it = { ...v, url: "", estado: v.entregado ? "En edición" : "Para entregar", subido: "" };
        await guardar("EdVideos", it as unknown as Record<string, unknown>);
        return json({ ok: true, item: it });
      }
      case "ritmo": {
        if (!me.dir) return json({ error: "Lo define la dirección." }, 403);
        const n = Math.max(0, Math.min(30, Math.round(Number(x.ritmo) || 0)));
        await guardar("TutConfig", { _id: "edRitmo", valor: String(n) });
        return json({ ok: true, plan: plan(L, n), ritmoFijo: n });
      }
    }
    return json({ error: "op" }, 400);
  } catch (e) { console.error("edicion POST", e); return json({ error: "No pudimos guardar el cambio." }, 500); }
};
