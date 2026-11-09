import { NextResponse } from "next/server";
import { MINUTOS_RETENCION } from "@/lib/config";
import { error, leerJson, permitido, ruta, turnstileValido } from "@/lib/servidor";
import { obtenerStore } from "@/lib/store";
import { validarDatosSolicitud } from "@/lib/validacion";

export const POST = ruta(async (req: Request) => {
  const cuerpo = await leerJson(req);

  // Honeypot: un bot rellena el campo oculto. Se responde como si nada para no darle pistas.
  if (cuerpo.sitio_web) return NextResponse.json({ token: "ok" });

  const store = await obtenerStore();
  if (!(await permitido(store, req, "solicitud", 8, 3600))) {
    return error("Demasiados intentos. Espera unos minutos.", 429);
  }
  if (!(await turnstileValido(cuerpo.turnstile, req))) {
    return error("No pudimos verificar que no eres un robot. Reintenta.", 400);
  }
  if (cuerpo.consentimiento !== true) {
    return error("Debes aceptar el tratamiento de tus datos para continuar.", 400);
  }

  const validacion = validarDatosSolicitud(cuerpo.datos);
  if (!validacion.ok) return error("Revisa los datos ingresados.", 422, { errores: validacion.errores });

  if (typeof cuerpo.holdToken !== "string") return error("Tu reserva de horario venció. Elige otra hora.", 409, { codigo: "HOLD_EXPIRADO" });

  const solicitud = await store.crearSolicitud(validacion.datos, cuerpo.holdToken, MINUTOS_RETENCION);
  if (!solicitud) return error("Tu reserva de horario venció. Elige otra hora.", 409, { codigo: "HOLD_EXPIRADO" });

  return NextResponse.json({ token: solicitud.token });
});
