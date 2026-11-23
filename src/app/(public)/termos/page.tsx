import type { Metadata } from "next";
import { LegalPage, TermsContent } from "@/features/legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso">
      <TermsContent />
    </LegalPage>
  );
}
