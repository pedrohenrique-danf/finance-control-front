import type { Metadata } from "next";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Criar conta" };

// RF01: o formulário de cadastro (Better Auth client) será implementado em features/auth.
export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <PageSection title="Criar conta">
        <p className="text-sm text-muted-foreground">Formulário de cadastro em construção.</p>
      </PageSection>
    </main>
  );
}
