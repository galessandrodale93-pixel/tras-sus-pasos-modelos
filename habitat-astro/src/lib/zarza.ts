// Zarza: músicos invitados (entran con un link personal, sin cuenta), repertorio con tonos y quién ensayó.
// El repertorio vive en el evento de VolEventos (campo canciones, JSON). Lo carga quien organiza (Agustina).
import { auth } from "@wix/essentials";
import { items } from "@wix/data";
import { mandar as mandar0, marco as marco0, p } from "./sem";
import { esc } from "./vol";

export const q = auth.elevate(items.query);
export const save = auth.elevate(items.save);
export const rem = auth.elevate(items.remove);
export const WEB = "https://www.habitat-cfm.org";
const marco = (k: string, t: string, c: string) => marco0(k, t, c, `<a href="${WEB}" style="color:#b8904f">habitat-cfm.org</a>`);
export const mandar = (to: string, asunto: string, html: string, remitente: string) => mandar0(to, asunto, html, remitente, "Habitat CFM · Zarza");

export type Musico = { _id: string; title?: string; email?: string; instrumento?: string; telefono?: string; clave?: string; activo?: string; bienvenida?: string };
export type Cancion = { id: string; t: string; tono?: string; link?: string; nota?: string };
export type Zarza = { _id: string; title?: string; fecha: string; hora?: string; lugar?: string; nota?: string; canciones?: string; llegada?: string; avisoDia?: string; avisoPrevio?: string; avisoRep?: string };
export type Ensayo = { _id: string; fecha: string; musicoId: string; va?: string; ensayadas?: string; nota?: string; title?: string };

