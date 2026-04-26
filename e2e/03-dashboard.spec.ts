import { test, expect } from "@playwright/test";
import { requiresAuth } from "./helpers";
import { existsSync } from "fs";

const authFile = "e2e/.auth/user.json";

test.describe("Dashboard (requiere auth)", () => {
  test.use({
    storageState: existsSync(authFile) ? authFile : undefined,
  });

  test.beforeEach(() => {
    requiresAuth();
  });

  test("home carga con navegación visible", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 8000 });
  });

  test("sidebar tiene links a secciones principales", async ({ page }) => {
    await page.goto("/home");
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible({ timeout: 8000 });
    const links = [/catálogo/i, /progreso/i, /tareas/i, /logros/i];
    let found = 0;
    for (const pattern of links) {
      const visible = await nav.getByText(pattern).isVisible().catch(() => false);
      if (visible) found++;
    }
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test("catálogo de cursos carga sin redirigir a login", async ({ page }) => {
    await page.goto("/cursos");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 8000 });
  });

  test("mi-progreso carga sin error 500", async ({ page }) => {
    const response = await page.goto("/mi-progreso");
    expect(response?.status()).not.toBe(500);
    await expect(page).not.toHaveURL(/login/);
  });

  test("perfil de usuario carga correctamente", async ({ page }) => {
    await page.goto("/perfil");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 8000 });
  });

  test("tareas carga sin error", async ({ page }) => {
    const response = await page.goto("/tareas");
    expect(response?.status()).not.toBe(500);
    await expect(page).not.toHaveURL(/login/);
  });

  test("logros carga sin error", async ({ page }) => {
    const response = await page.goto("/logros");
    expect(response?.status()).not.toBe(500);
    await expect(page).not.toHaveURL(/login/);
  });

  test("reconocimientos carga sin error", async ({ page }) => {
    const response = await page.goto("/reconocimientos");
    expect(response?.status()).not.toBe(500);
    await expect(page).not.toHaveURL(/login/);
  });

  test("certificados carga sin error", async ({ page }) => {
    const response = await page.goto("/certificados");
    expect(response?.status()).not.toBe(500);
    await expect(page).not.toHaveURL(/login/);
  });
});
