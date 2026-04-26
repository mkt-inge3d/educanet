import { test, expect } from "@playwright/test";
import { requiresAuth } from "./helpers";
import { existsSync } from "fs";

const authFile = "e2e/.auth/user.json";

test.describe("Catálogo y cursos (requiere auth)", () => {
  test.use({
    storageState: existsSync(authFile) ? authFile : undefined,
  });

  test.beforeEach(() => {
    requiresAuth();
  });

  test("catálogo muestra contenido de cursos", async ({ page }) => {
    await page.goto("/cursos");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 8000 });
    const hasCursos =
      (await page.getByRole("heading").count()) > 0 ||
      (await page.getByText(/curso/i).count()) > 0;
    expect(hasCursos).toBe(true);
  });

  test("catálogo tiene filtros de búsqueda o categoría", async ({ page }) => {
    await page.goto("/cursos");
    // Wait for client components to hydrate
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 8000 });
    const hasFilters =
      (await page.locator("button[role=combobox]").count()) > 0 ||
      (await page.locator("input[placeholder]").count()) > 0 ||
      (await page.getByText(/todos los cursos|mis cursos/i).count()) > 0;
    expect(hasFilters).toBe(true);
  });
});
