import { randomBytes, randomUUID } from "node:crypto";
import { combinarConfig, HORARIOS_POR_DEFECTO } from "../config";
import type { Cita, Config, DiaBloqueado, Documento, Horario, Nota, Solicitud } from "../tipos";
import type { Store } from "./tipos";

// Solo para DEMO_MODE en local: refleja las reglas de supabase/schema.sql sin base de datos.
interface Estado {
  config: Partial<Config>;
  horarios: Horario[];
  bloqueados: DiaBloqueado[];
  solicitudes: Solicitud[];
  citas: Cita[];
  documentos: Documento[];
  notas: Nota[];
  notificaciones: Set<string>;
  limites: Map<string, { n: number; hasta: number }>;
  archivos: Map<string, Uint8Array>;
  correlativo: number;
}

const g = globalThis as unknown as { __migratoria?: Estado };
const db: Estado = (g.__migratoria ??= {
  config: {},
  horarios: HORARIOS_POR_DEFECTO,
  bloqueados: [],
  solicitudes: [],
  citas: [],
  documentos: [],
  notas: [],
  notificaciones: new Set(),
  limites: new Map(),
  archivos: new Map(),
  correlativo: 0,
});

const ahora = () => new Date().toISOString();
const minutosDesdeAhora = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
const vencida = (c: Cita) => c.estado === "retenida" && !!c.expira_en && new Date(c.expira_en).getTime() <= Date.now();
const activa = (c: Cita) => (c.estado === "retenida" && !vencida(c)) || c.estado === "confirmada";
const mismoInicio = (a: string, b: string) => new Date(a).getTime() === new Date(b).getTime();
const citaDe = (id: string) => db.citas.find((c) => c.solicitud_id === id) ?? null;

