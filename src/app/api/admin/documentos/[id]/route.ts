import { NextResponse } from "next/server";
import { adminActual } from "@/lib/admin-auth";
import { error, ruta } from "@/lib/servidor";
import { obtenerStore } from "@/lib/store";

// Redirige a una URL firmada de corta duración; el bucket nunca es público.
export const GET = ruta(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  if (!(await adminActual())) return error("No autorizado.", 401);
  const { id } = await params;
  const store = await obtenerStore();
  const documento = await store.documentoPorId(id);
  if (!documento) return error("Documento no encontrado.", 404);
  const url = await store.firmarDescarga(documento.storage_path, documento.nombre);
  return NextResponse.redirect(new URL(url, req.url));
});
