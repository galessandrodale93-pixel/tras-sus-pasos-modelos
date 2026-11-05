// Campus Habitat: link de video protegido para alumnos inscriptos.
// Reemplaza la función /_functions/video de la web anterior.
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { files } from "@wix/media";
import VMAP from "../../data/vmap.json";

const map = VMAP as Record<string, string>;
const generate = auth.elevate(files.generateVideoStreamingUrl);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Habitat-Auth, Authorization",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async ({ request }) => {
  try {
    const token = request.headers.get("x-habitat-auth") || request.headers.get("authorization");
    let body: { stepId?: unknown } = {};
    try { body = await request.json(); } catch { /* vacío */ }
    const stepId = typeof body.stepId === "string" ? body.stepId : "";
    if (!token || !/^[0-9a-f-]{36}$/i.test(stepId)) return json({ error: "faltan datos" }, 400);
    // El paso solo se puede leer con el token del alumno si participa del programa.
    const r = await fetch(
      "https://www.wixapis.com/online-programs/v3/steps/" + encodeURIComponent(stepId) + "?descriptionFieldSet=EXTENDED",
      { headers: { authorization: token } },
    );
    if (!r.ok) return json({ error: "sin acceso" }, 403);
    const step = ((await r.json()) as any).step || {};
    const vo = step.videoOptions || {};
    let fileId: string | undefined = vo.video && vo.video.id;
    if (!fileId && vo.wixVideo) fileId = map[vo.wixVideo.id];
    if (!fileId) return json({ error: "sin video" }, 404);
    const hls: any = await generate(fileId, { format: "HLS", expirationInMinutes: 360 } as any);
    return json({ hls: hls?.downloadUrl?.url });
  } catch (e: any) {
    return json({ error: String((e && e.message) || e) }, 500);
  }
};
