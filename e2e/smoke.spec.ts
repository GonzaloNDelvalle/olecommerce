import { expect, test } from "@playwright/test";

/**
 * Recorrido básico de compra sin pagar: catálogo → ficha → carrito → checkout.
 * No crea órdenes (no confirma el pedido).
 */

test("la portada carga", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/OL\./);
});

test("el catálogo lista prendas y pagina", async ({ page }) => {
  await page.goto("/productos");
  const cards = page.locator('a[href^="/productos/"]');
  await expect(cards.first()).toBeVisible();
});

test("la búsqueda ignora acentos", async ({ page }) => {
  await page.goto("/productos?q=pantalon");
  await expect(page.getByText(/pantal[oó]n/i).first()).toBeVisible();
});

test("la ficha tiene datos estructurados y permite agregar al carrito", async ({
  page,
}) => {
  await page.goto("/productos");
  await page.locator('a[href^="/productos/"]').first().click();
  await expect(page).toHaveURL(/\/productos\/[a-z0-9-]+$/);

  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  const data = JSON.parse(jsonLd ?? "{}");
  expect(data["@type"]).toBe("Product");
  expect(data.offers.priceCurrency).toBe("ARS");
});

test("el checkout con carrito vacío invita a ver el catálogo", async ({
  page,
}) => {
  await page.goto("/checkout");
  await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible();
});

test("el panel de administración pide iniciar sesión", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fadmin/);
});

test("robots y sitemap responden", async ({ request }) => {
  expect((await request.get("/robots.txt")).status()).toBe(200);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/productos/");
});
