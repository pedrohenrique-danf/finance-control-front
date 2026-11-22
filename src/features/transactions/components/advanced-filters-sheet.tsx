"use client";

import { useEffect, useState } from "react";
import { CategoryIcon } from "@/components/common/category-icon";
import { DateInput } from "@/components/common/date-input";
import { Field, FilterChip, Segmented } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { FormSheet } from "@/components/common/form-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TransactionFilters } from "../filters";
import type { AccountOption, CategoryOption, TransactionStatus } from "../schemas";

type Advanced = Pick<TransactionFilters, "categoryIds" | "accountIds" | "status" | "from" | "to">;
const EMPTY: Advanced = { categoryIds: [], accountIds: [], status: null, from: null, to: null };

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "efetivada", label: "Efetivada" },
  { value: "pendente", label: "Pendente" },
] as const;

export function AdvancedFiltersSheet({
  open,
  onOpenChange,
  value,
  onApply,
  categories,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: Advanced;
  onApply: (value: Advanced) => void;
  categories: readonly CategoryOption[];
  accounts: readonly AccountOption[];
}) {
  const [draft, setDraft] = useState<Advanced>(value);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setDraft(value);
      setError(undefined);
    }
  }, [open, value]);

  const toggle = (key: "categoryIds" | "accountIds", id: string) =>
    setDraft((d) => ({ ...d, [key]: d[key].includes(id) ? d[key].filter((x) => x !== id) : [...d[key], id] }));

  function apply() {
    if (draft.from && draft.to && draft.from > draft.to) {
      setError("A data inicial deve ser anterior à data final.");
      return;
    }
    onApply(draft);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros avançados"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={() => setDraft(EMPTY)}>
            Limpar
          </Button>
          <Button size="lg" className="flex-1" onClick={apply}>
            Aplicar filtros
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pt-2">
        <FormAlert message={error} />
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Categoria</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = draft.categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle("categoryIds", c.id)}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-full border pr-3 pl-1 text-[13px] font-semibold transition-colors",
                    active
                      ? "border-primary bg-accent-soft text-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  <CategoryIcon category={c} className="size-7" iconClassName="size-3.5" />
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Conta ou cartão</legend>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a) => (
              <FilterChip
                key={a.id}
                active={draft.accountIds.includes(a.id)}
                onClick={() => toggle("accountIds", a.id)}
              >
                {a.name}
              </FilterChip>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="mb-2 text-[13px] font-semibold">Situação</p>
          <Segmented
            label="Situação"
            value={draft.status ?? "todos"}
            onChange={(v) => setDraft((d) => ({ ...d, status: v === "todos" ? null : (v as TransactionStatus) }))}
            options={STATUS_OPTIONS}
          />
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="De" htmlFor="filter-from">
              <DateInput
                id="filter-from"
                value={draft.from ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value || null }))}
              />
            </Field>
            <Field label="Até" htmlFor="filter-to">
              <DateInput
                id="filter-to"
                value={draft.to ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value || null }))}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Com um período de datas, o filtro ignora o mês selecionado.
          </p>
        </div>
      </div>
    </FormSheet>
  );
}
