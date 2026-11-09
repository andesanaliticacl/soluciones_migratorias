"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiaDisponible } from "@/lib/fechas";
import { IconoAtras, IconoFlecha } from "../iconos";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

interface Props {
  seleccion: string | null;
  alElegir: (inicio: string | null) => void;
  /** Cambia para forzar una recarga, por ejemplo tras perder un horario. */
  version?: number;
}

export function SelectorHorario({ seleccion, alElegir, version = 0 }: Props) {
  const [dias, setDias] = useState<DiaDisponible[] | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [mes, setMes] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setFallo(null);
    fetch("/api/disponibilidad", { cache: "no-store" })
      .then(async (r) => {
        const datos = await r.json();
        if (!r.ok) throw new Error(datos.error);
        return datos.dias as DiaDisponible[];
      })
      .then((lista) => {
        if (!vigente) return;
        setDias(lista);
        const elegido = lista.find((d) => d.bloques.some((b) => b.inicio === seleccion && b.libre));
        const primero = elegido ?? lista.find((d) => d.bloques.some((b) => b.libre));
        setFecha(primero?.fecha ?? null);
        setMes(primero?.fecha.slice(0, 7) ?? null);
        if (seleccion && !elegido) alElegir(null);
      })
      .catch((e: Error) => vigente && setFallo(e.message || "No pudimos cargar los horarios."));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo recarga al cambiar la versión
  }, [version]);

  const porFecha = useMemo(() => new Map((dias ?? []).map((d) => [d.fecha, d])), [dias]);
  const meses = useMemo(() => [...new Set((dias ?? []).map((d) => d.fecha.slice(0, 7)))], [dias]);

  if (fallo) return <p role="alert" className="rounded-xl bg-deuda/5 p-4 text-sm text-deuda">{fallo}</p>;
  if (!dias) return <div className="h-72 animate-pulse rounded-xl bg-fondo" aria-label="Cargando horarios" />;
  if (!mes) return <p className="rounded-xl bg-fondo p-4 text-sm text-marino">No hay horarios disponibles por ahora. Escríbenos por WhatsApp y te ayudamos.</p>;

  const [anio, numeroMes] = mes.split("-").map(Number);
  const diasDelMes = new Date(Date.UTC(anio, numeroMes, 0)).getUTCDate();
  const huecos = (new Date(Date.UTC(anio, numeroMes - 1, 1)).getUTCDay() + 6) % 7;
  const indiceMes = meses.indexOf(mes);
  const bloques = fecha ? (porFecha.get(fecha)?.bloques ?? []) : [];

  return (
    <div className="grid gap-5">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-marino capitalize">
            {MESES[numeroMes - 1]} {anio}
          </p>
          <div className="flex gap-1">
            <button type="button" aria-label="Mes anterior" disabled={indiceMes <= 0} onClick={() => setMes(meses[indiceMes - 1])} className="grid size-9 place-items-center rounded-full text-marino transition-colors hover:bg-fondo disabled:opacity-30">
              <IconoAtras className="size-4" />
            </button>
            <button type="button" aria-label="Mes siguiente" disabled={indiceMes >= meses.length - 1} onClick={() => setMes(meses[indiceMes + 1])} className="grid size-9 place-items-center rounded-full text-marino transition-colors hover:bg-fondo disabled:opacity-30">
              <IconoFlecha className="size-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS.map((d, i) => (
            <span key={i} aria-hidden="true" className="pb-1 text-xs text-tenue">{d}</span>
          ))}
          {Array.from({ length: huecos }, (_, i) => <span key={`h${i}`} />)}
          {Array.from({ length: diasDelMes }, (_, i) => {
            const dia = `${mes}-${String(i + 1).padStart(2, "0")}`;
            const disponible = porFecha.get(dia)?.bloques.some((b) => b.libre);
            const activo = fecha === dia;
            return (
              <button
                key={dia}
                type="button"
                disabled={!disponible}
                aria-pressed={activo}
                aria-label={`${i + 1} de ${MESES[numeroMes - 1]}`}
                onClick={() => setFecha(dia)}
                className={`mx-auto grid size-10 place-items-center rounded-full text-sm tabular-nums transition-colors ${
                  activo ? "bg-marino font-medium text-white" : disponible ? "text-marino hover:bg-fondo" : "text-tenue/40"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-marino">Horarios disponibles <span className="font-normal text-tenue">(hora de Chile)</span></p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {bloques.map((b) => {
            const activo = seleccion === b.inicio;
            return (
              <button
                key={b.inicio}
                type="button"
                disabled={!b.libre}
                aria-pressed={activo}
                onClick={() => alElegir(b.inicio)}
                className={`h-11 rounded-lg border text-sm tabular-nums transition-colors ${
                  activo
                    ? "border-marino bg-marino font-medium text-white"
                    : b.libre
                      ? "border-linea text-marino hover:border-marino/40"
                      : "border-transparent bg-fondo text-tenue/50 line-through"
                }`}
              >
                {b.hora}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
