import type { Metadata } from "next";
import { accountsDataSource } from "@/features/accounts";
import { categoriesDataSource } from "@/features/categories";
import { dataExchangeDataSource, ImportExportView } from "@/features/data-exchange";
import { currentMonth } from "@/lib/format/date";

export const metadata: Metadata = { title: "Importar / Exportar" };

// RF07: importar CSV ou PDF do Nubank (lido pelo backend) e exportar CSV do mês.
export default async function ImportExportPage() {
  const [history, categories, accounts] = await Promise.all([
    dataExchangeDataSource.history(),
    categoriesDataSource.list(),
    accountsDataSource.list(),
  ]);
  return (
    <ImportExportView history={history} categories={categories} accounts={accounts} defaultMonth={currentMonth()} />
  );
}
