import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Categorias" };

// RF02: categorias de receitas e despesas (features/categories).
export default function CategoriesPage() {
  return (
    <PageSection title="Categorias">
      <EmptyState art="folder" title="Em construção" description="Esta tela será migrada nos próximos lotes." />
    </PageSection>
  );
}
