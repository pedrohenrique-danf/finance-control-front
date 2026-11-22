import { parseMonthParam } from "@/lib/format/date";
import { firstParam } from "@/lib/search-params";
import type { TransactionNature, TransactionStatus, TransactionType } from "./schemas";

/** Atalhos de filtro do extrato (chips). */
export const QUICK_FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "receitas", label: "Receitas" },
  { value: "despesas", label: "Despesas" },
  { value: "fixas", label: "Fixas" },
  { value: "variaveis", label: "Variáveis" },
] as const;
export type QuickFilter = (typeof QUICK_FILTERS)[number]["value"];

/** Filtros do extrato. Vivem na URL: ?month, q, filtro, categorias, contas, status, de, ate, page. */
export interface TransactionFilters {
  month: string;
  q: string;
  quick: QuickFilter;
  categoryIds: string[];
  accountIds: string[];
  status: TransactionStatus | null;
  from: string | null;
  to: string | null;
}

export const PAGE_SIZE = 20;
/** Limite de páginas acumuladas pelo "Carregar mais". */
export const MAX_PAGE = 25;

type SearchParams = Record<string, string | string[] | undefined>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function list(raw: string | string[] | undefined): string[] {
  return (firstParam(raw) ?? "")
    .split(",")
    .filter((id) => UUID.test(id))
    .slice(0, 50);
}

/** "YYYY-MM-DD" que existe no calendário (o backend recusa 2026-02-30 com 400). */
function isRealDate(value: string): boolean {
  const [y = 0, m = 0, d = 0] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d && value >= "2000-01-01";
}

function date(raw: string | string[] | undefined): string | null {
  const value = firstParam(raw);
  return value && ISO_DATE.test(value) && isRealDate(value) ? value : null;
}

export function parseTransactionFilters(params: SearchParams, now = new Date()): TransactionFilters {
  const quick = firstParam(params.filtro);
  const status = firstParam(params.status);
  return {
    month: parseMonthParam(params.month, now),
    q: (firstParam(params.q) ?? "").trim().slice(0, 100),
    quick: QUICK_FILTERS.some((f) => f.value === quick) ? (quick as QuickFilter) : "todas",
    categoryIds: list(params.categorias),
    accountIds: list(params.contas),
    status: status === "pendente" || status === "efetivada" ? status : null,
    from: date(params.de),
    to: date(params.ate),
  };
}

export function parsePage(params: SearchParams): number {
  const page = Number(firstParam(params.page));
  return Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1;
}

/** Filtros → query string (sem valores padrão), na ordem estável dos parâmetros. */
export function filtersToSearchParams(filters: TransactionFilters, page = 1): URLSearchParams {
  const params = new URLSearchParams();
  params.set("month", filters.month);
  if (filters.q) params.set("q", filters.q);
  if (filters.quick !== "todas") params.set("filtro", filters.quick);
  if (filters.categoryIds.length) params.set("categorias", filters.categoryIds.join(","));
  if (filters.accountIds.length) params.set("contas", filters.accountIds.join(","));
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("de", filters.from);
  if (filters.to) params.set("ate", filters.to);
  if (page > 1) params.set("page", String(page));
  return params;
}

/** Quantidade de filtros avançados ativos (badge do botão). */
export function advancedCount(filters: TransactionFilters): number {
  return (
    filters.categoryIds.length +
    filters.accountIds.length +
    (filters.status ? 1 : 0) +
    (filters.from || filters.to ? 1 : 0)
  );
}

export function hasAnyFilter(filters: TransactionFilters): boolean {
  return filters.quick !== "todas" || filters.q !== "" || advancedCount(filters) > 0;
}

/** Tradução dos chips para os campos de consulta. */
export function quickToQuery(quick: QuickFilter): { type?: TransactionType; nature?: TransactionNature } {
  switch (quick) {
    case "receitas":
      return { type: "receita" };
    case "despesas":
      return { type: "despesa" };
    case "fixas":
      return { nature: "fixa" };
    case "variaveis":
      return { nature: "variavel" };
    default:
      return {};
  }
}
