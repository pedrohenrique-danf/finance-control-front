import type { Metadata } from "next";
import { LegalPage, PrivacyContent } from "@/features/legal";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade">
      <PrivacyContent />
    </LegalPage>
  );
}
