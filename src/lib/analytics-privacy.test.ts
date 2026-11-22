import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsUrl } from "./analytics-privacy";
import { maskEmail } from "@/modules/orders/order-details";

const ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

describe("sanitizeAnalyticsUrl", () => {
  it("reemplaza el UUID de la orden en la ruta", () => {
    expect(sanitizeAnalyticsUrl(`https://tienda.test/checkout/confirmacion/${ID}?status=approved`)).toBe(
      "https://tienda.test/checkout/confirmacion/:id?status=approved"
    );
  });

  it("funciona con rutas relativas y quita orderId y token", () => {
    expect(sanitizeAnalyticsUrl(`/checkout?status=rejected&orderId=${ID}`)).toBe("/checkout?status=rejected");
    expect(sanitizeAnalyticsUrl("/newsletter/baja?token=abc")).toBe("/newsletter/baja");
  });

  it("no toca URLs sin identificadores", () => {
    expect(sanitizeAnalyticsUrl("/categoria/denim?talle=m")).toBe("/categoria/denim?talle=m");
  });
});

describe("maskEmail", () => {
  it("oculta la parte local del email", () => {
    expect(maskEmail("gonzalo@gmail.com")).toBe("g••••••@gmail.com");
    expect(maskEmail("a@b.com")).toBe("a••@b.com");
  });

  it("no rompe con valores inválidos", () => {
    expect(maskEmail("sin-arroba")).toBe("•••");
  });
});
