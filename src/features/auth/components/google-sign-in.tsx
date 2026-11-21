"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { authErrorMessage } from "../auth-errors";
import { safeNextPath } from "../safe-next-path";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z" />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z"
      />
    </svg>
  );
}

/** Separador "ou" entre o formulário e o login social. */
export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted-foreground">
      <span className="h-px flex-1 bg-border" aria-hidden />
      ou
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

/**
 * Login com Google (OAuth pelo Better Auth). O navegador é redirecionado ao Google e volta para `next`.
 * As URLs de retorno são absolutas: o baseURL do Better Auth é o do backend.
 */
export function GoogleSignInButton({ label = "Continuar com Google", next }: { label?: string; next?: string }) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const origin = window.location.origin;
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${origin}${safeNextPath(next)}`,
      errorCallbackURL: `${origin}/login?error=google`,
    });
    // Sucesso: o navegador já está saindo para o Google; só volta a habilitar em caso de erro.
    if (error) {
      setPending(false);
      toast.error(authErrorMessage("google", error));
    }
  }

  return (
    <Button type="button" variant="outline" size="lg" className="w-full" onClick={onClick} disabled={pending}>
      <GoogleIcon />
      {pending ? "Conectando…" : label}
    </Button>
  );
}
