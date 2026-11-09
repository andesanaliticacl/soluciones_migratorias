import type { DiaBloqueado, Horario } from "./tipos";

// Todos los horarios se definen en hora de Chile y se guardan como instantes UTC,
// así el cambio de hora no descuadra las citas.
export const ZONA = "America/Santiago";

export interface PartesLocales {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  diaSemana: number; // 0 = domingo
}

const formateadorPartes = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const DIAS_INGLES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function partesCrudas(fecha: Date): Record<string, string> {
  return Object.fromEntries(formateadorPartes.formatToParts(fecha).map((p) => [p.type, p.value]));
}

export function partesLocales(fecha: Date): PartesLocales {
  const p = partesCrudas(fecha);
  return {
    fecha: `${p.year}-${p.month}-${p.day}`,
    hora: `${p.hour}:${p.minute}`,
    diaSemana: DIAS_INGLES.indexOf(p.weekday),
  };
}

function desfaseMs(fecha: Date): number {
  const p = partesCrudas(fecha);
  const comoUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return comoUtc - Math.floor(fecha.getTime() / 1000) * 1000;
}

/** Convierte "2026-11-04" + "09:30" en hora de Chile al instante UTC. */
export function localAUtc(fecha: string, hora: string): Date {
  const [a, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const ingenuo = Date.UTC(a, m - 1, d, h, min);
  // Dos pasadas: el desfase se recalcula sobre el resultado por si cae al otro lado de un cambio de hora.
  const primera = ingenuo - desfaseMs(new Date(ingenuo));
  return new Date(ingenuo - desfaseMs(new Date(primera)));
}

function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

function minutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function aHora(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export interface Bloque {
  inicio: string; // ISO UTC
  hora: string; // HH:mm local
  libre: boolean;
}

export interface DiaDisponible {
  fecha: string;
  bloques: Bloque[];
}

export interface ParametrosAgenda {
  ahora: Date;
  horarios: Horario[];
  bloqueados: DiaBloqueado[];
  duracionMin: number;
  diasHorizonte: number;
  anticipacionMin: number;
}

/** Bloques posibles según la configuración, sin mirar todavía si están ocupados. */
export function generarBloques(p: ParametrosAgenda): { fecha: string; inicio: Date; hora: string }[] {
  const minimo = p.ahora.getTime() + p.anticipacionMin * 60_000;
  const bloqueados = new Set(p.bloqueados.map((b) => b.fecha));
  const hoy = partesLocales(p.ahora).fecha;
  const salida: { fecha: string; inicio: Date; hora: string }[] = [];

  for (let i = 0; i <= p.diasHorizonte; i++) {
    const fecha = sumarDias(hoy, i);
    if (bloqueados.has(fecha)) continue;
    const [a, m, d] = fecha.split("-").map(Number);
    const diaSemana = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
    const horario = p.horarios.find((h) => h.dia_semana === diaSemana);
    if (!horario?.activo) continue;

    const fin = minutos(horario.hora_fin);
    for (let t = minutos(horario.hora_inicio); t + p.duracionMin <= fin; t += p.duracionMin) {
      const hora = aHora(t);
      const inicio = localAUtc(fecha, hora);
      if (inicio.getTime() >= minimo) salida.push({ fecha, inicio, hora });
    }
  }
  return salida;
}

export function agendaDisponible(p: ParametrosAgenda, ocupados: string[]): DiaDisponible[] {
  const tomados = new Set(ocupados.map((i) => new Date(i).getTime()));
  const dias = new Map<string, Bloque[]>();
  for (const b of generarBloques(p)) {
    const lista = dias.get(b.fecha) ?? [];
    lista.push({ inicio: b.inicio.toISOString(), hora: b.hora, libre: !tomados.has(b.inicio.getTime()) });
    dias.set(b.fecha, lista);
  }
  return [...dias.entries()].map(([fecha, bloques]) => ({ fecha, bloques }));
}

/** El servidor rechaza cualquier inicio que no sea exactamente un bloque de la agenda. */
export function esBloqueValido(inicio: Date, p: ParametrosAgenda): boolean {
  if (Number.isNaN(inicio.getTime())) return false;
  return generarBloques(p).some((b) => b.inicio.getTime() === inicio.getTime());
}

export function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function formatearHora(iso: string): string {
  return partesLocales(new Date(iso)).hora;
}

export function formatearFechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: ZONA,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatearCLP(monto: number): string {
  return `$${monto.toLocaleString("es-CL")}`;
}
