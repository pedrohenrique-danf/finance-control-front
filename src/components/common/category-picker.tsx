"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/common/category-icon";
import { fieldErrorId } from "@/components/common/field";
import { cn } from "@/lib/utils";

/** Seleção de categoria em chips com ícone (radiogroup). Sem categorias do tipo, leva à tela de Categorias. */
export function CategoryPicker({
  id,
  categories,
  value,
  onChange,
  error,
  type,
}: {
  id: string;
  categories: ReadonlyArray<{ id: string; name: string; color: string; icon: string | null }>;
  value: string;
  onChange: (id: string) => void;
  error: string | undefined;
  type: "receita" | "despesa";
}) {
  return (
    <fieldset aria-describedby={error ? fieldErrorId(id) : undefined}>
      <legend className="mb-1.5 text-[13px] font-semibold">Categoria</legend>
      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nenhuma categoria de {type} ainda.{" "}
          <Link href="/categories" className="font-semibold text-primary underline-offset-4 hover:underline">
            Criar categoria
          </Link>
        </p>
      ) : (
        <div role="radiogroup" aria-label="Categoria" className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {categories.map((c) => {
            const selected = value === c.id;
            return (
              // biome-ignore lint/a11y/useSemanticElements: chips com ícone (padrão WAI-ARIA radiogroup)
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(c.id)}
                className={cn(
                  "relative flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 py-2.5 text-center text-[11px] leading-tight font-semibold transition-all duration-150",
                  selected
                    ? "border-primary bg-accent-soft/50 text-foreground ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                <CategoryIcon category={c} className="size-9" iconClassName="size-[18px]" />
                <span className="line-clamp-2 break-words">{c.name}</span>
                {selected ? (
                  <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
      {error ? (
        <p id={fieldErrorId(id)} role="alert" className="mt-1.5 text-xs font-medium text-expense">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
