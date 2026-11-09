import { obtenerStore } from "@/lib/store";
import {
  bloquearDia,
  desbloquearDia,
  guardarContacto,
  guardarContadores,
  guardarHorarios,
  guardarTestimonios,
} from "../../acciones";

export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDEN = [1, 2, 3, 4, 5, 6, 0];
const CAMPO = "mt-1 h-10 w-full rounded-lg border border-linea bg-white px-3 text-sm text-marino outline-none focus:border-marino";
const ETIQUETA = "text-sm font-medium text-marino";
const BOTON = "mt-4 h-10 rounded-xl bg-marino px-5 text-sm font-semibold text-white transition-colors hover:bg-marino-claro";

function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-linea bg-white p-5">
      <h2 className="font-semibold text-marino">{titulo}</h2>
      {ayuda && <p className="mt-1 text-sm text-tenue">{ayuda}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function PaginaConfiguracion() {
  const store = await obtenerStore();
  const [config, horarios, bloqueados] = await Promise.all([store.obtenerConfig(), store.obtenerHorarios(), store.obtenerBloqueados()]);
  const testimonios = [...config.testimonios, { nombre: "", pais: "", texto: "", ejemplo: false }];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-marino">Configuración</h1>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Seccion titulo="Horarios disponibles" ayuda="En hora de Chile. Los cambios no afectan citas ya tomadas.">
          <form action={guardarHorarios}>
            <div className="grid gap-2">
              {ORDEN.map((d) => {
                const h = horarios.find((x) => x.dia_semana === d)!;
                return (
                  <div key={d} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-marino">
                      <input type="checkbox" name={`activo_${d}`} defaultChecked={h.activo} className="size-4 accent-marino" />
                      {DIAS[d]}
                    </label>
                    <input type="time" name={`inicio_${d}`} defaultValue={h.hora_inicio} aria-label={`${DIAS[d]}, inicio`} className="h-9 rounded-lg border border-linea px-2 text-sm text-marino" />
                    <input type="time" name={`fin_${d}`} defaultValue={h.hora_fin} aria-label={`${DIAS[d]}, término`} className="h-9 rounded-lg border border-linea px-2 text-sm text-marino" />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className={ETIQUETA}>Duración del bloque (min)
                <input type="number" name="duracion" min={10} max={240} defaultValue={config.duracion_bloque_min} className={CAMPO} />
              </label>
              <label className={ETIQUETA}>Días a futuro
                <input type="number" name="horizonte" min={1} max={180} defaultValue={config.dias_horizonte} className={CAMPO} />
              </label>
            </div>
            <button className={BOTON}>Guardar horarios</button>
          </form>
        </Seccion>

        <div className="grid content-start gap-5">
          <Seccion titulo="Días bloqueados">
            <form action={bloquearDia} className="flex flex-wrap items-end gap-2">
              <label className={`${ETIQUETA} flex-1`}>Fecha
                <input type="date" name="fecha" required className={CAMPO} />
              </label>
              <label className={`${ETIQUETA} flex-1`}>Motivo
                <input name="motivo" maxLength={120} className={CAMPO} />
              </label>
              <button className="h-10 rounded-xl border border-linea px-4 text-sm font-semibold text-marino hover:border-marino/40">Bloquear</button>
            </form>
            {bloqueados.length > 0 && (
              <ul className="mt-3 divide-y divide-linea text-sm">
                {bloqueados.map((b) => (
                  <li key={b.fecha} className="flex items-center justify-between gap-3 py-2 text-marino">
                    <span className="tabular-nums">{b.fecha}{b.motivo ? ` · ${b.motivo}` : ""}</span>
                    <form action={desbloquearDia}>
                      <input type="hidden" name="fecha" value={b.fecha} />
                      <button className="text-tenue hover:text-deuda">Quitar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

        </div>

        <Seccion titulo="Contadores" ayuda={config.contadores.ejemplo ? "Hoy se publican rotulados como “Cifras de ejemplo”. Ingresa tus cifras reales y guarda para quitar el rótulo." : undefined}>
          <form action={guardarContadores}>
            <div className="grid grid-cols-3 gap-3">
              <label className={ETIQUETA}>Evaluados
                <input type="number" name="evaluados" min={0} required defaultValue={config.contadores.casos_evaluados} className={CAMPO} />
              </label>
              <label className={ETIQUETA}>Gestionados
                <input type="number" name="gestionados" min={0} required defaultValue={config.contadores.casos_gestionados} className={CAMPO} />
              </label>
              <label className={ETIQUETA}>Años
                <input type="number" name="anos" min={0} required defaultValue={config.contadores.anos_experiencia} className={CAMPO} />
              </label>
            </div>
            <button className={BOTON}>Guardar contadores</button>
          </form>
        </Seccion>

        <Seccion titulo="Contacto y abogado responsable">
          <form action={guardarContacto} className="grid gap-3 sm:grid-cols-2">
            <label className={ETIQUETA}>Teléfono<input name="telefono" defaultValue={config.contacto.telefono} className={CAMPO} /></label>
            <label className={ETIQUETA}>WhatsApp (solo dígitos)<input name="whatsapp" defaultValue={config.contacto.whatsapp} className={CAMPO} /></label>
            <label className={ETIQUETA}>Correo<input type="email" name="correo" defaultValue={config.contacto.correo} className={CAMPO} /></label>
            <label className={ETIQUETA}>Dirección<input name="direccion" defaultValue={config.contacto.direccion} className={CAMPO} /></label>
            <label className={ETIQUETA}>Nombre del abogado<input name="abogado_nombre" defaultValue={config.abogado.nombre} className={CAMPO} /></label>
            <label className={ETIQUETA}>Cargo del abogado<input name="abogado_cargo" defaultValue={config.abogado.cargo} className={CAMPO} /></label>
            <label className={ETIQUETA}>Foto del abogado (URL https)<input type="url" name="abogado_foto" defaultValue={config.abogado.foto_url} className={CAMPO} /></label>
            <label className={ETIQUETA}>WhatsApp del abogado<input name="abogado_whatsapp" defaultValue={config.abogado.whatsapp} className={CAMPO} /></label>
            <label className={ETIQUETA}>Correo del abogado<input type="email" name="abogado_correo" defaultValue={config.abogado.correo} className={CAMPO} /></label>
            <label className={ETIQUETA}>URL del logo<input type="url" name="logo" defaultValue={config.logo_url} className={CAMPO} /></label>
            <div className="sm:col-span-2"><button className="h-10 rounded-xl bg-marino px-5 text-sm font-semibold text-white">Guardar contacto</button></div>
          </form>
        </Seccion>

        <div className="lg:col-span-2">
          <Seccion titulo="Testimonios" ayuda="Publica solo testimonios reales y autorizados. Los de ejemplo se muestran rotulados hasta que los edites. Deja una fila vacía para eliminarla.">
            <form action={guardarTestimonios}>
              <input type="hidden" name="total" value={testimonios.length} />
              <div className="grid gap-4 lg:grid-cols-2">
                {testimonios.map((t, i) => (
                  <div key={i} className="grid gap-2 rounded-xl bg-fondo p-3">
                    <label className={ETIQUETA}>Nombre
                      <input name={`nombre_${i}`} maxLength={80} defaultValue={t.nombre} className={CAMPO} />
                    </label>
                    <label className={ETIQUETA}>País de origen
                      <input name={`pais_${i}`} maxLength={60} defaultValue={t.pais} className={CAMPO} />
                    </label>
                    <label className={ETIQUETA}>Testimonio{t.ejemplo && <span className="ml-2 font-normal text-tenue">(ejemplo)</span>}
                      <textarea name={`texto_${i}`} rows={2} maxLength={400} defaultValue={t.texto} className="mt-1 w-full rounded-lg border border-linea bg-white px-3 py-2 text-sm text-marino outline-none focus:border-marino" />
                    </label>
                  </div>
                ))}
              </div>
              <button className={BOTON}>Guardar testimonios</button>
            </form>
          </Seccion>
        </div>
      </div>
    </>
  );
}
