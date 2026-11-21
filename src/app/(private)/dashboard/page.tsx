import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Início" };

// RF05: saldo do mês, cards, gráficos e próximos vencimentos (features/dashboard).
export default function DashboardPage() {
  return (
    <PageSection title="Início">
      <EmptyState art="chart" title="Em construção" description="Esta tela será migrada nos próximos lotes." />
    </PageSection>
  );
}
