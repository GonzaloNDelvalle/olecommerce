import { expect, test, type Page } from "@playwright/test";

/**
 * Recorrido de compra hasta ANTES de confirmar el pedido: ficha → carrito →
 * checkout. Ningún test crea una orden ni toca Mercado Pago (la base del .env
 * puede ser la de producción).
 */

async function addFirstProductToCart(page: Page) {
  await page.goto("/productos");
  await page.locator('a[href^="/productos/"]').first().click();
  await expect(page).toHaveURL(/\/productos\/[a-z0-9-]+$/);

  const sizes = page.getByRole("radio", { name: /^(XXS|XS|S|M|L|XL|XXL|\d{1,2})$/ });
  await expect(sizes.first()).toBeVisible();
  const count = await sizes.count();
  for (let i = 0; i < count; i++) {
    if (await sizes.nth(i).isEnabled()) {
      await sizes.nth(i).click();
      break;
    }
  }
  await page.getByRole("button", { name: /agregar al carrito/i }).click();
  await expect(page.getByRole("dialog")).toContainText(/tu carrito \(1\)/i);
}

async function goToCheckout(page: Page) {
  await page.getByRole("link", { name: /finalizar compra/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
}

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test.describe("carrito", () => {
  test("agregar desde la ficha abre el carrito con subtotal y botón para finalizar", async ({ page }) => {
    await addFirstProductToCart(page);
    const drawer = page.getByRole("dialog");
    await expect(drawer).toContainText(/subtotal/i);
    await expect(drawer.getByRole("link", { name: /finalizar compra/i })).toBeVisible();
  });

  test("el carrito se conserva al recargar la página", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.reload();
    await expect(page.getByRole("button", { name: /abrir carrito, 1 producto/i })).toBeVisible();
  });

  test("se puede sumar una unidad en el carrito", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByRole("button", { name: /sumar uno/i }).click();
    await expect(page.getByRole("dialog")).toContainText(/tu carrito \(2\)/i);
  });

  test("se puede quitar el producto y el checkout vuelve a quedar vacío", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.getByRole("dialog").getByRole("button", { name: /^quitar/i }).first().click();
    await page.goto("/checkout");
    await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible();
  });

  test("el carrito no genera scroll horizontal", async ({ page }) => {
    await addFirstProductToCart(page);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

test.describe("checkout", () => {
  test("muestra los datos de contacto, entrega y medios de pago", async ({ page }) => {
    await addFirstProductToCart(page);
    await goToCheckout(page);

    for (const label of [/nombre/i, /apellido/i, /dni o cuil/i, /teléfono/i, /calle/i, /altura/i, /código postal/i]) {
      await expect(page.getByLabel(label).first()).toBeVisible();
    }
    await expect(page.getByText(/envío a domicilio/i).first()).toBeVisible();
    await expect(page.getByText(/transferencia bancaria/i).first()).toBeVisible();
    await expect(page.getByText(/mercado pago/i).first()).toBeVisible();
  });

  test("valida los campos obligatorios y NO envía el pedido", async ({ page }) => {
    // Cualquier Server Action (POST con cabecera next-action) se corta y se cuenta
    let serverActionCalls = 0;
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() === "POST" && request.headers()["next-action"]) {
        serverActionCalls += 1;
        await route.abort();
        return;
      }
      await route.continue();
    });

    await addFirstProductToCart(page);
    await goToCheckout(page);
    await page.getByRole("button", { name: /pagar con mercado pago|confirmar pedido|realizar pedido/i }).click();

    await expect(page.getByText(/obligatori/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
    expect(serverActionCalls).toBe(0);
  });

  test("rechaza un email y un código postal inválidos", async ({ page }) => {
    await addFirstProductToCart(page);
    await goToCheckout(page);

    await page.getByLabel(/correo electrónico/i).fill("no-es-un-email");
    await page.getByLabel(/código postal/i).fill("12");
    await page.getByRole("button", { name: /pagar con mercado pago|confirmar pedido|realizar pedido/i }).click();

    await expect(page.getByText(/email válido/i)).toBeVisible();
    await expect(page.getByText(/código postal válido/i)).toBeVisible();
  });

  test("elegir transferencia muestra el descuento y cambia el botón de pago", async ({ page }) => {
    await addFirstProductToCart(page);
    await goToCheckout(page);

    await page.getByRole("button", { name: /transferencia bancaria/i }).click();
    await expect(page.getByText(/15%/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /pagar con mercado pago/i })).toHaveCount(0);
  });

  test("el checkout no genera scroll horizontal", async ({ page }) => {
    await addFirstProductToCart(page);
    await goToCheckout(page);
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test("la confirmación de una orden inexistente muestra el aviso 404, no filtra datos y no se indexa", async ({ page }) => {
    // El HTTP status es 200 (la página se envía en streaming antes de buscar la orden):
    // por eso la ruta lleva noindex.
    await page.goto("/checkout/confirmacion/00000000-0000-4000-8000-000000000000");
    await expect(page.getByRole("heading", { name: /no encontramos esta página/i })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/@/);
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await expect(page.locator('meta[name="referrer"][content="no-referrer"]')).toBeAttached();
  });
});

test.describe("cabeceras de seguridad", () => {
  test("la tienda no se puede embeber y evita el sniffing de contenido", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});
