import { z } from "zod";

// SYNC: finance-control-back docs/02 ("Resumo do dashboard") — GET /api/v1/dashboard/summary?month=YYYY-MM.
const money = z.string();

export const dashboardSummarySchema = z.object({
  month: z.string(),
  income: money,
  fixedExpenses: money,
  variableExpenses: money,
  paidIncome: money,
  paidExpenses: money,
  /** Efetivado: recebido − pago. */
  balance: money,
  /** Com pendentes: receitas − despesas do mês. */
  forecast: money,
  byCategory: z.array(
    z.object({ type: z.enum(["receita", "despesa"]), categoryId: z.string().nullable(), total: money }),
  ),
  history: z.array(z.object({ month: z.string(), income: money, expense: money })),
  upcoming: z.array(
    z.object({
      recurrenceId: z.string(),
      description: z.string(),
      amount: money,
      categoryId: z.string().nullable(),
      dueDate: z.string(),
    }),
  ),
});
export type DashboardSummary = z.output<typeof dashboardSummarySchema>;

/** Categoria vista pelo dashboard (composta pelo app/ a partir de features/categories). */
export interface DashboardCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}
