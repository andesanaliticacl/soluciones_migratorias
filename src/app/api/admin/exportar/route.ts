import { adminActual } from "@/lib/admin-auth";
import { formatearFechaHora } from "@/lib/fechas";
import { error, ruta } from "@/lib/servidor";
import { obtenerStore } from "@/lib/store";
import { ESTADOS, type EstadoSolicitud } from "@/lib/tipos";

function celda(valor: string | number | null | undefined): string {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  // Evita que Excel interprete como fórmula un dato ingresado por el público.
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

export const GET = ruta(async (req: Request) => {
  if (!(await adminActual())) return error("No autorizado.", 401);

  const url = new URL(req.url);
  const estado = url.searchParams.get("estado");
  const filas = await (await obtenerStore()).listarSolicitudes({
    q: url.searchParams.get("q") ?? undefined,
    estado: ESTADOS.some((e) => e.id === estado) ? (estado as EstadoSolicitud) : undefined,
    limite: 5000,
  });

  const encabezado = ["Número", "Estado", "Creada", "Nombre", "RUT", "Teléfono", "Correo", "Comuna", "Materias", "Nacionalidad", "Descripción", "Cita", "Modalidad"];
  const lineas = filas.map((s) =>
    [
      s.numero_atencion,
      s.estado,
      formatearFechaHora(s.creado_en),
      s.nombre,
      s.rut,
      s.telefono,
      s.correo,
      s.comuna,
      s.materias.join(", "),
      s.nacionalidad,
      s.descripcion,
      s.cita ? formatearFechaHora(s.cita.inicio) : "",
      s.cita?.modalidad,
    ]
      .map(celda)
      .join(";"),
  );

  // Punto y coma y BOM: así lo abre bien Excel con configuración regional de Chile.
  const csv = `﻿${encabezado.map(celda).join(";")}\r\n${lineas.join("\r\n")}\r\n`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="solicitudes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
