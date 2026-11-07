# 08 — UI, Responsividade e Acessibilidade

> Aplicação das Unidades 2 e 4 à camada visual: estados de requisição (loading/erro/vazio), separação server/client e requisitos RF05, RF06, RF07 e RNF01.

## Objetivo

Definir os padrões de interface do FinanceControl: abordagem **UI-First** e **mobile-first**, dashboard em cards (RF05), listagem mensal (RF06), importação/exportação (RF07) e acessibilidade, usando Tailwind CSS e shadcn/ui.

## Escopo

**Cobre:** layout responsivo, componentes, estados de UI, dashboard, tabela, formulários visuais, acessibilidade.
**Não cobre:** lógica de formulário e conversões (06), autenticação (07). Ferramenta de acessibilidade automatizada: **[PENDENTE DE DEFINIÇÃO]**. Fluxo de download/upload de CSV: **[PENDENTE DE DEFINIÇÃO]**.

## Regras e padrões

### Mobile-first (RNF01)

- Escreva o CSS base para **360 px** e amplie com `sm:`, `md:`, `lg:`. Nada de `max-width` como estratégia principal.
- Sem rolagem horizontal da página em nenhuma tela. Tabelas largas ficam em contêiner com `overflow-x-auto` **ou** viram lista de cartões no mobile.
- Alvos de toque ≥ 44 × 44 px; espaçamento suficiente entre ações.
- Tema/estilos por tokens do Tailwind/shadcn; não use valores mágicos de cor ou tamanho espalhados.

### Componentes

- Primitivos de `components/ui/` (shadcn/ui) são a base: `Button`, `Card`, `Dialog`, `Input`, `Label`, `Select`, `Table`. Evite modificá-los; componha em `features/*/components` ou `components/layout`.
- Server Components renderizam estrutura e dados; Client Components só para interação (diálogos, formulários, seletor de mês).
- Textos em pt-BR; moeda `R$ 1.234,50`; data `05/11/2026`.

### Estados obrigatórios de cada tela com dados

| Estado | Implementação |
|---|---|
| Carregando | `loading.tsx` (esqueleto) |
| Vazio | mensagem + ação ("Nenhuma transação neste mês. Adicione a primeira.") |
| Erro | `error.tsx` com "Tentar novamente" e `requestId` quando houver |
| Sucesso/Falha de ação | feedback não bloqueante (toast) + mensagem associada ao campo |

### Dashboard (RF05)

- Quatro cards: **Receitas**, **Despesas fixas**, **Despesas variáveis**, **Saldo** do mês filtrado.
- Valores vêm de `GET /api/v1/dashboard/summary?month=`; não recalcule no cliente.
- Grid: 1 coluna (mobile), 2 (`sm`), 4 (`lg`).
- Saldo negativo: não use apenas cor; inclua sinal/ícone e texto acessível.
- Seletor de mês altera `?month=YYYY-MM` na URL.

### Listagem mensal (RF06)

- Tabela com data, descrição, categoria (ou "Sem categoria"), natureza, valor; ordenação padrão por data.
- Paginação por `?page=` usando `meta` da API; indicar página atual e total.
- Em telas pequenas, cada linha pode virar cartão com os mesmos dados.
- Valor de despesa e receita distinguíveis por sinal/rótulo, não só por cor.

### Importação e exportação (RF07)

- Página única `import-export`: seleção de arquivo CSV, botão importar, resumo (linhas com sucesso/erro) e exportação por mês.
- Exibir erros de importação por linha/campo de forma legível.
- Mecanismo de upload/download: **[PENDENTE DE DEFINIÇÃO]** (depende do formato final do backend).

### Acessibilidade

- Todo campo tem `<label>` associado; erros ligados por `aria-describedby` e `aria-invalid`.
- Foco visível; navegação completa por teclado; diálogos devolvem o foco ao fechar.
- Contraste mínimo AA; informação nunca só por cor.
- Botões com texto ou `aria-label`; ícones decorativos com `aria-hidden`.
- `lang="pt-BR"` em `<html>`.
- Headings em ordem (`h1` único por página).

## Exemplos de código

