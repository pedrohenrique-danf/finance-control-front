import type { Metadata } from "next";
import { accountsDataSource } from "@/features/accounts";
import { categoriesDataSource } from "@/features/categories";
import { RecurrencesView, recurrencesDataSource } from "@/features/recurrences";

export const metadata: Metadata = { title: "Despesas fixas" };

// RF04: despesas (e receitas) que se repetem todo mês.
export default async function RecurrencesPage() {
  const [recurrences, categories, accounts] = await Promise.all([
    recurrencesDataSource.list(),
    categoriesDataSource.list(),
    accountsDataSource.list(),
  ]);
  return <RecurrencesView recurrences={recurrences} categories={categories} accounts={accounts} />;
}
