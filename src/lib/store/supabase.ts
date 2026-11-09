import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { combinarConfig } from "../config";
import type { Cita, Config, DiaBloqueado, Documento, Horario, Nota, Solicitud, SolicitudConCita } from "../tipos";
import { formatearRut, validarRut } from "../validacion";
import type { Store } from "./tipos";

const BUCKET = "documentos";
const SEGUNDOS_DESCARGA = 120;

let cliente: SupabaseClient | null = null;

function db(): SupabaseClient {
  cliente ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

function sinError<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

const hhmm = (hora: string) => hora.slice(0, 5);

export const storeSupabase: Store = {
  async obtenerConfig() {
    const fila = sinError(await db().from("configuracion").select("datos").eq("id", 1).maybeSingle());
    return combinarConfig((fila?.datos ?? null) as Partial<Config> | null);
  },
  async guardarConfig(cambios) {
    const fila = sinError(await db().from("configuracion").select("datos").eq("id", 1).maybeSingle());
    const datos = { ...((fila?.datos ?? {}) as object), ...cambios };
    sinError(await db().from("configuracion").upsert({ id: 1, datos, actualizado_en: new Date().toISOString() }));
  },
  async obtenerHorarios() {
    const filas = sinError(await db().from("horarios").select("*").order("dia_semana")) as Horario[];
    return filas.map((h) => ({ ...h, hora_inicio: hhmm(h.hora_inicio), hora_fin: hhmm(h.hora_fin) }));
  },
  async guardarHorarios(horarios) {
    sinError(await db().from("horarios").upsert(horarios));
  },
  async obtenerBloqueados() {
    return sinError(await db().from("dias_bloqueados").select("*").order("fecha")) as DiaBloqueado[];
  },
  async agregarBloqueado(dia) {
    sinError(await db().from("dias_bloqueados").upsert(dia));
  },
  async quitarBloqueado(fecha) {
    sinError(await db().from("dias_bloqueados").delete().eq("fecha", fecha));
  },

  async horariosOcupados() {
    const ahora = new Date().toISOString();
    const filas = sinError(
      await db()
        .from("citas")
        .select("inicio")
        .gte("inicio", ahora)
        .or(`estado.eq.confirmada,and(estado.eq.retenida,expira_en.gt.${ahora})`),
    ) as { inicio: string }[];
    return filas.map((f) => f.inicio);
  },
  async retenerCita(inicio, modalidad, holdPrevio, minutos) {
    const filas = sinError(
      await db().rpc("retener_cita", {
        p_inicio: inicio,
        p_modalidad: modalidad,
        p_hold_previo: holdPrevio,
        p_minutos: minutos,
      }),
    ) as { hold_token: string; expira_en: string }[];
    return filas[0] ?? null;
  },
  async citaDeSolicitud(solicitudId) {
    const filas = sinError(
      await db().from("citas").select("*").eq("solicitud_id", solicitudId).order("creado_en", { ascending: false }).limit(1),
    ) as Cita[];
    return filas[0] ?? null;
  },

  async crearSolicitud(datos, holdToken, minutos) {
    const { data, error } = await db().rpc("crear_solicitud", {
      p_datos: datos,
      p_hold_token: holdToken,
      p_minutos: minutos,
    });
    if (error?.message.includes("HOLD_EXPIRADO")) return null;
    if (error) throw new Error(error.message);
    return data as Solicitud;
  },
  async solicitudPorToken(token) {
    return sinError(await db().from("solicitudes").select("*").eq("token", token).maybeSingle()) as Solicitud | null;
  },
  async solicitudPorId(id) {
    return sinError(await db().from("solicitudes").select("*").eq("id", id).maybeSingle()) as Solicitud | null;
  },
  async confirmarSolicitud(id) {
    return sinError(await db().rpc("confirmar_solicitud", { p_solicitud_id: id })) as Solicitud;
  },
  async cambiarEstado(id, estado) {
    sinError(await db().from("solicitudes").update({ estado }).eq("id", id));
  },
  async listarSolicitudes({ q, estado, limite = 200 }) {
    let consulta = db()
      .from("solicitudes")
      .select("*, citas(*)")
      .order("creado_en", { ascending: false })
      .limit(limite);
    if (estado) consulta = consulta.eq("estado", estado);

    // Quita los caracteres con significado para el filtro de PostgREST.
    const texto = q?.replace(/[,()%*"\\:]/g, " ").trim();
    if (texto) {
      const rut = validarRut(texto) ? formatearRut(texto) : texto;
      consulta = consulta.or(`nombre.ilike.%${texto}%,rut.ilike.%${rut}%,numero_atencion.ilike.%${texto}%`);
    }
    const filas = sinError(await consulta) as (Solicitud & { citas: Cita[] })[];
    return filas.map(({ citas, ...s }): SolicitudConCita => ({ ...s, cita: citas[citas.length - 1] ?? null }));
  },

  async firmarSubida(ruta) {
    const r = sinError(await db().storage.from(BUCKET).createSignedUploadUrl(ruta));
    return r!.signedUrl;
  },
  async leerSubida(ruta) {
    const { data, error } = await db().storage.from(BUCKET).download(ruta);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  },
  async borrarSubida(ruta) {
    await db().storage.from(BUCKET).remove([ruta]);
  },
  async firmarDescarga(ruta, nombre) {
    const r = sinError(await db().storage.from(BUCKET).createSignedUrl(ruta, SEGUNDOS_DESCARGA, { download: nombre }));
    return r!.signedUrl;
  },
  async registrarDocumento(doc) {
    return sinError(await db().from("documentos").insert(doc).select().single()) as Documento;
  },
  async documentosDeSolicitud(solicitudId) {
    return sinError(await db().from("documentos").select("*").eq("solicitud_id", solicitudId).order("creado_en")) as Documento[];
  },
  async documentoPorId(id) {
    return sinError(await db().from("documentos").select("*").eq("id", id).maybeSingle()) as Documento | null;
  },

  async agregarNota(solicitudId, autor, texto) {
    sinError(await db().from("notas_internas").insert({ solicitud_id: solicitudId, autor, texto }));
  },
  async notasDeSolicitud(solicitudId) {
    return sinError(
      await db().from("notas_internas").select("*").eq("solicitud_id", solicitudId).order("creado_en", { ascending: false }),
    ) as Nota[];
  },
  async reclamarNotificacion(solicitudId, canal) {
    const filas = sinError(
      await db()
        .from("notificaciones")
        .upsert({ solicitud_id: solicitudId, canal }, { onConflict: "solicitud_id,canal", ignoreDuplicates: true })
        .select(),
    ) as unknown[];
    return filas.length > 0;
  },
  async soltarNotificacion(solicitudId, canal) {
    sinError(await db().from("notificaciones").delete().eq("solicitud_id", solicitudId).eq("canal", canal));
  },
  async notificacionesEnviadas(solicitudId) {
    const filas = sinError(await db().from("notificaciones").select("canal").eq("solicitud_id", solicitudId)) as { canal: string }[];
    return filas.map((f) => f.canal);
  },

  async rateLimit(clave, maximo, ventanaSeg) {
    return sinError(
      await db().rpc("rate_limit_hit", { p_clave: clave, p_max: maximo, p_ventana_seg: ventanaSeg }),
    ) as boolean;
  },
  async esAdmin(userId) {
    const fila = sinError(await db().from("admin_usuarios").select("user_id").eq("user_id", userId).maybeSingle());
    return !!fila;
  },
};
