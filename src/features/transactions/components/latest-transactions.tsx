"use client";

import { useShell } from "@/components/layout/shell-context";
import type { AccountOption, CategoryOption, Transaction } from "../schemas";
import { TransactionItem } from "./transaction-item";

/** Lista compacta (sem selos) das últimas transações do mês; toque abre a edição global. */
export function LatestTransactions({
  transactions,
  categories,
  accounts,
}: {
  transactions: Transaction[];
  categories: readonly CategoryOption[];
  accounts: readonly AccountOption[];
}) {
  const { openEditTransaction } = useShell();
  if (transactions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Sem transações neste mês.
      </p>
    );
  }
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const accountById = new Map(accounts.map((a) => [a.id, a.name]));
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {transactions.map((t) => (
        <li key={t.id}>
          <TransactionItem
            compact
            transaction={t}
            category={t.categoryId ? categoryById.get(t.categoryId) : undefined}
            accountName={t.valueSourceId ? accountById.get(t.valueSourceId) : undefined}
            onOpen={() => openEditTransaction(t.id)}
          />
        </li>
      ))}
    </ul>
  );
}
