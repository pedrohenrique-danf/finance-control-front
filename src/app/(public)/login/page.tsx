import type { Metadata } from "next";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Entrar" };

// RF01: o formulário (Better Auth client) será implementado em features/auth.
export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <PageSection title="Entrar" description="Acesse sua conta do FinanceControl.">
        <p className="text-sm text-muted-foreground">Formulário de login em construção.</p>
      </PageSection>
    </main>
  );
}
