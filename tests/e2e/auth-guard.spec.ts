import { expect, test } from "@playwright/test";

test("redireciona anônimo de rota privada para o login", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/login\?next=%2Ftransactions/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("página de login não tem rolagem horizontal no mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/login");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
