import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 92,
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        OL.
      </div>
    ),
    size,
  );
}
