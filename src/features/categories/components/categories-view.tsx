"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CategoryIcon } from "@/components/common/category-icon";
import { EmptyState } from "@/components/common/empty-state";
import { Segmented } from "@/components/common/field";
import { Money } from "@/components/common/money";
import { MonthSelector } from "@/components/common/month-selector";
import { HeaderIconButton } from "@/components/layout/header-controls";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import type { Category, CategoryTotalsByType, CategoryType } from "../schemas";
import { CategorySheet } from "./category-sheet";

const TABS = [
  { value: "despesa", label: "Despesas" },
  { value: "receita", label: "Receitas" },
] as const;

interface Row {
  key: string;
  name: string;
  total: number;
  totalText: string;
  category: Category | null;
}

function CategoryRow({ row, max, sum, onOpen }: { row: Row; max: number; sum: number; onOpen?: () => void }) {
  const share = sum > 0 ? Math.round((row.total / sum) * 100) : 0;
  const width = max > 0 ? (row.total / max) * 100 : 0;
  const content = (
    <>
      <CategoryIcon category={row.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[14.5px] font-semibold">{row.name}</p>
          <Money value={row.totalText} className="text-sm font-bold" />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${width}%`, backgroundColor: row.category?.color ?? "var(--color-muted-foreground)" }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{share}% do total no mês</p>
      </div>
    </>
  );
  const className = "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-soft";
  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Editar ${row.name}`}
      className={`${className} transition-colors hover:bg-muted/40`}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function CategoriesView({ month, data }: { month: string; data: Record<CategoryType, CategoryTotalsByType> }) {
  const [tab, setTab] = useState<CategoryType>("despesa");
  const [sheet, setSheet] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const openNew = () => setSheet({ open: true, category: null });

  const current = data[tab];
  const rows: Row[] = current.categories
    .map((c) => ({ key: c.id, name: c.name, total: Number(c.total), totalText: c.total, category: c }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
  const uncategorized = Number(current.uncategorizedTotal);
  if (uncategorized > 0) {
    rows.push({
      key: "sem-categoria",
      name: "Sem categoria",
      total: uncategorized,
      totalText: current.uncategorizedTotal,
      category: null,
    });
  }
  const sum = rows.reduce((acc, r) => acc + r.total, 0);
  const max = Math.max(0, ...rows.map((r) => r.total));
  const label = tab === "despesa" ? "despesas" : "receitas";

  return (
    <PageSection
      title="Categorias"
      description="Organize receitas e despesas e veja quanto foi lançado em cada uma no mês."
      action={
        <HeaderIconButton label="Nova categoria" onClick={openNew}>
          <Plus className="size-[22px]" aria-hidden />
        </HeaderIconButton>
      }
    >
      <div className="grid gap-2 lg:grid-cols-[minmax(0,22rem)_auto] lg:items-center lg:justify-between">
        <Segmented label="Tipo de categoria" value={tab} onChange={setTab} options={TABS} />
        <MonthSelector month={month} size="sm" />
      </div>
      <p className="text-center text-xs text-muted-foreground lg:text-left">
        Total de {label} no mês: <Money value={sum.toFixed(2)} className="font-bold text-foreground" />
      </p>

      {rows.length === 0 ? (
        <EmptyState
          art="folder"
          title={`Nenhuma categoria de ${label}`}
          description="Crie categorias para organizar seus lançamentos."
          action={
            <Button onClick={openNew}>
              <Plus aria-hidden /> Nova categoria
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {rows.map((row) => (
            <li key={row.key}>
              <CategoryRow
                row={row}
                max={max}
                sum={sum}
                onOpen={row.category ? () => setSheet({ open: true, category: row.category }) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" size="lg" className="w-full lg:w-auto" onClick={openNew}>
        <Plus aria-hidden /> Nova categoria
      </Button>

      <CategorySheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        category={sheet.category}
        defaultType={tab}
      />
    </PageSection>
  );
}
