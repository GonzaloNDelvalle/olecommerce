import { ImageResponse } from "next/og";

export const alt = "OL. Indumenti — indumentaria atemporal en tonos tierra";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen para compartir en redes (fallback de todas las páginas sin imagen propia). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#EFE6D8",
          padding: "72px 80px",
          color: "#15110E",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: "#5C4033", textTransform: "uppercase" }}>
          Indumentaria · Argentina
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 220, fontWeight: 600, lineHeight: 1 }}>OL.</div>
          <div style={{ fontSize: 44, marginTop: 24, color: "#2C2119" }}>Sastrería, tejidos y básicos en tonos tierra</div>
        </div>
        <div style={{ display: "flex", height: 16, width: 240, background: "#5C4033" }} />
      </div>
    ),
    size,
  );
}
