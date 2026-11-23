import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { PRIVACY_CONTACT_EMAIL, TERMS_UPDATED_AT } from "../legal-info";

/** Página pública de texto longo (termos e privacidade): coluna de leitura confortável, links entre as duas. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="FinanceControl, página inicial">
            <Logo markClassName="size-8" />
          </Link>
          <nav aria-label="Documentos" className="flex gap-4 text-sm font-semibold">
            <Link href="/termos" className="text-primary underline-offset-4 hover:underline">
              Termos
            </Link>
            <Link href="/privacidade" className="text-primary underline-offset-4 hover:underline">
              Privacidade
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <h1 className="text-2xl leading-tight font-extrabold text-primary-dark lg:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Versão de {TERMS_UPDATED_AT}.</p>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-primary-dark [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
          {children}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Ir para o login
          </Link>
        </p>
      </main>
    </div>
  );
}

/** Como falar com o responsável pelos dados (o e-mail ainda pode estar em definição). */
export function ContactInfo() {
  return PRIVACY_CONTACT_EMAIL ? (
    <>
      pelo e-mail{" "}
      <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="font-semibold text-primary break-all">
        {PRIVACY_CONTACT_EMAIL}
      </a>
    </>
  ) : (
    <>pelo e-mail de contato do projeto, que será publicado nesta página (enquanto isso, use as opções do Perfil)</>
  );
}
