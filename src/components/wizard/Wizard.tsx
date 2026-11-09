"use client";

import { useEffect, useRef, useState } from "react";
import { IconoAtras, IconoFlecha, IconoPersona, IconoVideo } from "../iconos";
import { actualizarBorrador, useBorrador } from "./borrador";
import { PasoCaso, type ArchivoElegido } from "./PasoCaso";
import { erroresDatos, PasoDatos } from "./PasoDatos";
import { PasoEnviar } from "./PasoEnviar";
import { SelectorHorario } from "./SelectorHorario";

const PASOS = ["Tus datos", "Tu caso", "Agenda y envío"];

export function CabeceraWizard({ paso }: { paso: number }) {
  return (
    <header className="mb-6">
      <h2 id="titulo-evaluacion" className="text-[1.75rem] leading-[1.1] font-bold tracking-[-0.03em] text-marino">Empieza hoy. Te respondemos en 24 horas.</h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-tenue">Cuéntanos qué quieres resolver. Un abogado revisará tu situación y te contactará con una propuesta concreta.</p>
      <div className="mt-5" role="progressbar" aria-label="Avance de la solicitud" aria-valuemin={1} aria-valuemax={PASOS.length} aria-valuenow={paso}>
        <div className="flex gap-1.5">
          {PASOS.map((nombre, i) => (
            <span key={nombre} className="h-1 flex-1 overflow-hidden rounded-full bg-linea">
              <span className={`block h-full origin-left rounded-full bg-limpio transition-transform duration-500 ease-out ${i < paso ? "scale-x-100" : "scale-x-0"}`} />
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-tenue">
          Paso {paso} de {PASOS.length} · <span className="font-medium text-marino">{PASOS[paso - 1]}</span>
        </p>
      </div>
    </header>
  );
}

function BotonModalidad({ activo, alElegir, icono, titulo }: { activo: boolean; alElegir: () => void; icono: React.ReactNode; titulo: string }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={alElegir}
      className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm transition-colors ${
        activo ? "border-marino bg-marino/[.03] font-medium text-marino" : "border-linea text-marino hover:border-marino/40"
      }`}
    >
      {icono}
      {titulo}
    </button>
  );
}

export function Wizard() {
  const b = useBorrador();
  const raiz = useRef<HTMLDivElement>(null);
  const [direccion, setDireccion] = useState(1);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [archivos, setArchivos] = useState<ArchivoElegido[]>([]);
  const [perdidos, setPerdidos] = useState<string[]>([]);
  const [fallo, setFallo] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const revisado = useRef(false);

  // Tras recargar, el borrador recuerda los nombres de archivos pero no los archivos.
  useEffect(() => {
    if (revisado.current || b.archivos.length === 0) return;
    revisado.current = true;
    if (archivos.length === 0 && !b.solicitudToken) setPerdidos(b.archivos);
  }, [b.archivos, b.solicitudToken, archivos.length]);

  const irAPaso = (paso: number, dir: number) => {
    setDireccion(dir);
    setMostrarErrores(false);
    setFallo(null);
    actualizarBorrador({ paso });
    raiz.current?.closest("dialog")?.scrollTo({ top: 0 });
  };

  const pasoValido = () => {
    if (b.paso === 1) return Object.values(erroresDatos(b)).every((e) => !e);
    return b.materias.length > 0;
  };

  const continuar = () => {
    setFallo(null);
    if (!pasoValido()) {
      setMostrarErrores(true);
      raiz.current?.querySelector<HTMLElement>("[data-campo-invalido]")?.focus();
      return;
    }
    irAPaso(b.paso + 1, 1);
  };

  const horarioPerdido = (mensaje: string) => {
    actualizarBorrador({ holdToken: null, holdExpira: null, inicio: null });
    setFallo(mensaje);
    setVersion((v) => v + 1);
  };

  const horarioListo = !!b.inicio && !!b.modalidad;

  return (
    // El margen negativo deja espacio al anillo de foco de los campos dentro del recorte lateral.
    <div ref={raiz} className="relative -mx-1 overflow-x-clip px-1">
      <CabeceraWizard paso={b.paso} />

      <div key={b.paso} className={direccion > 0 ? "wizard-entra-derecha" : "wizard-entra-izquierda"}>
        {b.paso === 1 && <PasoDatos mostrarErrores={mostrarErrores} />}
        {b.paso === 2 && (
          <PasoCaso
            archivos={archivos}
            alCambiarArchivos={(lista) => {
              setArchivos(lista);
              setPerdidos([]);
            }}
            perdidos={perdidos}
            mostrarErrores={mostrarErrores}
          />
        )}
        {b.paso === 3 && (
          <div className="grid gap-6">
            {/* Una vez guardada la solicitud, su horario ya no se cambia desde aquí */}
            {!b.solicitudToken && (
              <>
                <SelectorHorario seleccion={b.inicio} alElegir={(inicio) => actualizarBorrador({ inicio })} version={version} />
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-marino">Modalidad</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <BotonModalidad activo={b.modalidad === "presencial"} alElegir={() => actualizarBorrador({ modalidad: "presencial" })} icono={<IconoPersona className="size-4" />} titulo="Presencial" />
                    <BotonModalidad activo={b.modalidad === "videollamada"} alElegir={() => actualizarBorrador({ modalidad: "videollamada" })} icono={<IconoVideo className="size-4" />} titulo="Videollamada" />
                  </div>
                </fieldset>
              </>
            )}
            {mostrarErrores && !horarioListo && !b.solicitudToken && (
              <p role="alert" className="text-sm text-deuda">Elige un horario y una modalidad.</p>
            )}
            {fallo && <p role="alert" className="rounded-xl bg-deuda/5 px-4 py-3 text-sm text-deuda">{fallo}</p>}
            <PasoEnviar
              archivos={archivos}
              alCambiarArchivos={setArchivos}
              horarioListo={horarioListo}
              alFaltarHorario={() => setMostrarErrores(true)}
              alPerderHorario={horarioPerdido}
            />
          </div>
        )}
      </div>

      {fallo && b.paso < 3 && <p role="alert" className="mt-4 rounded-xl bg-deuda/5 px-4 py-3 text-sm text-deuda">{fallo}</p>}

      <div className={`mt-6 flex items-center gap-3 ${b.paso === 3 && b.solicitudToken ? "hidden" : ""}`}>
        {b.paso > 1 && (
          <button type="button" onClick={() => irAPaso(b.paso - 1, -1)} className="flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-medium text-marino transition-colors hover:bg-fondo">
            <IconoAtras className="size-4" />
            Atrás
          </button>
        )}
        {b.paso < 3 && (
          <button type="button" onClick={continuar} className="ml-auto flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-marino px-6 text-sm font-semibold text-white transition-colors hover:bg-marino-claro sm:flex-none">
            Continuar
            <IconoFlecha className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
