"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/common/category-icon";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DateInput } from "@/components/common/date-input";
import { Field, fieldA11y, fieldErrorId, Segmented } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { FormSheet } from "@/components/common/form-sheet";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayIso } from "@/lib/format/date";
import { digitsToDecimal, formatMoneyPlain } from "@/lib/format/money";
import { applyActionError } from "@/lib/forms/apply-action-error";
import { cn } from "@/lib/utils";
import {
  createTransactionAction,
  deleteTransactionAction,
  getTransactionAction,
  updateTransactionAction,
} from "../actions";
import {
  type AccountOption,
  type CategoryOption,
  DESCRIPTION_MAX,
  type Transaction,
  type TransactionFormValues,
  type TransactionType,
  toTransactionFormValues,
  toTransactionInput,
  transactionFormSchema,
} from "../schemas";

const FIELDS = ["type", "amount", "description", "date", "categoryId", "valueSourceId", "nature", "status"] as const;
const TYPE_OPTIONS = [
  { value: "despesa", label: "Despesa", activeClassName: "bg-expense text-primary-foreground shadow-soft" },
  { value: "receita", label: "Receita", activeClassName: "bg-income text-primary-foreground shadow-soft" },
] as const;
const NATURE_OPTIONS = [
  { value: "fixa", label: "Fixa" },
  { value: "variavel", label: "Variável" },
] as const;

function emptyValues(type: TransactionType, accountId: string): TransactionFormValues {
  return {
    type,
    amount: "0.00",
    description: "",
    date: todayIso(),
    categoryId: "",
    valueSourceId: accountId,
    nature: "variavel",
    status: "efetivada",
  };
}

