"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Field, fieldA11y } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { authErrorMessage } from "../auth-errors";
import { type ResetPasswordFormValues, resetPasswordFormSchema } from "../schemas";
import { PasswordInput } from "./password-input";
import { PasswordStrengthMeter } from "./password-strength-meter";

function InvalidLink() {
  return (
    <div role="status" className="flex flex-1 flex-col items-center pt-4 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-alert-soft text-alert-strong">
        <LinkIcon className="size-9" aria-hidden />
      </span>
      <h2 className="mt-5 text-lg font-bold text-primary-dark">Link inválido ou expirado</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Os links de redefinição valem por pouco tempo e só podem ser usados uma vez. Peça um novo link.
      </p>
      <Link href="/forgot-password" className={buttonVariants({ size: "lg", className: "mt-8 w-full" })}>
        Pedir novo link
      </Link>
    </div>
  );
}

/** `token` chega pela URL do e-mail (o Better Auth redireciona para /reset-password?token=… ou ?error=…). */
export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const router = useRouter();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirm: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });

  if (!token) return <InvalidLink />;

  async function onSubmit(values: ResetPasswordFormValues) {
    const { error } = await authClient.resetPassword({ newPassword: values.password, token });
    if (error) {
      form.setError("root", { message: authErrorMessage("reset", error) });
      return;
    }
    toast.success("Senha alterada! Entre com a nova senha.");
    router.replace("/login");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormAlert message={errors.root?.message} />
      <Field label="Nova senha" htmlFor="password" error={errors.password?.message}>
        <PasswordInput
          {...fieldA11y("password", errors.password?.message)}
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          {...form.register("password")}
        />
      </Field>
      <PasswordStrengthMeter value={password} />
      <Field label="Confirmar nova senha" htmlFor="confirm" error={errors.confirm?.message}>
        <PasswordInput
          {...fieldA11y("confirm", errors.confirm?.message)}
          autoComplete="new-password"
          placeholder="Repita a senha"
          {...form.register("confirm")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
