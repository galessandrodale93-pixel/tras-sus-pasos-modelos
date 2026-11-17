// Versión publicada del juego Kids & Hero (commit del repo). La lee jugar.html al abrirse para cargar ese game.js,
// así actualizar el juego es cambiar un dato en la colección KhVersion, sin volver a publicar la web.
import type { APIRoute } from "astro";
import { q } from "../../lib/sem";

export const GET: APIRoute = async () => {
  let hash = "";
  try { const it = (await q("KhVersion").eq("_id", "live").limit(1).find()).items[0] as { hash?: string } | undefined; hash = it && /^[0-9a-f]{40}$/.test(it.hash || "") ? (it.hash as string) : ""; } catch (e) { console.error("kh-version", e); }
  return new Response(JSON.stringify({ hash }), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=20" } });
};
