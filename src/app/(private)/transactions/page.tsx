import type { Metadata } from "next";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Transações" };

// RF03 + RF06: lançamento e listagem mensal (features/transactions).
export default function TransactionsPage() {
  return (
    <PageSection title="Transações">
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </PageSection>
  );
}
