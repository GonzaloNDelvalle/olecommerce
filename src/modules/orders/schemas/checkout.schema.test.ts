import { describe, expect, it } from "vitest";
import {
  checkoutFormSchema,
  createOrderPayloadSchema,
} from "./checkout.schema";

const base = {
  email: "clienta@example.com",
  firstName: "Ana",
  lastName: "Pérez",
  documentNumber: "30123456",
  phone: "+54 9 11 5555-5555",
  shippingMethodId: "1d2b3c4d-5e6f-4a1b-8c9d-0e1f2a3b4c5d",
  state: "Córdoba",
  paymentMethod: "MERCADOPAGO" as const,
};

const homeAddress = {
  deliveryType: "HOME_DELIVERY" as const,
  street: "Av. Alvear",
  number: "1850",
  city: "Córdoba",
};

describe("checkoutFormSchema", () => {
  it("el retiro en showroom no exige domicilio", () => {
    const result = checkoutFormSchema.safeParse({
      ...base,
      deliveryType: "PICKUP",
    });
    expect(result.success).toBe(true);
  });

  it("el envío a domicilio exige calle, altura, CP y localidad", () => {
    const result = checkoutFormSchema.safeParse({
      ...base,
      deliveryType: "HOME_DELIVERY",
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining(["street", "number", "city", "postalCode"])
    );
  });

  it.each(["1425", "C1425BGH", "x5000abc"])(
    "acepta el código postal %s",
    (postalCode) => {
      const result = checkoutFormSchema.safeParse({
        ...base,
        ...homeAddress,
        postalCode,
      });
      expect(result.success).toBe(true);
    }
  );

  it.each(["123", "ABCDE", "14250"])(
    "rechaza el código postal %s",
    (postalCode) => {
      const result = checkoutFormSchema.safeParse({
        ...base,
        ...homeAddress,
        postalCode,
      });
      expect(result.success).toBe(false);
    }
  );

  it("rechaza un DNI con puntos", () => {
    const result = checkoutFormSchema.safeParse({
      ...base,
      deliveryType: "PICKUP",
      documentNumber: "30.123.456",
    });
    expect(result.success).toBe(false);
  });
});

describe("createOrderPayloadSchema", () => {
  it("limita la cantidad por prenda", () => {
    const result = createOrderPayloadSchema.safeParse({
      customer: { ...base, deliveryType: "PICKUP" },
      items: [{ variantId: base.shippingMethodId, quantity: 21 }],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un carrito vacío", () => {
    const result = createOrderPayloadSchema.safeParse({
      customer: { ...base, deliveryType: "PICKUP" },
      items: [],
    });
    expect(result.success).toBe(false);
  });
});
