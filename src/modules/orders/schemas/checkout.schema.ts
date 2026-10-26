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

export const BANK_TRANSFER_DISCOUNT_PERCENTAGE = 15;

export const checkoutPaymentMethodSchema = z.enum([
  "MERCADOPAGO",
  "BANK_TRANSFER",
]);

export type CheckoutPaymentMethod = z.infer<typeof checkoutPaymentMethodSchema>;

export const checkoutFormSchema = z.object({
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

  // Datos de Envío Logístico
  street: z
    .string()
    .trim()
    .min(2, "La calle es obligatoria")
    .max(255),
  number: z
    .string()
    .trim()
    .min(1, "La altura/número es obligatoria")
    .max(20),
  apartment: z
    .string()
    .trim()
    .max(50)
    .optional()
    .or(z.literal("")),
  postalCode: z
    .string()
    .trim()
    .regex(
      /^([A-Za-z]\d{4}[A-Za-z]{3}|\d{4})$/,
      "Ingresá un Código Postal válido (ej: 1425 o C1425BGH)"
    ),
  city: z
    .string()
    .trim()
    .min(2, "La localidad/ciudad es obligatoria")
    .max(100),
  state: z
    .string()
    .trim()
    .min(2, "Seleccioná una provincia"),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("")),

  // Selector de Medio de Pago
  paymentMethod: checkoutPaymentMethodSchema,
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const checkoutCartItemSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
});

export const createOrderPayloadSchema = z.object({
  customer: checkoutFormSchema,
  items: z
    .array(checkoutCartItemSchema)
    .min(1, "El carrito no puede estar vacío"),
});

export type CreateOrderPayload = z.infer<typeof createOrderPayloadSchema>;
