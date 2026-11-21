"use client";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex min-h-[60dvh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Esta página não carregou</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Tente de novo ou volte ao início.
        </p>
        {error.digest ? <p className="mt-2 text-xs text-muted-foreground">Código: {error.digest}</p> : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset}>Tentar novamente</Button>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
