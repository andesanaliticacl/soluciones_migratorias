"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { irASeccion } from "@/lib/scroll";
import { IconoLuna, IconoSol } from "../iconos";
import { Cta } from "./Cta";
import { Logo } from "./Logo";

function abrir(e: MouseEvent, href: string) {
  e.preventDefault();
  irASeccion(href);
}

function SelectorTema() {
  // Siempre parte en azul noche; lo elegido dura solo mientras se está en la página.
  const [negro, setNegro] = useState(true);

  const elegir = (valor: boolean) => {
    setNegro(valor);
    if (valor) document.documentElement.dataset.tema = "negro";
    else delete document.documentElement.dataset.tema;
  };

  const boton = (activo: boolean) =>
    `grid size-7 place-items-center rounded-full transition-colors duration-200 lg:size-8 ${activo ? "bg-marino text-white" : "text-tenue hover:text-marino"}`;

  return (
    <div role="group" aria-label="Color de fondo" className="flex rounded-full border border-linea/80 bg-white/70 p-0.5 backdrop-blur-sm">
      <button type="button" aria-label="Fondo claro" aria-pressed={!negro} title="Fondo claro" onClick={() => elegir(false)} className={boton(!negro)}>
        <IconoSol className="size-4" />
      </button>
      <button type="button" aria-label="Fondo azul noche" aria-pressed={negro} title="Fondo azul noche" onClick={() => elegir(true)} className={boton(negro)}>
        <IconoLuna className="size-4" />
      </button>
    </div>
  );
}

export function Navbar({ logoUrl }: { logoUrl: string }) {
  const [solida, setSolida] = useState(false);

  useEffect(() => {
    const revisar = () => setSolida(window.scrollY > 12);
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-1.5 z-40 px-2 lg:top-3 lg:px-4">
        <nav aria-label="Principal" className={`mx-auto flex h-12 max-w-[76rem] items-center justify-between rounded-full border pr-1.5 pl-4 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 lg:h-14 lg:pr-2 lg:pl-6 ${solida ? "border-linea/70 bg-white/80 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.35)] backdrop-blur-xl" : "border-transparent"}`}>
          <Link href="/" aria-label="Soluciones Migratorias, inicio"><Logo url={logoUrl} /></Link>
          <div className="flex items-center gap-2 lg:gap-6">
            <div className="hidden items-center gap-6 text-sm font-bold text-tenue lg:flex">
              <a href="#proceso" onClick={(e) => abrir(e, "#proceso")} className="transition-colors hover:text-marino">Cómo funciona</a>
              <a href="#servicios" onClick={(e) => abrir(e, "#servicios")} className="transition-colors hover:text-marino">Servicios</a>
              <a href="#preguntas" onClick={(e) => abrir(e, "#preguntas")} className="transition-colors hover:text-marino">Preguntas</a>
            </div>
            <SelectorTema />
            <Cta href="#solicitud" className="h-9 px-3.5 text-[0.8rem] whitespace-nowrap lg:h-10 lg:px-5 lg:text-sm"><span className="sm:hidden">Evaluar</span><span className="hidden sm:inline">Evaluar mi caso</span></Cta>
          </div>
        </nav>
      </header>
    </>
  );
}
