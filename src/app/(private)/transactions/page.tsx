import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Extrato mensal" };

// RF03 + RF06: lançamento e extrato mensal (features/transactions).
export default function TransactionsPage() {
  return (
    <PageSection title="Extrato mensal">
      <EmptyState art="list" title="Em construção" description="Esta tela será migrada nos próximos lotes." />
    </PageSection>
  );
}
