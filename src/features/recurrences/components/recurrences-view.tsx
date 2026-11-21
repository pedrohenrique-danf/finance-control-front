"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/common/category-icon";
import { EmptyState } from "@/components/common/empty-state";
import { Money } from "@/components/common/money";
import { HeaderIconButton } from "@/components/layout/header-controls";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { setRecurrenceActiveAction } from "../actions";
import { monthlyFixedTotal, type Recurrence, type RecurrenceAccount, type RecurrenceCategory } from "../schemas";
import { RecurrenceSheet } from "./recurrence-sheet";

function RecurrenceRow({
  recurrence: r,
  category,
  onToggle,
}: {
  recurrence: Recurrence;
  category: RecurrenceCategory | undefined;
  onToggle: (active: boolean) => void;
}) {
  return (
    <li
      className={cn(
        "rounded-2xl border border-border bg-card shadow-soft transition-opacity",
        !r.active && "opacity-60",
      )}
    >
      <Link href={`/recurrences/${r.id}`} className="flex items-center gap-3 rounded-t-2xl p-3 hover:bg-muted/40">
        <CategoryIcon category={category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold">{r.description}</p>
          <p className="truncate text-xs text-muted-foreground">
            {category?.name ?? "Sem categoria"} · vence todo dia {r.dueDay}
          </p>
          <p className="num truncate text-[11px] text-muted-foreground">
            {formatDate(r.startDate)} – {r.endDate ? formatDate(r.endDate) : "sem término"}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <Money
            value={r.amount}
            className={cn("text-sm font-bold", r.type === "receita" ? "text-income" : "text-foreground")}
          />
          <ChevronRight className="mt-1 size-4 text-muted-foreground" aria-hidden />
        </div>
      </Link>
      <div className="flex min-h-11 items-center justify-between border-t border-border px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{r.active ? "Ativa" : "Pausada"}</span>
        <Switch
          checked={r.active}
          aria-label={`${r.active ? "Pausar" : "Reativar"} ${r.description}`}
          onCheckedChange={(next) => onToggle(next)}
        />
      </div>
    </li>
  );
}

export function RecurrencesView({
  recurrences,
  categories,
  accounts,
}: {
  recurrences: Recurrence[];
  categories: readonly RecurrenceCategory[];
  accounts: readonly RecurrenceAccount[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(recurrences, (current, change: { id: string; active: boolean }) =>
    current.map((r) => (r.id === change.id ? { ...r, active: change.active } : r)),
  );
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const activeCount = optimistic.filter((r) => r.active).length;

  function toggle(r: Recurrence, active: boolean) {
    startTransition(async () => {
      setOptimistic({ id: r.id, active });
      const result = await setRecurrenceActiveAction(r.id, active);
      if (!result.ok) toast.error(result.error.message);
      else toast.success(active ? "Recorrência reativada." : "Recorrência pausada.");
    });
  }

  return (
    <PageSection
      title="Despesas fixas"
      description="Contas que se repetem todo mês, lançadas automaticamente."
      action={
        <HeaderIconButton label="Nova despesa fixa" onClick={() => setOpen(true)}>
          <Plus className="size-[22px]" aria-hidden />
        </HeaderIconButton>
      }
    >
      <section
        aria-label="Total fixo mensal"
        className="rounded-3xl bg-balance p-5 text-primary-foreground shadow-card lg:max-w-md"
      >
        <p className="text-sm opacity-85">Total fixo mensal</p>
        <Money value={monthlyFixedTotal(optimistic)} className="mt-1 block text-[30px] font-extrabold" />
        <p className="mt-1 text-xs opacity-80">
          {activeCount} {activeCount === 1 ? "recorrência ativa" : "recorrências ativas"}
        </p>
      </section>

      {optimistic.length === 0 ? (
        <EmptyState
          art="list"
          title="Nenhuma despesa fixa"
          description="Cadastre contas que se repetem, como aluguel e internet, para lançá-las automaticamente."
          action={<Button onClick={() => setOpen(true)}>Nova despesa fixa</Button>}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {optimistic.map((r) => (
            <RecurrenceRow
              key={r.id}
              recurrence={r}
              category={r.categoryId ? categoryById.get(r.categoryId) : undefined}
              onToggle={(active) => toggle(r, active)}
            />
          ))}
        </ul>
      )}

      <Button variant="secondary" size="lg" className="w-full lg:w-auto" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Nova despesa fixa
      </Button>
      <RecurrenceSheet
        open={open}
        onOpenChange={setOpen}
        recurrence={null}
        categories={categories}
        accounts={accounts}
      />
    </PageSection>
  );
}
