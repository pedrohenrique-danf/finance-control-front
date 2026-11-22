import { expect, test } from "@playwright/test";
import { newTransactionButton, registerUser, toast } from "./helpers";

/** Valor do card "Despesas variáveis" do início, em centavos. */
async function variableExpensesCents(page: import("@playwright/test").Page): Promise<number> {
  await page.goto("/dashboard");
  const card = page
    .getByRole("region", { name: "Resumo do mês" })
    .locator("div")
    .filter({ hasText: "Despesas variáveis" })
    .last();
  const text = (await card.locator("span.num").first().textContent()) ?? "";
  return Number(text.replace(/[^\d,]/g, "").replace(",", ".")) * 100;
}

test("categoria → transação → extrato e início; excluir a categoria mantém a transação (RNF02)", async ({ page }) => {
  await registerUser(page);
  const category = `Pets ${Date.now() % 10_000}`;
  const before = await variableExpensesCents(page);

  // RF02: nova categoria
  await page.goto("/categories");
  await page.getByRole("button", { name: "Nova categoria" }).filter({ visible: true }).first().click();
  await page.getByRole("dialog").getByLabel("Nome").fill(category);
  await page.getByRole("radio", { name: "Pets" }).click();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(toast(page, "Categoria criada.")).toBeVisible();

  // RF03: lançar transação pelo botão global
  await newTransactionButton(page).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Valor").fill("12345");
  await expect(sheet.getByLabel("Valor")).toHaveValue("123,45");
  await sheet.getByLabel("Descrição").fill("Ração premium");
  await sheet.getByRole("radio", { name: category }).click();
  await sheet.getByRole("button", { name: "Salvar" }).click();
  await expect(toast(page, "Transação salva.")).toBeVisible();

  // RF06: aparece no extrato com a categoria
  await page.goto("/transactions?q=ração premium");
  const row = page.getByRole("button", { name: "Editar Ração premium" });
  await expect(row).toContainText(category);
  await expect(row).toContainText("123,45");

  // RF05: o card de despesas variáveis do início soma o lançamento
  expect(Math.round((await variableExpensesCents(page)) - before)).toBe(12345);

  // RNF02: excluir a categoria não apaga a transação
  await page.goto("/categories");
  await page.getByRole("button", { name: `Editar ${category}` }).click();
  await page.getByRole("button", { name: "Excluir categoria" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
  await expect(toast(page, "Categoria excluída.")).toBeVisible();

  await page.goto("/transactions?q=ração premium");
  await expect(page.getByRole("button", { name: "Editar Ração premium" })).toContainText("Sem categoria");
});

test("extrato: busca, filtros na URL e estado sem resultados", async ({ page }) => {
  await registerUser(page);
  await page.goto("/transactions");
  await page.getByLabel("Buscar transação").fill("mercado");
  await expect(page).toHaveURL(/q=mercado/);
  await page.getByRole("button", { name: "Receitas", exact: true }).click();
  await expect(page).toHaveURL(/filtro=receitas/);
  await expect(page.getByRole("heading", { name: "Nenhuma transação encontrada" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page).not.toHaveURL(/q=|filtro=/);
  await expect(page.getByLabel("Buscar transação")).toHaveValue("");
});

test("despesa fixa: criar com término, ver a agenda e encerrar mantendo o lançamento", async ({ page }) => {
  await registerUser(page);
  await page.goto("/recurrences");
  await page.getByRole("button", { name: "Nova despesa fixa" }).filter({ visible: true }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Valor").fill("5990");
  await sheet.getByLabel("Descrição").fill("Plano de celular");
  await sheet.getByRole("radio", { name: "Moradia" }).click();
  await sheet.getByLabel("Vence dia").fill("31");
  await sheet.getByText("Sem data de término").click(); // o rótulo inteiro alterna o interruptor
  await sheet.getByLabel("Data de fim").fill("2099-12-31");
  await sheet.getByRole("button", { name: "Salvar" }).click();
  await expect(toast(page, "Despesa fixa criada.")).toBeVisible();

  await page.getByRole("link", { name: /Plano de celular/ }).click();
  await expect(page.getByRole("heading", { name: "Próximos 6 meses" })).toBeVisible();
  await expect(page.locator("ol li")).toHaveCount(6);

  await page.getByRole("button", { name: "Excluir recorrência" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
  await expect(page).toHaveURL(/\/recurrences$/);
  await page.goto("/transactions?q=plano de celular");
  await expect(page.getByRole("button", { name: "Editar Plano de celular" }).first()).toBeVisible();
});
