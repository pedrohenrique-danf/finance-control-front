import type { Metadata } from "next";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Importar e exportar" };

// RF07: importação/exportação CSV (features/data-exchange). Fluxo [PENDENTE DE DEFINIÇÃO].
export default function ImportExportPage() {
  return (
    <PageSection title="Importar e exportar">
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </PageSection>
  );
}
