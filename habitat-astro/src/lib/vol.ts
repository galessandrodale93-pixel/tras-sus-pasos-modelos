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
