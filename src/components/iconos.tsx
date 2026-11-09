import type { ReactNode, SVGProps } from "react";

function Icono({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const IconoSol = (p: P) => <Icono {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.400 1.400M5.600 18.400L7 17M17 7l1.400-1.400" /></Icono>;
export const IconoLuna = (p: P) => <Icono {...p}><path d="M20 14.500A8.500 8.500 0 019.500 4a8.500 8.500 0 1010.500 10.500z" /></Icono>;
export const IconoCheck = (p: P) => <Icono {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icono>;
export const IconoCerrar = (p: P) => <Icono {...p}><path d="M6 6l12 12M18 6L6 18" /></Icono>;
export const IconoFlecha = (p: P) => <Icono {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icono>;
export const IconoAtras = (p: P) => <Icono {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icono>;
export const IconoMas = (p: P) => <Icono {...p}><path d="M12 5v14M5 12h14" /></Icono>;
export const IconoBanco = (p: P) => <Icono {...p}><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></Icono>;
export const IconoTarjeta = (p: P) => <Icono {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3" /></Icono>;
export const IconoCasa = (p: P) => <Icono {...p}><path d="M4 11l8-6.5L20 11M6 9.5V19h12V9.5M10 19v-5h4v5" /></Icono>;
export const IconoMaletin = (p: P) => <Icono {...p}><rect x="3" y="8" width="18" height="11.5" rx="2.5" /><path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></Icono>;
export const IconoAvion = (p: P) => <Icono {...p}><path d="M10.5 13.5L4 11l1.5-1.5 7 .5 4-4a2.1 2.1 0 013 3l-4 4 .5 7L14.5 21.5 12 15l-3 3v2.5L7.500 22 6 18l-4-1.500L3.500 15H6l3-3" /></Icono>;
export const IconoSalud = (p: P) => <Icono {...p}><path d="M12 20.5s-7.500-4.600-7.500-10.100A4.100 4.100 0 0112 7.900a4.100 4.100 0 017.500 2.500c0 5.500-7.500 10.100-7.500 10.100z" /><path d="M12 11v4M10 13h4" /></Icono>;
export const IconoReloj = (p: P) => <Icono {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.500V12l3 2" /></Icono>;
export const IconoCalendario = (p: P) => <Icono {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.500 10h17M8 3v4M16 3v4M8 14.500l2.500 2.500L16 13" /></Icono>;
export const IconoBandera = (p: P) => <Icono {...p}><path d="M5 21V4M5 4.500c4-2 7 2 14 0v9c-7 2-10-2-14 0" /></Icono>;
export const IconoCandado = (p: P) => <Icono {...p}><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 018 0v3" /></Icono>;
export const IconoCandadoAbierto = (p: P) => <Icono {...p}><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 017.6-1.7" /></Icono>;
export const IconoEscudo = (p: P) => <Icono {...p}><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6L12 3z" /><path d="M9 12l2 2 4-4" /></Icono>;
export const IconoBalanza = (p: P) => <Icono {...p}><path d="M12 4v16M8 20h8M5 7h14M5 7l-2.5 6a3 3 0 005 0L5 7zM19 7l-2.5 6a3 3 0 005 0L19 7z" /></Icono>;
export const IconoDocumento = (p: P) => <Icono {...p}><path d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Icono>;
export const IconoSubir = (p: P) => <Icono {...p}><path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16" /></Icono>;
export const IconoPersona = (p: P) => <Icono {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1-3.8 4-5.5 7.5-5.5s6.500 1.700 7.500 5.500" /></Icono>;
export const IconoVideo = (p: P) => <Icono {...p}><rect x="3" y="6" width="13" height="12" rx="2.500" /><path d="M16 10.500l5-3v9l-5-3" /></Icono>;

export const IconoWhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.300A10 10 0 1012 2zm0 18.200a8.200 8.200 0 01-4.200-1.100l-.3-.2-3 .8.800-2.900-.2-.3A8.200 8.200 0 1112 20.200zm4.500-6.100c-.2-.1-1.500-.700-1.700-.800-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100a6.700 6.700 0 01-3.300-2.900c-.2-.4.200-.4.700-1.200.1-.200 0-.300 0-.500l-.8-1.800c-.2-.500-.4-.400-.6-.400h-.500a.9.9 0 00-.7.300 2.800 2.800 0 00-.9 2.100c0 1.200.9 2.400 1 2.600.1.200 1.800 2.800 4.400 3.900 1.600.7 2.300.8 3.100.6.500-.1 1.500-.6 1.700-1.200.2-.6.2-1.100.2-1.200-.1-.1-.3-.2-.5-.3z" />
  </svg>
);
