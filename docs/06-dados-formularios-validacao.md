# 06 — Dados, Formulários e Validação

> Unidade 6 (modelo de dados, mapeamento, integridade, restrições) sob a ótica do cliente: o frontend **espelha** o modelo do backend; não persiste dados.

## Objetivo

Definir como o frontend representa os dados do domínio, valida entradas (RNF04) com Zod + React Hook Form, converte formatos (dinheiro e datas) e trata erros de validação vindos do servidor.

## Escopo

**Cobre:** schemas espelho, tipos, formulários, conversões pt-BR ↔ contrato, mapeamento de erros por campo, paginação, exibição de categoria ausente (RNF02).
**Não cobre:** banco, ORM e migrações — **não existem no frontend** (ver backend 06). `DATABASE_URL` nunca é usada aqui.

## Regras e padrões

### Mapa (Unidade 6 → frontend)

| Unidade 6 | Frontend |
|---|---|
| Modelo físico / classes ORM | schemas Zod espelho (`features/*/schemas.ts`) + tipos `z.output` |
| Restrições (unique, FK, nullable) | validações Zod equivalentes (UX); **a autoridade é o servidor** |
| Relacionamento opcional | campo `nullable` (ex.: `categoryId: string \| null`) |
| `flask shell` para validar | testes unitários dos schemas e dos conversores |

### Validação em duas camadas (RNF04)

1. **Cliente (UX):** React Hook Form + Zod, mensagens em pt-BR, feedback imediato.
2. **Servidor:** a Server Action **revalida** com o mesmo schema e o backend valida de novo. Erros `400` do backend com `details` são exibidos no campo (`path` → `setError`).

O cliente **nunca** é a única barreira.

### Dinheiro

- Contrato: string decimal com ponto (`"1234.50"`). Nunca guarde/some dinheiro em `number`.
- Entrada do usuário: formato pt-BR (`1.234,50`; ponto = milhar, vírgula = centavos). Entradas ambíguas como `89.90` são **rejeitadas** com orientação ("use vírgula nos centavos").
- Exibição: `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`. Converter para `number` é permitido **somente para exibir**.
- Totais (dashboard) vêm prontos do backend; não recalcule no cliente.

### Datas

- Contrato: `"YYYY-MM-DD"`. **Nunca** `new Date("2026-11-05")` (interpreta como UTC e pode exibir o dia anterior). Formate dividindo a string.
- Mês corrente: usar data local do navegador/servidor, formato `YYYY-MM`.
- Limites de datas retroativas são os do backend **[PENDENTE DE DEFINIÇÃO]**; o frontend só reflete o que o backend definir.

### Formulários

- Um schema de **formulário** (strings como o usuário digita) e uma função `toXxxPayload` que o converte para o **contrato** da API.
- Rótulos (`<label>`) associados a todos os campos; mensagens de erro vinculadas (`aria-describedby`).
- Botão de envio desabilitado durante o envio; sem duplo envio.
- Após sucesso: fechar diálogo, `revalidatePath`, feedback não bloqueante.

### Listagens e paginação

- Mês e página em `searchParams` (`?month=2026-11&page=2`).
- Use `meta.total`, `page`, `pageSize` da API para a paginação.
- Estados obrigatórios: carregando (`loading.tsx`), vazio, erro (`error.tsx`).

### RNF02 na UI

Transação com `categoryId: null` exibe o rótulo **"Sem categoria"** e mantém o valor histórico. Nunca oculte nem exclua essas transações.

### `status` da transação

Valores permitidos: **[PENDENTE DE DEFINIÇÃO]** (definidos no backend). Não invente rótulos de status.

## Exemplos de código

### Schemas espelho

```ts
// src/features/transactions/schemas.ts
// SYNC: finance-control-back/src/modules/transactions/transactions.schemas.ts
import { z } from "zod";

export const transactionTypes = ["income", "expense"] as const;
export const transactionNatures = ["fixed", "variable"] as const;

export const transactionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(transactionTypes),
  nature: z.enum(transactionNatures).nullable(),
  description: z.string(),
  amount: z.string(),                       // "1234.50"
  date: z.string(),                         // "YYYY-MM-DD"
  categoryId: z.string().uuid().nullable(), // null após exclusão da categoria (RNF02)
  origin: z.enum(["manual", "recurrence", "import"]),
});
export type Transaction = z.output<typeof transactionSchema>;

export const transactionsPageSchema = z.object({
  data: z.array(transactionSchema),
  meta: z.object({ page: z.number(), pageSize: z.number(), total: z.number() }),
});

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
```

### Conversores de dinheiro e data

