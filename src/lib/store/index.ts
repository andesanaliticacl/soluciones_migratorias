import { combinarConfig } from "../config";
import type { Config } from "../tipos";
import type { Store } from "./tipos";

/** El modo demo nunca corre en Vercel: en un sitio público expondría datos reales con un admin sin clave. */
export function esDemo(): boolean {
  return process.env.DEMO_MODE === "true" && !process.env.VERCEL && !supabaseConfigurado();
}

export function supabaseConfigurado(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export class ServicioNoConfigurado extends Error {}

export async function obtenerStore(): Promise<Store> {
  if (supabaseConfigurado()) return (await import("./supabase")).storeSupabase;
  if (esDemo()) return (await import("./memoria")).storeMemoria;
  throw new ServicioNoConfigurado("Faltan las variables de Supabase.");
}

/** Para la landing: sin backend todavía, el sitio igual se muestra con los valores por defecto. */
export async function configPublica(): Promise<Config> {
  try {
    return await (await obtenerStore()).obtenerConfig();
  } catch (error) {
    if (!(error instanceof ServicioNoConfigurado)) console.error("No se pudo leer la configuración", error);
    return combinarConfig(null);
  }
}
