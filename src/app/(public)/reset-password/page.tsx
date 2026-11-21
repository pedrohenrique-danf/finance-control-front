import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ResetPasswordForm } from "@/features/auth";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Nova senha", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const params = await searchParams;
  // O Better Auth redireciona com ?error=INVALID_TOKEN quando o link expirou ou já foi usado.
  const token = firstParam(params.error) ? undefined : firstParam(params.token);

  return (
    <AuthShell back title="Crie uma nova senha" subtitle="Escolha algo forte e fácil de lembrar.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
