"use client";

import { useEffect, useRef } from "react";

/** Cuenta desde cero hasta el valor cuando aparece en pantalla. El HTML ya trae el valor final (SEO y sin JS). */
export function Contador({ valor, prefijo = "" }: { valor: number; prefijo?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const formato = (n: number) => `${prefijo}${Math.round(n).toLocaleString("es-CL")}`;
    let cuadro = 0;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        const inicio = performance.now();
        const paso = (t: number) => {
          const x = Math.min(1, (t - inicio) / 1600);
          nodo.textContent = formato(valor * (1 - (1 - x) ** 3));
          if (x < 1) cuadro = requestAnimationFrame(paso);
        };
        nodo.textContent = formato(0);
        cuadro = requestAnimationFrame(paso);
      },
      { threshold: 0.6 },
    );
    observador.observe(nodo);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, [valor, prefijo]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefijo}
      {valor.toLocaleString("es-CL")}
    </span>
  );
}
