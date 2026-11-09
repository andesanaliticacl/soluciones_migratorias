import type { CSSProperties, ComponentType, SVGProps } from "react";
import {
  IconoBandera,
  IconoCalendario,
  IconoCasa,
  IconoCheck,
  IconoEscudo,
  IconoFlecha,
  IconoReloj,
  IconoVideo,
  IconoWhatsApp,
} from "@/components/iconos";
import { Contador } from "@/components/landing/Contador";
import { Cta } from "@/components/landing/Cta";
import { DialogoEvaluacion } from "@/components/landing/DialogoEvaluacion";
import { LuzTarjetas } from "@/components/landing/LuzTarjetas";
import { MapaHogar } from "@/components/landing/MapaHogar";
import { Navbar } from "@/components/landing/Navbar";
import { Pie } from "@/components/landing/Pie";
import { Revelar } from "@/components/landing/Revelar";
import { enlaceWhatsApp, urlSitio } from "@/lib/config";
import { configPublica, esDemo } from "@/lib/store";

export const revalidate = 60;

const MENSAJE_WHATSAPP = "Hola, quiero hablar con un abogado sobre mi situación migratoria.";

const retraso = (s: number) => ({ "--retraso": `${s}s` }) as CSSProperties;

const PASOS = [
  { titulo: "Llegas a Chile", texto: "Nos cuentas tu historia y tu situación actual, sin costo." },
  { titulo: "Revisamos tu caso", texto: "Un abogado analiza tus antecedentes en 24 horas." },
  { titulo: "Preparamos tus documentos", texto: "Reunimos y presentamos todo lo que tu trámite necesita." },
  { titulo: "Ya estás en regla", texto: "Te acompañamos hasta que tu trámite se resuelva." },
];

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

const SERVICIOS: { titulo: string; texto: string; Icono: Icono; tono: string; puntos: string[] }[] = [
  {
    titulo: "Visa temporal",
    texto: "Para vivir en Chile mientras trabajas, estudias o te reúnes con tu familia.",
    Icono: IconoCalendario,
    tono: "bg-oro/15 text-oro-texto",
    puntos: ["Trabajo", "Estudios", "Reunificación familiar"],
  },
  {
    titulo: "Residencia definitiva",
    texto: "Para quedarte en Chile de forma indefinida, con todos tus derechos.",
    Icono: IconoCasa,
    tono: "bg-limpio/15 text-limpio-oscuro",
    puntos: ["Revisión de requisitos", "Postulación", "Seguimiento"],
  },
  {
    titulo: "Regularización",
    texto: "Para ordenar tu situación si tu permiso venció o tu trámite está detenido.",
    Icono: IconoEscudo,
    tono: "bg-oro/15 text-oro-texto",
    puntos: ["Trámites sin respuesta", "Órdenes de expulsión o abandono", "Permisos vencidos"],
  },
  {
    titulo: "Nacionalidad",
    texto: "Para pedir la nacionalidad chilena por años de residencia o vínculos familiares.",
    Icono: IconoBandera,
    tono: "bg-limpio/15 text-limpio-oscuro",
    puntos: ["Carta de nacionalización", "Revisión de años de residencia", "Preparación de la solicitud"],
  },
];

const COMPROMISOS: { texto: string; Icono: Icono }[] = [
  { texto: "Respuesta en 24 horas", Icono: IconoReloj },
  { texto: "Evaluación sin costo", Icono: IconoCheck },
  { texto: "100% confidencial", Icono: IconoEscudo },
  { texto: "Presencial o videollamada", Icono: IconoVideo },
];

