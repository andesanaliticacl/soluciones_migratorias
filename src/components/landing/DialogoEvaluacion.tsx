"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { enlaceWhatsApp, NOTA_LEGAL } from "@/lib/config";
import { IconoCerrar, IconoWhatsApp } from "../iconos";

// El formulario se descarga y se monta recién al abrir el panel: la página inicial queda más liviana.
const Wizard = dynamic(() => import("../wizard/Wizard").then((m) => m.Wizard), {
  ssr: false,
  loading: () => <p className="py-16 text-center text-sm text-tenue">Cargando el formulario…</p>,
});

// El formulario vive en un panel lateral: se abre sobre la página, sin hacer bajar a nadie.
export function DialogoEvaluacion({ whatsapp }: { whatsapp: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const abrir = () => {
      setMontado(true);
      if (!dialogo.current?.open) dialogo.current?.showModal();
    };
    window.addEventListener("migratoria:evaluar", abrir);
    if (window.location.hash === "#solicitud") abrir();
    return () => window.removeEventListener("migratoria:evaluar", abrir);
  }, []);

  return (
    <dialog
      ref={dialogo}
      id="solicitud"
      aria-labelledby="titulo-evaluacion"
      onClick={(e) => {
        // Un clic fuera del panel cae sobre el propio <dialog>, que cubre el fondo
        if (e.target === dialogo.current) dialogo.current?.close();
      }}
      className="panel-lateral bg-superficie text-marino"
    >
      <div className="p-5 pb-24 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <p className="etiqueta-seccion mb-0">Evaluación gratis</p>
          <button type="button" aria-label="Cerrar" onClick={() => dialogo.current?.close()} className="-mt-1.5 -mr-1.5 grid size-10 shrink-0 place-items-center rounded-full text-tenue transition-colors hover:bg-fondo hover:text-marino">
            <IconoCerrar className="size-5" />
          </button>
        </div>
        {montado && <Wizard />}
        <a
          href={enlaceWhatsApp(whatsapp, "Hola, quiero evaluar mi caso.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-linea p-3 text-sm font-medium text-marino transition-colors hover:border-marino/40"
        >
          <IconoWhatsApp className="size-5 text-limpio" />
          Prefiero escribir por WhatsApp
        </a>
        <p className="mt-4 text-center text-xs leading-relaxed text-tenue">{NOTA_LEGAL}</p>
      </div>
    </dialog>
  );
}
