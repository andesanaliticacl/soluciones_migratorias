export function Logo({ url }: { url?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- logo configurable desde el panel, de cualquier origen
    return <img src={url} alt="Soluciones Migratorias" className="h-8 w-auto" />;
  }
  return (
    <span className="flex items-center gap-2 text-base font-black tracking-tight whitespace-nowrap text-marino sm:text-lg">
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill="var(--color-oro)" />
        <path d="M9 15.5l7-5.5 7 5.5M11 14v8h10v-8" fill="none" stroke="var(--color-tinta)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14.3" y="15.8" width="3.4" height="3.4" rx="0.8" fill="var(--color-tinta)" />
      </svg>
      <span>
        Soluciones <span className="text-oro-texto">Migratorias</span>
      </span>
    </span>
  );
}
