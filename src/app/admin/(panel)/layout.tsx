import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { exigirAdmin } from "@/lib/admin-auth";
import { cerrarSesion } from "../acciones";

export const metadata: Metadata = { title: "Panel | Soluciones Migratorias", robots: { index: false, follow: false } };

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const admin = await exigirAdmin();
  return (
    <div className="min-h-svh bg-fondo">
      <header className="border-b border-linea bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/admin"><Logo /></Link>
          <nav aria-label="Panel" className="flex gap-4 text-sm text-marino">
            <Link href="/admin" className="hover:underline">Solicitudes</Link>
            <Link href="/admin/configuracion" className="hover:underline">Configuración</Link>
          </nav>
          <form action={cerrarSesion} className="ml-auto flex items-center gap-3 text-sm text-tenue">
            <span className="hidden sm:inline">{admin.correo}</span>
            <button type="submit" className="font-medium text-marino hover:underline">Salir</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
