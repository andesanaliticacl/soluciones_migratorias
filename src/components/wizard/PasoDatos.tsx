"use client";

import {
  formatearRut,
  formatearTelefono,
  validarComuna,
  validarCorreo,
  validarNombre,
  validarRut,
  validarTelefono,
} from "@/lib/validacion";
import { actualizarBorrador, useBorrador, type Borrador } from "./borrador";
import { Campo } from "./Campo";

export function erroresDatos(b: Borrador) {
  return {
    nombre: validarNombre(b.nombre) ? null : "Escribe tu nombre y apellido.",
    rut: validarRut(b.rut) ? null : "El RUT no es válido. Revisa el dígito verificador.",
    telefono: validarTelefono(b.telefono) ? null : "Ingresa un celular chileno: +56 9 1234 5678.",
    correo: validarCorreo(b.correo) ? null : "El correo no es válido.",
    comuna: validarComuna(b.comuna) ? null : "Indica tu comuna.",
  };
}

export function PasoDatos({ mostrarErrores = false, prefijo = "w" }: { mostrarErrores?: boolean; prefijo?: string }) {
  const b = useBorrador();
  const e = erroresDatos(b);

  return (
    <div className="grid gap-4">
      <Campo
        id={`${prefijo}-nombre`}
        etiqueta="Nombre completo"
        autoComplete="name"
        placeholder="María Pérez González"
        valor={b.nombre}
        alCambiar={(nombre) => actualizarBorrador({ nombre })}
        error={e.nombre}
        mostrarError={mostrarErrores}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${prefijo}-rut`}
          etiqueta="RUT"
          inputMode="text"
          autoComplete="off"
          placeholder="12.345.678-5"
          valor={b.rut}
          alCambiar={(v) => actualizarBorrador({ rut: formatearRut(v) })}
          error={e.rut}
          mostrarError={mostrarErrores}
        />
        <Campo
          id={`${prefijo}-telefono`}
          etiqueta="Celular"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+56 9 1234 5678"
          valor={b.telefono}
          alCambiar={(v) => actualizarBorrador({ telefono: formatearTelefono(v) })}
          error={e.telefono}
          mostrarError={mostrarErrores}
        />
      </div>
      <Campo
        id={`${prefijo}-correo`}
        etiqueta="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="maria@correo.cl"
        valor={b.correo}
        alCambiar={(correo) => actualizarBorrador({ correo })}
        error={e.correo}
        mostrarError={mostrarErrores}
      />
      <Campo
        id={`${prefijo}-comuna`}
        etiqueta="Comuna"
        autoComplete="address-level2"
        placeholder="Providencia"
        valor={b.comuna}
        alCambiar={(comuna) => actualizarBorrador({ comuna })}
        error={e.comuna}
        mostrarError={mostrarErrores}
      />
    </div>
  );
}
