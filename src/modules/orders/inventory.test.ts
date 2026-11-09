import { describe, expect, it } from "vitest";
import { mergeStockLines } from "./inventory";

describe("mergeStockLines", () => {
  it("suma las cantidades de la misma variante", () => {
    expect(
      mergeStockLines([
        { variantId: "a", quantity: 1 },
        { variantId: "b", quantity: 2 },
        { variantId: "a", quantity: 3 },
      ])
    ).toEqual([
      { variantId: "a", quantity: 4 },
      { variantId: "b", quantity: 2 },
    ]);
  });

  it("no modifica el arreglo original", () => {
    const lines = [
      { variantId: "a", quantity: 1 },
      { variantId: "a", quantity: 1 },
    ];
    mergeStockLines(lines);
    expect(lines[0].quantity).toBe(1);
  });
});
