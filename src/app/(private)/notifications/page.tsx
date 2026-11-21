import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Notificações" };

// Avisos e preferências de notificação (features/notifications).
export default function NotificationsPage() {
  return (
    <PageSection title="Notificações">
      <EmptyState art="bell" title="Em construção" description="Esta tela será migrada nos próximos lotes." />
    </PageSection>
  );
}
