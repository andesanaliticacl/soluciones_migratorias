import type {
  Cita,
  Config,
  DatosSolicitud,
  DiaBloqueado,
  Documento,
  EstadoSolicitud,
  Horario,
  Modalidad,
  Nota,
  Solicitud,
  SolicitudConCita,
} from "../tipos";

export interface FiltroSolicitudes {
  q?: string;
  estado?: EstadoSolicitud;
  limite?: number;
}

/** Todo lo que la app le pide a la persistencia. Implementaciones: Supabase y memoria (demo local). */
export interface Store {
  // Configuración
  obtenerConfig(): Promise<Config>;
  guardarConfig(cambios: Partial<Config>): Promise<void>;
  obtenerHorarios(): Promise<Horario[]>;
  guardarHorarios(horarios: Horario[]): Promise<void>;
  obtenerBloqueados(): Promise<DiaBloqueado[]>;
  agregarBloqueado(dia: DiaBloqueado): Promise<void>;
  quitarBloqueado(fecha: string): Promise<void>;

  // Agenda
  horariosOcupados(): Promise<string[]>;
  retenerCita(inicio: string, modalidad: Modalidad, holdPrevio: string | null, minutos: number): Promise<{ hold_token: string; expira_en: string } | null>;
  citaDeSolicitud(solicitudId: string): Promise<Cita | null>;

  // Solicitudes
  crearSolicitud(datos: DatosSolicitud, holdToken: string, minutos: number): Promise<Solicitud | null>;
  solicitudPorToken(token: string): Promise<Solicitud | null>;
  solicitudPorId(id: string): Promise<Solicitud | null>;
  confirmarSolicitud(id: string): Promise<Solicitud>;
  cambiarEstado(id: string, estado: EstadoSolicitud): Promise<void>;
  listarSolicitudes(filtro: FiltroSolicitudes): Promise<SolicitudConCita[]>;

  // Documentos
  firmarSubida(ruta: string): Promise<string>;
  leerSubida(ruta: string): Promise<Uint8Array | null>;
  borrarSubida(ruta: string): Promise<void>;
  firmarDescarga(ruta: string, nombre: string): Promise<string>;
  registrarDocumento(doc: Omit<Documento, "id" | "creado_en">): Promise<Documento>;
  documentosDeSolicitud(solicitudId: string): Promise<Documento[]>;
  documentoPorId(id: string): Promise<Documento | null>;

  // Notas y notificaciones
  agregarNota(solicitudId: string, autor: string, texto: string): Promise<void>;
  notasDeSolicitud(solicitudId: string): Promise<Nota[]>;
  /** true si este llamador ganó el derecho a enviar por ese canal. */
  reclamarNotificacion(solicitudId: string, canal: string): Promise<boolean>;
  soltarNotificacion(solicitudId: string, canal: string): Promise<void>;
  notificacionesEnviadas(solicitudId: string): Promise<string[]>;

  // Seguridad
  rateLimit(clave: string, maximo: number, ventanaSeg: number): Promise<boolean>;
  esAdmin(userId: string): Promise<boolean>;
}
