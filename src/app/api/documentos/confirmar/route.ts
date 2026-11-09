import { NextResponse } from "next/server";
import { error, leerJson, ruta } from "@/lib/servidor";
import { obtenerStore } from "@/lib/store";
import { firmaCoincide, TAMANO_MAX_ARCHIVO, TIPOS_ARCHIVO } from "@/lib/validacion";

// Después de subir, el servidor lee el archivo real: tipo y tamaño no se aceptan de palabra.
export const POST = ruta(async (req: Request) => {
  const store = await obtenerStore();
  const { token, ruta: rutaArchivo, mime, nombre } = await leerJson(req);

  const solicitud = typeof token === "string" ? await store.solicitudPorToken(token) : null;
  if (!solicitud) return error("Solicitud no encontrada.", 404);
  if (typeof rutaArchivo !== "string" || !rutaArchivo.startsWith(`${solicitud.id}/`) || rutaArchivo.includes("..")) {
    return error("Archivo no válido.", 400);
  }
  if (typeof mime !== "string" || !TIPOS_ARCHIVO[mime]) return error("Tipo de archivo no permitido.", 415);

  const bytes = await store.leerSubida(rutaArchivo);
  if (!bytes) return error("No encontramos el archivo subido.", 404);
  if (bytes.length === 0 || bytes.length > TAMANO_MAX_ARCHIVO || !firmaCoincide(bytes, mime)) {
    await store.borrarSubida(rutaArchivo);
    return error("El archivo no es un PDF, JPG o PNG válido.", 422);
  }

  const nombreLimpio = (typeof nombre === "string" ? nombre : "documento").replace(/[\\/\r\n\t]/g, " ").trim().slice(0, 150);
  await store.registrarDocumento({
    solicitud_id: solicitud.id,
    storage_path: rutaArchivo,
    nombre: nombreLimpio || "documento",
    mime,
    tamano: bytes.length,
  });
  return NextResponse.json({ ok: true });
});
