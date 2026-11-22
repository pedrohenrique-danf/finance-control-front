import { z } from "zod";

// SYNC: finance-control-back docs/07 ("Despesas fixas (recorrências, RF04)") e src/db/schema/recurrences.ts.
export const transactionTypes = ["receita", "despesa"] as const;
export type RecurrenceType = (typeof transactionTypes)[number];

export const DESCRIPTION_MAX = 160;

export const recurrenceSchema = z.object({
  id: z.string(),
  type: z.enum(transactionTypes),
  description: z.string(),
  amount: z.string(),
  dueDay: z.number().int(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  active: z.boolean(),
  categoryId: z.string().nullable(),
  valueSourceId: z.string().nullable(),
});
export type Recurrence = z.output<typeof recurrenceSchema>;

export const recurrenceListSchema = z.object({ data: z.array(recurrenceSchema) });

export const scheduleStatuses = ["efetivada", "pendente", "prevista"] as const;
export type ScheduleStatus = (typeof scheduleStatuses)[number];

export const recurrenceDetailSchema = recurrenceSchema.extend({
  schedule: z.array(
    z.object({
      month: z.string(),
      dueDate: z.string(),
      status: z.enum(scheduleStatuses),
      transactionId: z.string().nullable(),
    }),
  ),
});
export type RecurrenceDetail = z.output<typeof recurrenceDetailSchema>;

/** Dados que a tela recebe de outras features (composição feita pelo app/). */
export interface RecurrenceCategory {
  id: string;
  name: string;
  type: RecurrenceType;
  color: string;
  icon: string | null;
}
export interface RecurrenceAccount {
  id: string;
  name: string;
  active: boolean;
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data válida.");
const money = z.string().regex(/^\d{1,12}\.\d{2}$/);

const fields = {
  description: z.string().trim().min(1).max(DESCRIPTION_MAX),
  amount: money.refine((v) => Number(v) > 0, "Informe um valor maior que zero."),
  dueDay: z.number().int().min(1).max(31),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  categoryId: z.uuid().nullable(),
  valueSourceId: z.uuid().nullable(),
};
const endAfterStart = (v: { startDate: string; endDate: string | null }) => !v.endDate || v.endDate >= v.startDate;
const endMessage = { path: ["endDate"], message: "A data de fim deve ser depois do início." };

/** POST /recurrences. */
export const recurrenceCreateSchema = z
  .object({ type: z.enum(transactionTypes), ...fields })
  .refine(endAfterStart, endMessage);
export type RecurrenceCreateInput = z.output<typeof recurrenceCreateSchema>;

/** PUT /recurrences/:id (tipo imutável). */
export const recurrenceUpdateSchema = z.object({ ...fields, active: z.boolean() }).refine(endAfterStart, endMessage);
export type RecurrenceUpdateInput = z.output<typeof recurrenceUpdateSchema>;

/** Formulário (UX): categoria e conta obrigatórias; "sem data de término" no lugar de endDate vazio. */
export const recurrenceFormSchema = z
  .object({
    type: z.enum(transactionTypes),
    amount: z.string().refine((v) => Number(v) > 0, "Informe um valor maior que zero."),
    description: z
      .string()
      .trim()
      .min(1, "Descreva a despesa.")
      .max(DESCRIPTION_MAX, `Use no máximo ${DESCRIPTION_MAX} caracteres.`),
    categoryId: z.string().min(1, "Escolha uma categoria."),
    valueSourceId: z.string().min(1, "Escolha uma conta ou cartão."),
    dueDay: z
      .number({ error: "Informe o dia." })
      .int("Use um dia inteiro.")
      .min(1, "Dia entre 1 e 31.")
      .max(31, "Dia entre 1 e 31."),
    startDate: z.string().min(1, "Escolha a data de início.").pipe(isoDate),
    noEnd: z.boolean(),
    endDate: z.string(),
  })
  .refine((v) => v.noEnd || v.endDate !== "", {
    path: ["endDate"],
    message: "Escolha a data de fim ou marque “Sem data de término”.",
  })
  .refine((v) => v.noEnd || v.endDate === "" || v.endDate >= v.startDate, endMessage);
export type RecurrenceFormValues = z.output<typeof recurrenceFormSchema>;

function common(values: RecurrenceFormValues) {
  return {
    description: values.description,
    amount: values.amount,
    dueDay: values.dueDay,
    startDate: values.startDate,
    endDate: values.noEnd ? null : values.endDate,
    categoryId: values.categoryId,
    valueSourceId: values.valueSourceId,
  };
}

export function toRecurrenceCreateInput(values: RecurrenceFormValues): RecurrenceCreateInput {
  return { type: values.type, ...common(values) };
}

export function toRecurrenceUpdateInput(values: RecurrenceFormValues, active: boolean): RecurrenceUpdateInput {
  return { ...common(values), active };
}

export function toRecurrenceFormValues(
  r: Recurrence | null,
  categories: readonly RecurrenceCategory[],
  defaults: { accountId: string; today: string },
): RecurrenceFormValues {
  if (!r) {
    return {
      type: "despesa",
      amount: "0.00",
      description: "",
      categoryId: "",
      valueSourceId: defaults.accountId,
      dueDay: 10,
      startDate: defaults.today,
      noEnd: true,
      endDate: "",
    };
  }
  return {
    type: r.type,
    amount: r.amount,
    description: r.description,
    categoryId: categories.some((c) => c.id === r.categoryId && c.type === r.type) ? (r.categoryId ?? "") : "",
    valueSourceId: r.valueSourceId ?? "",
    dueDay: r.dueDay,
    startDate: r.startDate,
    noEnd: r.endDate === null,
    endDate: r.endDate ?? "",
  };
}

/** Total fixo mensal: soma das despesas fixas ativas. */
export function monthlyFixedTotal(recurrences: readonly Recurrence[]): string {
  const cents = recurrences
    .filter((r) => r.active && r.type === "despesa")
    .reduce((acc, r) => acc + Math.round(Number(r.amount) * 100), 0);
  return (cents / 100).toFixed(2);
}
