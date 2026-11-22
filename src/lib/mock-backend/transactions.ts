import "server-only";
import { ApiError } from "@/lib/api/errors";
import { fromCents, toCents } from "./money";
import { notify, notifyTransaction } from "./notifications";
import { insertRecurrence, materialize } from "./recurrences";
import { notFound, userData } from "./store";
import type { TransactionNature, TransactionRecord, TransactionStatus, TransactionType, UserData } from "./types";

// Simula: GET/POST /api/v1/transactions, GET/PUT/DELETE /api/v1/transactions/:id (finance-control-back docs/02).
// Filtros e meta.summary/meta.dayTotals conforme listTransactionsQuerySchema (backend docs/07).

export interface TransactionQuery {
  /** "YYYY-MM". Ignorado quando há `from` ou `to`. */
  month?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  q?: string | undefined;
  type?: TransactionType | undefined;
  nature?: TransactionNature | undefined;
  status?: TransactionStatus | undefined;
  categoryIds?: readonly string[] | undefined;
  valueSourceIds?: readonly string[] | undefined;
  page: number;
  pageSize: number;
}

export interface TransactionPage {
  data: TransactionRecord[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    /** Totais do conjunto filtrado inteiro (não só da página). */
    summary: { income: string; expense: string; balance: string };
    /** Saldo líquido por dia do conjunto filtrado. */
    dayTotals: Record<string, string>;
  };
}

export type TransactionInput = Omit<TransactionRecord, "id" | "origin" | "recurrenceId">;

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function matches(t: TransactionRecord, query: TransactionQuery): boolean {
  if (query.from || query.to) {
    if (query.from && t.date < query.from) return false;
    if (query.to && t.date > query.to) return false;
  } else if (query.month && !t.date.startsWith(query.month)) {
    return false;
  }
  if (query.q && !normalize(t.description).includes(normalize(query.q))) return false;
  if (query.type && t.type !== query.type) return false;
  if (query.nature && t.nature !== query.nature) return false;
  if (query.status && t.status !== query.status) return false;
  if (query.categoryIds?.length && !query.categoryIds.includes(t.categoryId ?? "")) return false;
  if (query.valueSourceIds?.length && !query.valueSourceIds.includes(t.valueSourceId ?? "")) return false;
  return true;
}

/** Regras do serviço de transações (docs/07 do backend) + checks do banco. */
function validate(data: UserData, input: TransactionInput): void {
  const issues: Array<{ path: string; message: string }> = [];
  if (input.type === "despesa" && !input.nature) {
    issues.push({ path: "nature", message: "Informe se a despesa é fixa ou variável." });
  }
  if (input.type === "receita" && input.nature) {
    issues.push({ path: "nature", message: "Receitas não têm natureza." });
  }
  if (input.categoryId) {
    const category = data.categories.find((c) => c.id === input.categoryId);
    if (!category) issues.push({ path: "categoryId", message: "Categoria não encontrada." });
    else if (category.type !== input.type) {
      issues.push({ path: "categoryId", message: "Tipo da categoria incompatível." });
    }
  }
  if (input.valueSourceId && !data.valueSources.some((s) => s.id === input.valueSourceId)) {
    issues.push({ path: "valueSourceId", message: "Conta não encontrada." });
  }
  if (toCents(input.amount) <= 0) issues.push({ path: "amount", message: "O valor deve ser maior que zero." });
  if (issues.length) throw new ApiError(400, "VALIDATION_ERROR", "Dados inválidos.", issues);
}

export const mockTransactions = {
  list(userId: string, query: TransactionQuery): TransactionPage {
    const all = userData(userId).transactions;
    // Mais recentes primeiro; no mesmo dia, o último lançado primeiro.
    const filtered = all
      .map((t, index) => ({ t, index }))
      .filter(({ t }) => matches(t, query))
      .sort((a, b) => b.t.date.localeCompare(a.t.date) || b.index - a.index)
      .map(({ t }) => t);

    let income = 0;
    let expense = 0;
    const days = new Map<string, number>();
    for (const t of filtered) {
      const cents = toCents(t.amount);
      if (t.type === "receita") income += cents;
      else expense += cents;
      days.set(t.date, (days.get(t.date) ?? 0) + (t.type === "receita" ? cents : -cents));
    }

    const start = (query.page - 1) * query.pageSize;
    return {
      data: filtered.slice(start, start + query.pageSize),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / query.pageSize)),
        summary: { income: fromCents(income), expense: fromCents(expense), balance: fromCents(income - expense) },
        dayTotals: Object.fromEntries([...days].map(([date, cents]) => [date, fromCents(cents)])),
      },
    };
  },

  get(userId: string, id: string): TransactionRecord {
    const found = userData(userId).transactions.find((t) => t.id === id);
    if (!found) throw notFound("Transação");
    return found;
  },

  /**
   * POST /transactions. Com `repeatMonthly`, cria também a recorrência (startDate = data) e liga a transação a ela;
   * as demais ocorrências até o mês corrente são materializadas sem duplicar a data lançada.
   */
  create(
    userId: string,
    input: TransactionInput,
    repeatMonthly?: { dueDay: number; endDate: string | null },
    now = new Date(),
  ): TransactionRecord {
    const data = userData(userId);
    validate(data, input);
    if (!repeatMonthly) {
      const created: TransactionRecord = { id: crypto.randomUUID(), origin: "manual", recurrenceId: null, ...input };
      data.transactions.push(created);
      notifyTransaction(data, created);
      return created;
    }
    const recurrence = insertRecurrence(data, {
      type: input.type,
      description: input.description,
      amount: input.amount,
      dueDay: repeatMonthly.dueDay,
      startDate: input.date,
      endDate: repeatMonthly.endDate,
      categoryId: input.categoryId,
      valueSourceId: input.valueSourceId,
    });
    const created: TransactionRecord = {
      id: crypto.randomUUID(),
      ...input,
      nature: input.type === "despesa" ? "fixa" : null,
      origin: "recorrencia",
      recurrenceId: recurrence.id,
    };
    data.transactions.push(created);
    materialize(data, recurrence, now);
    notifyTransaction(data, created);
    notify(data, {
      type: "sistema",
      title: "Despesa fixa criada",
      message: `${recurrence.description} · todo dia ${recurrence.dueDay}`,
      recurrenceId: recurrence.id,
    });
    return created;
  },

  /** PUT: substitui os campos editáveis; origem e recorrência são preservadas. */
  update(userId: string, id: string, input: TransactionInput): TransactionRecord {
    const data = userData(userId);
    const current = data.transactions.find((t) => t.id === id);
    if (!current) throw notFound("Transação");
    validate(data, input);
    Object.assign(current, input);
    return current;
  },

  remove(userId: string, id: string): void {
    const data = userData(userId);
    if (!data.transactions.some((t) => t.id === id)) throw notFound("Transação");
    data.transactions = data.transactions.filter((t) => t.id !== id);
  },
};
