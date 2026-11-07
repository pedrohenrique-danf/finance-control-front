import type { Metadata } from "next";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Recorrências" };

// RF04: despesas fixas projetadas (features/recurrences).
export default function RecurrencesPage() {
  return (
    <PageSection title="Recorrências">
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </PageSection>
  );
}
