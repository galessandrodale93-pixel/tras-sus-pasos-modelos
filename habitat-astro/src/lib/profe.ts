// Profesores de Habitat: quién es quién, sus clases (TutClases.profe) y utilidades compartidas.
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { horario } from "./vol";

export const q = auth.elevate(items.query);
export const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const s = (v: unknown, max = 300) => (typeof v === "string" ? v : v == null ? "" : String(v)).replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, max);
export const nrm = (t: unknown) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
export const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
export const masDias = (f: string, n: number) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);

export type Profe = { _id: string; title?: string; email?: string; clave?: string; gracias?: string; activo?: string };
export type Clase = { _id: string; fecha: string; programa?: string; bloque?: string; title?: string; profe?: string; tipo?: string; nota?: string };

// La clase es de este profe si su nombre aparece en el campo profe (sirve para "Gui y Agus").
export const esDe = (c: Clase, p: Profe) => !!p.title && nrm(c.profe).includes(nrm(p.title));
export const esClase = (c: Clase) => !c.tipo || /clase/i.test(c.tipo);
export const hora = (f: string) => horario(f).clase;

export async function emailDe(request: Request) {
  const token = request.headers.get("x-habitat-auth");
  if (!token) return { email: "", nombre: "" };
  const mr = await fetch("https://www.wixapis.com/members/v1/members/my?fieldsets=FULL", { headers: { authorization: token } });
  if (!mr.ok) return { email: "", nombre: "" };
  const m = (await mr.json()).member || {};
  const c = m.contact || {};
  return { email: String(m.loginEmail || "").toLowerCase(), nombre: String([c.firstName, c.lastName].filter(Boolean).join(" ") || (m.profile || {}).nickname || "") };
}

export async function todos<T>(col: string): Promise<T[]> {
  const out: T[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as T[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as T[])); }
  return out;
}

export async function profeDe(email: string) {
  if (!email) return undefined;
  const ps = await todos<Profe>("Profes");
  return ps.find((p) => p.activo !== "no" && String(p.email || "").toLowerCase().split(/[,;\s]+/).includes(email));
}

// quien organiza: director o con permiso de organizar en TutTutores
export async function organiza(email: string) {
  if (!email) return false;
  const t = (await q("TutTutores").eq("email", email).limit(1).find()).items[0] as { rol?: string; org?: boolean } | undefined;
  return !!t && (t.rol === "director" || !!t.org);
}
