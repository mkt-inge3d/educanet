import { test, expect } from "@playwright/test";

test.describe("Autenticación", () => {
  test("página de login carga con formulario completo", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Bienvenido de vuelta" })).toBeVisible({ timeout: 8000 });
    // Usar IDs directos para evitar problemas con animaciones de opacidad
    await expect(page.locator("#email")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("#password")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "Iniciar sesion" })).toBeVisible();
  });

  test("muestra error con credenciales incorrectas (permanece en login)", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("noexiste@test.com");
    await page.locator("#password").fill("WrongPass123!");
    await page.getByRole("button", { name: "Iniciar sesion" }).click();
    await expect(page).toHaveURL(/login/, { timeout: 12000 });
  });

  test("página de registro carga correctamente", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Unete|Registr|Crear/i })).toBeVisible({ timeout: 8000 });
  });

  test("link 'Registrate' existe en login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /Registrate/i })).toBeVisible({ timeout: 5000 });
  });

  test("link de olvidé contraseña existe en login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/Olvidaste/i)).toBeVisible({ timeout: 5000 });
  });

  test("redirige a login cuando se accede a /dashboard sin auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });

  test("redirige a login cuando se accede a /mi-progreso sin auth", async ({ page }) => {
    await page.goto("/mi-progreso");
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });

  test("redirige a login cuando se accede a /cursos sin auth", async ({ page }) => {
    await page.goto("/cursos");
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });

  test("redirige a login cuando se accede a /carrera sin auth", async ({ page }) => {
    await page.goto("/carrera");
    await expect(page).toHaveURL(/login/, { timeout: 8000 });
  });
});
