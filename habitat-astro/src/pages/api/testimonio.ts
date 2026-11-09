// Video testimonio del alumno. Entra con la clave personal del mail (sin necesidad de iniciar sesión)
// o desde el Campus con su cuenta. También da los testimonios aprobados con permiso para la página Sembradores.
// GET ?k=<clave> | GET ?publicos=1 | GET con x-habitat-auth (Campus)
// POST {k, op: "responder", r: subi|ayuda|alla} | {k, op: "subir", mime, nombre} | {k, op: "video", url}
import type { APIRoute } from "astro";
import { auth, httpClient } from "@wix/essentials";
import { q, todos, type Testimonio } from "../../lib/sem";
import { porClave, responder, videoSubido, type Video } from "../../lib/tes";

const fetchAuth = auth.elevate(httpClient.fetchWithAuth);
const json = (b: unknown, status = 200, cache = "no-store") => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": cache } });
const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).trim().slice(0, max);
const vista = (v: Video) => ({ nombre: String(v.title || "").split(/\s+/)[0], becado: !!v.becado, estado: v.estado, limite: v.limite, video: v.video || "" });

async function cfg() {
  const c = (await q("TutConfig").limit(80).find()).items as { _id: string; valor?: string }[];
  return Object.fromEntries(c.map((x) => [x._id, x.valor || ""])) as Record<string, string>;
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    if (url.searchParams.get("publicos")) {
      const ts = (await todos<Testimonio>("SemTestimonios")).filter((t) => t.estado === "Aprobado" && t.permiso && (t.video || t.texto));
      return json(ts.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 12).map((t) => ({ nombre: t.title, texto: t.texto || "", video: t.video || "", becado: !!t.becado })), 200, "public, max-age=600");
    }
    const k = url.searchParams.get("k");
    if (k) { const v = await porClave(k); return v ? json({ ...vista(v), clave: k }) : json({ error: "Este link ya no es válido." }, 404); }
    const token = request.headers.get("x-habitat-auth");
    if (!token) return json({});
    const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
    if (!mr.ok) return json({});
    const email = String(((await mr.json()).member || {}).loginEmail || "").toLowerCase();
    if (!email) return json({});
    const v = ((await q("SemVideos").eq("email", email).limit(1).find()).items[0] as Video | undefined);
    return json(v && v.estado !== "Descartado" ? { ...vista(v), clave: v.clave } : {});
  } catch (e) {
    console.error("testimonio GET", e);
    return json({ error: "No pudimos cargar tu testimonio." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    let x: Record<string, unknown> = {};
    try { x = await request.json(); } catch { /* vacío */ }
    const v = await porClave(s(x.k, 40));
    if (!v) return json({ error: "Este link ya no es válido." }, 404);
    const C = await cfg(), remitente = C.remitente || "galessandrodale.93@gmail.com";
    if (x.op === "responder") { const it = await responder(v, s(x.r, 10), remitente); return json({ ok: true, ...vista(it) }); }
    if (x.op === "subir") {
      const mime = s(x.mime, 80);
      if (!/^video\//.test(mime)) return json({ error: "Elegí un archivo de video." }, 400);
      const r = await fetchAuth("https://www.wixapis.com/site-media/v1/files/generate-upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mimeType: mime, fileName: ("testimonio-" + String(v.title || "alumno")).replace(/[^\w.-]+/g, "-").slice(0, 80) + "." + (mime.split("/")[1] || "mp4").replace(/[^a-z0-9]/g, "") }) });
      const b = await r.json();
      if (!r.ok || !b.uploadUrl) return json({ error: "No pudimos preparar la subida." }, 500);
      return json({ ok: true, uploadUrl: b.uploadUrl });
    }
    if (x.op === "video") {
      const u = s(x.url, 600);
      if (!/^https:\/\/[^\s]+$/.test(u)) return json({ error: "No llegó el video." }, 400);
      const it = await videoSubido(v, u, remitente);
      return json({ ok: true, ...vista(it) });
    }
    return json({ error: "op" }, 400);
  } catch (e) {
    console.error("testimonio POST", e);
    return json({ error: "No pudimos guardar. Probá de nuevo." }, 500);
  }
};
