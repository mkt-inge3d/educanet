import { test, expect } from "@playwright/test";

test.describe("API health checks", () => {
  test("API de cron kpis-autoreporte responde (no 500)", async ({ request }) => {
    const r = await request.get("/api/cron/kpis-autoreporte", {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? "test"}` },
    });
    // Puede ser 401 (no autorizado) o 200, pero no 500
    expect(r.status()).not.toBe(500);
  });

  test("API route inexistente retorna 404", async ({ request }) => {
    const r = await request.get("/api/ruta-que-no-existe-xyz");
    expect(r.status()).toBe(404);
  });
});
