"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AmountField } from "@/components/common/amount-field";
import { CategoryPicker } from "@/components/common/category-picker";
import { DateInput } from "@/components/common/date-input";
import { Field, fieldA11y, Segmented } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { FormSheet } from "@/components/common/form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { todayIso } from "@/lib/format/date";
import { applyActionError } from "@/lib/forms/apply-action-error";
import { createRecurrenceAction, updateRecurrenceAction } from "../actions";
import {
  DESCRIPTION_MAX,
  type Recurrence,
  type RecurrenceAccount,
  type RecurrenceCategory,
  type RecurrenceFormValues,
  recurrenceFormSchema,
  toRecurrenceCreateInput,
  toRecurrenceFormValues,
  toRecurrenceUpdateInput,
} from "../schemas";

const FIELDS = [
  "type",
  "amount",
  "description",
  "categoryId",
  "valueSourceId",
  "dueDay",
  "startDate",
  "endDate",
] as const;
const TYPE_OPTIONS = [
  { value: "despesa", label: "Despesa", activeClassName: "bg-expense text-primary-foreground shadow-soft" },
  { value: "receita", label: "Receita", activeClassName: "bg-income text-primary-foreground shadow-soft" },
] as const;

interface RecurrenceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = nova despesa fixa. */
  recurrence: Recurrence | null;
  categories: readonly RecurrenceCategory[];
  accounts: readonly RecurrenceAccount[];
}

export function RecurrenceSheet({ open, onOpenChange, recurrence, categories, accounts }: RecurrenceSheetProps) {
  const firstActive = accounts.find((a) => a.active)?.id ?? "";
  const defaults = () => toRecurrenceFormValues(recurrence, categories, { accountId: firstActive, today: todayIso() });
  const form = useForm<RecurrenceFormValues>({
    resolver: zodResolver(recurrenceFormSchema),
    defaultValues: defaults(),
  });
  const { errors, isSubmitting } = form.formState;
  const [type, noEnd] = useWatch({ control: form.control, name: ["type", "noEnd"] });

  // biome-ignore lint/correctness/useExhaustiveDependencies: reinicia só ao abrir ou trocar de recorrência
  useEffect(() => {
    if (open) form.reset(defaults());
  }, [open, recurrence]);

  const selectableAccounts = accounts.filter((a) => a.active || a.id === recurrence?.valueSourceId);

  async function onSubmit(values: RecurrenceFormValues) {
    const result = recurrence
      ? await updateRecurrenceAction(recurrence.id, toRecurrenceUpdateInput(values, recurrence.active))
      : await createRecurrenceAction(toRecurrenceCreateInput(values));
    if (!result.ok) return applyActionError(form.setError, result.error, FIELDS);
    toast.success(recurrence ? "Recorrência atualizada." : "Despesa fixa criada.");
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={recurrence ? "Editar recorrência" : "Nova despesa fixa"}
      footer={
        <Button type="submit" form="recurrence-form" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      <form id="recurrence-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormAlert message={errors.root?.message} />
        <Controller
          control={form.control}
          name="type"
          render={({ field }) =>
            recurrence ? (
              <p className="text-sm text-muted-foreground">
                {field.value === "despesa" ? "Despesa" : "Receita"} · o tipo não pode ser alterado.
              </p>
            ) : (
              <Segmented
                label="Tipo"
                value={field.value}
                options={TYPE_OPTIONS}
                onChange={(next) => {
                  field.onChange(next);
                  form.setValue("categoryId", "");
                }}
              />
            )
          }
        />

        <Controller
          control={form.control}
          name="amount"
          render={({ field }) => (
            <AmountField
              id="rec-amount"
              value={field.value}
              onChange={field.onChange}
              tone={type}
              error={errors.amount?.message}
            />
          )}
        />

        <Field label="Descrição" htmlFor="rec-description" error={errors.description?.message}>
          <Input
            {...fieldA11y("rec-description", errors.description?.message)}
            placeholder="Ex.: Aluguel, academia…"
            maxLength={DESCRIPTION_MAX}
            autoComplete="off"
            {...form.register("description")}
          />
        </Field>

        <Controller
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <CategoryPicker
              id="rec-category"
              categories={categories.filter((c) => c.type === type)}
              value={field.value}
              onChange={field.onChange}
              error={errors.categoryId?.message}
              type={type}
            />
          )}
        />

        <Field label="Conta ou cartão" htmlFor="rec-account" error={errors.valueSourceId?.message}>
          <Controller
            control={form.control}
            name="valueSourceId"
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(next) => field.onChange(next ?? "")}
                items={selectableAccounts.map((a) => ({ value: a.id, label: a.name }))}
              >
                <SelectTrigger {...fieldA11y("rec-account", errors.valueSourceId?.message)} className="w-full">
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

        <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-3">
          <Field label="Vence dia" htmlFor="rec-day" error={errors.dueDay?.message}>
            <Input
              {...fieldA11y("rec-day", errors.dueDay?.message)}
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              {...form.register("dueDay", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Data de início" htmlFor="rec-start" error={errors.startDate?.message}>
            <DateInput {...fieldA11y("rec-start", errors.startDate?.message)} {...form.register("startDate")} />
          </Field>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          {/* biome-ignore lint/a11y/noLabelWithoutControl: o Switch é renderizado pelo Controller dentro do label */}
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
            <span className="text-sm font-semibold">Sem data de término</span>
            <Controller
              control={form.control}
              name="noEnd"
              render={({ field }) => (
                <Switch id="rec-no-end" checked={field.value} onCheckedChange={(next) => field.onChange(next)} />
              )}
            />
          </label>
          {noEnd ? null : (
            <Field label="Data de fim" htmlFor="rec-end" error={errors.endDate?.message} className="mt-3">
              <DateInput {...fieldA11y("rec-end", errors.endDate?.message)} {...form.register("endDate")} />
            </Field>
          )}
        </div>

        <p className="flex gap-2 rounded-2xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {recurrence
            ? "As mudanças valem para os próximos lançamentos. Os já lançados continuam como estão no extrato."
            : "Os lançamentos até este mês entram no extrato como pendentes; os próximos meses são lançados automaticamente."}
        </p>
      </form>
    </FormSheet>
  );
}
