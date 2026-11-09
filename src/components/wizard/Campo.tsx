"use client";

import { useState, type InputHTMLAttributes } from "react";
import { IconoCheck } from "../iconos";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  /** Mensaje de error si el valor actual no es válido; null si es válido. */
  error?: string | null;
  mostrarError?: boolean;
  opcional?: boolean;
}

export function Campo({ id, etiqueta, valor, alCambiar, error, mostrarError, opcional, ...resto }: Props) {
  const [tocado, setTocado] = useState(false);
  const valido = !!valor && !error;
  const conError = !!error && (mostrarError || (tocado && !!valor));

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-marino">
        {etiqueta}
        {opcional && <span className="text-xs font-normal text-tenue">Opcional</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          onBlur={() => setTocado(true)}
          aria-invalid={conError || undefined}
          aria-describedby={conError ? `${id}-error` : undefined}
          data-campo-invalido={error ? "" : undefined}
          className={`h-12 w-full rounded-xl border bg-white px-4 pr-11 text-base text-marino transition-colors outline-none placeholder:text-tenue/70 focus:border-marino focus:ring-3 focus:ring-marino/10 ${
            conError ? "border-deuda" : "border-linea"
          }`}
          {...resto}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 right-3.5 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-limpio text-white transition duration-300 ${
            valido && !opcional ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <IconoCheck className="size-3.5" strokeWidth={2.4} />
        </span>
      </div>
      {conError && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-deuda">
          {error}
        </p>
      )}
    </div>
  );
}
