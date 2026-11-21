import type { Metadata } from "next";
import { accountsDataSource } from "@/features/accounts";
import { categoriesDataSource } from "@/features/categories";
import { parsePage, parseTransactionFilters, StatementView, transactionsDataSource } from "@/features/transactions";

export const metadata: Metadata = { title: "Extrato mensal" };

// RF06: extrato do mês com busca, filtros e paginação, todos na URL.
export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const params = await searchParams;
  const filters = parseTransactionFilters(params);
  const [statement, categories, accounts] = await Promise.all([
    transactionsDataSource.statement(filters, parsePage(params)),
    categoriesDataSource.list(),
    accountsDataSource.list(),
  ]);
  return <StatementView filters={filters} statement={statement} categories={categories} accounts={accounts} />;
}
