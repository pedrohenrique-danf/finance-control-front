import { expect, test } from "@playwright/test";
import { PASSWORD, registerUser } from "./helpers";

test("termos e privacidade são públicos e estão ligados ao cadastro e ao login", async ({ page }) => {
  await page.goto("/register");
  // Link do checkbox (minúsculo); o aviso do Google e o rodapé têm "Termos de uso".
  const termos = page.getByRole("main").getByRole("link", { name: "termos de uso", exact: true });
  await expect(termos).toHaveAttribute("href", "/termos");
  await expect(termos).toHaveAttribute("target", "_blank");
  await expect(page.getByText("Ao continuar com o Google, você aceita os")).toBeVisible();

  await page.goto("/login");
  await page
    .getByRole("navigation", { name: "Documentos" })
    .getByRole("link", { name: "Política de privacidade" })
    .click();
  await expect(page).toHaveURL(/\/privacidade$/);
  await expect(page.getByRole("heading", { name: "Política de privacidade", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "7. Seus direitos" })).toBeVisible();

  await page.getByRole("banner").getByRole("link", { name: "Termos" }).click();
  await expect(page.getByRole("heading", { name: "Termos de uso", level: 1 })).toBeVisible();
});

test("baixar meus dados entrega um JSON com o perfil", async ({ page }) => {
  const { email } = await registerUser(page);
  await page.goto("/profile");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Baixar meus dados" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^financecontrol-meus-dados-\d{4}-\d{2}-\d{2}\.json$/);
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(Buffer.from(chunk));
  const data = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { profile: { email: string } };
  expect(data.profile.email).toBe(email);
});

test("excluir conta: pede a senha, apaga e o login deixa de funcionar", async ({ page }) => {
  const { email } = await registerUser(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Excluir conta" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByLabel("Sua senha")).toBeVisible();

  await dialog.getByRole("checkbox").click();
  await dialog.getByLabel("Sua senha").fill("senha-errada-123");
  await dialog.getByRole("button", { name: "Excluir conta" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Senha incorreta.");

  await dialog.getByLabel("Sua senha").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Excluir conta" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
});
