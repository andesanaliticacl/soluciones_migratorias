"use client";

/** Abre el panel lateral con el formulario de evaluación. */
export function abrirEvaluacion() {
  window.dispatchEvent(new Event("migratoria:evaluar"));
}

/** Lleva a una sección de la página, o abre el formulario si el destino es #solicitud. */
export function irASeccion(href: string) {
  if (href === "#solicitud") return abrirEvaluacion();
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector(href)?.scrollIntoView({ behavior: reducido ? "auto" : "smooth" });
}