```ts
// src/lib/format/money.ts
const PT_BR_MONEY = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/;

/** "1.234,50" → "1234.50". Retorna null se o formato for inválido ou ambíguo. */
export function parseMoneyInput(input: string): string | null {
  const value = input.trim();
  if (!PT_BR_MONEY.test(value)) return null;
  return value.replace(/\./g, "").replace(",", ".");
}

/** "1234.50" → "R$ 1.234,50" (apenas exibição). */
export function formatMoney(value: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}
```

```ts
// src/lib/format/date.ts
/** "2026-11-05" → "05/11/2026", sem passar por Date (evita deslocamento de fuso). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
```

### Schema de formulário e conversão para o contrato

```ts
export const createTransactionFormSchema = z
  .object({
    type: z.enum(transactionTypes),
    nature: z.enum(transactionNatures).optional(),
    description: z.string().trim().min(1, "Informe a descrição.").max(160, "Máximo de 160 caracteres."),
    amount: z.string().refine((v) => parseMoneyInput(v) !== null, "Use o formato 1.234,50 (vírgula nos centavos)."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
    categoryId: z.string().uuid().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "expense" && !v.nature) {
      ctx.addIssue({ code: "custom", path: ["nature"], message: "Informe se a despesa é fixa ou variável." });
    }
  });
export type CreateTransactionFormValues = z.input<typeof createTransactionFormSchema>;

export function toCreateTransactionPayload(v: z.output<typeof createTransactionFormSchema>) {
  return {
    type: v.type,
    nature: v.type === "expense" ? v.nature ?? null : null,
    description: v.description,
    amount: parseMoneyInput(v.amount)!,        // já validado pelo schema
    date: v.date,
    categoryId: v.categoryId,
  };
}
```

### Formulário com React Hook Form

```tsx
// src/features/transactions/components/transaction-form.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTransactionAction } from "../actions";
import { createTransactionFormSchema, type CreateTransactionFormValues } from "../schemas";

export function TransactionForm({ categories, onDone }: TransactionFormProps) {
  const form = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionFormSchema),
    defaultValues: { type: "expense", description: "", amount: "", date: todayIso(), categoryId: null },
  });

  async function onSubmit(values: CreateTransactionFormValues) {
    const result = await createTransactionAction(values);
    if (result.ok) return onDone();
    // erros 400 do servidor → campos do formulário
    for (const [path, message] of Object.entries(result.error.fieldErrors ?? {})) {
      form.setError(path as keyof CreateTransactionFormValues, { message });
    }
    if (!result.error.fieldErrors || Object.keys(result.error.fieldErrors).length === 0) {
      form.setError("root", { message: result.error.message });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* campos com <label>, aria-invalid e aria-describedby (ver 08) */}
      <button type="submit" disabled={form.formState.isSubmitting}>Salvar</button>
    </form>
  );
}
```

### Exibição de categoria ausente (RNF02)

```tsx
const categoryName = tx.categoryId ? categoriesById.get(tx.categoryId)?.name ?? "Sem categoria" : "Sem categoria";
```

### Teste do conversor de formulário

```ts
it("converte valores do formulário para o contrato da API", () => {
  const values = createTransactionFormSchema.parse({
    type: "expense", nature: "variable", description: "Compra", amount: "1.234,50", date: "2026-11-05", categoryId: null,
  });
  expect(toCreateTransactionPayload(values)).toMatchObject({ amount: "1234.50", date: "2026-11-05", nature: "variable" });
});
```

## Boas práticas e anti-padrões

| Faça | Evite |
|---|---|
| Schema de formulário + conversor para o contrato | Enviar o valor digitado direto à API |
| Rejeitar entrada monetária ambígua | Adivinhar se `89.90` é milhar ou centavos |
| Formatar datas por split de string | `new Date("YYYY-MM-DD")` para exibir |
| Mapear `details[].path` para campos | Mostrar só "erro ao salvar" |
| Revalidar no servidor (Action) | Confiar só na validação do cliente |
| Mostrar "Sem categoria" | Esconder ou perder transações sem categoria |
| Totais vindos do backend | Somar valores no cliente com `number` |

## Checklist de conformidade

- [ ] Schemas espelho têm `// SYNC:` e conferem com o backend.
- [ ] Formulários usam React Hook Form + Zod e têm schema de formulário separado do contrato.
- [ ] Valores monetários trafegam como string decimal; exibição usa `Intl.NumberFormat`.
- [ ] Datas nunca passam por `new Date(string)` para exibição.
- [ ] Erros 400 do servidor aparecem nos campos correspondentes.
- [ ] Transações sem categoria aparecem como "Sem categoria" com o valor preservado.
- [ ] Testes unitários cobrem conversores e schemas.
