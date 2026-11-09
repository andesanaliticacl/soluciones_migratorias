import { ESTADOS, type EstadoSolicitud } from "@/lib/tipos";

const CLASES: Record<EstadoSolicitud, string> = {
  nueva: "bg-marino/8 text-marino",
  en_curso: "bg-limpio-claro text-limpio",
  cerrada: "bg-fondo text-tenue",
};

export function EtiquetaEstado({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${CLASES[estado]}`}>
      {ESTADOS.find((e) => e.id === estado)?.etiqueta}
    </span>
  );
}
