"use client";

import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { FilterChip } from "@/components/common/field";
import { Money } from "@/components/common/money";
import { MonthSelector } from "@/components/common/month-selector";
import { PageSection } from "@/components/layout/page-section";
import { useShell } from "@/components/layout/shell-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { deleteTransactionAction } from "../actions";
import { advancedCount, filtersToSearchParams, hasAnyFilter, QUICK_FILTERS, type TransactionFilters } from "../filters";
import type { AccountOption, CategoryOption, Transaction, TransactionPage } from "../schemas";
import { AdvancedFiltersSheet } from "./advanced-filters-sheet";
import { TransactionGroups } from "./transaction-groups";

interface StatementViewProps {
  filters: TransactionFilters;
  statement: {
    items: Transaction[];
    page: number;
    hasMore: boolean;
    summary: TransactionPage["meta"]["summary"];
    dayTotals: TransactionPage["meta"]["dayTotals"];
  };
  categories: readonly CategoryOption[];
  accounts: readonly AccountOption[];
}

const EMPTY_FILTERS = (month: string): TransactionFilters => ({
  month,
  q: "",
  quick: "todas",
  categoryIds: [],
  accountIds: [],
  status: null,
  from: null,
  to: null,
});

/** Extrato mensal (RF06): filtros na URL, lidos no servidor; aqui só a interação. */
export function StatementView({ filters, statement, categories, accounts }: StatementViewProps) {
  const router = useRouter();
  const { openNewTransaction } = useShell();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const [deleting, startDelete] = useTransition();
  const lastPushedQ = useRef(filters.q);

  function navigate(next: Partial<TransactionFilters>) {
    const params = filtersToSearchParams({ ...filters, ...next });
    startTransition(() => router.replace(`/transactions?${params}`, { scroll: false }));
  }

  // Busca com atraso de 300 ms (não navega a cada tecla).
  // biome-ignore lint/correctness/useExhaustiveDependencies: navigate muda a cada render; só a busca importa
  useEffect(() => {
    const q = search.trim();
    if (q === lastPushedQ.current) return;
    const timer = setTimeout(() => {
      lastPushedQ.current = q;
      navigate({ q });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtros limpos por fora (ex.: "Limpar filtros") → sincroniza o campo.
  useEffect(() => {
    if (filters.q !== lastPushedQ.current) {
      lastPushedQ.current = filters.q;
      setSearch(filters.q);
    }
  }, [filters.q]);

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      const result = await deleteTransactionAction(toDelete.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setToDelete(null);
      toast.success("Transação excluída.");
    });
  }

  const { summary } = statement;
  const balanceNegative = Number(summary.balance) < 0;
  const advanced = advancedCount(filters);
  const filtered = hasAnyFilter(filters);
  const byPeriod = Boolean(filters.from || filters.to);

  return (
    <PageSection title="Extrato mensal" description="Todas as transações do mês, agrupadas por dia.">
      {byPeriod ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-accent-soft/50 px-4 py-2.5 text-sm">
          <p>
            Período:{" "}
            <span className="num font-semibold">
              {filters.from ? formatDate(filters.from) : "início"} a {filters.to ? formatDate(filters.to) : "hoje"}
            </span>
          </p>
          <button
            type="button"
            onClick={() => navigate({ from: null, to: null })}
            className="tap -mr-2 grid place-items-center rounded-full font-semibold text-primary"
          >
            Limpar
          </button>
        </div>
      ) : (
        <MonthSelector month={filters.month} size="sm" />
      )}

      <dl className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card py-2.5 text-center shadow-soft">
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground">Entradas</dt>
          <dd>
            <Money value={summary.income} className="text-[13px] font-bold text-income lg:text-base" />
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground">Saídas</dt>
          <dd>
            <Money value={summary.expense} className="text-[13px] font-bold text-expense lg:text-base" />
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground">Saldo</dt>
          <dd>
            <Money
              value={summary.balance}
              className={cn(
                "text-[13px] font-bold lg:text-base",
                balanceNegative ? "text-expense" : "text-primary-dark",
              )}
            />
          </dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="statement-search" className="sr-only">
            Buscar transação
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="statement-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar transação"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-border bg-card pr-10 pl-10 text-[15px] transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/25 [&::-webkit-search-cancel-button]:hidden"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setAdvancedOpen(true)}
          aria-label={advanced ? `Filtros avançados, ${advanced} ativos` : "Filtros avançados"}
          className={cn(
            "relative grid size-11 shrink-0 place-items-center rounded-xl border transition-colors",
            advanced
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-primary-dark hover:bg-muted",
          )}
        >
          <SlidersHorizontal className="size-[18px]" aria-hidden />
          {advanced ? (
            <span className="num absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-expense text-[10px] font-bold text-primary-foreground ring-2 ring-background">
              {advanced}
            </span>
          ) : null}
        </button>
      </div>

      <div className="no-scrollbar -mx-5 -my-1 flex gap-2 overflow-x-auto px-5 py-1 lg:mx-0 lg:px-0">
        {QUICK_FILTERS.map((q) => (
          <FilterChip key={q.value} active={filters.quick === q.value} onClick={() => navigate({ quick: q.value })}>
            {q.label}
          </FilterChip>
        ))}
      </div>

      <div aria-live="polite" aria-busy={pending} className={cn("transition-opacity", pending && "opacity-60")}>
        {statement.items.length === 0 ? (
          filtered ? (
            <EmptyState
              art="list"
              title="Nenhuma transação encontrada"
              description="Tente outra busca ou limpe os filtros."
              action={
                <Button variant="secondary" onClick={() => navigate(EMPTY_FILTERS(filters.month))}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              art="list"
              title="Extrato vazio"
              description="Nenhuma transação neste mês ainda."
              action={<Button onClick={() => openNewTransaction()}>Adicionar transação</Button>}
            />
          )
        ) : (
          <div className="space-y-4">
            <p className="text-center text-[11px] text-muted-foreground lg:hidden">
              Toque para editar · deslize para a esquerda para excluir
            </p>
            <TransactionGroups
              transactions={statement.items}
              categories={categories}
              accounts={accounts}
              dayTotals={statement.dayTotals}
              onDelete={setToDelete}
            />
            {statement.hasMore ? (
              <Link
                href={`/transactions?${filtersToSearchParams(filters, statement.page + 1)}`}
                scroll={false}
                replace
                className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full" })}
              >
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                Carregar mais
              </Link>
            ) : statement.items.length > 8 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">Você chegou ao fim do extrato</p>
            ) : null}
          </div>
        )}
      </div>

      <AdvancedFiltersSheet
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        value={filters}
        onApply={(value) => {
          setAdvancedOpen(false);
          navigate(value);
        }}
        categories={categories}
        accounts={accounts}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="Excluir transação?"
        description={
          toDelete
            ? `"${toDelete.description}" sairá do extrato e dos totais do mês. Essa ação não pode ser desfeita.`
            : ""
        }
        pending={deleting}
        onConfirm={confirmDelete}
      />
    </PageSection>
  );
}
