import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2C2119",
          color: "#EFE6D8",
          fontSize: 34,
          fontWeight: 700,
          fontFamily: "serif",
          borderRadius: 14,
        }}
      >
        OL.
      </div>
    ),
    size,
  );
}
