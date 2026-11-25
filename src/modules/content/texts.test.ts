import { describe, expect, it } from "vitest";
import { fillText, mergeTexts, TEXT_DEFINITIONS, TEXT_KEYS, textLines } from "@/modules/content/texts";

describe("textos editables", () => {
  it("usa el valor por defecto salvo que haya uno guardado (incluso vacío)", () => {
    const texts = mergeTexts([
      { key: "shop.title", value: "Tienda" },
      { key: "shop.description", value: "" },
      { key: "clave.vieja", value: "x" },
    ]);
    expect(texts["shop.title"]).toBe("Tienda");
    expect(texts["shop.description"]).toBe("");
    expect(texts["home.collections.title"]).toBe("Colecciones");
    expect(Object.keys(texts)).toHaveLength(TEXT_KEYS.length);
  });

  it("reemplaza comodines y quita separadores sueltos", () => {
    expect(fillText("{coleccion} · {temporada}", { coleccion: "Mutare", temporada: "" })).toBe("Mutare");
    expect(fillText("Selección {temporada}", { temporada: "SS'26" })).toBe("Selección SS'26");
  });

  it("separa las listas por línea", () => {
    expect(textLines("uno\n\n dos ")).toEqual(["uno", "dos"]);
  });

  it("ningún valor por defecto supera su máximo", () => {
    for (const key of TEXT_KEYS) {
      expect(TEXT_DEFINITIONS[key].default.length, key).toBeLessThanOrEqual(TEXT_DEFINITIONS[key].max);
    }
  });
});
