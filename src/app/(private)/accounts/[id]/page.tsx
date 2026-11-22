import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AccountDetailView, accountsDataSource } from "@/features/accounts";
import { categoriesDataSource } from "@/features/categories";
import { AccountTransactions, transactionsDataSource } from "@/features/transactions";

export const metadata: Metadata = { title: "Detalhe da conta" };

export default async function AccountDetailPage({ params }: PageProps<"/accounts/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [account, accounts, categories, transactions] = await Promise.all([
    accountsDataSource.get(id),
    accountsDataSource.list(),
    categoriesDataSource.list(),
    transactionsDataSource.byAccount(id, 40),
  ]);
  if (!account) notFound();
  return (
    <AccountDetailView account={account}>
      <AccountTransactions transactions={transactions} categories={categories} accounts={accounts} />
    </AccountDetailView>
  );
}
