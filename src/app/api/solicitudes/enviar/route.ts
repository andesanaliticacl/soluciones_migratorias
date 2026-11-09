import { NextResponse } from "next/server";
import { enviarAvisosDeSolicitud } from "@/lib/notificaciones";
import { error, leerJson, permitido, ruta } from "@/lib/servidor";
import { obtenerStore } from "@/lib/store";

// Último paso del formulario, cuando los documentos ya subieron: genera el número y avisa.
export const POST = ruta(async (req: Request) => {
  const store = await obtenerStore();
  if (!(await permitido(store, req, "enviar", 20, 3600))) return error("Demasiados intentos. Espera unos minutos.", 429);

  const { token } = await leerJson(req);
  const solicitud = typeof token === "string" ? await store.solicitudPorToken(token) : null;
  if (!solicitud) return error("Solicitud no encontrada.", 404);

  const confirmada = await store.confirmarSolicitud(solicitud.id);
  // Un aviso fallido no invalida la solicitud: queda registrada y a la vista en el panel.
  await enviarAvisosDeSolicitud(store, confirmada);
  return NextResponse.json({ numero: confirmada.numero_atencion });
});
