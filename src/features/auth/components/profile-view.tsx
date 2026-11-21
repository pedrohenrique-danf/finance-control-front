"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Avatar } from "@/components/common/avatar";
import { Field, fieldA11y } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { SectionHeader } from "@/components/common/section-header";
import { PageSection } from "@/components/layout/page-section";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { authErrorMessage } from "../auth-errors";
import {
  type ChangePasswordFormValues,
  changePasswordFormSchema,
  type ProfileFormValues,
  profileFormSchema,
} from "../schemas";
import { PasswordInput } from "./password-input";
import { PasswordStrengthMeter } from "./password-strength-meter";

const card = "space-y-4 rounded-3xl border border-border bg-card p-4 shadow-soft lg:p-5";

function NameForm({ name }: { name: string }) {
  const router = useRouter();
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues: { name } });
  const { errors, isSubmitting, isDirty } = form.formState;

  async function onSubmit(values: ProfileFormValues) {
    const { error } = await authClient.updateUser({ name: values.name });
    if (error) {
      form.setError("root", { message: authErrorMessage("profile", error) });
      return;
    }
    form.reset(values);
    toast.success("Nome atualizado.");
    router.refresh(); // menu e saudação usam a sessão do servidor
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className={card}>
      <SectionHeader title="Dados pessoais" />
      <FormAlert message={errors.root?.message} />
      <Field label="Nome" htmlFor="profile-name" error={errors.name?.message}>
        <Input
          {...fieldA11y("profile-name", errors.name?.message)}
          autoComplete="name"
          maxLength={100}
          {...form.register("name")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Salvando…" : "Salvar nome"}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: "", password: "", confirm: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });

  async function onSubmit(values: ChangePasswordFormValues) {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.password,
      revokeOtherSessions: true, // encerra a sessão nos outros dispositivos
    });
    if (error) {
      const message = authErrorMessage("change-password", error);
      if (message === "A senha atual não confere.")
        form.setError("currentPassword", { message }, { shouldFocus: true });
      else form.setError("root", { message });
      return;
    }
    form.reset();
    toast.success("Senha alterada.", { description: "As sessões nos outros dispositivos foram encerradas." });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className={card}>
      <SectionHeader title="Trocar senha" />
      <FormAlert message={errors.root?.message} />
      <Field label="Senha atual" htmlFor="current-password" error={errors.currentPassword?.message}>
        <PasswordInput
          {...fieldA11y("current-password", errors.currentPassword?.message)}
          autoComplete="current-password"
          {...form.register("currentPassword")}
        />
      </Field>
      <Field label="Nova senha" htmlFor="new-password" error={errors.password?.message}>
        <PasswordInput
          {...fieldA11y("new-password", errors.password?.message)}
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          {...form.register("password")}
        />
      </Field>
      <PasswordStrengthMeter value={password} />
      <Field label="Confirmar nova senha" htmlFor="confirm-password" error={errors.confirm?.message}>
        <PasswordInput
          {...fieldA11y("confirm-password", errors.confirm?.message)}
          autoComplete="new-password"
          {...form.register("confirm")}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Alterar senha"}
      </Button>
    </form>
  );
}

/** Perfil e configurações: nome e senha pelo Better Auth (sem dados do domínio). */
export function ProfileView({ user }: { user: { name: string; email: string } }) {
  return (
    <PageSection title="Perfil e configurações" description="Seus dados de acesso ao FinanceControl.">
      <div className="flex items-center gap-4 rounded-3xl bg-balance p-5 text-primary-foreground shadow-card">
        <Avatar name={user.name} className="size-14 text-lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{user.name}</p>
          <p className="truncate text-sm opacity-85">{user.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <NameForm name={user.name} />
        <PasswordForm />
      </div>
      <div className={card}>
        <SectionHeader title="Sessão" />
        <p className="text-sm text-muted-foreground">
          O e-mail <span className="font-semibold text-foreground break-all">{user.email}</span> é usado para entrar e
          não pode ser alterado por aqui.
        </p>
        <SignOutButton className="w-full justify-center sm:w-auto" />
      </div>
    </PageSection>
  );
}
