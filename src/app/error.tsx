"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md space-y-3 p-6">
      <h2 className="text-lg font-semibold">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground">Não foi possível carregar esta página.</p>
      {error.digest ? <p className="text-xs">Código: {error.digest}</p> : null}
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
