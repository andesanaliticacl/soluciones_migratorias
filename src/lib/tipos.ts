export type EstadoSolicitud = "nueva" | "en_curso" | "cerrada";
export type EstadoCita = "retenida" | "confirmada" | "liberada" | "cancelada";
export type Modalidad = "presencial" | "videollamada";
export type Materia = "proteccion" | "amparo" | "visa" | "regularizar" | "nacionalidad" | "otro";

export const MATERIAS: { id: Materia; etiqueta: string }[] = [
  { id: "proteccion", etiqueta: "Mi trámite no tiene respuesta" },
  { id: "amparo", etiqueta: "Orden de expulsión o abandono" },
  { id: "visa", etiqueta: "Postular o renovar una visa" },
  { id: "regularizar", etiqueta: "Regularizar mi situación" },
  { id: "nacionalidad", etiqueta: "Nacionalidad chilena" },
  { id: "otro", etiqueta: "Otro tema migratorio" },
];

export const ESTADOS: { id: EstadoSolicitud; etiqueta: string }[] = [
  { id: "nueva", etiqueta: "Nueva" },
  { id: "en_curso", etiqueta: "En curso" },
  { id: "cerrada", etiqueta: "Cerrada" },
];

export interface Solicitud {
  id: string;
  token: string;
  numero_atencion: string | null;
  estado: EstadoSolicitud;
  nombre: string;
  rut: string;
  telefono: string;
  correo: string;
  comuna: string;
  materias: Materia[];
  /** País de origen, opcional. */
  nacionalidad: string | null;
  descripcion: string | null;
  consentimiento_en: string;
  enviada_en: string | null;
  cita_conflicto: boolean;
  creado_en: string;
}

export interface Cita {
  id: string;
  solicitud_id: string | null;
  hold_token: string;
  inicio: string;
  modalidad: Modalidad;
  estado: EstadoCita;
  expira_en: string | null;
}

export interface Documento {
  id: string;
  solicitud_id: string;
  storage_path: string;
  nombre: string;
  mime: string;
  tamano: number;
  creado_en: string;
}

export interface Nota {
  id: string;
  solicitud_id: string;
  autor: string;
  texto: string;
  creado_en: string;
}

export interface Horario {
  dia_semana: number; // 0 = domingo
  activo: boolean;
  hora_inicio: string; // HH:mm
  hora_fin: string; // HH:mm
}

export interface DiaBloqueado {
  fecha: string; // YYYY-MM-DD
  motivo: string | null;
}

export interface Testimonio {
  nombre: string;
  /** País de origen, para mostrar que atendemos a personas de distintos lugares. */
  pais: string;
  texto: string;
  /** Mientras sea true el sitio lo rotula como ejemplo, para no publicar un testimonio inventado. */
  ejemplo: boolean;
}

export interface Config {
  duracion_bloque_min: number;
  dias_horizonte: number;
  logo_url: string;
  contadores: {
    casos_evaluados: number;
    casos_gestionados: number;
    anos_experiencia: number;
    /** Igual que en testimonios: true rotula las cifras como de ejemplo. */
    ejemplo: boolean;
  };
  testimonios: Testimonio[];
  contacto: { telefono: string; whatsapp: string; correo: string; direccion: string };
  abogado: { nombre: string; cargo: string; foto_url: string; whatsapp: string; correo: string };
}

export interface DatosSolicitud {
  nombre: string;
  rut: string;
  telefono: string;
  correo: string;
  comuna: string;
  materias: Materia[];
  /** País de origen, opcional. */
  nacionalidad: string | null;
  descripcion: string | null;
}

export type SolicitudConCita = Solicitud & { cita: Cita | null };
