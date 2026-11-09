import { adminActual } from "@/lib/admin-auth";
import { error, ruta } from "@/lib/servidor";
import { esDemo, obtenerStore } from "@/lib/store";

// Reemplaza a las URLs firmadas de Storage en DEMO_MODE. Fuera de ese modo responde 404.
export const PUT = ruta(async (req: Request) => {
  if (!esDemo()) return error("No encontrado.", 404);
  const rutaArchivo = new URL(req.url).searchParams.get("ruta");
  if (!rutaArchivo) return error("Falta la ruta.", 400);
  const formulario = await req.formData();
  const archivo = formulario.get("");
  if (!(archivo instanceof File)) return error("Falta el archivo.", 400);
  const { guardarArchivoDemo } = await import("@/lib/store/memoria");
  guardarArchivoDemo(rutaArchivo, new Uint8Array(await archivo.arrayBuffer()));
  return new Response(null, { status: 200 });
});

export const GET = ruta(async (req: Request) => {
  if (!esDemo() || !(await adminActual())) return error("No encontrado.", 404);
  const rutaArchivo = new URL(req.url).searchParams.get("ruta") ?? "";
  const bytes = await (await obtenerStore()).leerSubida(rutaArchivo);
  if (!bytes) return error("No encontrado.", 404);
  return new Response(Buffer.from(bytes), { headers: { "Content-Disposition": "attachment" } });
});
