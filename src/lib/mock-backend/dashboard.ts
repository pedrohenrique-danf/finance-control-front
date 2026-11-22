import "server-only";
import { currentMonth, shiftMonth, todayIso } from "@/lib/format/date";
import { fromCents, toCents } from "./money";
import { covers, dueDateIn } from "./recurrences";
import { userData } from "./store";
import type { TransactionRecord, TransactionType } from "./types";

// Simula: GET /api/v1/dashboard/summary?month=YYYY-MM (backend docs/02, "Resumo do dashboard").

export interface DashboardSummaryRecord {
  month: string;
  income: string;
  fixedExpenses: string;
  variableExpenses: string;
  paidIncome: string;
  paidExpenses: string;
  balance: string;
  forecast: string;
  byCategory: Array<{ type: TransactionType; categoryId: string | null; total: string }>;
  history: Array<{ month: string; income: string; expense: string }>;
  upcoming: Array<{
    recurrenceId: string;
    description: string;
    amount: string;
    categoryId: string | null;
    dueDate: string;
  }>;
}

const HISTORY_MONTHS = 6;
const UPCOMING_LIMIT = 3;

function monthTotals(transactions: TransactionRecord[], month: string) {
  let income = 0;
  let fixed = 0;
  let variable = 0;
  let paidIncome = 0;
  let paidExpenses = 0;
  for (const t of transactions) {
    if (!t.date.startsWith(month)) continue;
    const cents = toCents(t.amount);
    const paid = t.status === "efetivada";
    if (t.type === "receita") {
      income += cents;
      if (paid) paidIncome += cents;
    } else {
      if (t.nature === "fixa") fixed += cents;
      else variable += cents;
      if (paid) paidExpenses += cents;
    }
  }
  return { income, fixed, variable, paidIncome, paidExpenses };
}

export const mockDashboard = {
  summary(userId: string, month: string, now = new Date()): DashboardSummaryRecord {
    const data = userData(userId);
    const totals = monthTotals(data.transactions, month);

    const byCategory = new Map<string, { type: TransactionType; categoryId: string | null; cents: number }>();
    for (const t of data.transactions) {
      if (!t.date.startsWith(month)) continue;
      const key = `${t.type}:${t.categoryId ?? ""}`;
      const entry = byCategory.get(key) ?? { type: t.type, categoryId: t.categoryId, cents: 0 };
      entry.cents += toCents(t.amount);
      byCategory.set(key, entry);
    }

    const history = Array.from({ length: HISTORY_MONTHS }, (_, i) => {
      const m = shiftMonth(month, i - (HISTORY_MONTHS - 1));
      const h = monthTotals(data.transactions, m);
      return { month: m, income: fromCents(h.income), expense: fromCents(h.fixed + h.variable) };
    });

    // Próximas despesas fixas: relativas a hoje (não ao mês consultado), como no protótipo.
    const today = todayIso(now);
    const thisMonth = currentMonth(now);
    const upcoming: DashboardSummaryRecord["upcoming"] = [];
    for (const rec of data.recurrences) {
      if (!rec.active || rec.type !== "despesa") continue;
      for (const m of [thisMonth, shiftMonth(thisMonth, 1)]) {
        const due = dueDateIn(rec, m);
        if (due < today || !covers(rec, due)) continue;
        const settled = data.transactions.some(
          (t) => t.recurrenceId === rec.id && t.date.startsWith(m) && t.status === "efetivada",
        );
        if (settled) continue;
        upcoming.push({
          recurrenceId: rec.id,
          description: rec.description,
          amount: rec.amount,
          categoryId: rec.categoryId,
          dueDate: due,
        });
        break;
      }
    }
    upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return {
      month,
      income: fromCents(totals.income),
      fixedExpenses: fromCents(totals.fixed),
      variableExpenses: fromCents(totals.variable),
      paidIncome: fromCents(totals.paidIncome),
      paidExpenses: fromCents(totals.paidExpenses),
      balance: fromCents(totals.paidIncome - totals.paidExpenses),
      forecast: fromCents(totals.income - totals.fixed - totals.variable),
      byCategory: [...byCategory.values()].map(({ type, categoryId, cents }) => ({
        type,
        categoryId,
        total: fromCents(cents),
      })),
      history,
      upcoming: upcoming.slice(0, UPCOMING_LIMIT),
    };
  },
};
