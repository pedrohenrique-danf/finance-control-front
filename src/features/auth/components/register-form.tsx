"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Field, fieldA11y, fieldErrorId } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TERMS_VERSION } from "@/features/legal";
import { authClient } from "@/lib/auth/auth-client";
import { authErrorMessage } from "../auth-errors";
import { type RegisterFormInput, type RegisterFormValues, registerFormSchema } from "../schemas";
import { GoogleSignInButton, OrDivider } from "./google-sign-in";
import { PasswordInput } from "./password-input";
import { PasswordStrengthMeter } from "./password-strength-meter";

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterFormInput, unknown, RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "", terms: false },
  });
  const { errors, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });

  async function onSubmit(values: RegisterFormValues) {
    // Com autoSignIn (padrão do Better Auth), o cadastro já devolve o cookie de sessão.
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      termsVersion: TERMS_VERSION, // o backend grava o aceite e recusa o cadastro sem ele
    });
    if (error) {
      form.setError("root", { message: authErrorMessage("register", error) });
      return;
    }
    toast.success("Conta criada! Bem-vindo ao FinanceControl.");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormAlert message={errors.root?.message} />
        <Field label="Nome" htmlFor="name" error={errors.name?.message}>
          <Input
            {...fieldA11y("name", errors.name?.message)}
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            {...form.register("name")}
          />
        </Field>
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
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            {...form.register("password")}
          />
        </Field>
        <PasswordStrengthMeter value={password} />
        <Field label="Confirmar senha" htmlFor="confirm" error={errors.confirm?.message}>
          <PasswordInput
            {...fieldA11y("confirm", errors.confirm?.message)}
            autoComplete="new-password"
            placeholder="Repita a senha"
            {...form.register("confirm")}
          />
        </Field>
        <div>
          <Controller
            control={form.control}
            name="terms"
            render={({ field }) => (
              <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm text-muted-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  aria-invalid={errors.terms ? true : undefined}
                  aria-describedby={errors.terms ? fieldErrorId("terms") : undefined}
                  className="mt-0.5 size-5 rounded-md"
                />
                {/* Os links abrem em nova aba: o formulário preenchido não se perde. */}
                <span>
                  Li e aceito os{" "}
                  <Link
                    href="/termos"
                    target="_blank"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    termos de uso
                  </Link>{" "}
                  e a{" "}
                  <Link
                    href="/privacidade"
                    target="_blank"
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    política de privacidade
                  </Link>
                  .
                </span>
              </label>
            )}
          />
          {errors.terms ? (
            <p id={fieldErrorId("terms")} role="alert" className="text-xs font-medium text-expense">
              {errors.terms.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
      <OrDivider />
      <GoogleSignInButton label="Cadastrar com Google" />
    </>
  );
}
