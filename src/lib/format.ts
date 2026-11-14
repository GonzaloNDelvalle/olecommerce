const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/** $189.900 — precios de la tienda, siempre sin decimales. */
export function formatARS(value: number): string {
  return arsFormatter.format(value);
}

const pluralRules = new Intl.PluralRules("es-AR");

/** plural(2, "producto", "productos") → "productos" */
export function plural(count: number, one: string, other: string): string {
  return pluralRules.select(count) === "one" ? one : other;
}
