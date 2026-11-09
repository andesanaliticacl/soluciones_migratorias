import { NextResponse } from "next/server";
import { MINUTOS_RETENCION } from "@/lib/config";
import { esBloqueValido } from "@/lib/fechas";
import { error, leerJson, parametrosAgenda, permitido, ruta } from "@/lib/servidor";
import { obtenerStore } from "@/lib/store";

export const POST = ruta(async (req: Request) => {
  const store = await obtenerStore();
  // Limita a quien intente bloquear la agenda completa reteniendo horarios.
  if (!(await permitido(store, req, "retener", 15, 3600))) {
    return error("Demasiados intentos. Espera unos minutos.", 429);
  }

  const cuerpo = await leerJson(req);
  const modalidad = cuerpo.modalidad;
  if (modalidad !== "presencial" && modalidad !== "videollamada") return error("Elige una modalidad.", 400);

  const inicio = new Date(typeof cuerpo.inicio === "string" ? cuerpo.inicio : "");
  if (!esBloqueValido(inicio, await parametrosAgenda(store))) return error("Ese horario no está disponible.", 409);

  const holdPrevio = typeof cuerpo.holdPrevio === "string" ? cuerpo.holdPrevio : null;
  const retencion = await store.retenerCita(inicio.toISOString(), modalidad, holdPrevio, MINUTOS_RETENCION);
  if (!retencion) return error("Alguien acaba de tomar ese horario. Elige otro.", 409);

  return NextResponse.json(retencion);
});
