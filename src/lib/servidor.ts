import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { MINUTOS_ANTICIPACION } from "./config";
import type { ParametrosAgenda } from "./fechas";
import { ServicioNoConfigurado } from "./store";
import type { Store } from "./store/tipos";

export function error(mensaje: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: mensaje, ...extra }, { status });
}

/** Envuelve una ruta para responder 503 si falta backend y 500 sin filtrar detalles internos. */
export function ruta<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ServicioNoConfigurado) return error("El servicio todavía no está configurado.", 503);
      console.error(e);
      return error("Ocurrió un error. Inténtalo nuevamente.", 500);
    }
  };
}

export async function leerJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const cuerpo = await req.json();
    return cuerpo && typeof cuerpo === "object" ? (cuerpo as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** La IP solo se guarda como hash con sal. */
export function huellaIp(cabeceras: Headers): string {
  const ip = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return createHash("sha256").update(`${process.env.RATE_LIMIT_SALT ?? ""}:${ip}`).digest("hex").slice(0, 32);
}

/** Rate limit por IP respaldado en la base de datos: funciona entre instancias serverless. */
export function permitido(store: Store, req: Request, accion: string, maximo: number, ventanaSeg: number) {
  return store.rateLimit(`${accion}:${huellaIp(req.headers)}`, maximo, ventanaSeg);
}

export async function turnstileValido(token: unknown, req: Request): Promise<boolean> {
  const secreto = process.env.TURNSTILE_SECRET_KEY;
  if (!secreto) return true;
  if (typeof token !== "string" || !token) return false;
  const respuesta = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: secreto,
      response: token,
      remoteip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    }),
  });
  const datos = (await respuesta.json()) as { success?: boolean };
  return datos.success === true;
}

export async function parametrosAgenda(store: Store): Promise<ParametrosAgenda> {
  const [config, horarios, bloqueados] = await Promise.all([
    store.obtenerConfig(),
    store.obtenerHorarios(),
    store.obtenerBloqueados(),
  ]);
  return {
    ahora: new Date(),
    horarios,
    bloqueados,
    duracionMin: config.duracion_bloque_min,
    diasHorizonte: config.dias_horizonte,
    anticipacionMin: MINUTOS_ANTICIPACION,
  };
}
