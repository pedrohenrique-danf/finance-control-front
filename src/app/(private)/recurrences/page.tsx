import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Despesas fixas" };

// RF04: despesas fixas e projeção (features/recurrences).
export default function RecurrencesPage() {
  return (
    <PageSection title="Despesas fixas">
      <EmptyState art="list" title="Em construção" description="Esta tela será migrada nos próximos lotes." />
    </PageSection>
  );
}
