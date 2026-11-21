"use client";

import { AlertTriangle, ChevronDown, FileText } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { Money } from "@/components/common/money";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { confirmImportAction } from "../actions";
import {
  type ExchangeAccount,
  type ExchangeCategory,
  type ImportPreview,
  matchAccount,
  matchCategory,
  SOURCE_LABELS,
  suggestAccount,
} from "../schemas";

const selectClass =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25";

interface RowState {
  include: boolean;
  categoryId: string;
}

export function ImportReview({
  preview,
  categories,
  accounts,
  onDone,
  onCancel,
}: {
  preview: ImportPreview;
  categories: readonly ExchangeCategory[];
  accounts: readonly ExchangeAccount[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [accountId, setAccountId] = useState(() => suggestAccount(preview, accounts));
  const [rows, setRows] = useState<RowState[]>(() =>
    preview.rows.map((r) => ({ include: !r.suggestedSkip, categoryId: matchCategory(r, categories) })),
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const activeAccounts = accounts.filter((a) => a.active);

  const selected = rows.filter((r) => r.include).length;
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    preview.rows.forEach((r, i) => {
      if (!rows[i]?.include) return;
      const cents = Math.round(Number(r.amount) * 100);
      if (r.type === "receita") income += cents;
      else expense += cents;
    });
    return { income: (income / 100).toFixed(2), expense: (expense / 100).toFixed(2) };
  }, [preview.rows, rows]);

  const update = (index: number, patch: Partial<RowState>) =>
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const setAll = (include: boolean) => setRows((current) => current.map((r) => ({ ...r, include })));

  function confirm() {
    setError(undefined);
    const payload = {
      fileName: preview.fileName,
      format: preview.source === "csv" ? "csv" : "pdf",
      rows: preview.rows.flatMap((r, i) => {
        const state = rows[i];
        if (!state?.include) return [];
        return [
          {
            date: r.date,
            description: r.description,
            amount: r.amount,
            type: r.type,
            nature: r.nature,
            status: r.status,
            categoryId: state.categoryId || null,
            valueSourceId: matchAccount(r, accounts) ?? (accountId || null),
          },
        ];
      }),
      errors: preview.errors,
    };
    startTransition(async () => {
      const result = await confirmImportAction(payload);
      if (!result.ok) {
        setError(result.error.fieldErrors?.rows ?? result.error.message);
        return;
      }
      toast.success(
        `${result.data.successRows} ${result.data.successRows === 1 ? "transação importada" : "transações importadas"}.`,
      );
      onDone();
    });
  }

  return (
    <section
      aria-labelledby="review-title"
      className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-soft lg:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-primary-dark">
          <FileText className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="review-title" className="text-[15px] font-bold text-primary-dark">
            {SOURCE_LABELS[preview.source]}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {preview.fileName}
            {preview.period ? ` · ${formatDate(preview.period.start)} a ${formatDate(preview.period.end)}` : ""}
          </p>
        </div>
      </div>

      <FormAlert message={error} />

      {preview.rows.length > 0 ? (
        <>
          <Field
            label="Conta ou cartão de destino"
            htmlFor="import-account"
            hint="Linhas do CSV com conta própria mantêm a conta informada."
          >
            <select
              id="import-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={selectClass}
            >
              <option value="">Sem conta</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p aria-live="polite">
              <span className="font-semibold">{selected}</span> de {preview.rows.length} selecionadas ·{" "}
              <Money value={totals.income} className="font-semibold text-income" /> entradas ·{" "}
              <Money value={totals.expense} className="font-semibold text-expense" /> saídas
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => setAll(true)}>
                Marcar todas
              </Button>
              <Button variant="ghost" onClick={() => setAll(false)}>
                Desmarcar
              </Button>
            </div>
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {preview.rows.map((row, index) => {
              const state = rows[index] ?? { include: false, categoryId: "" };
              const income = row.type === "receita";
              const options = categories.filter((c) => c.type === row.type);
              const id = `import-row-${index}`;
              return (
                <li key={row.line} className={cn("space-y-2 p-3", !state.include && "bg-muted/40")}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={id}
                      checked={state.include}
                      onCheckedChange={(checked) => update(index, { include: checked === true })}
                      className="mt-0.5 size-5 rounded-md"
                      aria-label={`Importar ${row.description}`}
                    />
                    <label htmlFor={id} className={cn("min-w-0 flex-1 cursor-pointer", !state.include && "opacity-60")}>
                      <span className="block text-sm font-semibold break-words">{row.description}</span>
                      <span className="num block text-xs text-muted-foreground">
                        {formatDate(row.date)}
                        {row.status === "pendente" ? " · pendente" : ""}
                      </span>
                    </label>
                    <Money
                      value={row.amount}
                      type={row.type}
                      signed
                      className={cn(
                        "text-sm font-bold",
                        income ? "text-income" : "text-expense",
                        !state.include && "opacity-60",
                      )}
                    />
                  </div>
                  {row.installment || row.note ? (
                    <div className="flex flex-wrap gap-1.5 pl-8">
                      {row.installment ? <StatusBadge tone="accent" label={`Parcela ${row.installment}`} /> : null}
                      {row.note ? <p className="text-[11px] text-alert-strong">{row.note}</p> : null}
                    </div>
                  ) : null}
                  {state.include ? (
                    <div className="pl-8">
                      <label htmlFor={`${id}-category`} className="sr-only">
                        Categoria de {row.description}
                      </label>
                      <select
                        id={`${id}-category`}
                        value={state.categoryId}
                        onChange={(e) => update(index, { categoryId: e.target.value })}
                        className={cn(selectClass, "h-10")}
                      >
                        <option value="">Sem categoria</option>
                        {options.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nenhuma transação encontrada no arquivo.
        </p>
      )}

      {preview.errors.length > 0 ? (
        <details className="group rounded-2xl border border-alert/40 bg-alert-soft/50 p-3 text-sm">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-alert-strong">
            <AlertTriangle className="size-4" aria-hidden />
            {preview.errors.length}{" "}
            {preview.errors.length === 1 ? "linha não pôde ser lida" : "linhas não puderam ser lidas"}
            <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="mt-2 space-y-1.5">
            {preview.errors.map((e) => (
              <li key={`${e.line}-${e.field ?? ""}-${e.message}`} className="text-xs">
                <span className="font-semibold">Linha {e.line}</span>
                {e.field ? ` (${e.field})` : ""}: {e.message}
                {e.content ? <span className="block truncate text-muted-foreground">{e.content}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button size="lg" onClick={confirm} disabled={pending || selected === 0}>
          {pending ? "Importando…" : `Importar ${selected} ${selected === 1 ? "transação" : "transações"}`}
        </Button>
      </div>
    </section>
  );
}
