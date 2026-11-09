"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconoCheck } from "../iconos";
import { actualizarBorrador, useBorrador } from "./borrador";
import type { ArchivoElegido } from "./PasoCaso";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opciones: Record<string, unknown>) => string };
  }
}

function Turnstile({ alVerificar }: { alVerificar: (token: string) => void }) {
  const contenedor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!SITE_KEY) return;
    const dibujar = () => {
      if (window.turnstile && contenedor.current && !contenedor.current.hasChildNodes()) {
        window.turnstile.render(contenedor.current, { sitekey: SITE_KEY, callback: alVerificar, language: "es" });
      }
    };
    if (window.turnstile) return dibujar();
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = dibujar;
    document.head.appendChild(script);
  }, [alVerificar]);
  return SITE_KEY ? <div ref={contenedor} /> : null;
}

async function pedir(url: string, cuerpo: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, datos };
}

export function PasoEnviar({
  archivos,
  alCambiarArchivos,
  horarioListo,
  alFaltarHorario,
  alPerderHorario,
}: {
  archivos: ArchivoElegido[];
  alCambiarArchivos: (lista: ArchivoElegido[]) => void;
  horarioListo: boolean;
  alFaltarHorario: () => void;
  alPerderHorario: (mensaje: string) => void;
}) {
  const b = useBorrador();
  const [consentimiento, setConsentimiento] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [turnstile, setTurnstile] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);

  const subirArchivos = async (token: string) => {
    let lista = [...archivos];
    const rechazados: string[] = [];
    // Un archivo inválido no tiene arreglo reintentando, y desde aquí ya no se vuelve al paso 2:
    // se saca de la lista y se avisa. Los errores de red o del servidor sí se pueden reintentar.
    const revisar = (r: Awaited<ReturnType<typeof pedir>>, item: ArchivoElegido) => {
      if (r.ok) return true;
      if (r.status >= 500 || r.status === 429) throw new Error(r.datos.error ?? "No se pudieron subir tus documentos. Reintenta.");
      rechazados.push(item.archivo.name);
      lista = lista.filter((a) => a.id !== item.id);
      alCambiarArchivos(lista);
      return false;
    };

    for (const [i, item] of archivos.entries()) {
      if (item.subido) continue;
      setEstado(`Subiendo documentos (${i + 1} de ${archivos.length})…`);
      const { archivo } = item;
      const firma = await pedir("/api/documentos/firmar", { token, mime: archivo.type, tamano: archivo.size });
      if (!revisar(firma, item)) continue;

      const cuerpo = new FormData();
      cuerpo.append("cacheControl", "3600");
      cuerpo.append("", archivo);
      const subida = await fetch(firma.datos.url, { method: "PUT", body: cuerpo, headers: { "x-upsert": "false" } });
      if (!subida.ok) throw new Error(`${archivo.name}: no se pudo subir. Reintenta.`);

      const confirmacion = await pedir("/api/documentos/confirmar", { token, ruta: firma.datos.ruta, mime: archivo.type, nombre: archivo.name });
      if (!revisar(confirmacion, item)) continue;

      lista = lista.map((a) => (a.id === item.id ? { ...a, subido: true } : a));
      alCambiarArchivos(lista);
    }

    if (rechazados.length > 0) {
      throw new Error(`No pudimos adjuntar ${rechazados.join(", ")}: no es un PDF, JPG o PNG válido. Puedes enviar tu solicitud sin él y entregárselo después al abogado.`);
    }
  };

  const enviar = async () => {
    setIntentado(true);
    setFallo(null);
    if (!b.solicitudToken && !horarioListo) {
      alFaltarHorario();
      return;
    }
    if (!consentimiento) return;
    if (SITE_KEY && !turnstile && !b.solicitudToken) {
      setFallo("Completa la verificación antes de continuar.");
      return;
    }
    try {
      let token = b.solicitudToken;
      if (!token) {
        // El horario se retiene recién aquí: hasta este punto no se ha enviado ningún dato personal.
        setEstado("Reservando tu horario…");
        const retencion = await pedir("/api/citas/retener", { inicio: b.inicio, modalidad: b.modalidad, holdPrevio: b.holdToken });
        if (retencion.status === 409) {
          setEstado(null);
          alPerderHorario(retencion.datos.error);
          return;
        }
        if (!retencion.ok) throw new Error(retencion.datos.error ?? "No pudimos reservar el horario.");
        actualizarBorrador({ holdToken: retencion.datos.hold_token, holdExpira: retencion.datos.expira_en });

        setEstado("Guardando tu solicitud…");
        const creada = await pedir("/api/solicitudes", {
          datos: {
            nombre: b.nombre,
            rut: b.rut,
            telefono: b.telefono,
            correo: b.correo,
            comuna: b.comuna,
            materias: b.materias,
            nacionalidad: b.nacionalidad || null,
            descripcion: b.descripcion,
          },
          holdToken: retencion.datos.hold_token,
          consentimiento,
          turnstile,
          sitio_web: honeypot.current?.value,
        });
        if (creada.datos.codigo === "HOLD_EXPIRADO") {
          setEstado(null);
          alPerderHorario(creada.datos.error);
          return;
        }
        if (!creada.ok) throw new Error(creada.datos.error ?? "No pudimos guardar tu solicitud.");
        token = creada.datos.token as string;
        actualizarBorrador({ solicitudToken: token });
      }

      await subirArchivos(token);

      setEstado("Enviando tu caso…");
      const envio = await pedir("/api/solicitudes/enviar", { token });
      if (!envio.ok) throw new Error(envio.datos.error ?? "No pudimos enviar tu solicitud.");
      window.location.assign(`/solicitud/${token}`);
    } catch (e) {
      setFallo(e instanceof Error ? e.message : "Ocurrió un error. Inténtalo nuevamente.");
      setEstado(null);
    }
  };

  return (
    <div className="grid gap-4">
      {/* Honeypot: invisible para personas, tentador para bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Sitio web
          <input ref={honeypot} name="sitio_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-marino has-focus-visible:[&>span]:ring-3 has-focus-visible:[&>span]:ring-marino/20">
        <input type="checkbox" className="sr-only" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} />
        <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${consentimiento ? "border-marino bg-marino text-white" : intentado ? "border-deuda" : "border-linea"}`}>
          {consentimiento && <IconoCheck className="size-3.5" strokeWidth={2.4} />}
        </span>
        <span>
          Autorizo el tratamiento de mis datos personales y sensibles para evaluar y gestionar mi caso, según la{" "}
          <Link href="/privacidad" target="_blank" className="underline underline-offset-2">política de privacidad</Link>.
        </span>
      </label>
      {intentado && !consentimiento && (
        <p role="alert" className="-mt-2 text-sm text-deuda">Necesitamos tu autorización para continuar.</p>
      )}

      <Turnstile alVerificar={setTurnstile} />

      {fallo && <p role="alert" className="rounded-xl bg-deuda/5 px-4 py-3 text-sm text-deuda">{fallo}</p>}

      <button
        type="button"
        onClick={enviar}
        disabled={!!estado}
        className="flex h-13 w-full items-center justify-center rounded-xl bg-marino px-5 text-base font-semibold text-white transition-colors hover:bg-marino-claro disabled:opacity-70"
      >
        {estado ?? "Quiero mi evaluación en 24 h"}
      </button>
      <p className="text-center text-xs text-tenue">Sin costo y sin compromiso. Tus datos son confidenciales.</p>
    </div>
  );
}
