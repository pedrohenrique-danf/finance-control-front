"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field, fieldA11y } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { FormSheet } from "@/components/common/form-sheet";
import { MoneyInput } from "@/components/common/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { applyActionError } from "@/lib/forms/apply-action-error";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPES } from "../account-types";
import { createAccountAction, updateAccountAction } from "../actions";
import {
  ACCOUNT_NAME_MAX,
  type Account,
  type AccountFormValues,
  accountFormSchema,
  toAccountFormValues,
  toAccountInput,
  valueSourceTypes,
} from "../schemas";

const FIELDS = ["name", "type", "institution", "initialBalance", "active"] as const;

function SwitchRow({
  id,
  title,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  title: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={(next) => onCheckedChange(next)} />
    </div>
  );
}

interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = nova conta. */
  account: Account | null;
}

export function AccountSheet({ open, onOpenChange, account }: AccountSheetProps) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: toAccountFormValues(account),
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (open) form.reset(toAccountFormValues(account));
  }, [open, account, form]);

  async function onSubmit(values: AccountFormValues) {
    const input = toAccountInput(values);
    const result = account ? await updateAccountAction(account.id, input) : await createAccountAction(input);
    if (!result.ok) return applyActionError(form.setError, result.error, FIELDS);
    toast.success(account ? "Conta atualizada." : "Conta criada.");
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={account ? "Editar conta" : "Nova conta ou cartão"}
      footer={
        <Button type="submit" form="account-form" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      <form id="account-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
        <FormAlert message={errors.root?.message} />
        <Field label="Nome" htmlFor="account-name" error={errors.name?.message}>
          <Input
            {...fieldA11y("account-name", errors.name?.message)}
            placeholder="Ex.: Nubank, Poupança…"
            maxLength={ACCOUNT_NAME_MAX}
            autoComplete="off"
            {...form.register("name")}
          />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">Tipo</legend>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Tipo de conta" className="grid grid-cols-2 gap-2">
                {valueSourceTypes.map((type) => {
                  const meta = ACCOUNT_TYPES[type];
                  const Icon = meta.icon;
                  const active = field.value === type;
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: opções com ícone (padrão WAI-ARIA radiogroup)
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(type)}
                      className={cn(
                        "flex h-12 items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors",
                        active
                          ? "border-primary bg-accent-soft text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </fieldset>

        <Field label="Instituição (opcional)" htmlFor="account-institution" error={errors.institution?.message}>
          <Input
            {...fieldA11y("account-institution", errors.institution?.message)}
            placeholder="Ex.: Nubank, Itaú, Dinheiro"
            maxLength={80}
            autoComplete="off"
            {...form.register("institution")}
          />
        </Field>

        <Field label="Saldo inicial" htmlFor="account-balance" error={errors.initialBalance?.message}>
          <Controller
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <MoneyInput
                {...fieldA11y("account-balance", errors.initialBalance?.message)}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </Field>

        <Controller
          control={form.control}
          name="negative"
          render={({ field }) => (
            <SwitchRow
              id="account-negative"
              title="Saldo inicial negativo"
              hint="Para conta no cheque especial ou fatura em aberto"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <Controller
          control={form.control}
          name="active"
          render={({ field }) => (
            <SwitchRow
              id="account-active"
              title="Conta ativa"
              hint="Contas inativas não aparecem ao lançar transações"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </form>
    </FormSheet>
  );
}
