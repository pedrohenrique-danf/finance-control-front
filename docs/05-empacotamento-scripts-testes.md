# 05 — Empacotamento, Dependências, Scripts e Testes

> Unidade 5 (projeto como pacote, `pyproject.toml`, dependências de runtime × desenvolvimento, `invoke`, PyTest, fixtures, cobertura).

## Objetivo

Definir `package.json`, dependências, scripts de automação e a estratégia de testes do frontend (unitários e fluxos com Playwright).

## Escopo

**Cobre:** `package.json`, dependências, scripts, testes unitários, Playwright (desktop e mobile), CI mínima.
**Não cobre:** código de aplicação (demais arquivos). Testes de componente dependem de ferramenta **[PENDENTE DE DEFINIÇÃO]**.

## Regras e padrões

### Empacotamento

- `package.json` concentra metadados, dependências e scripts; `"private": true`.
- Fixe versões (`pnpm add --save-exact`, sem `^`/`latest`); versione o `pnpm-lock.yaml`; `engines` `>=22.16.0`; `packageManager` `pnpm@12`.
- Setup padronizado: clonar → `pnpm install` → copiar `.env.example` para `.env.local` → subir o backend → `pnpm dev`.
- Antes do primeiro E2E: `pnpm exec playwright install chromium`.

### Dependências

