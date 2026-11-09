import { z } from "zod";

export const ARGENTINA_PROVINCES = [
  "Ciudad Autónoma de Buenos Aires",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export const checkoutPaymentMethodSchema = z.enum([
  "MERCADOPAGO",
  "BANK_TRANSFER",
]);

export type CheckoutPaymentMethod = z.infer<typeof checkoutPaymentMethodSchema>;

export const deliveryTypeSchema = z.enum(["HOME_DELIVERY", "PICKUP"]);

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const checkoutFormSchema = z
  .object({
    // Datos de Contacto y Facturación (ARCA / ex-AFIP)
    email: z
      .string()
      .trim()
      .min(1, "El email es obligatorio")
      .email("Ingresá un email válido"),
    firstName: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100),
    lastName: z
      .string()
      .trim()
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(100),
    documentNumber: z
      .string()
      .trim()
      .regex(
        /^\d{7,11}$/,
        "Ingresá un DNI o CUIT/CUIL válido (7 a 11 números, sin puntos ni guiones)"
      ),
    phone: z
      .string()
      .trim()
      .min(8, "Ingresá un teléfono de contacto válido")
      .max(30),

    // Entrega: método elegido + domicilio (obligatorio solo para envío a domicilio)
    shippingMethodId: z.string().uuid("Elegí un método de entrega"),
    deliveryType: deliveryTypeSchema,
    state: z.string().trim().min(2, "Seleccioná una provincia"),
    street: optionalText(255),
    number: optionalText(20),
    apartment: optionalText(50),
    postalCode: optionalText(8),
    city: optionalText(100),
    notes: optionalText(500),

    paymentMethod: checkoutPaymentMethodSchema,
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType !== "HOME_DELIVERY") return;

    const requireField = (
      field: "street" | "number" | "city",
      message: string,
      min = 2
    ) => {
      if ((data[field]?.trim().length ?? 0) < min) {
        ctx.addIssue({ code: "custom", path: [field], message });
      }
    };
    requireField("street", "La calle es obligatoria");
    requireField("number", "La altura/número es obligatoria", 1);
    requireField("city", "La localidad/ciudad es obligatoria");

    if (!/^([A-Za-z]\d{4}[A-Za-z]{3}|\d{4})$/.test(data.postalCode ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["postalCode"],
        message: "Ingresá un Código Postal válido (ej: 1425 o C1425BGH)",
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const checkoutCartItemSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
  quantity: z
    .number()
    .int()
    .positive("La cantidad debe ser mayor a 0")
    .max(20, "Máximo 20 unidades por prenda"),
});

export const createOrderPayloadSchema = z.object({
  customer: checkoutFormSchema,
  items: z
    .array(checkoutCartItemSchema)
    .min(1, "El carrito no puede estar vacío")
    .max(50, "El carrito tiene demasiados productos"),
});

export type CreateOrderPayload = z.infer<typeof createOrderPayloadSchema>;
