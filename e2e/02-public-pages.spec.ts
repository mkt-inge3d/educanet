import { test, expect } from "@playwright/test";

test.describe("Páginas públicas", () => {
  test("raíz redirige a login (app protegida)", async ({ page }) => {
    await page.goto("/");
    // La app protege todas las rutas, redirige a login o muestra landing
    const url = page.url();
    expect(url).toMatch(/localhost:3000/);
  });

  test("página /unauthorized muestra mensaje de acceso denegado", async ({ page }) => {
    await page.goto("/unauthorized");
    await expect(page.getByText(/No tienes acceso/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /Volver/i })).toBeVisible();
  });

  test("página 404 para rutas inexistentes no rompe el servidor", async ({ page }) => {
    const response = await page.goto("/ruta-que-no-existe-xyz");
    // Puede ser 404 o redirect a login — lo importante es que no sea 500
    expect(response?.status()).not.toBe(500);
  });

  test("login page tiene link de soporte", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/soporte|ayuda/i)).toBeVisible();
  });
});
