import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Perfil e configurações" };

// Dados da conta e preferências (features/profile).
export default function ProfilePage() {
  return (
    <PageSection title="Perfil e configurações">
      <EmptyState art="wallet" title="Em construção" description="Esta tela será migrada nos próximos lotes." />
    </PageSection>
  );
}
