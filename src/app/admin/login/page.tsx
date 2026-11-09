import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { adminActual } from "@/lib/admin-auth";
import { esDemo } from "@/lib/store";
import { iniciarSesion } from "../acciones";

export const metadata: Metadata = { title: "Panel | Soluciones Migratorias", robots: { index: false, follow: false } };

const ERRORES: Record<string, string> = {
  credenciales: "Correo o contraseña incorrectos, o la cuenta no es de administrador.",
  limite: "Demasiados intentos. Espera 15 minutos.",
};

const CAMPO = "mt-1.5 h-11 w-full rounded-xl border border-linea px-3.5 text-marino outline-none transition-colors focus:border-marino";

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await adminActual()) redirect("/admin");
  const { error } = await searchParams;
  const demo = esDemo();

  return (
    <main className="grid min-h-svh place-items-center bg-fondo px-4">
      <form action={iniciarSesion} className="w-full max-w-sm rounded-3xl border border-linea/70 bg-white p-8 shadow-tarjeta">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-marino">Panel de administración</h1>
        {demo ? (
          <p className="mt-2 text-sm leading-relaxed text-tenue">Modo demo local: entras sin contraseña. En producción se usa Supabase Auth.</p>
        ) : (
          <div className="mt-6 grid gap-4">
            <label className="text-sm font-medium text-marino">
              Correo
              <input name="correo" type="email" autoComplete="username" required className={CAMPO} />
            </label>
            <label className="text-sm font-medium text-marino">
              Contraseña
              <input name="clave" type="password" autoComplete="current-password" required className={CAMPO} />
            </label>
          </div>
        )}
        {error && ERRORES[error] && <p role="alert" className="mt-4 text-sm text-deuda">{ERRORES[error]}</p>}
        <button type="submit" className="mt-6 h-11 w-full rounded-xl bg-marino text-sm font-semibold text-white transition-colors hover:bg-marino-claro">
          Entrar
        </button>
      </form>
    </main>
  );
}
