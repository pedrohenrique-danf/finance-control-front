import { expect, test } from "@playwright/test";
import { registerUser, toast } from "./helpers";

// A pré-visualização usa a rota real do backend (POST /api/v1/imports/preview): o backend precisa estar rodando.
const CSV = [
  "data;descricao;valor;tipo;natureza;situacao;categoria;conta",
  "03/11/2026;Feira E2E;45,00;despesa;variavel;efetivada;Alimentação;Carteira",
  "04/11/2026;Freela E2E;600,00;receita;;efetivada;Freelance;Nubank",
  "31/02/2026;Data errada;10,00;despesa;;;;",
].join("\n");

test("importar CSV: pré-visualização do backend, erro por linha, confirmação, histórico e notificação", async ({
  page,
}) => {
  await registerUser(page);
  await page.goto("/import-export");
  await page
    .locator("#import-file")
    .setInputFiles({ name: "planilha.csv", mimeType: "text/csv", buffer: Buffer.from(CSV) });
  await page.getByRole("button", { name: "Ler arquivo" }).click();

  await expect(page.getByRole("heading", { name: "Planilha CSV" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("1 linha não pôde ser lida")).toBeVisible();
  await expect(page.getByLabel("Categoria de Feira E2E")).toHaveValue(/.+/); // categoria reconhecida pelo nome
  await page.getByRole("button", { name: "Importar 2 transações" }).click();
  await expect(toast(page, "2 transações importadas.")).toBeVisible();
  await expect(page.getByText("planilha.csv")).toBeVisible();

  await page.goto("/transactions?q=e2e");
  await expect(page.getByRole("button", { name: /^Editar (Feira|Freela) E2E/ })).toHaveCount(2);

  await page.goto("/notifications");
  await expect(page.getByText("Importação concluída")).toBeVisible();
});

test("importar PDF que não é do Nubank mostra erro claro", async ({ page }) => {
  await registerUser(page);
  await page.goto("/import-export");
  const pdf =
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
  await page
    .locator("#import-file")
    .setInputFiles({ name: "outro.pdf", mimeType: "application/pdf", buffer: Buffer.from(pdf) });
  await page.getByRole("button", { name: "Ler arquivo" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/PDF/);
});

test("exportar CSV do mês no formato da importação", async ({ page }) => {
  await registerUser(page);
  await page.goto("/import-export");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: /Baixar CSV/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^financecontrol-\d{4}-\d{2}\.csv$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const content = Buffer.concat(chunks).toString("utf8");
  expect(content.charCodeAt(0)).toBe(0xfeff);
  expect(content).toContain("data;descricao;valor;tipo;natureza;situacao;categoria;conta");
});

test("preferências: desligar categorias para de gerar o aviso; atalho a partir das notificações", async ({ page }) => {
  await registerUser(page);
  await page.goto("/notifications");
  await page.getByRole("link", { name: "Escolher avisos" }).click();
  await expect(page).toHaveURL(/\/profile#avisos$/);

  const categorias = page.getByRole("switch", { name: "Categorias" });
  await expect(categorias).toBeChecked();
  // A tela é otimista (muda na hora); espera a Server Action terminar de gravar antes de recarregar.
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/profile"));
  await categorias.click();
  await expect(categorias).not.toBeChecked();
  expect((await saved).ok()).toBe(true);
  await page.reload(); // gravado no backend
  await expect(page.getByRole("switch", { name: "Categorias" })).not.toBeChecked();

  await page.goto("/categories");
  await page.getByRole("button", { name: "Nova categoria" }).filter({ visible: true }).first().click();
  await page.getByRole("dialog").getByLabel("Nome").fill("Sem aviso E2E");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(toast(page, "Categoria criada.")).toBeVisible();

  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Nenhuma notificação" })).toBeVisible();
});
