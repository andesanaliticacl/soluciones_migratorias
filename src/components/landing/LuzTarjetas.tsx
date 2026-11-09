"use client";

import { useEffect } from "react";

/** Luz que sigue al cursor en las tarjetas. Una sola escucha para toda la página. */
export function LuzTarjetas() {
  useEffect(() => {
    const mover = (e: PointerEvent) => {
      const tarjeta = (e.target as Element).closest?.<HTMLElement>(".tarjeta-luz");
      if (!tarjeta) return;
      const caja = tarjeta.getBoundingClientRect();
      tarjeta.style.setProperty("--luz-x", `${e.clientX - caja.left}px`);
      tarjeta.style.setProperty("--luz-y", `${e.clientY - caja.top}px`);
    };
    document.addEventListener("pointermove", mover, { passive: true });
    return () => document.removeEventListener("pointermove", mover);
  }, []);
  return null;
}
