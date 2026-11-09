"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { MATERIAS } from "@/lib/tipos";
import { LIMITE_DESCRIPCION, MAX_ARCHIVOS, TAMANO_MAX_ARCHIVO, TIPOS_ARCHIVO } from "@/lib/validacion";
import { IconoCerrar, IconoCheck, IconoDocumento, IconoSubir } from "../iconos";
import { actualizarBorrador, useBorrador } from "./borrador";
import { Campo } from "./Campo";

export interface ArchivoElegido {
  id: string;
  archivo: File;
  vista: string | null;
  subido: boolean;
}

function pesoLegible(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function PasoCaso({
  archivos,
  alCambiarArchivos,
  perdidos,
  mostrarErrores,
}: {
  archivos: ArchivoElegido[];
  alCambiarArchivos: (lista: ArchivoElegido[]) => void;
  perdidos: string[];
  mostrarErrores: boolean;
}) {
  const b = useBorrador();
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const alternar = (id: (typeof MATERIAS)[number]["id"]) => {
    const materias = b.materias.includes(id) ? b.materias.filter((a) => a !== id) : [...b.materias, id];
    actualizarBorrador({ materias });
  };

  const agregar = (lista: FileList | null) => {
    if (!lista) return;
    const nuevos: ArchivoElegido[] = [];
    let problema: string | null = null;
    for (const archivo of Array.from(lista)) {
      if (!TIPOS_ARCHIVO[archivo.type]) problema = `${archivo.name}: solo PDF, JPG o PNG.`;
      else if (archivo.size > TAMANO_MAX_ARCHIVO) problema = `${archivo.name}: supera los 10 MB.`;
      else if (archivos.length + nuevos.length >= MAX_ARCHIVOS) problema = `Puedes adjuntar hasta ${MAX_ARCHIVOS} archivos.`;
      else {
        nuevos.push({
          id: crypto.randomUUID(),
          archivo,
          vista: archivo.type.startsWith("image/") ? URL.createObjectURL(archivo) : null,
          subido: false,
        });
      }
    }
    setAviso(problema);
    if (nuevos.length) alCambiarArchivos([...archivos, ...nuevos]);
  };

  const quitar = (item: ArchivoElegido) => {
    if (item.vista) URL.revokeObjectURL(item.vista);
    alCambiarArchivos(archivos.filter((a) => a.id !== item.id));
  };

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    agregar(e.dataTransfer.files);
  };

  useEffect(() => {
    actualizarBorrador({ archivos: archivos.map((a) => a.archivo.name) });
  }, [archivos]);

  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-marino">¿Qué quieres resolver?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {MATERIAS.map(({ id, etiqueta }) => {
            const activo = b.materias.includes(id);
            return (
              <label
                key={id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-marino/20 ${
                  activo ? "border-marino bg-marino/[.03] font-medium text-marino" : "border-linea text-marino hover:border-marino/40"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={activo} onChange={() => alternar(id)} />
                <span
                  aria-hidden="true"
                  className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
                    activo ? "border-marino bg-marino text-white" : "border-linea"
                  }`}
                >
                  {activo && <IconoCheck className="size-3.5" strokeWidth={2.4} />}
                </span>
                {etiqueta}
              </label>
            );
          })}
        </div>
        {mostrarErrores && b.materias.length === 0 && (
          <p role="alert" className="mt-1.5 text-sm text-deuda">
            Selecciona al menos una opción.
          </p>
        )}
      </fieldset>

      <Campo
        id="w-nacionalidad"
        etiqueta="Tu nacionalidad"
        opcional
        autoComplete="off"
        placeholder="Ej.: venezolana"
        valor={b.nacionalidad}
        alCambiar={(v) => actualizarBorrador({ nacionalidad: v.slice(0, 60) })}
      />

      <div>
        <label htmlFor="w-descripcion" className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-marino">
          Cuéntanos brevemente tu caso
          <span className="text-xs font-normal text-tenue">Opcional</span>
        </label>
        <textarea
          id="w-descripcion"
          rows={3}
          maxLength={LIMITE_DESCRIPCION}
          value={b.descripcion}
          onChange={(e) => actualizarBorrador({ descripcion: e.target.value })}
          className="w-full resize-y rounded-xl border border-linea bg-white px-4 py-3 text-base text-marino transition-colors outline-none focus:border-marino focus:ring-3 focus:ring-marino/10"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-marino">Documentos</p>
        <p className="mb-2 text-sm leading-relaxed text-tenue">
          Te sugerimos subir tu pasaporte o cédula, el comprobante de tu solicitud y cualquier resolución o correo que hayas recibido.
        </p>
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={`flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
            arrastrando ? "border-marino bg-marino/[.04]" : "border-linea hover:border-marino/40"
          }`}
        >
          <IconoSubir className="size-5 text-marino" />
          <span className="text-sm font-medium text-marino">Arrastra tus archivos o toca para elegir</span>
          <span className="text-xs text-tenue">PDF, JPG o PNG, hasta 10 MB cada uno</span>
        </button>
        <input
          ref={entrada}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png"
          className="sr-only"
          tabIndex={-1}
          aria-label="Elegir documentos"
          onChange={(e) => {
            agregar(e.target.files);
            e.target.value = "";
          }}
        />
        {aviso && (
          <p role="alert" className="mt-2 text-sm text-deuda">
            {aviso}
          </p>
        )}
        {perdidos.length > 0 && (
          <p className="mt-2 rounded-lg bg-ambar/10 px-3 py-2 text-sm text-marino">
            Por seguridad no guardamos tus archivos en este dispositivo. Vuelve a adjuntar: {perdidos.join(", ")}.
          </p>
        )}
        {archivos.length > 0 && (
          <ul className="mt-3 grid gap-2">
            {archivos.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-linea px-3 py-2">
                {item.vista ? (
                  // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
                  <img src={item.vista} alt="" className="size-10 rounded-md object-cover" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-md bg-fondo text-marino">
                    <IconoDocumento className="size-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-marino">{item.archivo.name}</span>
                  <span className="block text-xs text-tenue">
                    {pesoLegible(item.archivo.size)}
                    {item.subido && " · Subido"}
                  </span>
                </span>
                {!item.subido && (
                  <button
                    type="button"
                    onClick={() => quitar(item)}
                    aria-label={`Quitar ${item.archivo.name}`}
                    className="grid size-9 place-items-center rounded-full text-tenue transition-colors hover:bg-fondo hover:text-marino"
                  >
                    <IconoCerrar className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
