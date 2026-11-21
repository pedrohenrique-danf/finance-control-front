import "server-only";
import { ApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/session";
import { mockTransactions, type TransactionQuery } from "@/lib/mock-backend";
import { PAGE_SIZE, quickToQuery, type TransactionFilters } from "./filters";
import {
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
  create(input: TransactionInput): Promise<Transaction>;
  update(id: string, input: TransactionInput): Promise<Transaction>;
  remove(id: string): Promise<void>;
}

function toQuery(filters: TransactionFilters, page: number, pageSize = PAGE_SIZE): TransactionQuery {
  return {
    month: filters.month,
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
    q: filters.q || undefined,
    ...quickToQuery(filters.quick),
    status: filters.status ?? undefined,
    categoryIds: filters.categoryIds,
    valueSourceIds: filters.accountIds,
    page,
    pageSize,
  };
}

// TODO(back): as rotas de transações ainda não existem no finance-control-back. Ao implementá-las,
// troque por getApi() mantendo o parse com os schemas:
//   página   → api.get("/api/v1/transactions", transactionPageSchema, { month, from, to, q, type, nature,
//                status, categoryIds: csv, valueSourceIds: csv, page, pageSize })  (backend docs/07)
//   obter    → api.get(`/api/v1/transactions/${id}`, transactionSchema)
//   criar    → api.post("/api/v1/transactions", input, transactionSchema)
//   editar   → api.put(`/api/v1/transactions/${id}`, input, transactionSchema)
//   excluir  → api.delete(`/api/v1/transactions/${id}`)
const mockDataSource: TransactionsDataSource = {
  async statement(filters, upToPage) {
    const { user } = await requireSession();
    const items: Transaction[] = [];
    let last: TransactionPage | undefined;
    for (let page = 1; page <= upToPage; page++) {
      last = transactionPageSchema.parse(mockTransactions.list(user.id, toQuery(filters, page)));
      items.push(...last.data);
      if (page >= last.meta.totalPages) break;
    }
    if (!last) throw new Error("Página inválida.");
    return {
      items,
      page: last.meta.page,
      hasMore: last.meta.page < last.meta.totalPages,
      summary: last.meta.summary,
      dayTotals: last.meta.dayTotals,
    };
  },

  async latest(month, limit) {
    const { user } = await requireSession();
    return transactionPageSchema.parse(mockTransactions.list(user.id, { month, page: 1, pageSize: limit })).data;
  },

  async byAccount(accountId, limit) {
    const { user } = await requireSession();
    const page = mockTransactions.list(user.id, { valueSourceIds: [accountId], page: 1, pageSize: limit });
    return transactionPageSchema.parse(page).data;
  },

  async get(id) {
    const { user } = await requireSession();
    try {
      return transactionSchema.parse(mockTransactions.get(user.id, id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async create(input) {
    const { user } = await requireSession();
    return transactionSchema.parse(mockTransactions.create(user.id, input));
  },

  async update(id, input) {
    const { user } = await requireSession();
    return transactionSchema.parse(mockTransactions.update(user.id, id, input));
  },

  async remove(id) {
    const { user } = await requireSession();
    mockTransactions.remove(user.id, id);
  },
};

export const transactionsDataSource: TransactionsDataSource = mockDataSource;