const PREGUNTAS = [
  {
    p: "¿Cuánto demora el análisis de mi caso?",
    r: "Revisamos tus antecedentes y te entregamos una evaluación de tu situación particular dentro de 24 horas desde que recibimos tu información.",
  },
  {
    p: "Mi trámite lleva meses sin respuesta, ¿qué puedo hacer?",
    r: "Si tu solicitud lleva más de 6 meses sin una respuesta concluyente, podría proceder un recurso de protección. En la evaluación revisamos si aplica a tu caso.",
  },
  {
    p: "Recibí una orden de expulsión o de abandono, ¿qué hago?",
    r: "Escríbenos cuanto antes, porque los plazos para reclamar son breves. Revisamos tu caso y te decimos si procede un recurso de amparo.",
  },
  {
    p: "¿El pago de derechos garantiza la residencia definitiva?",
    r: "No. El pago de derechos es un requisito previo para que se decida tu solicitud. Después viene una etapa de análisis que puede tomar tiempo.",
  },
  {
    p: "¿El porcentaje de avance muestra el estado real de mi solicitud?",
    r: "No. Ese indicador no refleja el avance ni el estado real de tu solicitud. Por eso conviene revisar tu caso con un abogado.",
  },
  {
    p: "¿Cuánto cuesta?",
    r: "La evaluación inicial es sin costo y sin compromiso. El valor de la gestión depende del trámite o recurso, y te lo informamos con claridad antes de empezar.",
  },
  {
    p: "¿Mis datos están seguros?",
    r: "Sí. Tratamos tu información de forma confidencial y solo la usamos para evaluar y gestionar tu caso.",
  },
  {
    p: "¿Qué documentos necesito?",
    r: "Tu pasaporte o cédula, el comprobante de tu solicitud y cualquier resolución, correo o notificación que hayas recibido. Si te falta alguno, igual puedes escribirnos.",
  },
];

function Ejemplo() {
  return <span className="rounded-full bg-oro/20 px-2 py-0.5 text-[0.65rem] font-extrabold tracking-wide text-oro-texto uppercase">Ejemplo</span>;
}

function BotonWhatsApp({ href, className = "" }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`pulso relative inline-flex h-16 items-center justify-center gap-3 rounded-full bg-oro px-7 text-lg font-extrabold text-tinta shadow-[0_14px_40px_-12px_rgb(244_184_74/0.7)] transition-transform duration-300 hover:scale-[1.02] sm:px-9 ${className}`}
    >
      <IconoWhatsApp className="size-6 shrink-0" />
      Habla con un abogado ahora
    </a>
  );
}

function Encabezado({ etiqueta, titulo, bajada }: { etiqueta: string; titulo: string; bajada: string }) {
  return (
    <div data-revela="sube" className="mx-auto max-w-3xl text-center">
      <p className="etiqueta-seccion">{etiqueta}</p>
      <h2 className="text-[2.1rem] leading-[1.05] font-black tracking-[-0.02em] text-marino lg:text-5xl">{titulo}</h2>
      <p className="mt-3 text-lg text-tenue">{bajada}</p>
    </div>
  );
}

