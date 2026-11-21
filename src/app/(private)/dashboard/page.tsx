import type { Metadata } from "next";
import { accountsDataSource } from "@/features/accounts";
import { categoriesDataSource } from "@/features/categories";
import { DashboardView, dashboardDataSource } from "@/features/dashboard";
import { LatestTransactions, transactionsDataSource } from "@/features/transactions";
import { requireSession } from "@/lib/auth/session";
import { parseMonthParam } from "@/lib/format/date";

export const metadata: Metadata = { title: "Início" };

// RF05: resumo do mês, gráficos, próximas despesas fixas e últimas transações.
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const month = parseMonthParam((await searchParams).month);
  const [{ user }, summary, latest, categories, accounts] = await Promise.all([
    requireSession(),
    dashboardDataSource.summary(month),
    transactionsDataSource.latest(month, 5),
    categoriesDataSource.list(),
    accountsDataSource.list(),
  ]);
  return (
    <DashboardView
      firstName={user.name.split(" ")[0] ?? user.name}
      month={month}
      summary={summary}
      categories={categories}
      hasMonthTransactions={latest.length > 0}
      latest={<LatestTransactions transactions={latest} categories={categories} accounts={accounts} />}
    />
  );
}
