"use client";

import { useEffect } from "react";

/**
 * Agrega .visible a cada [data-revela] cuando entra en pantalla. Una sola escucha para toda la página.
 * El contenido está siempre en el HTML: solo se oculta cuando este script ya está listo para mostrarlo.
 */
export function Revelar() {
  useEffect(() => {
    const raiz = document.documentElement;
    const elementos = document.querySelectorAll<HTMLElement>("[data-revela]");
    if (!("IntersectionObserver" in window)) {
      elementos.forEach((e) => e.classList.add("visible"));
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    elementos.forEach((e) => observador.observe(e));
    raiz.classList.add("revela-listo");
    return () => observador.disconnect();
  }, []);
  return null;
}
