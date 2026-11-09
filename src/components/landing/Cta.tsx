"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { irASeccion } from "@/lib/scroll";

const VARIANTES = {
  primario: "bg-marino text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_10px_24px_-10px_rgb(11_31_58/0.6)] hover:bg-marino-claro",
  secundario: "border border-linea bg-white/80 text-marino backdrop-blur-sm hover:border-marino/40",
  invertido: "bg-white text-marino hover:bg-white/90",
  enlace: "",
};

/** Enlace a un ancla con hover magnético sutil. Sigue siendo un <a>, así funciona sin JS. */
export function Cta({
  href,
  variante = "primario",
  className = "",
  children,
}: {
  href: string;
  variante?: keyof typeof VARIANTES;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const mover = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const caja = ref.current.getBoundingClientRect();
    const x = (e.clientX - caja.left - caja.width / 2) * 0.12;
    const y = (e.clientY - caja.top - caja.height / 2) * 0.2;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const soltar = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <a
      ref={ref}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        irASeccion(href);
      }}
      onPointerMove={mover}
      onPointerLeave={soltar}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-[transform,background-color,border-color] duration-300 ease-out motion-reduce:transform-none ${VARIANTES[variante]} ${className}`}
    >
      {children}
    </a>
  );
}
