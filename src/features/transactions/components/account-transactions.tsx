"use client";

import { EmptyState } from "@/components/common/empty-state";
import { SectionHeader } from "@/components/common/section-header";
import type { AccountOption, CategoryOption, Transaction } from "../schemas";
import { TransactionGroups } from "./transaction-groups";

/** "Transações desta conta" no detalhe da conta (últimas N, agrupadas por dia). */
export function AccountTransactions({
  transactions,
  categories,
  accounts,
}: {
  transactions: Transaction[];
  categories: readonly CategoryOption[];
  accounts: readonly AccountOption[];
}) {
  return (
    <section>
      <SectionHeader title="Transações desta conta" />
      {transactions.length === 0 ? (
        <EmptyState art="list" title="Sem transações" description="Nada lançado nesta conta ainda." />
      ) : (
        <TransactionGroups transactions={transactions} categories={categories} accounts={accounts} headingLevel="h3" />
      )}
    </section>
  );
}