export default async function Inicio() {
  const config = await configPublica();
  const { contadores, contacto, abogado } = config;
  const whatsapp = enlaceWhatsApp(contacto.whatsapp, MENSAJE_WHATSAPP);

  // Cifras, testimonios y foto del abogado se publican solo cuando son reales (cargados en el panel).
  // En el modo demo local se ven rotulados como ejemplo, para revisar el diseño.
  const vistaPrevia = esDemo();
  const testimonios = config.testimonios.filter((t) => vistaPrevia || !t.ejemplo);
  const cifras =
    contadores.ejemplo && !vistaPrevia
      ? []
      : [
          { valor: contadores.casos_evaluados, etiqueta: "casos evaluados", prefijo: "+" },
          { valor: contadores.casos_gestionados, etiqueta: "casos gestionados", prefijo: "+" },
          { valor: contadores.anos_experiencia, etiqueta: "años de experiencia", prefijo: "" },
        ];
  const mostrarAbogado = !!abogado.foto_url || vistaPrevia;
  const iniciales = abogado.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const datosEstructurados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LegalService",
        name: "Soluciones Migratorias",
        url: urlSitio(),
        telephone: contacto.telefono,
        email: contacto.correo,
        areaServed: { "@type": "Country", name: "Chile" },
        description: "Visas, residencia, regularización y nacionalidad para extranjeros en Chile, con acompañamiento de abogados.",
      },
      {
        "@type": "FAQPage",
        mainEntity: PREGUNTAS.map(({ p, r }) => ({ "@type": "Question", name: p, acceptedAnswer: { "@type": "Answer", text: r } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados).replace(/</g, "\\u003c") }} />
      <Navbar logoUrl={config.logo_url} />

      <main>
        {/* Inicio: título, frase y un solo botón. El mapa va detrás, sin tapar ni retrasar el texto. */}
        <section id="inicio" className="fondo-calido relative isolate overflow-hidden px-4 pt-20 pb-10 lg:flex lg:min-h-svh lg:items-center lg:pt-24 lg:pb-12">
          <div className="mx-auto grid w-full max-w-[77.5rem] items-center gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-4">
            <div className="relative z-10 text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-linea bg-superficie/70 py-1 pr-3.5 pl-1 text-sm font-bold text-marino">
                <span className="rounded-full bg-limpio px-2.5 py-0.5 text-white">24 h</span>
                Evaluación gratis de tu caso
              </p>
              <h1 className="mt-5 text-[2.9rem] leading-[1] font-black tracking-[-0.03em] text-marino sm:text-6xl lg:text-[5.25rem]">
                Tu vida en Chile, <span className="marcador">en regla.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-[34rem] text-lg leading-relaxed text-tenue sm:text-xl lg:mx-0">
                Visas, residencia y regularización para extranjeros. Te acompañamos en todo el proceso.
              </p>
              <BotonWhatsApp href={whatsapp} className="mt-8 w-full sm:w-auto" />
              <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm font-semibold text-tenue lg:justify-start">
                <li className="flex items-center gap-1.5"><IconoCheck className="size-4 text-limpio" strokeWidth={2.4} />Abogados en derecho migratorio</li>
                <li className="flex items-center gap-1.5"><IconoCheck className="size-4 text-limpio" strokeWidth={2.4} />Confidencial</li>
              </ul>
            </div>

            <MapaHogar className="relative z-0 mx-auto -mt-2 w-full max-w-[15rem] sm:max-w-[20rem] lg:mt-0 lg:max-w-[27rem]" />
          </div>
        </section>

        {/* Línea de tiempo */}
        <section id="proceso" className="scroll-mt-16 border-t border-linea bg-fondo px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-[77.5rem] lg:px-4">
            <Encabezado etiqueta="Cómo funciona" titulo="Así te acompañamos." bajada="Cuatro pasos claros. No estás solo en ningún momento." />
            <ol data-revela className="linea-tiempo relative mx-auto mt-12 grid max-w-md gap-9 lg:max-w-none lg:grid-cols-4 lg:gap-6">
              <li aria-hidden="true" className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-1 overflow-hidden rounded-full bg-linea lg:block">
                <span className="tiempo-relleno block h-full rounded-full bg-limpio" />
              </li>
              <li aria-hidden="true" className="absolute top-3 bottom-3 left-[1.625rem] w-1 overflow-hidden rounded-full bg-linea lg:hidden">
                <span className="tiempo-relleno-vertical block h-full w-full rounded-full bg-limpio" />
              </li>
              {PASOS.map(({ titulo, texto }, i) => (
                <li key={titulo} className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center" style={retraso(0.3 + i * 0.45)}>
                  <span className="tiempo-circulo relative z-10 grid size-14 shrink-0 place-items-center rounded-full border-2 border-limpio bg-limpio text-white shadow-[0_0_0_6px_var(--color-fondo)]">
                    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} className="tiempo-check" />
                    </svg>
                  </span>
                  <div className="pt-1 lg:pt-0">
                    <p className="text-xs font-extrabold tracking-[0.1em] text-oro-texto uppercase">Paso 0{i + 1}</p>
                    <h3 className="mt-1 text-xl font-extrabold tracking-tight text-marino">{titulo}</h3>
                    <p className="mt-1 leading-relaxed text-tenue lg:mx-auto lg:max-w-[15rem]">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Servicios */}
        <section id="servicios" className="scroll-mt-16 px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-[77.5rem] lg:px-4">
            <Encabezado etiqueta="Servicios" titulo="Te ayudamos con cada trámite." bajada="Cada historia es distinta. Revisamos la tuya y te decimos qué camino aplica." />
            <ul className="carrusel -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-3 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
              {SERVICIOS.map(({ titulo, texto, Icono, tono, puntos }, i) => (
                <li key={titulo} data-revela="sube" style={retraso(i * 0.1)} className="w-[82%] shrink-0 snap-center md:w-auto">
                  <article className="tarjeta-luz tarjeta-alza flex h-full flex-col rounded-[1.75rem] border border-linea bg-superficie p-6 shadow-tarjeta">
                    <span className={`grid size-13 place-items-center rounded-2xl ${tono}`}>
                      <Icono className="size-7" strokeWidth={1.8} />
                    </span>
                    <h3 className="mt-5 text-xl font-extrabold tracking-tight text-marino">{titulo}</h3>
                    <p className="mt-2 leading-relaxed text-tenue">{texto}</p>
                    <ul className="mt-4 grid gap-2 text-sm font-bold text-marino">
                      {puntos.map((punto) => (
                        <li key={punto} className="flex items-start gap-2">
                          <IconoCheck className="mt-px size-4 shrink-0 text-limpio" strokeWidth={2.6} />
                          {punto}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-6">
                      <Cta href="#solicitud" variante="secundario" className="h-11 px-4 text-sm">
                        Evaluar mi caso
                        <IconoFlecha className="size-4" />
                      </Cta>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Confianza */}
        <section id="confianza" aria-labelledby="titulo-confianza" className="border-t border-linea bg-fondo px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-[77.5rem] lg:px-4">
            <div data-revela="sube" className="mx-auto max-w-2xl text-center">
              <p className="etiqueta-seccion">Confianza</p>
              <h2 id="titulo-confianza" className="text-[2.1rem] leading-[1.05] font-black tracking-[-0.02em] text-marino lg:text-5xl">Estás en buenas manos.</h2>
              <p className="mt-3 text-lg text-tenue">Cada caso lo revisa un abogado en derecho migratorio, con trato cercano y claro.</p>
            </div>

            <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {COMPROMISOS.map(({ texto, Icono }, i) => (
                <li key={texto} data-revela="sube" style={retraso(i * 0.08)} className="flex items-center gap-3 rounded-2xl border border-linea bg-superficie p-4 text-sm font-extrabold text-marino">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-limpio/15 text-limpio-oscuro">
                    <Icono className="size-5" strokeWidth={2} />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>

            {(mostrarAbogado || cifras.length > 0) && (
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                {mostrarAbogado && (
                  <figure data-revela="sube" className="flex items-center gap-5 rounded-[1.75rem] border border-linea bg-superficie p-5 shadow-tarjeta">
                    {abogado.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- foto configurable desde el panel
                      <img src={abogado.foto_url} alt={`Foto de ${abogado.nombre}`} width={96} height={96} loading="lazy" className="size-24 shrink-0 rounded-full object-cover ring-4 ring-oro/40" />
                    ) : (
                      <span aria-hidden="true" className="grid size-24 shrink-0 place-items-center rounded-full bg-oro/20 text-3xl font-black text-oro-texto ring-4 ring-oro/30">{iniciales}</span>
                    )}
                    <figcaption>
                      {!abogado.foto_url && <Ejemplo />}
                      <p className="mt-1 text-xl font-extrabold text-marino">{abogado.nombre}</p>
                      <p className="text-tenue">{abogado.cargo}</p>
                    </figcaption>
                  </figure>
                )}
                {cifras.length > 0 && (
                  <div data-revela="sube" style={retraso(0.1)} className="grid grid-cols-3 gap-3 rounded-[1.75rem] border border-linea bg-superficie p-5 shadow-tarjeta">
                    {cifras.map(({ valor, etiqueta, prefijo }) => (
                      <div key={etiqueta} className="text-center">
                        <p className="text-3xl font-black tracking-tight text-oro-texto sm:text-5xl"><Contador valor={valor} prefijo={prefijo} /></p>
                        <p className="mt-1 text-xs font-bold text-tenue sm:text-sm">{etiqueta}</p>
                      </div>
                    ))}
                    {contadores.ejemplo && <p className="col-span-3 text-center"><Ejemplo /></p>}
                  </div>
                )}
              </div>
            )}

            {testimonios.length > 0 && (
              <ul className="carrusel -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
                {testimonios.map((t, i) => (
                  <li key={`${t.nombre}-${i}`} data-revela="sube" style={retraso(i * 0.1)} className="w-[82%] shrink-0 snap-center md:w-auto">
                    <figure className="flex h-full flex-col rounded-[1.75rem] border border-linea bg-superficie p-6">
                      <span aria-hidden="true" className="text-5xl leading-none font-black text-oro">“</span>
                      <blockquote className="-mt-2 flex-1 leading-relaxed text-marino">{t.texto}</blockquote>
                      <figcaption className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-extrabold text-marino">{t.nombre}</span>
                        {t.pais && <span className="rounded-full bg-limpio/15 px-2.5 py-0.5 text-xs font-bold text-limpio-oscuro">{t.pais}</span>}
                        {t.ejemplo && <Ejemplo />}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Cierre con el sello */}
        <section aria-labelledby="titulo-bienvenida" className="fondo-calido overflow-hidden px-4 py-16 lg:py-24">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16">
            <div data-revela className="sello mx-auto size-56 lg:size-72">
              <svg viewBox="0 0 200 200" className="size-full drop-shadow-[0_20px_40px_rgb(244_184_74/0.35)]" role="img" aria-label="Sello: Bienvenido a casa">
                <defs>
                  <path id="sello-circulo" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
                </defs>
                <circle cx="100" cy="100" r="96" fill="var(--color-oro)" />
                <circle cx="100" cy="100" r="86" fill="none" stroke="var(--color-tinta)" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
                <g className="sello-texto-giro">
                  {/* textLength reparte el texto justo en la vuelta completa (2π·74 ≈ 465) */}
                  <text fill="var(--color-tinta)" fontSize="12" fontWeight="800">
                    <textPath href="#sello-circulo" textLength="458" lengthAdjust="spacing">SOLUCIONES MIGRATORIAS · CHILE · BIENVENIDO ·</textPath>
                  </text>
                </g>
                <circle cx="100" cy="100" r="58" fill="var(--color-tinta)" />
                <path d="M84 92l16-13 16 13M88 89v16h24V89" fill="none" stroke="var(--color-oro)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="96" y="94" width="8" height="8" rx="1.5" fill="var(--color-oro)" />
                <text x="100" y="124" textAnchor="middle" fill="#fffaf2" fontSize="13.5" fontWeight="900">Bienvenido</text>
                <text x="100" y="140" textAnchor="middle" fill="#fffaf2" fontSize="13.5" fontWeight="900">a casa</text>
              </svg>
            </div>
            <div data-revela="sube" className="text-center lg:text-left">
              <h2 id="titulo-bienvenida" className="text-[2.1rem] leading-[1.05] font-black tracking-[-0.02em] text-marino lg:text-5xl">
                Tu nuevo comienzo empieza con una conversación.
              </h2>
              <p className="mt-4 text-lg text-tenue">Escríbenos hoy. Un abogado revisa tu caso sin costo y te explica tus opciones con claridad.</p>
              <BotonWhatsApp href={whatsapp} className="mt-8 w-full sm:w-auto" />
              <p className="mt-4 text-sm text-tenue">
                ¿Prefieres un formulario?{" "}
                <Cta href="#solicitud" variante="enlace" className="font-extrabold text-oro-texto underline underline-offset-4">Evalúa tu caso gratis</Cta>
              </p>
            </div>
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" className="scroll-mt-16 border-t border-linea bg-fondo px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-[77.5rem] lg:px-4">
            <Encabezado etiqueta="Preguntas" titulo="Preguntas frecuentes." bajada="¿No encuentras la tuya? Escríbenos y te respondemos." />
            <div className="mt-10 grid items-start gap-3 md:grid-cols-2">
              {PREGUNTAS.map(({ p, r }) => (
                <details key={p} name="preguntas" className="faq tarjeta-luz rounded-2xl border border-linea bg-superficie px-5">
                  <summary className="flex min-h-15 list-none items-center justify-between gap-4 py-4 font-extrabold text-marino">
                    {p}
                    <span aria-hidden="true" className="faq-signo grid size-7 shrink-0 place-items-center rounded-full bg-oro/15 text-lg leading-none text-oro-texto transition-transform duration-300">+</span>
                  </summary>
                  <p className="pb-5 leading-relaxed text-tenue">{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Pie config={config} />

      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Habla con un abogado por WhatsApp"
        className="pulso fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-oro text-tinta shadow-[0_12px_30px_-8px_rgb(0_0_0/0.5)] transition-transform duration-300 hover:scale-105 lg:right-6 lg:bottom-6 lg:size-16"
      >
        <IconoWhatsApp className="size-7 lg:size-8" />
      </a>

      <DialogoEvaluacion whatsapp={contacto.whatsapp} />
      <LuzTarjetas />
      <Revelar />
    </>
  );
}
