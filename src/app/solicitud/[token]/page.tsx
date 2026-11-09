import type { Metadata } from "next";
import Link from "next/link";
import { Confirmacion } from "@/components/wizard/Confirmacion";
import { formatearFecha, formatearHora } from "@/lib/fechas";
import { configPublica, obtenerStore, ServicioNoConfigurado } from "@/lib/store";

export const metadata: Metadata = { title: "Tu solicitud | Soluciones Migratorias", robots: { index: false, follow: false } };

async function buscar(token: string) {
  try {
    const store = await obtenerStore();
    const solicitud = await store.solicitudPorToken(token);
    if (!solicitud?.numero_atencion) return null;
    return { solicitud, cita: await store.citaDeSolicitud(solicitud.id) };
  } catch (e) {
    if (e instanceof ServicioNoConfigurado) return null;
    throw e;
  }
}

export default async function PaginaSolicitud({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [encontrada, config] = await Promise.all([buscar(token), configPublica()]);
  const cita = encontrada && !encontrada.solicitud.cita_conflicto ? encontrada.cita : null;

  return (
    <main className="grid min-h-svh place-items-center bg-fondo px-4 py-12">
      <div className="w-full max-w-[34rem] rounded-3xl border border-linea/70 bg-white p-6 shadow-tarjeta sm:p-10">
        {encontrada ? (
          <Confirmacion
            numero={encontrada.solicitud.numero_atencion!}
            fecha={cita ? formatearFecha(cita.inicio) : null}
            hora={cita ? formatearHora(cita.inicio) : null}
            modalidad={cita?.modalidad ?? null}
            whatsapp={config.contacto.whatsapp}
          />
        ) : (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-marino">No encontramos esta solicitud</h1>
            <p className="mt-2 text-tenue">Revisa el enlace o escríbenos y te ayudamos.</p>
            <Link href="/" className="mt-6 inline-block text-sm font-medium text-marino underline underline-offset-2">Volver al inicio</Link>
          </div>
        )}
      </div>
    </main>
  );
}
