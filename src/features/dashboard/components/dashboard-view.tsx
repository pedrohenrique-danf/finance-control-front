"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Eye,
  EyeOff,
  type LucideIcon,
  Repeat,
  Shuffle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/common/category-icon";
import { EmptyState } from "@/components/common/empty-state";
import { Money } from "@/components/common/money";
import { MonthSelector } from "@/components/common/month-selector";
import { SectionHeader } from "@/components/common/section-header";
import { PageSection } from "@/components/layout/page-section";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { daysBetween, formatDate, relativeDays, todayIso } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { expenseSlices, isEmptyHistory } from "../chart-data";
import type { DashboardCategory, DashboardSummary } from "../schemas";
import { ExpenseDonut } from "./expense-donut";
import { EXPENSE_COLOR, INCOME_COLOR, IncomeExpenseBars } from "./income-expense-bars";

const TONES = {
  income: { bubble: "bg-income-soft text-income", value: "text-income" },
  expense: { bubble: "bg-expense-soft text-expense", value: "text-foreground" },
  alert: { bubble: "bg-alert-soft text-alert-strong", value: "text-foreground" },
  neutral: { bubble: "bg-muted text-primary", value: "text-foreground" },
} as const;

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: keyof typeof TONES;
  hint?: string;
}) {
  const t = TONES[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <span className={cn("grid size-9 place-items-center rounded-xl", t.bubble)}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <Money
        value={value}
        className={cn("mt-0.5 block text-[17px] font-bold", Number(value) < 0 ? "text-expense" : t.value)}
      />
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function BalanceCard({ summary }: { summary: DashboardSummary }) {
  const { hideValues, toggleHideValues } = useShell();
  return (
    <section
      aria-label="Saldo do mês"
      className="relative overflow-hidden rounded-3xl bg-balance p-5 text-primary-foreground shadow-card"
    >
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-12 -bottom-16 size-52 text-primary-foreground/[0.07]"
        aria-hidden
      >
        <path d="M20 180C20 90 80 25 180 20c0 100-65 160-160 160Z" fill="currentColor" />
      </svg>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium opacity-85">Saldo do mês</h2>
        <button
          type="button"
          onClick={toggleHideValues}
          aria-label={hideValues ? "Mostrar valores" : "Ocultar valores"}
          aria-pressed={hideValues}
          className="tap -mr-2 grid place-items-center rounded-full hover:bg-primary-foreground/10"
        >
          {hideValues ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      <Money value={summary.balance} className="mt-1 block text-[34px] leading-tight font-extrabold" />
      <p className="mt-1 text-xs opacity-80">Recebido menos o que já foi pago</p>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-primary-foreground/15 pt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] opacity-80">Entrou</p>
            <Money value={summary.paidIncome} className="font-bold" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-primary-foreground/15">
            <ArrowDownRight className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] opacity-80">Saiu</p>
            <Money value={summary.paidExpenses} className="font-bold" />
          </div>
        </div>
      </div>
    </section>
  );
}

interface DashboardViewProps {
  firstName: string;
  month: string;
  summary: DashboardSummary;
  categories: readonly DashboardCategory[];
  /** "Últimas transações" (composto pelo app/ a partir de features/transactions). */
  latest: React.ReactNode;
  hasMonthTransactions: boolean;
}

export function DashboardView({
  firstName,
  month,
  summary,
  categories,
  latest,
  hasMonthTransactions,
}: DashboardViewProps) {
  const { openNewTransaction } = useShell();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const slices = expenseSlices(summary, categories);
  const totalExpenses = (Number(summary.fixedExpenses) + Number(summary.variableExpenses)).toFixed(2);
  const today = todayIso();

  return (
    <PageSection title="Início" description="Resumo do mês, gráficos e próximas despesas fixas.">
      <p className="text-sm text-muted-foreground">
        Olá, <span className="font-bold text-primary-dark">{firstName}</span> 👋
      </p>
      <MonthSelector month={month} />

      {isEmptyHistory(summary) ? (
        <EmptyState
          art="wallet"
          title="Seu mês começa aqui"
          description="Registre sua primeira receita ou despesa para ver o saldo e os gráficos do mês."
          action={
            <Button size="lg" onClick={() => openNewTransaction()}>
              Adicionar primeira transação
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-stretch">
            <BalanceCard summary={summary} />
            <section aria-label="Resumo do mês" className="grid grid-cols-2 gap-3">
              <SummaryCard label="Receitas" value={summary.income} icon={TrendingUp} tone="income" />
              <SummaryCard label="Despesas fixas" value={summary.fixedExpenses} icon={Repeat} tone="expense" />
              <SummaryCard label="Despesas variáveis" value={summary.variableExpenses} icon={Shuffle} tone="alert" />
              <SummaryCard
                label="Saldo previsto"
                value={summary.forecast}
                icon={CalendarClock}
                tone="neutral"
                hint="Com pendentes"
              />
            </section>
          </div>

          {hasMonthTransactions ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {slices.length > 0 ? (
                <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                  <SectionHeader title="Despesas por categoria" />
                  <ExpenseDonut slices={slices} total={totalExpenses} />
                </section>
              ) : null}
              <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <SectionHeader
                  title="Receitas x Despesas"
                  action={
                    <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full" style={{ backgroundColor: INCOME_COLOR }} aria-hidden />
                        Receitas
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} aria-hidden />
                        Despesas
                      </span>
                    </div>
                  }
                />
                <IncomeExpenseBars bars={summary.history} currentMonth={month} />
              </section>
            </div>
          ) : (
            <EmptyState
              art="chart"
              title="Nada por aqui neste mês"
              description="Ainda não há transações neste mês. Que tal registrar a primeira?"
              action={<Button onClick={() => openNewTransaction()}>Adicionar transação</Button>}
              className="rounded-3xl border border-border bg-card py-8"
            />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            {summary.upcoming.length > 0 ? (
              <section>
                <SectionHeader
                  title="Próximas despesas fixas"
                  action={
                    <Link
                      href="/recurrences"
                      className="inline-flex min-h-11 items-center text-[13px] font-semibold text-primary"
                    >
                      Ver todas
                    </Link>
                  }
                />
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  {summary.upcoming.map((u) => {
                    const days = daysBetween(today, u.dueDate);
                    return (
                      <li key={u.recurrenceId}>
                        <Link
                          href={`/recurrences/${u.recurrenceId}`}
                          className="flex min-h-16 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
                        >
                          <CategoryIcon
                            category={u.categoryId ? categoryById.get(u.categoryId) : undefined}
                            className="size-10"
                            iconClassName="size-[18px]"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{u.description}</p>
                            <p className="num text-xs text-muted-foreground">Vence em {formatDate(u.dueDate)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Money value={u.amount} className="text-sm font-bold" />
                            <span
                              className={cn(
                                "inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-bold",
                                days <= 3 ? "bg-alert-soft text-alert-strong" : "bg-muted text-muted-foreground",
                              )}
                            >
                              {relativeDays(days)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <section className={summary.upcoming.length > 0 ? undefined : "lg:col-span-2"}>
              <SectionHeader title="Últimas transações" />
              {latest}
              <Link
                href={`/transactions?month=${month}`}
                className="mt-3 flex h-11 items-center justify-center gap-1 rounded-xl text-sm font-bold text-primary hover:bg-muted"
              >
                Ver extrato completo <ChevronRight className="size-4" aria-hidden />
              </Link>
            </section>
          </div>
        </div>
      )}
    </PageSection>
  );
}
