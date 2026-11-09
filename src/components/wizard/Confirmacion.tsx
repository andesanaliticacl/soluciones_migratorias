"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { enlaceWhatsApp } from "@/lib/config";
import { IconoWhatsApp } from "../iconos";
import { limpiarBorrador } from "./borrador";

function NumeroAnimado({ numero }: { numero: string }) {
  const [texto, setTexto] = useState(numero);
  useEffect(() => {
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const meta = Number(numero.replace(/\D/g, ""));
    if (reducido || !meta) return;
    const inicio = performance.now();
    let cuadro = 0;
    const paso = (t: number) => {
      const avance = Math.min(1, (t - inicio) / 1200);
      const suave = 1 - Math.pow(1 - avance, 3);
      setTexto(`SM-${String(Math.round(meta * suave)).padStart(6, "0")}`);
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [numero]);
  return (
    <p className="mt-1 text-4xl font-semibold tracking-tight text-marino tabular-nums" aria-label={numero}>
      {texto}
    </p>
  );
}

export function Confirmacion({
  numero,
  fecha,
  hora,
  modalidad,
  whatsapp,
}: {
  numero: string;
  fecha: string | null;
  hora: string | null;
  modalidad: string | null;
  whatsapp: string;
}) {
  useEffect(() => {
    limpiarBorrador();
  }, []);

  return (
    <div className="text-center">
      <svg viewBox="0 0 64 64" className="mx-auto size-20" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="none" stroke="var(--color-limpio)" strokeWidth="2.5" className="dibujar-circulo" />
        <path d="M20 33l8.500 8.500L45 24" fill="none" stroke="var(--color-limpio)" strokeWidth="3.500" strokeLinecap="round" strokeLinejoin="round" className="dibujar-check" />
      </svg>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-marino">¡Recibimos tu caso!</h1>
      <p className="mx-auto mt-3 max-w-sm leading-relaxed text-tenue">
        Un abogado revisará tus antecedentes y te contactará dentro de las próximas 24 horas.
      </p>
      <p className="mt-6 text-sm text-tenue">Tu número de atención</p>
      <NumeroAnimado numero={numero} />

      {fecha && hora ? (
        <p className="mt-5 text-marino">
          Tu cita quedó para el <span className="font-medium">{fecha}</span> a las <span className="font-medium">{hora}</span>
          {modalidad && <span className="block text-sm text-tenue">{modalidad === "videollamada" ? "Videollamada" : "Presencial"}</span>}
        </p>
      ) : (
        <p className="mx-auto mt-5 max-w-sm rounded-xl bg-ambar/10 px-4 py-3 text-sm leading-relaxed text-marino">
          El horario que elegiste ya no estaba disponible. Te contactaremos para coordinar una nueva hora.
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <a
          href={enlaceWhatsApp(whatsapp, `Hola, mi número de atención es ${numero}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-marino px-6 text-sm font-semibold text-white transition-colors hover:bg-marino-claro"
        >
          <IconoWhatsApp className="size-5" />
          Escribir por WhatsApp
        </a>
        <Link href="/#solicitud" className="text-sm font-medium text-marino underline underline-offset-4">Enviar otro caso</Link>
      </div>
    </div>
  );
}