| Grupo | Pacotes (definidos) | Observação |
|---|---|---|
| `dependencies` | `next`, `react`, `react-dom`, `zod`, `better-auth`, `react-hook-form`, `@hookform/resolvers`, `server-only` | `@hookform/resolvers` é o adaptador oficial para usar Zod com React Hook Form; `server-only` é o pacote recomendado pelo Next para proteger módulos de servidor |
| UI | `tailwindcss`, `@tailwindcss/turbopack`, componentes shadcn/ui (copiados para `components/ui`) e as dependências que eles exigem: `shadcn`, `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `sonner`, `next-themes`, `tw-animate-css` | nada além do que o shadcn/ui requerer |
| `devDependencies` | `typescript`, `@biomejs/biome`, `vitest`, `@vitest/coverage-v8`, `@playwright/test`, tipos (`@types/*`) | |

Não adicione biblioteca fora desta tabela sem autorização.

### Scripts obrigatórios

| Script | Finalidade | Comando |
|---|---|---|
| `dev` | desenvolvimento | `next dev` |
| `build` | build de produção | `next build` |
| `start` | produção | `next start` |
| `typecheck` | tipos | `tsc --noEmit` |
| `lint` | análise estática | `biome lint .` |
| `format` / `format:check` | formatação | `biome format --write .` / `biome format .` |
| `check` | lint + formatação + organização de imports | `biome check .` |
| `test` | unitários | `vitest run` |
| `test:coverage` | cobertura | `vitest run --coverage` |
| `test:e2e` | fluxos Playwright | `playwright test` |
| `verify` | `typecheck` + `lint` + `test` | encadeado |

### Estratégia de testes

| Nível | O que testa | Ferramenta |
|---|---|---|
| Unitário | funções puras (`formatMoney`, `parseMoneyInput`, datas), schemas Zod, cliente HTTP (com `fetch` falso), fábricas de API | Vitest |
| Componente | **[PENDENTE DE DEFINIÇÃO]** | — |
| Fluxo (E2E) | jornadas completas contra frontend + backend reais | Playwright |

Regras:

- E2E exige backend em execução com banco **de teste** **[PENDENTE DE DEFINIÇÃO]** — nunca produção.
- Cada teste cria seu próprio usuário (e-mail único) e não depende de ordem.
- Localize elementos por papel/rótulo (`getByRole`, `getByLabel`), nunca por classe CSS.
- Execute os fluxos em **dois projetos**: desktop e mobile (RNF01).
- Teste os requisitos: RNF02 (categoria excluída preserva a transação), RNF04 (validação), proteção de rotas (RNF03).
- Cobertura mínima: **[PENDENTE DE DEFINIÇÃO]**.
- CI mínima: `typecheck → lint → test → build → test:e2e`. Plataforma **[PENDENTE DE DEFINIÇÃO]**.

## Exemplos de código

### `package.json` (ilustrativo)

```jsonc
{
  "name": "finance-control-front",
  "private": true,
  "packageManager": "pnpm@12.15.0",
  "engines": { "node": ">=22.16.0" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "verify": "pnpm typecheck && pnpm lint && pnpm test"
    // lista completa: package.json do repositório
  }
}
```

### `playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Teste unitário de dinheiro e datas

```ts
import { describe, it, expect } from "vitest";   // com Jest, remova este import
import { parseMoneyInput, formatMoney } from "@/lib/format/money";
import { formatDate } from "@/lib/format/date";

describe("dinheiro", () => {
  it.each([
    ["1.234,50", "1234.50"],
    ["89,9", "89.9"],
    ["100", "100"],
  ])("converte %s em %s", (input, expected) => expect(parseMoneyInput(input)).toBe(expected));

  it.each(["89.90", "abc", "1,234,50", "", "-5"])("rejeita %s", (input) =>
    expect(parseMoneyInput(input)).toBeNull());

  it("formata em BRL", () => expect(formatMoney("1234.50").replace(/\s/g, " ")).toBe("R$ 1.234,50"));
});

it("formata data sem deslocar o fuso", () => expect(formatDate("2026-11-05")).toBe("05/11/2026"));
```

### Fluxo E2E: cadastro → categoria → transação → dashboard

```ts
// tests/e2e/transactions.spec.ts
import { test, expect } from "@playwright/test";

test("lança despesa e vê o saldo no dashboard", async ({ page }) => {
  const email = `user-${crypto.randomUUID()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Nome").fill("Teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("Senha-segura-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/categories");
  await page.getByRole("button", { name: "Nova categoria" }).click();
  await page.getByLabel("Nome").fill("Mercado");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Mercado")).toBeVisible();

  await page.goto("/transactions");
  await page.getByRole("button", { name: "Nova transação" }).click();
  await page.getByLabel("Descrição").fill("Compra do mês");
  await page.getByLabel("Valor").fill("89,90");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("R$ 89,90")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByTestId("card-balance")).toContainText("89,90");
});
```

### Fluxo E2E: RNF02 (categoria excluída preserva a transação)

```ts
test("excluir categoria mantém a transação sem categoria", async ({ page }) => {
  // pré-condição: usuário logado, categoria "Mercado" e transação de R$ 89,90 vinculada (via helper de setup)
  await page.goto("/categories");
  await page.getByRole("button", { name: "Excluir Mercado" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();

  await page.goto("/transactions");
  const row = page.getByRole("row", { name: /Compra do mês/ });
  await expect(row).toContainText("R$ 89,90");
  await expect(row).toContainText("Sem categoria");
});
```

### Rota privada sem sessão

```ts
test("redireciona anônimo para o login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
```

## Boas práticas e anti-padrões

| Faça | Evite |
|---|---|
| Scripts para tarefas recorrentes | Comandos longos copiados manualmente |
| E2E em desktop **e** mobile | Testar só em desktop |
| Localizar por papel/rótulo | Seletores por classe/ordem |
| Um usuário novo por teste | Dados compartilhados e dependência de ordem |
| Testar RNF02/RNF03/RNF04 explicitamente | Testar só o caminho feliz |
| Fixar versões + lockfile | Dependências soltas |
| `data-testid` apenas quando não houver papel/rótulo | `data-testid` em tudo |

## Checklist de conformidade

- [ ] Scripts da tabela existem (ou estão marcados como pendentes).
- [ ] Dependências novas foram autorizadas e fixadas; lockfile versionado.
- [ ] Funções puras e cliente HTTP têm testes unitários.
- [ ] Fluxos E2E cobrem cadastro/login, categoria, transação, dashboard e RNF02.
- [ ] E2E roda nos projetos desktop e mobile.
- [ ] Testes não dependem de ordem nem de dados prévios.
- [ ] `verify` passa antes de abrir PR.
