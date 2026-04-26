import { chromium, FullConfig } from "@playwright/test";
import { TEST_USER } from "./helpers";

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  if (!TEST_USER.email || !TEST_USER.password) {
    console.log("Skipping auth setup: no E2E credentials configured.");
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.locator("#email").fill(TEST_USER.email);
  await page.locator("#password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await page.waitForURL(/home|dashboard|inicio|cursos/, { timeout: 20000 });

  await page.context().storageState({ path: "e2e/.auth/user.json" });
  await browser.close();
}

export default globalSetup;
