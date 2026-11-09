"use client";

import { useSyncExternalStore } from "react";
import type { Materia, Modalidad } from "@/lib/tipos";

export interface Borrador {
  paso: number;
  nombre: string;
  rut: string;
  telefono: string;
  correo: string;
  comuna: string;
  materias: Materia[];
  nacionalidad: string;
  descripcion: string;
  inicio: string | null;
  modalidad: Modalidad | null;
  holdToken: string | null;
  holdExpira: string | null;
  /** Existe desde que la solicitud se creó en el servidor: desde ahí los datos ya no se editan aquí. */
  solicitudToken: string | null;
  /** Nombres de los archivos elegidos. Los archivos en sí no se guardan en el navegador. */
  archivos: string[];
}

export const BORRADOR_VACIO: Borrador = {
  paso: 1,
  nombre: "",
  rut: "",
  telefono: "",
  correo: "",
  comuna: "",
  materias: [],
  nacionalidad: "",
  descripcion: "",
  inicio: null,
  modalidad: null,
  holdToken: null,
  holdExpira: null,
  solicitudToken: null,
  archivos: [],
};

const CLAVE = "migratoria.solicitud.v1";
// Son datos personales en el dispositivo de la persona: no se conservan indefinidamente.
const DURACION_MS = 7 * 24 * 60 * 60 * 1000;

let actual: Borrador = BORRADOR_VACIO;
let hidratado = false;
const oyentes = new Set<() => void>();

function hidratar() {
  if (hidratado || typeof window === "undefined") return;
  hidratado = true;
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return;
    const { guardado, datos } = JSON.parse(crudo) as { guardado: number; datos: Partial<Borrador> };
    if (Date.now() - guardado > DURACION_MS) localStorage.removeItem(CLAVE);
    else actual = { ...BORRADOR_VACIO, ...datos };
  } catch {
    // Almacenamiento bloqueado o corrupto: se parte de cero.
  }
}

function persistir() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ guardado: Date.now(), datos: actual }));
  } catch {}
}

export function actualizarBorrador(cambios: Partial<Borrador>) {
  hidratar();
  actual = { ...actual, ...cambios };
  persistir();
  oyentes.forEach((o) => o());
}

export function limpiarBorrador() {
  actual = BORRADOR_VACIO;
  try {
    localStorage.removeItem(CLAVE);
  } catch {}
  oyentes.forEach((o) => o());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  if (!hidratado) {
    hidratar();
    if (actual !== BORRADOR_VACIO) queueMicrotask(oyente);
  }
  return () => oyentes.delete(oyente);
}

export function useBorrador(): Borrador {
  return useSyncExternalStore(
    suscribir,
    () => actual,
    () => BORRADOR_VACIO,
  );
}