export const hoyAR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
export const masDias = (f: string, n: number) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const DL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], MS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const larga = (f: string) => { const d = new Date(f + "T12:00:00Z"); return DL[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MS[d.getUTCMonth()]; };
export const HORA = "19:30";
// los músicos llegan una hora antes, salvo que la Zarza tenga otra hora de llegada cargada
export function llegada(z: Zarza) {
  if (z.llegada && /^\d{2}:\d{2}$/.test(z.llegada)) return z.llegada;
  const [h, m] = (z.hora && /^\d{2}:\d{2}$/.test(z.hora) ? z.hora : HORA).split(":").map(Number);
  const t = h * 60 + m - 60;
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}
export const canciones = (z: Zarza): Cancion[] => { try { const L = JSON.parse(z.canciones || "[]"); return Array.isArray(L) ? L : []; } catch { return []; } };
export const ensayadas = (e?: Ensayo): string[] => { try { const L = JSON.parse((e && e.ensayadas) || "[]"); return Array.isArray(L) ? L : []; } catch { return []; } };
export const linkDe = (m: Musico) => WEB + "/musicos.html?k=" + m.clave;

export async function todos<T>(col: string): Promise<T[]> {
  const out: T[] = [];
  let r = await q(col).limit(1000).find();
  out.push(...(r.items as T[]));
  while (r.hasNext()) { r = await r.next(); out.push(...(r.items as T[])); }
  return out;
}
export const proximas = async (desde = hoyAR()) => ((await q("VolEventos").eq("tipo", "zarza").ge("fecha", desde).ascending("fecha").limit(10).find()).items as Zarza[]);

const btn = (href: string, t: string) => `<p style="margin:18px 0"><a href="${href}" style="background:#10251d;color:#fbf8f2;font:700 15px Arial;padding:12px 20px;border-radius:999px;text-decoration:none">${t}</a></p>`;
const nom = (m: Musico) => esc(String(m.title || "").split(/\s+/)[0]);
const lista = (L: Cancion[]) => L.length ? `<ol style="font:16px/1.8 Arial;margin:0 0 12px;padding-left:22px">${L.map((c) => `<li><b>${esc(c.t)}</b>${c.tono ? ` · tono <b>${esc(c.tono)}</b>` : ""}${c.link ? ` · <a href="${esc(c.link)}" style="color:#b8904f">escuchar</a>` : ""}</li>`).join("")}</ol>` : "";
const cuando = (z: Zarza) => `<b>${esc(larga(z.fecha))}</b>, empieza a las <b>${esc(z.hora || HORA)}</b> y a los músicos los esperamos a las <b>${esc(llegada(z))}</b>${z.lugar ? " en " + esc(z.lugar) : ""}`;

export const mailBienvenida = (m: Musico, z?: Zarza) => marco("Habitat · Zarza", "¡Bienvenido al equipo de músicos! 🎶", `${p(`Hola ${nom(m)}! Gracias por sumarte a tocar en la Zarza de Habitat. Armamos un lugar para vos, sin cuentas ni contraseñas: entrás con tu link personal.`)}${p("Ahí vas a ver la próxima Zarza, las canciones con sus tonos para ensayar, y podés marcar cuáles ya ensayaste y si podés venir.")}${z ? p("La próxima es el " + cuando(z) + ".") : ""}${btn(linkDe(m), "Abrir mi lugar de músico")}${p("Guardá este mail: el link es solo tuyo.")}`);
export const mailRepertorio = (m: Musico, z: Zarza) => marco("Habitat · Zarza", "Ya está el repertorio 🎶", `${p(`Hola ${nom(m)}! Ya cargamos las canciones de la Zarza del ${cuando(z)}.`)}${lista(canciones(z))}${p("Entrá a tu lugar para escucharlas, marcar las que vas ensayando y confirmarnos si venís.")}${btn(linkDe(m), "Ver repertorio y confirmar")}`);
export const mailPrevio = (m: Musico, z: Zarza, faltan: number) => marco("Habitat · Zarza", "Se viene la Zarza 🔥", `${p(`Hola ${nom(m)}! Te recordamos que la Zarza es el ${cuando(z)}.`)}${lista(canciones(z))}${faltan ? p(`Te ${faltan === 1 ? "queda 1 canción" : "quedan " + faltan + " canciones"} por marcar como ensayada. ¡Todavía hay tiempo!`) : ""}${btn(linkDe(m), "Abrir el repertorio")}`);
export const mailDia = (m: Musico, z: Zarza) => marco("Habitat · Zarza", "¡Hoy es la Zarza! 🔥", `${p(`Hola ${nom(m)}! Hoy tocamos juntos. Te esperamos a las <b>${esc(llegada(z))}</b> para armar y probar sonido (la Zarza empieza a las ${esc(z.hora || HORA)})${z.lugar ? " en " + esc(z.lugar) : ""}.`)}${lista(canciones(z))}${z.nota ? p(esc(z.nota)) : ""}${btn(linkDe(m), "Ver el repertorio")}${p("Gracias por servir con tu música. Que Su fuego se encienda en cada canción 🙌🏽")}`);

// Aviso diario (desde /api/avisos): 3 días antes, recordatorio con el repertorio; el mismo día, que vengan una hora antes.
export async function zarzaDiario(hoy: string, dry: boolean, remitente: string) {
  const zs = (await proximas(hoy)).filter((z) => z.fecha === hoy || z.fecha === masDias(hoy, 3));
  if (!zs.length) return { zarza: "nada" };
  const ms = (await todos<Musico>("ZarMusicos")).filter((m) => m.activo !== "no" && m.email);
  const out: unknown[] = [];
  for (const z of zs) {
    const dia = z.fecha === hoy, marca = dia ? "avisoDia" : "avisoPrevio";
    if (z[marca as keyof Zarza]) continue;
    const ens = (await q("ZarEnsayos").eq("fecha", z.fecha).limit(500).find()).items as Ensayo[];
    const L = canciones(z);
    let ok = 0;
    for (const m of ms) {
      const e = ens.find((x) => x.musicoId === m._id);
      if (e && e.va === "no") continue; // avisó que no puede
      if (dry) { ok++; continue; }
      const faltan = L.filter((c) => !ensayadas(e).includes(c.id)).length;
      const r = await mandar(m.email as string, dia ? "Hoy es la Zarza: te esperamos a las " + llegada(z) + " 🎶" : "La Zarza es el " + larga(z.fecha) + " 🎶", dia ? mailDia(m, z) : mailPrevio(m, z, faltan), remitente);
      if (r.ok) ok++;
    }
    if (!dry) { const { _createdDate, _updatedDate, _owner, ...rest } = z as Zarza & Record<string, unknown>; await save("VolEventos", { ...rest, [marca]: hoy }); }
    out.push({ fecha: z.fecha, tipo: dia ? "día" : "3 días antes", enviados: ok });
  }
  return out;
}
