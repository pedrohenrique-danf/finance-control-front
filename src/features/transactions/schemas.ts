import { z } from "zod";

// SYNC: finance-control-back src/shared/enums.ts e src/db/schema/transactions.ts
// (descrição ≤ 160, valor > 0, natureza só em despesas, status default "efetivada").
// Contrato: finance-control-back docs/07 (createTransactionSchema, listTransactionsQuerySchema).
export const transactionTypes = ["receita", "despesa"] as const;
export const transactionNatures = ["fixa", "variavel"] as const;
export const transactionStatuses = ["pendente", "efetivada"] as const;
export const transactionOrigins = ["manual", "recorrencia", "importacao"] as const;

export type TransactionType = (typeof transactionTypes)[number];
export type TransactionNature = (typeof transactionNatures)[number];
export type TransactionStatus = (typeof transactionStatuses)[number];

export const DESCRIPTION_MAX = 160;

export const transactionSchema = z.object({
  id: z.string(),
  type: z.enum(transactionTypes),
  nature: z.enum(transactionNatures).nullable(),
  description: z.string(),
  amount: z.string(),
  date: z.string(),
  status: z.enum(transactionStatuses),
  origin: z.enum(transactionOrigins),
  categoryId: z.string().nullable(),
  valueSourceId: z.string().nullable(),
  recurrenceId: z.string().nullable(),
});
export type Transaction = z.output<typeof transactionSchema>;

export const transactionPageSchema = z.object({
  data: z.array(transactionSchema),
  meta: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
    summary: z.object({ income: z.string(), expense: z.string(), balance: z.string() }),
    dayTotals: z.record(z.string(), z.string()),
  }),
});
export type TransactionPage = z.output<typeof transactionPageSchema>;

/** Dados auxiliares que a tela recebe de outras features (composição feita pelo app/). */
export interface CategoryOption {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
}
export interface AccountOption {
  id: string;
  name: string;
  active: boolean;
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data válida.")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00`).getTime()), "Escolha uma data válida.")
  .refine((v) => v >= "2000-01-01", "Use uma data a partir de 01/01/2000.");

/** Corpo de POST/PUT /transactions (contrato). */
export const transactionInputSchema = z
  .object({
    type: z.enum(transactionTypes),
    nature: z.enum(transactionNatures).nullable(),
    description: z.string().trim().min(1).max(DESCRIPTION_MAX),
    amount: z.string().regex(/^\d{1,12}\.\d{2}$/),
    date: isoDate,
    status: z.enum(transactionStatuses),
    categoryId: z.uuid().nullable(),
    valueSourceId: z.uuid().nullable(),
  })
  .refine((v) => (v.type === "despesa" ? v.nature !== null : v.nature === null), {
    path: ["nature"],
    message: "Natureza só se aplica a despesas.",
  })
  .refine((v) => Number(v.amount) > 0, { path: ["amount"], message: "Informe um valor maior que zero." });
export type TransactionInput = z.output<typeof transactionInputSchema>;

/** Formulário (UX): categoria e conta obrigatórias; natureza ignorada em receitas. */
export const transactionFormSchema = z.object({
  type: z.enum(transactionTypes),
  amount: z.string().refine((v) => Number(v) > 0, "Informe um valor maior que zero."),
  description: z
    .string()
    .trim()
    .min(1, "Descreva a transação.")
    .max(DESCRIPTION_MAX, `Use no máximo ${DESCRIPTION_MAX} caracteres.`),
  date: z.string().min(1, "Escolha uma data.").pipe(isoDate),
  categoryId: z.string().min(1, "Escolha uma categoria."),
  valueSourceId: z.string().min(1, "Escolha uma conta ou cartão."),
  nature: z.enum(transactionNatures),
  status: z.enum(transactionStatuses),
});
export type TransactionFormValues = z.output<typeof transactionFormSchema>;

export function toTransactionInput(values: TransactionFormValues): TransactionInput {
  return {
    type: values.type,
    nature: values.type === "despesa" ? values.nature : null,
    description: values.description,
    amount: values.amount,
    date: values.date,
    status: values.status,
    categoryId: values.categoryId,
    valueSourceId: values.valueSourceId,
  };
}

/** Valores do formulário a partir de uma transação existente (categoria apagada → vazio). */
export function toTransactionFormValues(
  t: Transaction,
  categories: readonly CategoryOption[],
  accounts: readonly AccountOption[],
): TransactionFormValues {
  const category = categories.find((c) => c.id === t.categoryId && c.type === t.type);
  return {
    type: t.type,
    amount: t.amount,
    description: t.description,
    date: t.date,
    categoryId: category?.id ?? "",
    valueSourceId: accounts.some((a) => a.id === t.valueSourceId) ? (t.valueSourceId ?? "") : "",
    nature: t.nature ?? "variavel",
    status: t.status,
  };
}
