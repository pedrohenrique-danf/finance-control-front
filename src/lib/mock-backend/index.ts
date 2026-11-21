// Backend simulado (somente servidor). Usado pelos data sources de features/* enquanto o
// finance-control-back não expõe as rotas de domínio.
// TODO(back): ao implementar cada rota, troque o data source da feature para getApi() e apague o módulo daqui.
export { mockCategories } from "./categories";
export { type DashboardSummaryRecord, dueDateIn, mockDashboard } from "./dashboard";
export { fromCents, toCents } from "./money";
export {
  mockTransactions,
  type TransactionInput,
  type TransactionPage,
  type TransactionQuery,
} from "./transactions";
export type * from "./types";
export { mockValueSources, type ValueSourceWithBalance } from "./value-sources";
