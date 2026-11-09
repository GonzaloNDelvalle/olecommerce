import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safe-path";

describe("safeInternalPath", () => {
  it("acepta rutas internas", () => {
    expect(safeInternalPath("/admin/ordenes?estado=PAID")).toBe(
      "/admin/ordenes?estado=PAID"
    );
  });

  it.each([
    "https://sitio-malicioso.com",
    "//sitio-malicioso.com",
    "/\\sitio-malicioso.com",
    "javascript:alert(1)",
    "",
    null,
  ])("rechaza %s y usa la ruta por defecto", (value) => {
    expect(safeInternalPath(value)).toBe("/mi-cuenta");
  });
});
