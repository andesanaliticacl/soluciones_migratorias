import Link from "next/link";
import { EtiquetaEstado } from "@/components/admin/EtiquetaEstado";
import { formatearFechaHora } from "@/lib/fechas";
import { obtenerStore } from "@/lib/store";
import { ESTADOS, type EstadoSolicitud } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function PaginaSolicitudes({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { q, estado: estadoCrudo } = await searchParams;
  const estado = ESTADOS.some((e) => e.id === estadoCrudo) ? (estadoCrudo as EstadoSolicitud) : undefined;
  const solicitudes = await (await obtenerStore()).listarSolicitudes({ q, estado });

  const consulta = (e?: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (e) p.set("estado", e);
    return p.size ? `?${p}` : "";
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-marino">Solicitudes</h1>
        <a href={`/api/admin/exportar${consulta(estado)}`} className="rounded-lg border border-linea bg-white px-3 py-2 text-sm font-medium text-marino hover:border-marino/40">
          Exportar CSV
        </a>
      </div>

      <form className="mt-5 flex gap-2">
        {estado && <input type="hidden" name="estado" value={estado} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          aria-label="Buscar"
          placeholder="Buscar por nombre, RUT o número de atención"
          className="h-11 flex-1 rounded-xl border border-linea bg-white px-4 text-sm text-marino outline-none focus:border-marino"
        />
        <button type="submit" className="h-11 rounded-xl bg-marino px-5 text-sm font-semibold text-white">Buscar</button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5 text-sm">
        <Link href={`/admin${consulta()}`} className={`rounded-full px-3 py-1.5 ${!estado ? "bg-marino text-white" : "bg-white text-marino"}`}>Todas</Link>
        {ESTADOS.map((e) => (
          <Link key={e.id} href={`/admin${consulta(e.id)}`} className={`rounded-full px-3 py-1.5 ${estado === e.id ? "bg-marino text-white" : "bg-white text-marino"}`}>
            {e.etiqueta}
          </Link>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-linea bg-white">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-linea text-xs text-tenue">
            <tr>
              <th className="px-4 py-3 font-medium">Número</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">RUT</th>
              <th className="px-4 py-3 font-medium">Cita</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Creada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {solicitudes.map((s) => (
              <tr key={s.id} className="hover:bg-fondo/60">
                <td className="px-4 py-3 font-medium text-marino tabular-nums">
                  <Link href={`/admin/solicitudes/${s.id}`} className="hover:underline">{s.numero_atencion ?? "Sin número"}</Link>
                </td>
                <td className="px-4 py-3 text-marino">
                  <Link href={`/admin/solicitudes/${s.id}`} className="hover:underline">{s.nombre}</Link>
                </td>
                <td className="px-4 py-3 text-tenue tabular-nums">{s.rut}</td>
                <td className="px-4 py-3 text-tenue tabular-nums">{s.cita ? formatearFechaHora(s.cita.inicio) : "—"}</td>
                <td className="px-4 py-3"><EtiquetaEstado estado={s.estado} /></td>
                <td className="px-4 py-3 text-tenue tabular-nums">{formatearFechaHora(s.creado_en)}</td>
              </tr>
            ))}
            {solicitudes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-tenue">No hay solicitudes con estos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
