// Datos compartidos del servicio de voluntarios.
export const TAREAS = ["Limpieza y sillas", "Audio", "Diapositivas", "Zoom", "Asistencia presencial", "Asistencia online"];

// Hora de la clase y de llegada (30 minutos antes) según el día.
export function horario(fecha: string) {
  const dow = new Date(fecha + "T12:00:00-03:00").getUTCDay();
  return dow === 6 ? { clase: "10:00", llegada: "09:30", dia: "sábado" } : { clase: "19:30", llegada: "19:00", dia: dow === 3 ? "miércoles" : dow === 4 ? "jueves" : "día de clase" };
}

const ANIMO = [
  "Gracias por servir con tanto amor. Cada detalle que cuidás prepara el lugar para que otros se encuentren con Dios, y el Señor ve todo lo que hacés en lo secreto.",
  "Tu servicio es parte de lo que Dios está haciendo en cada alumno. Gracias por tu tiempo y tu entrega: el Señor ve tu corazón y lo honra.",
  "Lo que hacés con alegría y en lo escondido tiene muchísimo valor delante de Dios. Gracias por ser parte de Habitat.",
  "Gracias por estar. Tu servicio sostiene lo que otros reciben, y el Señor ve cada silla acomodada y cada cable conectado.",
  "Servir también es adorar. Gracias por hacerlo con excelencia y con un corazón dispuesto (Colosenses 3:23-24).",
  "Hoy tu servicio abre camino para que la Palabra llegue a muchos. Gracias de corazón: el Señor ve y recompensa lo que hacés para Él.",
];
export function animo(seed: string) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ANIMO[h % ANIMO.length];
}
export const esc = (t: unknown) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

// Fechas especiales del servicio: Zarza (músicos), tiempo de mesa por Zoom (encargados) y Selah (encargado y voluntarios).
export const ESPECIALES: Record<string, { pref: string; titulo: string; icono: string }> = {
  zarza: { pref: "Zarza", titulo: "Zarza", icono: "🎶" },
  mesa: { pref: "Tiempo de mesa", titulo: "Tiempo de mesa por Zoom", icono: "🍽️" },
  selah: { pref: "Selah", titulo: "Selah", icono: "📖" },
};
export function tipoTarea(t: string) {
  for (const [k, v] of Object.entries(ESPECIALES)) if (t.startsWith(v.pref)) return k;
  return "clase";
}
export type Ev = { tipo: string; fecha: string; hora?: string; lugar?: string; link?: string; versiculos?: string; nota?: string; title?: string };
export type Grupo = { fecha: string; tipo: string; titulo: string; icono: string; tareas: string[]; notas: string[]; llegada: string; inicio: string; lugar: string; link: string; versiculos: string; encargado: boolean; manana: boolean };
// agrupa los turnos de una persona en un día: el servicio de la clase y cada fecha especial por separado
export function grupos(fecha: string, ts: { tarea: string; nota?: string }[], evs: Ev[]): Grupo[] {
  const by: Record<string, { tarea: string; nota?: string }[]> = {};
  ts.forEach((t) => (by[tipoTarea(t.tarea)] = by[tipoTarea(t.tarea)] || []).push(t));
  return Object.keys(by).map((tipo) => {
    const L = by[tipo];
    if (tipo === "clase") { const h = horario(fecha); return { fecha, tipo, titulo: "Servicio en la clase", icono: "🙌🏽", tareas: L.map((t) => t.tarea), notas: L.map((t) => t.nota || "").filter(Boolean), llegada: h.llegada, inicio: h.clase, lugar: "Habitat CFM", link: "", versiculos: "", encargado: false, manana: h.dia === "sábado" }; }
    const e = evs.find((x) => x.tipo === tipo && x.fecha === fecha) || ({} as Ev), E = ESPECIALES[tipo];
    const hora = e.hora || "";
    return { fecha, tipo, titulo: e.title || E.titulo, icono: E.icono, tareas: L.map((t) => (t.nota ? t.tarea + " (" + t.nota + ")" : t.tarea)), notas: e.nota ? [e.nota] : [], llegada: hora, inicio: hora, lugar: e.lugar || (tipo === "mesa" ? "Zoom" : "Habitat CFM"), link: e.link || "", versiculos: e.versiculos || "", encargado: L.some((t) => /encargad/i.test(t.tarea) || tipo === "mesa"), manana: !hora || hora < "13:00" };
  });
}
