import { describe, expect, it } from "vitest";
import {
  findZone,
  formatPostalRanges,
  packageWeight,
  parsePostalCode,
  parsePostalRanges,
  parseRateTable,
  priceForWeight,
  quoteShipping,
  type RateTable,
} from "@/modules/orders/shipping-rates";

const table: RateTable = {
  packagingGrams: 150,
  defaultItemGrams: 500,
  zones: [
    {
      name: "CABA",
      postalRanges: [[1000, 1499]],
      brackets: [
        { maxGrams: 1000, price: 5000 },
        { maxGrams: 3000, price: 7000 },
      ],
      extraPerKg: 1500,
    },
    {
      name: "Interior",
      postalRanges: [
        [2000, 2999],
        [5000, 5999],
      ],
      brackets: [{ maxGrams: 2000, price: 9000 }],
      extraPerKg: null,
    },
  ],
};

describe("parsePostalCode", () => {
  it.each([
    ["1043", 1043],
    ["C1043AAB", 1043],
    [" c1043aab ", 1043],
    ["B1636", 1636],
  ])("%s → %s", (input, expected) => {
    expect(parsePostalCode(input)).toBe(expected);
  });

  it.each(["", "123", "12345", "ABC", "0999"])("rechaza %s", (input) => {
    expect(parsePostalCode(input)).toBeNull();
  });
});

describe("parsePostalRanges / formatPostalRanges", () => {
  it("acepta rangos y códigos sueltos", () => {
    expect(parsePostalRanges("1000-1499, 1600")).toEqual([
      [1000, 1499],
      [1600, 1600],
    ]);
  });

  it("rechaza rangos invertidos o texto inválido", () => {
    expect(parsePostalRanges("1499-1000")).toBeNull();
    expect(parsePostalRanges("CABA")).toBeNull();
    expect(parsePostalRanges("")).toBeNull();
  });

  it("vuelve al mismo texto", () => {
    expect(formatPostalRanges([[1000, 1499], [1600, 1600]])).toBe("1000-1499, 1600");
  });
});

describe("packageWeight", () => {
  it("suma prendas, usa el peso por defecto si falta y agrega el embalaje", () => {
    expect(
      packageWeight(
        [
          { weightGrams: 800, quantity: 2 },
          { weightGrams: 0, quantity: 1 },
        ],
        table,
      ),
    ).toBe(800 * 2 + 500 + 150);
  });
});

describe("findZone / priceForWeight", () => {
  it("encuentra la zona por rango", () => {
    expect(findZone(table, 1043)?.name).toBe("CABA");
    expect(findZone(table, 5500)?.name).toBe("Interior");
    expect(findZone(table, 9400)).toBeNull();
  });

  it("elige el tramo de peso y cobra el recargo por kg extra", () => {
    const caba = table.zones[0];
    expect(priceForWeight(caba, 1000)).toBe(5000);
    expect(priceForWeight(caba, 1001)).toBe(7000);
    expect(priceForWeight(caba, 3001)).toBe(7000 + 1500);
    expect(priceForWeight(caba, 5000)).toBe(7000 + 1500 * 2);
  });

  it("sin recargo por kg, un paquete más pesado no se cotiza", () => {
    expect(priceForWeight(table.zones[1], 2500)).toBeNull();
  });
});

describe("quoteShipping", () => {
  const rule = { price: 0, freeShippingThreshold: 250000, rateTable: table };

  it("cotiza por zona y peso", () => {
    expect(quoteShipping(rule, { postalCode: "C1043AAB", weightGrams: 900, subtotal: 100000 })).toEqual({
      available: true,
      cost: 5000,
      zoneName: "CABA",
    });
  });

  it("aplica el envío gratis por monto", () => {
    expect(quoteShipping(rule, { postalCode: "1043", weightGrams: 900, subtotal: 250000 })).toMatchObject({
      available: true,
      cost: 0,
    });
  });

  it("pide el CP, avisa si no llega o si pesa demasiado", () => {
    expect(quoteShipping(rule, { postalCode: "", weightGrams: 900, subtotal: 0 })).toEqual({
      available: false,
      reason: "postal_code_required",
    });
    expect(quoteShipping(rule, { postalCode: "9410", weightGrams: 900, subtotal: 0 })).toEqual({
      available: false,
      reason: "no_zone",
    });
    expect(quoteShipping(rule, { postalCode: "5000", weightGrams: 2500, subtotal: 0 })).toEqual({
      available: false,
      reason: "too_heavy",
    });
  });

  it("un método sin tabla mantiene su precio fijo", () => {
    expect(
      quoteShipping({ price: 9500, freeShippingThreshold: null, rateTable: null }, { postalCode: null, weightGrams: 99999, subtotal: 0 }),
    ).toEqual({ available: true, cost: 9500, zoneName: null });
  });
});

describe("parseRateTable", () => {
  it("ignora datos mal formados", () => {
    expect(parseRateTable({ zones: [] })).toBeNull();
    expect(parseRateTable(null)).toBeNull();
    expect(parseRateTable(table)).toEqual(table);
  });
});
