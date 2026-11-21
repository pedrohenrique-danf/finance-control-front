import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Contas e cartões" };

// Fontes de valor (contas, carteira, cartões) — features/accounts.
export default function AccountsPage() {
  return (
    <PageSection title="Contas e cartões">
      <EmptyState art="wallet" title="Em construção" description="Esta tela será migrada nos próximos lotes." />
    </PageSection>
  );
}
