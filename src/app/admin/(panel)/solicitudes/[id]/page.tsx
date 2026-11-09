import Link from "next/link";
import { notFound } from "next/navigation";
import { EtiquetaEstado } from "@/components/admin/EtiquetaEstado";
import { IconoDocumento, IconoWhatsApp } from "@/components/iconos";
import { enlaceWhatsApp } from "@/lib/config";
import { formatearFecha, formatearFechaHora, formatearHora } from "@/lib/fechas";
import { obtenerStore } from "@/lib/store";
import { MATERIAS, ESTADOS } from "@/lib/tipos";
import { telefonoE164 } from "@/lib/validacion";
import { agregarNota, cambiarEstado } from "../../../acciones";

export const dynamic = "force-dynamic";

function Fila({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[11rem_1fr]">
      <dt className="text-sm text-tenue">{etiqueta}</dt>
      <dd className="text-sm break-words text-marino">{valor}</dd>
    </div>
  );
}

const TARJETA = "rounded-2xl border border-linea bg-white p-5";

export default async function DetalleSolicitud({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await obtenerStore();
  const s = await store.solicitudPorId(id);
  if (!s) notFound();
  const [cita, documentos, notas, enviadas] = await Promise.all([
    store.citaDeSolicitud(id),
    store.documentosDeSolicitud(id),
    store.notasDeSolicitud(id),
    store.notificacionesEnviadas(id),
  ]);

  const saludo = `Hola ${s.nombre.split(" ")[0]}${s.numero_atencion ? `, te escribimos por tu solicitud ${s.numero_atencion}` : ""}.`;

  return (
    <>
      <Link href="/admin" className="text-sm text-tenue hover:text-marino">← Solicitudes</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-marino">{s.numero_atencion ?? "Sin número de atención"}</h1>
        <EtiquetaEstado estado={s.estado} />
        <a
          href={enlaceWhatsApp(telefonoE164(s.telefono), saludo)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-limpio px-4 text-sm font-semibold text-white"
        >
          <IconoWhatsApp className="size-4" />
          Escribir por WhatsApp
        </a>
      </div>

      {s.cita_conflicto && (
        <p role="alert" className="mt-4 rounded-xl bg-ambar/15 px-4 py-3 text-sm text-marino">
          Al enviar la solicitud, el horario ya estaba tomado: hay que coordinar una nueva hora con esta persona.
        </p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-5">
          <section className={TARJETA}>
            <h2 className="font-semibold text-marino">Datos</h2>
            <dl className="mt-2 divide-y divide-linea">
              <Fila etiqueta="Nombre" valor={s.nombre} />
              <Fila etiqueta="RUT" valor={s.rut} />
              <Fila etiqueta="Celular" valor={s.telefono} />
              <Fila etiqueta="Correo" valor={s.correo} />
              <Fila etiqueta="Comuna" valor={s.comuna} />
              <Fila etiqueta="Quiere resolver" valor={s.materias.map((a) => MATERIAS.find((x) => x.id === a)?.etiqueta ?? a).join(", ")} />
              <Fila etiqueta="Nacionalidad" valor={s.nacionalidad ?? "No indicada"} />
              <Fila etiqueta="Descripción" valor={<span className="whitespace-pre-wrap">{s.descripcion ?? "Sin descripción"}</span>} />
              <Fila etiqueta="Consentimiento" valor={formatearFechaHora(s.consentimiento_en)} />
            </dl>
          </section>

          <section className={TARJETA}>
            <h2 className="font-semibold text-marino">Documentos</h2>
            {documentos.length === 0 && <p className="mt-2 text-sm text-tenue">No adjuntó documentos.</p>}
            <ul className="mt-2 grid gap-2">
              {documentos.map((d) => (
                <li key={d.id}>
                  <a href={`/api/admin/documentos/${d.id}`} className="flex items-center gap-3 rounded-xl border border-linea px-3 py-2.5 text-sm text-marino hover:border-marino/40">
                    <IconoDocumento className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{d.nombre}</span>
                    <span className="text-xs text-tenue">{Math.max(1, Math.round(d.tamano / 1024))} KB</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid content-start gap-5">
          <section className={TARJETA}>
            <h2 className="font-semibold text-marino">Cita</h2>
            <dl className="mt-2 divide-y divide-linea">
              <Fila etiqueta="Cita" valor={cita ? `${formatearFecha(cita.inicio)}, ${formatearHora(cita.inicio)}` : "Sin cita"} />
              <Fila etiqueta="Modalidad" valor={cita?.modalidad ?? "—"} />
              <Fila etiqueta="Estado de la cita" valor={cita?.estado ?? "—"} />
              <Fila etiqueta="Enviada" valor={s.enviada_en ? formatearFechaHora(s.enviada_en) : "Sin enviar"} />
              <Fila etiqueta="Avisos enviados" valor={enviadas.length ? enviadas.join(", ") : "Ninguno"} />
            </dl>
          </section>

          <section className={TARJETA}>
            <h2 className="font-semibold text-marino">Cambiar estado</h2>
            <form action={cambiarEstado} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={s.id} />
              <select name="estado" defaultValue={s.estado} aria-label="Estado" className="h-10 flex-1 rounded-xl border border-linea bg-white px-3 text-sm text-marino">
                {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.etiqueta}</option>)}
              </select>
              <button type="submit" className="h-10 rounded-xl bg-marino px-4 text-sm font-semibold text-white">Guardar</button>
            </form>
          </section>

          <section className={TARJETA}>
            <h2 className="font-semibold text-marino">Notas internas</h2>
            <form action={agregarNota} className="mt-3">
              <input type="hidden" name="id" value={s.id} />
              <textarea name="texto" rows={3} required maxLength={2000} aria-label="Nueva nota" className="w-full rounded-xl border border-linea px-3 py-2 text-sm text-marino outline-none focus:border-marino" />
              <button type="submit" className="mt-2 h-10 rounded-xl border border-linea px-4 text-sm font-semibold text-marino hover:border-marino/40">Agregar nota</button>
            </form>
            <ul className="mt-4 grid gap-3">
              {notas.map((n) => (
                <li key={n.id} className="border-t border-linea pt-3 text-sm">
                  <p className="whitespace-pre-wrap text-marino">{n.texto}</p>
                  <p className="mt-1 text-xs text-tenue">{n.autor} · {formatearFechaHora(n.creado_en)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
