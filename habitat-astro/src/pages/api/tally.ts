// Webhook de Tally: cada examen enviado se suma a la progresión del alumno en el panel de tutores.
// Si el nombre escrito no coincide con ningún alumno, queda en TutTally para asignarlo a mano.
// Configurar en Tally → Integraciones → Webhooks: https://www.habitat-cfm.org/api/tally?k=<clave de TutConfig.cronKey>
import type { APIRoute } from "astro";
import { auth } from "@wix/essentials";
import { items } from "@wix/data";

const q = auth.elevate(items.query);
const save = auth.elevate(items.save);

const norm = (t: unknown) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]+/g, " ").split(/\s+/).filter((w) => w.length > 1);
const asc = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

type F = { key?: string; label?: string; type?: string; value?: unknown; options?: { id: string; text: string }[] };

function text(f?: F): string {
  if (!f) return "";
  const v = f.value;
  if (Array.isArray(v) && f.options) return v.map((id) => (f.options || []).find((o) => o.id === id)?.text || id).join(" ");
  if (Array.isArray(v)) return v.join(" ");
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const key = ((await q("TutConfig").eq("_id", "cronKey").limit(1).find()).items[0] as { valor?: string } | undefined)?.valor;
    if (!key || url.searchParams.get("k") !== key) return new Response("no", { status: 401 });
    const body = await request.json();
    const d = body.data || {};
    const fields: F[] = d.fields || [];
    const formName = String(d.formName || "");
    const by = (re: RegExp) => fields.find((f) => re.test(String(f.label || "")));
    // nombre
    const nombre = [text(by(/^nombre( y apellido)?$/i) || by(/nombre/i)), text(by(/^apellido/i))].join(" ").trim();
    // nota: campo calculado "nota" o "puntaje"
    let nota: number | null = null;
    for (const f of fields) {
      const l = String(f.label || f.key || "").toLowerCase();
      if (f.type === "CALCULATED_FIELDS" && /nota|puntaje/.test(l) && typeof f.value === "number") nota = f.value;
      if (f.type === "CALCULATED_FIELDS" && f.value && typeof f.value === "object") {
        const o = f.value as Record<string, unknown>; const n = o.nota ?? o.puntaje; if (typeof n === "number") nota = n;
      }
    }
    // carrera e ítem
    const cf = text(by(/carrera/i));
    const pick = (t: string) => (/adoraci/i.test(t) ? "Adoración" : /liderazgo/i.test(t) ? "Liderazgo" : /maranata/i.test(t) ? "Maranata" : "");
    const programa = /maranata/i.test(formName) ? "Maranata" : pick(cf) || pick(formName);
    const m = formName.match(/(m[oó]dulo|bloque)\s*(\d+)/i);
    const item = /\btp\b|trabajo pr|entrega/i.test(formName) ? "TP" : m ? (/m[oó]dulo/i.test(m[1]) ? "Módulo " : "Bloque ") + m[2] : "";
    if (!programa || !item) return new Response(JSON.stringify({ ok: true, ignorado: formName }), { status: 200 });
    const fecha = String(d.createdAt || body.createdAt || new Date().toISOString()).slice(0, 10);
    const modalidad = text(by(/modalidad/i));
    const up = fields.find((f) => f.type === "FILE_UPLOAD" && Array.isArray(f.value) && (f.value as unknown[]).length);
    const archivo = up ? String(((up.value as { url?: string }[])[0] || {}).url || "") : "";
    // buscar alumno
    const tk = norm(nombre);
    const al = (await q("TutAlumnos").limit(1000).find()).items as { _id: string; title?: string }[];
    let best: { id: string; s: number } | null = null;
    for (const a of al) {
      const at = norm(a.title);
      const hit = tk.filter((w) => at.includes(w)).length;
      const sc = hit >= 2 || (hit === 1 && at.length === 1) ? hit / Math.max(at.length, 1) : 0;
      if (sc > 0 && (!best || sc > best.s)) best = { id: a._id, s: sc };
    }
    if (best) {
      await save("TutEvaluaciones", { _id: best.id + "|" + asc(programa) + "|" + asc(item), alumnoId: best.id, programa, item, ok: nota == null || nota >= 60, nota, fecha, fuente: "Tally", por: "Tally", archivo });
      return new Response(JSON.stringify({ ok: true, alumno: best.id }), { status: 200 });
    }
    await save("TutTally", { _id: String(d.submissionId || d.responseId || crypto.randomUUID()).slice(0, 60), title: nombre || "(sin nombre)", formId: String(d.formId || ""), formName, programa, item, nota, fecha, modalidad, archivo });
    return new Response(JSON.stringify({ ok: true, pendiente: true }), { status: 200 });
  } catch (e) {
    console.error("tally", e);
    return new Response("error", { status: 500 });
  }
};
