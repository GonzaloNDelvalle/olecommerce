import { describe, expect, it } from "vitest";
import {
  applyDiscount,
  computeOrderTotals,
  computeShippingCost,
  isShippingAvailableFor,
} from "./pricing";

describe("applyDiscount", () => {
  it("devuelve el precio sin cambios cuando no hay descuento", () => {
    expect(applyDiscount(54000, 0)).toBe(54000);
  });

  it("aplica el porcentaje y redondea a pesos enteros", () => {
    expect(applyDiscount(118000, 10)).toBe(106200);
    expect(applyDiscount(99999, 15)).toBe(84999);
  });

  it("nunca baja de 0 aunque el descuento supere 100%", () => {
    expect(applyDiscount(1000, 150)).toBe(0);
  });
});

describe("computeShippingCost", () => {
  const rule = { price: 9500, freeShippingThreshold: 250000 };

  it("cobra el costo cuando no se llega al mínimo", () => {
    expect(computeShippingCost(rule, 249999)).toBe(9500);
  });

  it("es gratis al alcanzar el mínimo", () => {
    expect(computeShippingCost(rule, 250000)).toBe(0);
  });

  it("sin mínimo configurado siempre cobra", () => {
    expect(
      computeShippingCost({ price: 5000, freeShippingThreshold: null }, 1e9)
    ).toBe(5000);
  });
});

describe("isShippingAvailableFor", () => {
  it("una lista vacía significa todo el país", () => {
    expect(isShippingAvailableFor({ provinces: [] }, "Salta")).toBe(true);
  });

  it("respeta las provincias habilitadas", () => {
    const rule = { provinces: ["Ciudad Autónoma de Buenos Aires"] };
    expect(
      isShippingAvailableFor(rule, "Ciudad Autónoma de Buenos Aires")
    ).toBe(true);
    expect(isShippingAvailableFor(rule, "Córdoba")).toBe(false);
  });
});

describe("computeOrderTotals", () => {
  it("con Mercado Pago no hay descuento", () => {
    expect(
      computeOrderTotals({
        subtotal: 100000,
        shippingCost: 9500,
        isBankTransfer: false,
        bankTransferDiscountPercentage: 15,
      })
    ).toEqual({
      subtotal: 100000,
      discountAmount: 0,
      shippingCost: 9500,
      totalAmount: 109500,
    });
  });

  it("el descuento por transferencia no se aplica sobre el envío", () => {
    const totals = computeOrderTotals({
      subtotal: 100000,
      shippingCost: 9500,
      isBankTransfer: true,
      bankTransferDiscountPercentage: 15,
    });
    expect(totals.discountAmount).toBe(15000);
    expect(totals.totalAmount).toBe(94500);
  });
});
