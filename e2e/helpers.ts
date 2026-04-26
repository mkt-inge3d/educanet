import { test, type Page } from "@playwright/test";

export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? "",
  password: process.env.E2E_USER_PASSWORD ?? "",
};

export function requiresAuth() {
  if (!TEST_USER.email || !TEST_USER.password) {
    test.skip(true, "E2E_USER_EMAIL y E2E_USER_PASSWORD no configurados. Crea .env.e2e con las credenciales.");
  }
}

export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await page.waitForURL(/home|dashboard|inicio|cursos/, { timeout: 12000 });
}
