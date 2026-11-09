import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { urlSitio } from "@/lib/config";
import "./globals.css";

// Sans-serif redondeada y cálida. next/font la sirve desde el propio sitio, sin pedirla a Google en cada visita.
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

const TITULO = "Tu vida en Chile, en regla | Soluciones Migratorias";
const DESCRIPCION =
  "Visas, residencia, regularización y nacionalidad para extranjeros en Chile. Abogados en derecho migratorio te acompañan en todo el proceso. Evaluación gratis en 24 horas.";

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio()),
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: "/",
    siteName: "Soluciones Migratorias",
    locale: "es_CL",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRIPCION },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e1a33" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" data-tema="negro" className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}
