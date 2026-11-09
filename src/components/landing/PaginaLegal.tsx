import Link from "next/link";
import { Logo } from "./Logo";

export function PaginaLegal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-white">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-4">
        <Link href="/" aria-label="Soluciones Migratorias, inicio"><Logo /></Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-24">
        <h1 className="text-4xl font-semibold tracking-tight text-marino">{titulo}</h1>
        <p className="mt-4 rounded-xl bg-ambar/10 px-4 py-3 text-sm text-marino">
          Borrador editable. Debe ser revisado por tu abogado y completado en los campos entre corchetes antes de publicar.
        </p>
        <div className="mt-8 grid gap-4 leading-relaxed text-tenue [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-marino [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}
