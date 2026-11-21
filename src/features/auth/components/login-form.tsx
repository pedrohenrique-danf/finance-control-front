"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Field, fieldA11y } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { authErrorMessage } from "../auth-errors";
import { safeNextPath } from "../safe-next-path";
import { type LoginFormValues, loginFormSchema } from "../schemas";
import { GoogleSignInButton, OrDivider } from "./google-sign-in";
import { PasswordInput } from "./password-input";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginFormValues) {
    const { error } = await authClient.signIn.email({ email: values.email, password: values.password });
    if (error) {
      form.setError("root", { message: authErrorMessage("login", error) });
      form.resetField("password");
      return;
    }
    router.replace(safeNextPath(next));
    router.refresh();
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormAlert message={errors.root?.message ?? initialError} />
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
        <Field label="Senha" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            {...fieldA11y("password", errors.password?.message)}
            autoComplete="current-password"
            placeholder="Sua senha"
            {...form.register("password")}
          />
        </Field>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <OrDivider />
      <GoogleSignInButton next={next} />
    </>
  );
}
