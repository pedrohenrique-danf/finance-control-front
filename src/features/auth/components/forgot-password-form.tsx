"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Field, fieldA11y } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { authErrorMessage } from "../auth-errors";
import { type ForgotPasswordFormValues, forgotPasswordFormSchema } from "../schemas";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ForgotPasswordFormValues) {
    // O backend envia o e-mail (SMTP; em dev sem SMTP, o link sai no log do backend). O link do e-mail passa
    // pelo Better Auth, que valida o token e redireciona para /reset-password?token=… (ou ?error=…).
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      form.setError("root", { message: authErrorMessage("forgot", error) });
      return;
    }
    // O backend responde igual para e-mails cadastrados ou não (não revela se a conta existe).
    setSentTo(values.email);
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-1 flex-col items-center pt-4 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-income-soft text-income">
          <MailCheck className="size-9" aria-hidden />
        </span>
        <h2 className="mt-5 text-lg font-bold text-primary-dark">Enviamos um link para seu e-mail</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Se existir uma conta para <span className="font-semibold break-all text-foreground">{sentTo}</span>, você vai
          receber as instruções para criar uma nova senha. Confira também a caixa de spam.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="mt-6 text-primary"
          onClick={() => {
            form.reset();
            setSentTo(null);
          }}
        >
          Usar outro e-mail
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
      </p>
      <FormAlert message={errors.root?.message} />
      <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
        <Input
          {...fieldA11y("email", errors.email?.message)}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          {...form.register("email")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}
