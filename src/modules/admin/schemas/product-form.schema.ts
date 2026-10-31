import { z } from "zod";

const imageSourceSchema = z
  .string()
  .trim()
  .refine(
    (val) =>
      val === "" ||
      val.startsWith("https://") ||
      val.startsWith("http://") ||
      val.startsWith("data:image/"),
    {
      message: "Subí un archivo de imagen válido (JPG, PNG, WEBP o AVIF)",
    }
  );

export const productGalleryImageInputSchema = z.object({
  url: imageSourceSchema,
});

export const productVariantInputSchema = z.object({
  sizeId: z.string().uuid("Seleccioná un talle válido"),
  colorId: z.string().uuid("Seleccioná un color válido"),
  sku: z
    .string()
    .trim()
    .min(3, "El SKU debe tener al menos 3 caracteres")
    .max(100, "El SKU no puede superar los 100 caracteres"),
  stock: z
    .number({ message: "Ingresá una cantidad numérica" })
    .int("El stock debe ser un número entero")
    .min(0, "El stock físico no puede ser negativo"),
  imageUrl: imageSourceSchema.optional().or(z.literal("")),
});

export const createProductFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre de la prenda debe tener al menos 3 caracteres")
      .max(200),
    description: z
      .string()
      .trim()
      .min(10, "La descripción debe tener al menos 10 caracteres"),
    basePrice: z
      .number({ message: "Ingresá un precio válido" })
      .positive("El precio base debe ser mayor a $0"),
    compareAtPrice: z
      .number()
      .positive("El precio promocional tachado debe ser mayor a $0")
      .nullable()
      .optional(),
    discountPercentage: z
      .number({ message: "Ingresá un porcentaje válido (0 a 100)" })
      .int("El porcentaje de descuento debe ser un número entero")
      .min(0, "El descuento no puede ser menor a 0%")
      .max(100, "El descuento no puede superar el 100%"),
    weightInGrams: z
      .number({ message: "Ingresá el peso en gramos" })
      .int("El peso debe ser un número entero en gramos")
      .min(0, "El peso no puede ser negativo"),
    categoryId: z.string().uuid("Seleccioná una categoría para la prenda"),
    collectionId: z.string().uuid().optional().or(z.literal("")),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    composition: z.string().trim().max(255).optional().or(z.literal("")),
    careGuide: z.string().trim().optional().or(z.literal("")),
    galleryUrls: z.array(productGalleryImageInputSchema),
    variants: z
      .array(productVariantInputSchema)
      .min(1, "Debés agregar al menos una variante de Talle y Color"),
  })
  .superRefine((data, ctx) => {
    const seenCombinations = new Set<string>();
    const seenSkus = new Set<string>();

    data.variants.forEach((variant, index) => {
      const comboKey = `${variant.sizeId}:${variant.colorId}`;
      if (seenCombinations.has(comboKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Esta combinación de Talle y Color está repetida en la matriz.",
          path: ["variants", index, "colorId"],
        });
      }
      seenCombinations.add(comboKey);

      const normalizedSku = variant.sku.trim().toUpperCase();
      if (normalizedSku && seenSkus.has(normalizedSku)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El código SKU no puede repetirse entre variantes.",
          path: ["variants", index, "sku"],
        });
      }
      seenSkus.add(normalizedSku);
    });
  });

export type ProductGalleryImageInput = z.infer<
  typeof productGalleryImageInputSchema
>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type CreateProductFormValues = z.infer<typeof createProductFormSchema>;
