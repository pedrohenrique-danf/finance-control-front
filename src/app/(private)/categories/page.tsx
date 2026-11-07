import type { Metadata } from "next";
import { PageSection } from "@/components/layout/page-section";

export const metadata: Metadata = { title: "Categorias" };

// RF02: CRUD de categorias (features/categories).
export default function CategoriesPage() {
  return (
    <PageSection title="Categorias">
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </PageSection>
  );
}
