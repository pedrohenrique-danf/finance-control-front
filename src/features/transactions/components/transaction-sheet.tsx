"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AmountField } from "@/components/common/amount-field";
import { CategoryPicker } from "@/components/common/category-picker";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DateInput } from "@/components/common/date-input";
import { Field, fieldA11y, Segmented } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { FormSheet } from "@/components/common/form-sheet";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { todayIso } from "@/lib/format/date";
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
  dayOf,
  type Transaction,
  type TransactionFormValues,
  type TransactionType,
  toRepeatMonthly,
  toTransactionFormValues,
  toTransactionInput,
  transactionFormSchema,
} from "../schemas";

const FIELDS = [
  "type",
  "amount",
  "description",
  "date",
  "categoryId",
  "valueSourceId",
  "nature",
  "status",
  "dueDay",
  "endDate",
] as const;
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
    repeat: false,
    dueDay: dayOf(todayIso()),
    endDate: "",
  };
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
  const [type, repeat] = useWatch({ control: form.control, name: ["type", "repeat"] });

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
    const result = editing
      ? await updateTransactionAction(editing.id, input)
      : await createTransactionAction(input, toRepeatMonthly(values));
    if (!result.ok) return applyActionError(form.setError, result.error, FIELDS);
    toast.success(editing ? "Transação atualizada." : "Transação salva.", {
      description: !editing && values.repeat ? "A recorrência mensal também foi criada." : undefined,
    });
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
                <AmountField
                  id="tx-amount"
                  value={field.value}
                  onChange={field.onChange}
                  tone={type}
                  error={errors.amount?.message}
                />
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
                  id="tx-category"
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
                        value={repeat ? "fixa" : field.value}
                        onChange={(next) => {
                          if (!repeat) field.onChange(next);
                        }}
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

            {isEdit ? null : (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="tx-repeat" className="min-w-0 cursor-pointer">
                    <span className="block text-sm font-semibold">Repetir todo mês</span>
                    <span className="block text-xs text-muted-foreground">
                      Cria uma {type === "receita" ? "receita" : "despesa"} fixa automática
                    </span>
                  </label>
                  <Controller
                    control={form.control}
                    name="repeat"
                    render={({ field }) => (
                      <Switch
                        id="tx-repeat"
                        checked={field.value}
                        onCheckedChange={(next) => {
                          field.onChange(next);
                          if (next) form.setValue("dueDay", dayOf(form.getValues("date")));
                        }}
                      />
                    )}
                  />
                </div>
                {repeat ? (
                  <div className="mt-4 grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                    <Field label="Vence dia" htmlFor="tx-due-day" error={errors.dueDay?.message}>
                      <Input
                        {...fieldA11y("tx-due-day", errors.dueDay?.message)}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={31}
                        {...form.register("dueDay", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field label="Data final (opcional)" htmlFor="tx-end-date" error={errors.endDate?.message}>
                      <DateInput {...fieldA11y("tx-end-date", errors.endDate?.message)} {...form.register("endDate")} />
                    </Field>
                  </div>
                ) : null}
              </div>
            )}

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