/** Valor grande "R$ 0,00": cada dígito entra pela direita; teclado numérico no celular. */
function AmountField({
  value,
  onChange,
  type,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  type: TransactionType;
  error: string | undefined;
}) {
  const income = type === "receita";
  return (
    <div className={cn("rounded-3xl px-4 py-5 transition-colors", income ? "bg-income-soft" : "bg-expense-soft")}>
      <div className="flex flex-col items-center">
        <label htmlFor="tx-amount" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Valor
        </label>
        <div className={cn("mt-1 flex items-baseline justify-center gap-1.5", income ? "text-income" : "text-expense")}>
          <span className="text-xl font-bold" aria-hidden>
            R$
          </span>
          <input
            {...fieldA11y("tx-amount", error)}
            inputMode="numeric"
            autoComplete="off"
            value={formatMoneyPlain(value || "0")}
            onChange={(e) => onChange(digitsToDecimal(e.target.value))}
            onFocus={(e) => {
              const input = e.currentTarget;
              requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
            }}
            className="num field-sizing-content max-w-full min-w-[4ch] bg-transparent text-center text-[42px] leading-none font-extrabold caret-current outline-none"
          />
        </div>
      </div>
      {error ? (
        <p id={fieldErrorId("tx-amount")} role="alert" className="mt-2 text-center text-xs font-medium text-expense">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CategoryPicker({
  categories,
  value,
  onChange,
  error,
  type,
}: {
  categories: readonly CategoryOption[];
  value: string;
  onChange: (id: string) => void;
  error: string | undefined;
  type: TransactionType;
}) {
  return (
    <fieldset aria-describedby={error ? fieldErrorId("tx-category") : undefined}>
      <legend className="mb-1.5 text-[13px] font-semibold">Categoria</legend>
      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nenhuma categoria de {type === "receita" ? "receita" : "despesa"} ainda.{" "}
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
        <p id={fieldErrorId("tx-category")} role="alert" className="mt-1.5 text-xs font-medium text-expense">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Formulário global de transação (RF03), aberto pelo "+" de qualquer tela ou ao tocar numa transação. */
export function TransactionSheet({
  categories,
  accounts,
}: {
  categories: readonly CategoryOption[];
  accounts: readonly AccountOption[];
}) {
  const { transactionSheet, closeTransaction } = useShell();
  const { open, editId, defaultType } = transactionSheet;
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  const firstActive = accounts.find((a) => a.active)?.id ?? "";
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: emptyValues("despesa", firstActive),
  });
  const { errors, isSubmitting } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });

  // Ao abrir: nova transação → valores padrão; edição → busca a transação no servidor.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reinicia só quando o painel abre ou muda o alvo
  useEffect(() => {
    if (!open) return;
    setLoadError(null);
    if (!editId) {
      setEditing(null);
      form.reset(emptyValues(defaultType ?? "despesa", firstActive));
      return;
    }
    let cancelled = false;
    setLoading(true);
    getTransactionAction(editId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setLoadError(result.error.message);
        return;
      }
      setEditing(result.data);
      form.reset(toTransactionFormValues(result.data, categories, accounts));
    });
    return () => {
      cancelled = true;
    };
  }, [open, editId]);

  const typeCategories = categories.filter((c) => c.type === type);
  const selectableAccounts = accounts.filter((a) => a.active || a.id === editing?.valueSourceId);
  const isEdit = Boolean(editId);

  async function onSubmit(values: TransactionFormValues) {
    const input = toTransactionInput(values);
    const result = editing ? await updateTransactionAction(editing.id, input) : await createTransactionAction(input);
    if (!result.ok) return applyActionError(form.setError, result.error, FIELDS);
    toast.success(editing ? "Transação atualizada." : "Transação salva.");
    closeTransaction();
  }

  function onDelete() {
    if (!editing) return;
    startDelete(async () => {
      const result = await deleteTransactionAction(editing.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setConfirmOpen(false);
      closeTransaction();
      toast.success("Transação excluída.");
    });
  }

  return (
    <>
      <FormSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) closeTransaction();
        }}
        title={isEdit ? "Editar transação" : "Nova transação"}
        headerAction={
          editing ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-expense"
              aria-label="Excluir transação"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-5" aria-hidden />
            </Button>
          ) : null
        }
        footer={
          <Button
            type="submit"
            form="transaction-form"
            size="lg"
            variant={type === "receita" ? "income" : "default"}
            className="w-full"
            disabled={isSubmitting || loading || Boolean(loadError)}
          >
            {isSubmitting ? "Salvando…" : "Salvar"}
          </Button>
        }
      >
        {loading ? (
          <div role="status" className="space-y-4 py-2" aria-busy="true">
            <span className="sr-only">Carregando transação…</span>
            <div className="h-10 animate-pulse rounded-2xl bg-muted" />
            <div className="h-28 animate-pulse rounded-3xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : loadError ? (
          <FormAlert message={loadError} className="mt-2" />
        ) : (
          <form id="transaction-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormAlert message={errors.root?.message} />
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Segmented
                  label="Tipo de transação"
                  value={field.value}
                  options={TYPE_OPTIONS}
                  onChange={(next) => {
                    field.onChange(next);
                    const current = categories.find((c) => c.id === form.getValues("categoryId"));
                    if (current && current.type !== next) form.setValue("categoryId", "");
                  }}
                />
              )}
            />

            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <AmountField value={field.value} onChange={field.onChange} type={type} error={errors.amount?.message} />
              )}
            />

            <Field label="Descrição" htmlFor="tx-description" error={errors.description?.message}>
              <Input
                {...fieldA11y("tx-description", errors.description?.message)}
                placeholder={type === "receita" ? "Ex.: Salário, freelance…" : "Ex.: Mercado, Uber…"}
                maxLength={DESCRIPTION_MAX}
                autoComplete="off"
                {...form.register("description")}
              />
            </Field>

            <Field label="Data" htmlFor="tx-date" error={errors.date?.message}>
              <DateInput {...fieldA11y("tx-date", errors.date?.message)} {...form.register("date")} />
            </Field>

            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <CategoryPicker
                  categories={typeCategories}
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  error={errors.categoryId?.message}
                  type={type}
                />
              )}
            />

            <Field label="Conta ou cartão" htmlFor="tx-account" error={errors.valueSourceId?.message}>
              <Controller
                control={form.control}
                name="valueSourceId"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(next) => field.onChange(next ?? "")}
                    items={selectableAccounts.map((a) => ({ value: a.id, label: a.name }))}
                  >
                    <SelectTrigger
                      {...fieldA11y("tx-account", errors.valueSourceId?.message)}
                      className="w-full"
                      onBlur={field.onBlur}
                    >
                      <SelectValue placeholder="Escolha uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="min-h-11">
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <div className={cn("grid gap-3", type === "despesa" ? "grid-cols-2" : "grid-cols-1")}>
              {type === "despesa" ? (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-semibold">Natureza</p>
                  <Controller
                    control={form.control}
                    name="nature"
                    render={({ field }) => (
                      <Segmented
                        label="Natureza"
                        value={field.value}
                        onChange={field.onChange}
                        options={NATURE_OPTIONS}
                      />
                    )}
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <p className="text-[13px] font-semibold">Situação</p>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Segmented
                      label="Situação"
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "efetivada", label: type === "receita" ? "Recebido" : "Pago" },
                        { value: "pendente", label: "Pendente" },
                      ]}
                    />
                  )}
                />
              </div>
            </div>

            {editing?.origin === "recorrencia" ? (
              <p className="rounded-2xl bg-accent-soft/50 p-3 text-xs text-muted-foreground">
                Lançada por uma despesa fixa. Editar aqui altera só este mês.
              </p>
            ) : null}
          </form>
        )}
      </FormSheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir transação?"
        description="Essa ação não pode ser desfeita. O valor sai do extrato e dos totais do mês."
        pending={deleting}
        onConfirm={onDelete}
      />
    </>
  );
}
