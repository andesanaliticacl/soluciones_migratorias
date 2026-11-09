import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { error, leerJson, permitido, ruta } from "@/lib/servidor";
import { obtenerStore } from "@/lib/store";
import { MAX_ARCHIVOS, TAMANO_MAX_ARCHIVO, TIPOS_ARCHIVO } from "@/lib/validacion";

// Los archivos suben directo a Storage con una URL firmada: Vercel limita el cuerpo de una función a 4,5 MB.
export const POST = ruta(async (req: Request) => {
  const store = await obtenerStore();
  if (!(await permitido(store, req, "subida", 40, 3600))) return error("Demasiados archivos. Espera unos minutos.", 429);

  const { token, mime, tamano } = await leerJson(req);
  const solicitud = typeof token === "string" ? await store.solicitudPorToken(token) : null;
  if (!solicitud) return error("Solicitud no encontrada.", 404);
  if (solicitud.estado === "cerrada") return error("La solicitud ya está cerrada.", 409);

  const tipo = typeof mime === "string" ? TIPOS_ARCHIVO[mime] : undefined;
  if (!tipo) return error("Solo se aceptan archivos PDF, JPG o PNG.", 415);
  if (typeof tamano !== "number" || tamano <= 0 || tamano > TAMANO_MAX_ARCHIVO) {
    return error("Cada archivo puede pesar hasta 10 MB.", 413);
  }
  const existentes = await store.documentosDeSolicitud(solicitud.id);
  if (existentes.length >= MAX_ARCHIVOS) return error(`Máximo ${MAX_ARCHIVOS} archivos por solicitud.`, 409);

  const rutaArchivo = `${solicitud.id}/${randomUUID()}.${tipo.extension}`;
  return NextResponse.json({ ruta: rutaArchivo, url: await store.firmarSubida(rutaArchivo) });
});