### Página do dashboard (Server Component)

```tsx
// src/app/(private)/dashboard/page.tsx
import { getDashboardApi } from "@/features/dashboard/server";
import { SummaryCards, MonthSelector } from "@/features/dashboard";
import { PageSection } from "@/components/layout/page-section";
import { monthSchema } from "@/features/transactions/schemas";
import { currentMonth } from "@/lib/format/date";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;       // Promise no Next 16
}) {
  const { month: raw } = await searchParams;
  const month = monthSchema.safeParse(raw).success ? raw! : currentMonth();
  const summary = await (await getDashboardApi()).summary(month);

  return (
    <PageSection title="Resumo do mês" actions={<MonthSelector month={month} />}>
      <SummaryCards summary={summary} />
    </PageSection>
  );
}
```

### Cards responsivos

```tsx
// src/features/dashboard/components/summary-cards.tsx
import { formatMoney } from "@/lib/format/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const items = [
    { id: "income", label: "Receitas", value: summary.income },
    { id: "fixed", label: "Despesas fixas", value: summary.fixedExpenses },
    { id: "variable", label: "Despesas variáveis", value: summary.variableExpenses },
    { id: "balance", label: "Saldo", value: summary.balance },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} data-testid={`card-${item.id}`}>
          <CardHeader><CardTitle className="text-sm font-medium">{item.label}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{formatMoney(item.value)}</p></CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Tabela com rolagem controlada e estado vazio

```tsx
export function TransactionsTable({ items, month }: { items: Transaction[]; month: string }) {
  if (items.length === 0) {
    return <p role="status">Nenhuma transação em {month}. Adicione a primeira.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <caption className="sr-only">Transações de {month}</caption>
        <thead>
          <tr><th scope="col" className="p-3 text-left">Data</th>{/* Descrição, Categoria, Natureza, Valor */}</tr>
        </thead>
        <tbody>
          {items.map((tx) => (
            <tr key={tx.id}>
              <td className="p-3">{formatDate(tx.date)}</td>
              {/* categoria: tx.categoryId ? nome : "Sem categoria" (RNF02) */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Campo acessível

```tsx
<div className="space-y-1">
  <Label htmlFor="amount">Valor</Label>
  <Input
    id="amount"
    inputMode="decimal"
    aria-invalid={Boolean(errors.amount)}
    aria-describedby={errors.amount ? "amount-error" : undefined}
    {...register("amount")}
  />
  {errors.amount ? <p id="amount-error" role="alert" className="text-sm text-destructive">{errors.amount.message}</p> : null}
</div>
```

### Verificação de rolagem horizontal (E2E mobile)

```ts
test("dashboard não tem rolagem horizontal no mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/dashboard");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
```

### `error.tsx`

```tsx
"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="space-y-2">
      <h2 className="text-lg font-semibold">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground">Não foi possível carregar esta página.</p>
      {error.digest ? <p className="text-xs">Código: {error.digest}</p> : null}
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
```

## Boas práticas e anti-padrões

| Faça | Evite |
|---|---|
| CSS base para 360 px + breakpoints crescentes | Layout só de desktop "adaptado" depois |
| Sinal/ícone/texto + cor | Informar saldo negativo só em vermelho |
| `loading.tsx`, `error.tsx`, estado vazio | Tela em branco enquanto carrega ou falha |
| `<label>` + `aria-describedby` | Placeholder como único rótulo |
| Componentes shadcn compostos | Alterar primitivos para cada caso |
| Totais do backend | Somar no cliente |
| Texto e formato pt-BR | Mistura de idiomas e formatos |

## Checklist de conformidade

- [ ] Todas as telas funcionam em 360 px sem rolagem horizontal da página.
- [ ] Dashboard mostra os quatro cards com valores do backend.
- [ ] Listagem mensal tem paginação por `searchParams` e estado vazio/erro/carregando.
- [ ] Transações sem categoria exibem "Sem categoria".
- [ ] Campos com rótulo, erro associado e navegação por teclado.
- [ ] Informação nunca depende apenas de cor.
- [ ] E2E roda em desktop e mobile.
