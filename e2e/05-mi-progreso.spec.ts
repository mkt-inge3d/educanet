import { test, expect } from "@playwright/test";
import { requiresAuth } from "./helpers";
import { existsSync } from "fs";

const authFile = "e2e/.auth/user.json";

test.describe("Mi Progreso y KPIs (requiere auth)", () => {
  test.use({
    storageState: existsSync(authFile) ? authFile : undefined,
  });

  test.beforeEach(() => {
    requiresAuth();
  });

  test("mi-progreso muestra métricas de progreso", async ({ page }) => {
    await page.goto("/mi-progreso");
    await expect(page).not.toHaveURL(/login/);
    // Wait for page content to render
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 8000 });
    const hasMetric =
      (await page.getByText(/puntos|rango|bronce|oro|diamante|sideral/i).count()) > 0;
    expect(hasMetric).toBe(true);
  });

  test("mi-progreso/kpis carga sin 500", async ({ page }) => {
    const response = await page.goto("/mi-progreso/kpis");
    expect(response?.status()).not.toBe(500);
    await expect(page).not.toHaveURL(/login/);
  });
});
