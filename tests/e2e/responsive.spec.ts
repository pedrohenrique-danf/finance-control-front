import { expect, test } from "@playwright/test";
import { registerUser } from "./helpers";

// RNF01: todas as telas funcionam em 360 px sem rolagem horizontal, com um único h1 e um main.
const PRIVATE_ROUTES = [
  "/dashboard",
  "/transactions",
  "/categories",
  "/recurrences",
  "/accounts",
  "/import-export",
  "/notifications",
  "/profile",
];

test("telas da área logada em 360 px", async ({ page }) => {
  await registerUser(page);
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of PRIVATE_ROUTES) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      h1: document.querySelectorAll("h1").length,
      main: document.querySelectorAll("main").length,
    }));
    expect(state, path).toEqual({ overflow: false, h1: 1, main: 1 });
  }
});

test("telas públicas em 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/login", "/register", "/forgot-password", "/reset-password"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, path).toBe(false);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});
