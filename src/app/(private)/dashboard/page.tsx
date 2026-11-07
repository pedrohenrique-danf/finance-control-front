import type { Metadata } from "next";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Resumo" };

// RF05: cards de Receitas, Despesas fixas, Despesas variáveis e Saldo (features/dashboard).
export default function DashboardPage() {
  return (
    <PageSection title="Resumo do mês">
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </PageSection>
  );
}
