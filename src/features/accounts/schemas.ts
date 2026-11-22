import { z } from "zod";

// SYNC: finance-control-back/src/shared/enums.ts (valueSourceTypes) e src/db/schema/value-sources.ts
// (nome ≤ 80 e único por usuário; instituição ≤ 80 e opcional; saldo_inicial numeric(14,2), pode ser negativo).
export const valueSourceTypes = [
  "conta_corrente",
  "poupanca",
  "carteira",
  "cartao_credito",
  "investimento",
  "outro",
] as const;
export type AccountType = (typeof valueSourceTypes)[number];

export const ACCOUNT_NAME_MAX = 80;

export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(valueSourceTypes),
  institution: z.string().nullable(),
  initialBalance: z.string(),
  active: z.boolean(),
  /** Saldo inicial + receitas − despesas efetivadas. */
  currentBalance: z.string(),
});
export type Account = z.output<typeof accountSchema>;

export const accountListSchema = z.object({ data: z.array(accountSchema) });

const decimal = /^-?\d{1,12}\.\d{2}$/;

/** Corpo de criação/edição (PUT substitui o recurso inteiro). */
export const accountInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome à conta.")
    .max(ACCOUNT_NAME_MAX, `Use no máximo ${ACCOUNT_NAME_MAX} caracteres.`),
  type: z.enum(valueSourceTypes),
  institution: z
    .string()
    .trim()
    .max(80, "Use no máximo 80 caracteres.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  initialBalance: z.string().regex(decimal, "Informe um valor válido."),
  active: z.boolean(),
});
export type AccountInput = z.output<typeof accountInputSchema>;

/** Formulário: valor sempre positivo na máscara + "saldo negativo" à parte. */
export const accountFormSchema = z.object({
  name: accountInputSchema.shape.name,
  type: z.enum(valueSourceTypes),
  institution: z.string().trim().max(80, "Use no máximo 80 caracteres."),
  initialBalance: z.string().regex(/^\d{1,12}\.\d{2}$/, "Informe um valor válido."),
  negative: z.boolean(),
  active: z.boolean(),
});
export type AccountFormValues = z.output<typeof accountFormSchema>;

export function toAccountInput(values: AccountFormValues): z.input<typeof accountInputSchema> {
  const isZero = Number(values.initialBalance) === 0;
  return {
    name: values.name,
    type: values.type,
    institution: values.institution,
    initialBalance: values.negative && !isZero ? `-${values.initialBalance}` : values.initialBalance,
    active: values.active,
  };
}

export function toAccountFormValues(account: Account | null): AccountFormValues {
  if (!account) {
    return { name: "", type: "conta_corrente", institution: "", initialBalance: "0.00", negative: false, active: true };
  }
  const negative = account.initialBalance.startsWith("-");
  return {
    name: account.name,
    type: account.type,
    institution: account.institution ?? "",
    initialBalance: negative ? account.initialBalance.slice(1) : account.initialBalance,
    negative,
    active: account.active,
  };
}