export const storeMemoria: Store = {
  async obtenerConfig() {
    return combinarConfig(db.config);
  },
  async guardarConfig(cambios) {
    db.config = { ...db.config, ...cambios };
  },
  async obtenerHorarios() {
    return db.horarios;
  },
  async guardarHorarios(horarios) {
    db.horarios = horarios;
  },
  async obtenerBloqueados() {
    return [...db.bloqueados].sort((a, b) => a.fecha.localeCompare(b.fecha));
  },
  async agregarBloqueado(dia) {
    db.bloqueados = [...db.bloqueados.filter((b) => b.fecha !== dia.fecha), dia];
  },
  async quitarBloqueado(fecha) {
    db.bloqueados = db.bloqueados.filter((b) => b.fecha !== fecha);
  },

  async horariosOcupados() {
    return db.citas.filter(activa).map((c) => c.inicio);
  },
  async retenerCita(inicio, modalidad, holdPrevio, minutos) {
    if (holdPrevio) {
      const previa = db.citas.find((c) => c.hold_token === holdPrevio && c.estado === "retenida" && !c.solicitud_id);
      if (previa) previa.estado = "liberada";
    }
    if (db.citas.some((c) => activa(c) && mismoInicio(c.inicio, inicio))) return null;
    const cita: Cita = {
      id: randomUUID(),
      solicitud_id: null,
      hold_token: randomBytes(24).toString("hex"),
      inicio,
      modalidad,
      estado: "retenida",
      expira_en: minutosDesdeAhora(minutos),
    };
    db.citas.push(cita);
    return { hold_token: cita.hold_token, expira_en: cita.expira_en! };
  },
  async citaDeSolicitud(solicitudId) {
    return citaDe(solicitudId);
  },

  async crearSolicitud(datos, holdToken, minutos) {
    const cita = db.citas.find((c) => c.hold_token === holdToken);
    if (!cita || !activa(cita) || cita.solicitud_id) return null;
    const solicitud: Solicitud = {
      ...datos,
      id: randomUUID(),
      token: randomBytes(24).toString("hex"),
      numero_atencion: null,
      estado: "nueva",
      consentimiento_en: ahora(),
      enviada_en: null,
      cita_conflicto: false,
      creado_en: ahora(),
    };
    db.solicitudes.push(solicitud);
    cita.solicitud_id = solicitud.id;
    cita.expira_en = minutosDesdeAhora(minutos);
    return solicitud;
  },
  async solicitudPorToken(token) {
    return db.solicitudes.find((s) => s.token === token) ?? null;
  },
  async solicitudPorId(id) {
    return db.solicitudes.find((s) => s.id === id) ?? null;
  },
  async confirmarSolicitud(id) {
    const s = db.solicitudes.find((x) => x.id === id);
    if (!s) throw new Error("SOLICITUD_NO_ENCONTRADA");
    if (s.numero_atencion) return s;
    const cita = citaDe(id);
    const tomado = !cita || db.citas.some((c) => c !== cita && activa(c) && mismoInicio(c.inicio, cita.inicio));
    if (tomado) {
      s.cita_conflicto = true;
      await this.agregarNota(id, "Sistema", "Al enviar la solicitud, el horario ya estaba tomado por otra persona: coordinar una nueva hora.");
    } else {
      cita.estado = "confirmada";
      cita.expira_en = null;
    }
    db.correlativo += 1;
    s.numero_atencion = `SM-${String(db.correlativo).padStart(6, "0")}`;
    s.estado = "en_curso";
    s.enviada_en = ahora();
    return s;
  },
  async cambiarEstado(id, estado) {
    const s = db.solicitudes.find((x) => x.id === id);
    if (s) s.estado = estado;
  },
  async listarSolicitudes({ q, estado, limite = 200 }) {
    const texto = q?.trim().toLowerCase();
    return db.solicitudes
      .filter((s) => !estado || s.estado === estado)
      .filter(
        (s) =>
          !texto ||
          s.nombre.toLowerCase().includes(texto) ||
          s.rut.toLowerCase().includes(texto) ||
          s.rut.replace(/\./g, "").toLowerCase().includes(texto) ||
          (s.numero_atencion ?? "").toLowerCase().includes(texto),
      )
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
      .slice(0, limite)
      .map((s) => ({ ...s, cita: citaDe(s.id) }));
  },

  async firmarSubida(ruta) {
    return `/api/demo/upload?ruta=${encodeURIComponent(ruta)}`;
  },
  async leerSubida(ruta) {
    return db.archivos.get(ruta) ?? null;
  },
  async borrarSubida(ruta) {
    db.archivos.delete(ruta);
  },
  async firmarDescarga(ruta) {
    return `/api/demo/upload?ruta=${encodeURIComponent(ruta)}`;
  },
  async registrarDocumento(doc) {
    const nuevo: Documento = { ...doc, id: randomUUID(), creado_en: ahora() };
    db.documentos.push(nuevo);
    return nuevo;
  },
  async documentosDeSolicitud(solicitudId) {
    return db.documentos.filter((d) => d.solicitud_id === solicitudId);
  },
  async documentoPorId(id) {
    return db.documentos.find((d) => d.id === id) ?? null;
  },

  async agregarNota(solicitudId, autor, texto) {
    db.notas.push({ id: randomUUID(), solicitud_id: solicitudId, autor, texto, creado_en: ahora() });
  },
  async notasDeSolicitud(solicitudId) {
    return db.notas.filter((n) => n.solicitud_id === solicitudId).reverse();
  },
  async reclamarNotificacion(solicitudId, canal) {
    const clave = `${solicitudId}:${canal}`;
    if (db.notificaciones.has(clave)) return false;
    db.notificaciones.add(clave);
    return true;
  },
  async soltarNotificacion(solicitudId, canal) {
    db.notificaciones.delete(`${solicitudId}:${canal}`);
  },
  async notificacionesEnviadas(solicitudId) {
    return [...db.notificaciones].filter((c) => c.startsWith(`${solicitudId}:`)).map((c) => c.split(":")[1]);
  },

  async rateLimit(clave, maximo, ventanaSeg) {
    const actual = db.limites.get(clave);
    if (!actual || actual.hasta <= Date.now()) {
      db.limites.set(clave, { n: 1, hasta: Date.now() + ventanaSeg * 1000 });
      return true;
    }
    actual.n += 1;
    return actual.n <= maximo;
  },
  async esAdmin() {
    return true;
  },
};

/** Lo usa la ruta de subida de demo, que reemplaza a las URLs firmadas de Storage. */
export function guardarArchivoDemo(ruta: string, bytes: Uint8Array) {
  db.archivos.set(ruta, bytes);
}
