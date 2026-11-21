"use client";

import { Money } from "@/components/common/money";
import { useShell } from "@/components/layout/shell-context";
import { formatDayHeader } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { AccountOption, CategoryOption, Transaction } from "../schemas";
import { TransactionItem } from "./transaction-item";

interface TransactionGroupsProps {
  transactions: Transaction[];
  categories: readonly CategoryOption[];
  accounts: readonly AccountOption[];
  /** Saldo líquido por dia vindo do backend (conjunto filtrado inteiro). Sem ele, soma os itens. */
  dayTotals?: Record<string, string>;
  onDelete?: (transaction: Transaction) => void;
  /** Nível do título de cada dia (h2 numa página, h3 dentro de uma seção). */
  headingLevel?: "h2" | "h3";
}

function groupByDay(items: Transaction[]): Array<{ date: string; items: Transaction[] }> {
  const groups: Array<{ date: string; items: Transaction[] }> = [];
  for (const t of items) {
    const last = groups.at(-1);
    if (last && last.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  }
  return groups;
}

function netOf(items: Transaction[]): number {
  return items.reduce((acc, t) => acc + (t.type === "receita" ? 1 : -1) * Math.round(Number(t.amount) * 100), 0) / 100;
}

/** Transações agrupadas por dia ("Qua, 18 nov" + saldo do dia). Toque abre a edição global. */
export function TransactionGroups({
  transactions,
  categories,
  accounts,
  dayTotals,
  onDelete,
  headingLevel: Heading = "h2",
}: TransactionGroupsProps) {
  const { openEditTransaction } = useShell();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const accountById = new Map(accounts.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-4">
      {groupByDay(transactions).map((group) => {
        const net = dayTotals?.[group.date] !== undefined ? Number(dayTotals[group.date]) : netOf(group.items);
        const label = formatDayHeader(group.date);
        return (
          <section key={group.date} aria-label={label}>
            <div className="mb-1.5 flex items-center justify-between px-1">
              <Heading className="text-[13px] font-bold text-primary-dark">{label}</Heading>
              <Money
                value={Math.abs(net).toFixed(2)}
                type={net >= 0 ? "receita" : "despesa"}
                signed
                className={cn("text-xs font-semibold", net >= 0 ? "text-income" : "text-muted-foreground")}
              />
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              {group.items.map((t) => (
                <li key={t.id}>
                  <TransactionItem
                    transaction={t}
                    category={t.categoryId ? categoryById.get(t.categoryId) : undefined}
                    accountName={t.valueSourceId ? accountById.get(t.valueSourceId) : undefined}
                    onOpen={() => openEditTransaction(t.id)}
                    {...(onDelete ? { onDelete: () => onDelete(t) } : {})}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
