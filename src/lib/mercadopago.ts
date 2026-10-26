import { MercadoPagoConfig } from "mercadopago";

/**
 * Instancia configurada del SDK de MercadoPago para uso exclusivo en el servidor.
 */
export function getMercadoPagoConfig(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "Falta configurar la variable de entorno MP_ACCESS_TOKEN en el servidor."
    );
  }

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000,
    },
  });
}
