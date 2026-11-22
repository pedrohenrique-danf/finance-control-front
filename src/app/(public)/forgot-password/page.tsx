import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell back title="Esqueceu a senha?" subtitle="Sem problema, a gente te ajuda.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
