import { expect, type Page } from "@playwright/test";

export const PASSWORD = "E2e-Senha-Segura-2026!";

/** Cria um usuário novo (e-mail único) pelo formulário de cadastro e espera o Início. */
export async function registerUser(page: Page, name = "Pessoa Teste E2E"): Promise<{ email: string }> {
  const email = `e2e+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@financecontrol.local`;
  await page.goto("/register");
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar senha").fill(PASSWORD);
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  return { email };
}

/** Botão "Nova transação" visível (barra lateral no desktop, "+" da barra inferior no mobile). */
export function newTransactionButton(page: Page) {
  return page.getByRole("button", { name: "Nova transação" }).filter({ visible: true }).first();
}

/** Mensagem do toast (sonner). */
export function toast(page: Page, text: string | RegExp) {
  return page.locator("[data-sonner-toast]").filter({ hasText: text });
}
