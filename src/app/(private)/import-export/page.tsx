import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Importar / Exportar" };

// RF07: importação e exportação (features/data-exchange). Fluxo [PENDENTE DE DEFINIÇÃO].
export default function ImportExportPage() {
  return (
    <PageSection title="Importar / Exportar">
      <EmptyState art="folder" title="Em construção" description="Esta tela será migrada nos próximos lotes." />
    </PageSection>
  );
}
