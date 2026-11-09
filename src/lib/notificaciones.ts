import { urlSitio } from "./config";
import { formatearFecha, formatearHora } from "./fechas";
import { correoConfigurado, enviarCorreo, enviarPlantillaWhatsApp, plantillaCorreo, whatsappConfigurado } from "./mensajeria";
import type { Store } from "./store/tipos";
import type { Solicitud } from "./tipos";
import { telefonoE164 } from "./validacion";

interface Envio {
  canal: string;
  disponible: boolean;
  enviar: () => Promise<void>;
}

/** Cada canal se reclama antes de enviar y se suelta si falla: reintentar no duplica lo ya enviado. */
async function ejecutarEnvios(store: Store, solicitudId: string, envios: Envio[]): Promise<boolean> {
  let todoBien = true;
  for (const envio of envios) {
    if (!envio.disponible) {
      console.warn(`Notificación omitida (${envio.canal}): canal sin configurar.`);
      continue;
    }
    if (!(await store.reclamarNotificacion(solicitudId, envio.canal))) continue;
    try {
      await envio.enviar();
    } catch (error) {
      console.error(`Falló la notificación ${envio.canal} de ${solicitudId}`, error);
      await store.soltarNotificacion(solicitudId, envio.canal);
      todoBien = false;
    }
  }
  return todoBien;
}

/** Avisa a la persona y al abogado. Devuelve false si algún canal falló. */
export async function enviarAvisosDeSolicitud(store: Store, s: Solicitud): Promise<boolean> {
  const [cita, config] = await Promise.all([store.citaDeSolicitud(s.id), store.obtenerConfig()]);
  const numero = s.numero_atencion!;
  const fecha = cita && !s.cita_conflicto ? formatearFecha(cita.inicio) : "por coordinar";
  const hora = cita && !s.cita_conflicto ? formatearHora(cita.inicio) : "por coordinar";
  const enlacePanel = `${urlSitio()}/admin/solicitudes/${s.id}`;
  const primerNombre = s.nombre.split(" ")[0];
  const filas: [string, string][] = [
    ["Número de atención", numero],
    ["Fecha", fecha],
    ["Hora", hora],
    ["Modalidad", cita?.modalidad === "videollamada" ? "Videollamada" : "Presencial"],
  ];
  const plantillaCliente = process.env.WHATSAPP_TEMPLATE_CLIENTE || "solicitud_en_curso";
  const plantillaAbogado = process.env.WHATSAPP_TEMPLATE_ABOGADO || "aviso_nueva_solicitud";

  return ejecutarEnvios(store, s.id, [
    {
      canal: "whatsapp_cliente",
      // La plantilla afirma una fecha: si el horario se perdió, el aviso va por correo y lo coordina el abogado.
      disponible: whatsappConfigurado() && !s.cita_conflicto,
      enviar: () => enviarPlantillaWhatsApp(telefonoE164(s.telefono), plantillaCliente, [primerNombre, numero, fecha, hora]),
    },
    {
      canal: "whatsapp_abogado",
      disponible: whatsappConfigurado() && !!config.abogado.whatsapp,
      enviar: () =>
        enviarPlantillaWhatsApp(config.abogado.whatsapp, plantillaAbogado, [
          numero,
          s.nombre,
          s.cita_conflicto ? "por coordinar: el horario se perdió" : `${fecha} a las ${hora}`,
          enlacePanel,
        ]),
    },
    {
      canal: "correo_cliente",
      disponible: correoConfigurado(),
      enviar: () =>
        enviarCorreo(
          s.correo,
          `Recibimos tu caso: ${numero}`,
          plantillaCorreo(
            `Hola ${primerNombre}, recibimos tu caso`,
            filas,
            s.cita_conflicto
              ? "El horario que elegiste ya no estaba disponible. Un abogado te contactará para coordinar una nueva hora."
              : "Un abogado revisará tus antecedentes y te contactará dentro de las próximas 24 horas.",
          ),
        ),
    },
    {
      canal: "correo_abogado",
      disponible: correoConfigurado() && !!config.abogado.correo,
      enviar: () =>
        enviarCorreo(
          config.abogado.correo,
          `Nueva solicitud ${numero}: ${s.nombre}`,
          plantillaCorreo(
            "Nueva solicitud de evaluación",
            [["Cliente", s.nombre], ["RUT", s.rut], ["Teléfono", s.telefono], ...filas],
            s.cita_conflicto ? "Atención: hay que coordinar una nueva hora con esta persona." : "Revisa el caso en el panel antes de la cita.",
            { texto: "Abrir en el panel", url: enlacePanel },
          ),
        ),
    },
  ]);
}
