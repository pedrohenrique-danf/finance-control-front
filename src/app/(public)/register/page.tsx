import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";

export const metadata: Metadata = { title: "Criar conta" };

// RF01: o formulário de cadastro (Better Auth client) será implementado em features/auth (Lote 1).
export default function RegisterPage() {
  return (
    <AuthShell back title="Crie sua conta" subtitle="Leva menos de um minuto.">
      <p className="text-sm text-muted-foreground">Formulário de cadastro em construção.</p>
    </AuthShell>
  );
}
