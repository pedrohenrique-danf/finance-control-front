import "server-only";
import { nullIfNotFound } from "@/lib/api/errors";
import { getApi } from "@/lib/api/server";
import { PAGE_SIZE, quickToQuery, type TransactionFilters } from "./filters";
import {
  type RepeatMonthly,
  type Transaction,
  type TransactionInput,
  type TransactionPage,
  transactionPageSchema,
  transactionSchema,
} from "./schemas";

/** Extrato já acumulado até a página pedida ("Carregar mais"). */
export interface Statement {
  items: Transaction[];
  page: number;
  hasMore: boolean;
  summary: TransactionPage["meta"]["summary"];
  dayTotals: TransactionPage["meta"]["dayTotals"];
}

export interface TransactionsDataSource {
  statement(filters: TransactionFilters, upToPage: number): Promise<Statement>;
  /** Últimas transações do mês (início). */
  latest(month: string, limit: number): Promise<Transaction[]>;
  /** Últimas transações de uma conta (detalhe da conta). */
  byAccount(accountId: string, limit: number): Promise<Transaction[]>;
  get(id: string): Promise<Transaction | null>;
  create(input: TransactionInput, repeatMonthly?: RepeatMonthly): Promise<Transaction>;
  update(id: string, input: TransactionInput): Promise<Transaction>;
  remove(id: string): Promise<void>;
}

/** Maior página aceita pelo backend (listTransactionsQuerySchema). */
const MAX_PAGE_SIZE = 100;

/** Query de GET /api/v1/transactions (backend docs/07). Listas de ids vão em CSV. */
function toQuery(filters: TransactionFilters) {
  // período invertido digitado na URL: o backend recusaria com 400
  const [from, to] =
    filters.from && filters.to && filters.from > filters.to ? [filters.to, filters.from] : [filters.from, filters.to];
  return {
    month: filters.month,
    from: from ?? undefined,
    to: to ?? undefined,
    q: filters.q || undefined,
    ...quickToQuery(filters.quick),
    status: filters.status ?? undefined,
    categoryIds: filters.categoryIds.join(",") || undefined,
    valueSourceIds: filters.accountIds.join(",") || undefined,
  };
}

const path = (id: string) => `/api/v1/transactions/${encodeURIComponent(id)}`;

// Contrato: finance-control-back docs/02 e 07 ("Transações").
export const transactionsDataSource: TransactionsDataSource = {
  /** As páginas acumuladas vêm numa só chamada enquanto couberem no limite do backend. */
  async statement(filters, upToPage) {
    const api = await getApi();
    const query = toQuery(filters);
    const items: Transaction[] = [];
    let last: TransactionPage | undefined;
    const perCall = Math.max(1, Math.floor(MAX_PAGE_SIZE / PAGE_SIZE)); // páginas da tela por requisição
    for (let call = 0; call * perCall < upToPage; call++) {
      const pages = Math.min(perCall, upToPage - call * perCall);
      last = await api.get("/api/v1/transactions", transactionPageSchema, {
        ...query,
        page: call + 1,
        pageSize: PAGE_SIZE * perCall,
      });
      items.push(...last.data.slice(0, PAGE_SIZE * pages));
      if (items.length >= last.meta.total) break;
    }
    if (!last) throw new Error("Página inválida.");
    const total = last.meta.total;
    return {
      items,
      page: Math.max(1, Math.min(upToPage, Math.ceil(total / PAGE_SIZE))),
      hasMore: items.length < total,
      summary: last.meta.summary,
      dayTotals: last.meta.dayTotals,
    };
  },

  async latest(month, limit) {
    const api = await getApi();
    return (await api.get("/api/v1/transactions", transactionPageSchema, { month, page: 1, pageSize: limit })).data;
  },

  async byAccount(accountId, limit) {
    const api = await getApi();
    const page = await api.get("/api/v1/transactions", transactionPageSchema, {
      valueSourceIds: accountId,
      page: 1,
      pageSize: limit,
    });
    return page.data;
  },

  async get(id) {
    const api = await getApi();
    return nullIfNotFound(api.get(path(id), transactionSchema));
  },

  async create(input, repeatMonthly) {
    const api = await getApi();
    return api.post("/api/v1/transactions", repeatMonthly ? { ...input, repeatMonthly } : input, transactionSchema);
  },

  async update(id, input) {
    const api = await getApi();
    return api.put(path(id), input, transactionSchema);
  },

  async remove(id) {
    const api = await getApi();
    await api.delete(path(id));
  },
};
