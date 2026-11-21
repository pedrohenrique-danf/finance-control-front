import { expect, test } from "@playwright/test";
import { PASSWORD, registerUser } from "./helpers";

test("redireciona anônimo de rota privada para o login", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/login\?next=%2Ftransactions/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
});

test("página de login não tem rolagem horizontal no mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/login");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("cadastro, sair, senha errada com mensagem genérica e login voltando para o `next`", async ({ page }) => {
  const { email } = await registerUser(page);
  await expect(page.getByText(/^Olá,/)).toContainText("Pessoa");

  await page.goto("/profile");
  await page.getByRole("main").getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/categories");
  await expect(page).toHaveURL(/\/login\?next=%2Fcategories/);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha inválidos.");

  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/categories$/);
});

test("validação do cadastro aponta todos os campos", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Criar conta" }).click();
  for (const message of ["Informe seu nome.", "Informe seu e-mail.", "Aceite os termos para continuar."]) {
    await expect(page.getByText(message)).toBeVisible();
  }
});

test("link de redefinição inválido oferece pedir outro", async ({ page }) => {
  await page.goto("/reset-password?error=INVALID_TOKEN");
  await expect(page.getByRole("heading", { name: "Link inválido ou expirado" })).toBeVisible();
  await page.getByRole("link", { name: "Pedir novo link" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});
