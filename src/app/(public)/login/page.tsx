import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";

export const metadata: Metadata = { title: "Entrar" };

// RF01: o formulário (Better Auth client) será implementado em features/auth (Lote 1).
export default function LoginPage() {
  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Suas finanças, com clareza.">
      <p className="text-sm text-muted-foreground">Formulário de login em construção.</p>
    </AuthShell>
  );
}
