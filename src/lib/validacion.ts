import type { Materia, DatosSolicitud } from "./tipos";

// Se comparte entre el wizard (validación en vivo) y las rutas del servidor (la que cuenta).

const MATERIAS_VALIDAS: Materia[] = ["proteccion", "amparo", "visa", "regularizar", "nacionalidad", "otro"];
const LIMITE_NACIONALIDAD = 60;

export function limpiarRut(valor: string): string {
  return valor.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function digitoVerificador(cuerpo: string): string {
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

export function formatearRut(valor: string): string {
  const limpio = limpiarRut(valor).slice(0, 9);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpo}-${limpio.slice(-1)}`;
}

export function validarRut(valor: string): boolean {
  const limpio = limpiarRut(valor);
  if (limpio.length < 8 || limpio.length > 9) return false;
  const cuerpo = limpio.slice(0, -1);
  if (!/^\d+$/.test(cuerpo)) return false;
  return digitoVerificador(cuerpo) === limpio.slice(-1);
}

/** Dígitos del celular chileno, sin el 56: "912345678". */
function digitosTelefono(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  return (digitos.startsWith("56") ? digitos.slice(2) : digitos).slice(0, 9);
}

export function formatearTelefono(valor: string): string {
  const d = digitosTelefono(valor);
  if (!d) return "";
  return `+56 ${d.slice(0, 1)} ${d.slice(1, 5)} ${d.slice(5)}`.trim();
}

// Solo celulares: el número tiene que poder recibir el WhatsApp de confirmación.
export function validarTelefono(valor: string): boolean {
  return /^9\d{8}$/.test(digitosTelefono(valor));
}

export function telefonoE164(valor: string): string {
  return `56${digitosTelefono(valor)}`;
}

export function validarCorreo(valor: string): boolean {
  return valor.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

export function validarNombre(valor: string): boolean {
  const limpio = valor.trim();
  return limpio.length <= 120 && limpio.split(/\s+/).length >= 2 && limpio.length >= 5;
}

export function validarComuna(valor: string): boolean {
  const limpio = valor.trim();
  return limpio.length >= 2 && limpio.length <= 80;
}

export const LIMITE_DESCRIPCION = 1000;

type Errores = Partial<Record<keyof DatosSolicitud, string>>;

export function validarDatosSolicitud(
  entrada: unknown,
): { ok: true; datos: DatosSolicitud } | { ok: false; errores: Errores } {
  const e = (entrada ?? {}) as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const errores: Errores = {};

  const nombre = texto(e.nombre);
  const rut = texto(e.rut);
  const telefono = texto(e.telefono);
  const correo = texto(e.correo).toLowerCase();
  const comuna = texto(e.comuna);
  const descripcion = texto(e.descripcion);
  const materias = Array.isArray(e.materias)
    ? [...new Set(e.materias)].filter((a): a is Materia => MATERIAS_VALIDAS.includes(a as Materia))
    : [];

  const nacionalidad = texto(e.nacionalidad);
  if (nacionalidad.length > LIMITE_NACIONALIDAD || /[<>{}]/.test(nacionalidad)) errores.nacionalidad = "Revisa tu nacionalidad.";

  if (!validarNombre(nombre)) errores.nombre = "Escribe tu nombre y apellido.";
  if (!validarRut(rut)) errores.rut = "El RUT no es válido.";
  if (!validarTelefono(telefono)) errores.telefono = "Ingresa un celular chileno: +56 9 1234 5678.";
  if (!validarCorreo(correo)) errores.correo = "El correo no es válido.";
  if (!validarComuna(comuna)) errores.comuna = "Indica tu comuna.";
  if (materias.length === 0) errores.materias = "Selecciona al menos una opción.";
  if (descripcion.length > LIMITE_DESCRIPCION) errores.descripcion = "La descripción es demasiado larga.";

  if (Object.keys(errores).length > 0) return { ok: false, errores };

  return {
    ok: true,
    datos: {
      nombre,
      rut: formatearRut(rut),
      telefono: formatearTelefono(telefono),
      correo,
      comuna,
      materias,
      nacionalidad: nacionalidad || null,
      descripcion: descripcion || null,
    },
  };
}

// ─── Archivos ────────────────────────────────────────────────────────────────

export const TAMANO_MAX_ARCHIVO = 10 * 1024 * 1024;
export const MAX_ARCHIVOS = 10;

export const TIPOS_ARCHIVO: Record<string, { extension: string; firma: number[] }> = {
  "application/pdf": { extension: "pdf", firma: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { extension: "jpg", firma: [0xff, 0xd8, 0xff] },
  "image/png": { extension: "png", firma: [0x89, 0x50, 0x4e, 0x47] },
};

/** Compara los primeros bytes con el tipo declarado: la extensión y el Content-Type se pueden falsificar. */
export function firmaCoincide(bytes: Uint8Array, mime: string): boolean {
  const tipo = TIPOS_ARCHIVO[mime];
  return !!tipo && tipo.firma.every((b, i) => bytes[i] === b);
}
