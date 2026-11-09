import type { CSSProperties } from "react";

// Mapa minimalista de Sudamérica. Desde cinco países salen líneas de luz que llegan a Chile,
// se entrelazan en el contorno de una casa y encienden su ventana. Solo SVG y CSS:
// no usa JavaScript, así no retrasa la carga ni el texto del inicio.

/** Proyección simple (equirectangular) a un lienzo de 400 × 620. */
function p(lon: number, lat: number): [number, number] {
  return [Math.round((lon + 82) * 8 * 10) / 10, Math.round((21 - lat) * 8 * 10) / 10];
}

function trazado(puntos: [number, number][]) {
  return puntos.map(([lon, lat], i) => `${i ? "L" : "M"}${p(lon, lat).join(" ")}`).join("") + "Z";
}

// Contorno aproximado, en longitud y latitud: basta para reconocer el continente.
const SUDAMERICA = trazado([
  [-77.5, 8.5], [-75.5, 10.5], [-72, 12.3], [-71, 11], [-68, 10.6], [-64, 10.7], [-61, 10.2], [-60.5, 8.5],
  [-57.5, 6], [-54, 5.8], [-51.5, 4.2], [-50, 1.8], [-49, -0.5], [-44, -2.5], [-39, -3], [-35, -5.5],
  [-35, -9], [-38.5, -13], [-39.5, -18], [-41, -22], [-43.5, -23], [-48, -25.8], [-48.6, -28.5], [-51, -31],
  [-53.5, -34], [-56, -34.9], [-57.5, -36], [-57, -38.3], [-62, -39], [-65, -41], [-63.8, -42.5], [-65.5, -45],
  [-67.5, -46.5], [-66, -48], [-68.5, -50.5], [-69, -52], [-68.5, -54.5], [-67.3, -55.9], [-71, -55.3],
  [-72.5, -53.5], [-74.5, -52], [-75.5, -48], [-74, -44], [-73.5, -41.5], [-73.5, -37], [-71.7, -33],
  [-71.5, -30], [-70.5, -26], [-70.3, -18.5], [-71.5, -17], [-76, -14], [-77.5, -11], [-79.5, -7],
  [-81.3, -4.5], [-80.2, -2.5], [-80.8, -0.5], [-80, 1], [-78.8, 1.8], [-77.5, 4], [-77.3, 7],
]);

const LA_ESPANOLA = trazado([
  [-74.4, 18.4], [-72.8, 19.9], [-70, 19.7], [-68.3, 18.5], [-71, 17.6], [-72.5, 18.2],
]);

// La casa se levanta sobre Santiago. Cada línea llega a una de sus esquinas.
const CUMBRE: [number, number] = [90, 378];
const ALERO_IZQ: [number, number] = [50, 414];
const ALERO_DER: [number, number] = [130, 414];
const BASE_IZQ: [number, number] = [62, 470];
const BASE_DER: [number, number] = [118, 470];

const ORIGENES = [
  // pais, ciudad de partida, destino en la casa, curva de control, retraso
  { pais: "Haití", lon: -72.3, lat: 18.5, llega: CUMBRE, curva: [175, 190], retraso: 0, etiqueta: [12, -4] },
  { pais: "Venezuela", lon: -66.9, lat: 10.5, llega: ALERO_DER, curva: [205, 260], retraso: 0.15, etiqueta: [10, 4] },
  { pais: "Colombia", lon: -74.1, lat: 4.7, llega: ALERO_IZQ, curva: [120, 280], retraso: 0.3, etiqueta: [-62, 4] },
  { pais: "Perú", lon: -77, lat: -12, llega: BASE_IZQ, curva: [92, 380], retraso: 0.45, etiqueta: [-34, 4] },
  { pais: "Bolivia", lon: -68.1, lat: -16.5, llega: BASE_DER, curva: [160, 400], retraso: 0.6, etiqueta: [10, 4] },
] as const;

// Techo a dos aguas y muros rectos: se lee como una casa, no como un escudo.
const CASA = `M${ALERO_IZQ.join(" ")}L${CUMBRE.join(" ")}L${ALERO_DER.join(" ")}M62 404V${BASE_IZQ[1]}H${BASE_DER[0]}V404`;

export function MapaHogar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 620" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="luz-ventana">
          <stop offset="0" stopColor="var(--color-oro)" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="var(--color-oro)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--color-oro)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d={SUDAMERICA} className="mapa-tierra" />
      <path d={LA_ESPANOLA} className="mapa-tierra" />

      {ORIGENES.map(({ pais, lon, lat, llega, curva, retraso, etiqueta }) => {
        const [x, y] = p(lon, lat);
        const d = `M${x} ${y}Q${curva[0]} ${curva[1]} ${llega[0]} ${llega[1]}`;
        const estilo = { "--retraso": `${retraso}s` } as CSSProperties;
        return (
          <g key={pais}>
            <path d={d} pathLength={1} className="mapa-linea" style={estilo} />
            <path d={d} pathLength={1} className="mapa-halo" style={estilo} />
            <circle cx={x} cy={y} r={3.5} className="mapa-origen" />
            <circle cx={x} cy={y} r={3.5} className="mapa-origen mapa-origen-pulso" style={estilo} />
            <text x={x + etiqueta[0]} y={y + etiqueta[1]} className="mapa-etiqueta">{pais}</text>
          </g>
        );
      })}

      {/* El hogar que se enciende */}
      <circle cx={90} cy={436} r={62} className="mapa-luz" />
      <path d={CASA} pathLength={1} className="mapa-casa" />
      <rect x={80} y={424} width={20} height={20} rx={3} className="mapa-ventana" />
      <text x={90} y={492} textAnchor="middle" className="mapa-etiqueta">Chile</text>
    </svg>
  );
}
