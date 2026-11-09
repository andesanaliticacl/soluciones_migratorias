import { ImageResponse } from "next/og";

export const alt = "Tu vida en Chile, en regla. Soluciones Migratorias.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ImagenOg() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0e1a33", padding: 72, color: "#f6f0e4", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>
          <span>Soluciones</span>
          <span style={{ color: "#f4b84a", marginLeft: 10 }}>Migratorias</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>Tu vida en Chile, en regla.</div>
          <div style={{ fontSize: 38, marginTop: 28, color: "#a9b3c9" }}>Visas, residencia y regularización para extranjeros.</div>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ display: "flex", background: "#f4b84a", color: "#14213d", borderRadius: 999, padding: "14px 30px", fontSize: 30, fontWeight: 800 }}>
            Habla con un abogado ahora
          </div>
        </div>
      </div>
    ),
    size,
  );
}
