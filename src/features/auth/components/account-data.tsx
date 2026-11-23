"use client";

import { Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/common/field";
import { FormAlert } from "@/components/common/form-alert";
import { SectionHeader } from "@/components/common/section-header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { authErrorMessage } from "../auth-errors";
import { PasswordInput } from "./password-input";

const card = "space-y-4 rounded-3xl border border-border bg-card p-4 shadow-soft lg:p-5";

/** Confirmação da exclusão: senha (contas com senha) + ciência de que tudo será apagado. */
function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  // Ao abrir: contas de e-mail confirmam com a senha; contas só do Google, pela sessão recente.
  useEffect(() => {
    if (!open) return;
    let active = true;
    void authClient.listAccounts().then(({ data }) => {
      if (active) setHasPassword(data ? data.some((account) => account.providerId === "credential") : true);
    });
    return () => {
      active = false;
    };
  }, [open]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setPassword("");
      setUnderstood(false);
      setError(undefined);
    }
  }

  async function onConfirm() {
    if (!understood) return setError("Confirme que entendeu que os dados serão apagados.");
    if (hasPassword && !password) return setError("Informe sua senha.");
    setPending(true);
    const { error: apiError } = await authClient.deleteUser(hasPassword ? { password } : {});
    setPending(false);
    if (apiError) return setError(authErrorMessage("delete-account", apiError));
    toast.success("Sua conta e seus dados foram excluídos.");
    router.replace("/login");
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-sm rounded-3xl bg-card p-6 shadow-card ring-0 data-[size=default]:max-w-sm">
        <AlertDialogTitle className="text-lg font-bold text-primary-dark">Excluir conta</AlertDialogTitle>
        <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
          Isso apaga de vez sua conta e todos os seus lançamentos, categorias, contas e despesas fixas. Se quiser
          guardar uma cópia, baixe seus dados antes.
        </AlertDialogDescription>
        <div className="space-y-4">
          <FormAlert message={error} />
          {hasPassword ? (
            <Field label="Sua senha" htmlFor="delete-password">
              <PasswordInput
                id="delete-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          ) : null}
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-muted-foreground">
            <Checkbox
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked === true)}
              className="mt-0.5 size-5 rounded-md"
            />
            <span>Entendo que meus dados serão apagados e que isso não pode ser desfeito.</span>
          </label>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <AlertDialogCancel variant="outline" size="default" disabled={pending}>
            Cancelar
          </AlertDialogCancel>
          <Button variant="expense" disabled={pending || hasPassword === null} onClick={() => void onConfirm()}>
            {pending ? "Excluindo…" : "Excluir conta"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Perfil → "Seus dados": portabilidade (baixar tudo) e eliminação (excluir conta), LGPD art. 18. */
export function AccountData() {
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="Seus dados" className={card}>
      <SectionHeader title="Seus dados" />
      <p className="-mt-1 text-sm text-muted-foreground">
        Baixe uma cópia de tudo o que você cadastrou ou exclua sua conta. Veja a{" "}
        <Link href="/privacidade" className="font-semibold text-primary underline-offset-4 hover:underline">
          Política de privacidade
        </Link>
        .
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Download direto pela API (mesma origem, cookie da sessão): arquivo JSON. */}
        <a
          href="/api/v1/exports/me"
          download
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
        >
          <Download className="size-4" aria-hidden />
          Baixar meus dados
        </a>
        <Button variant="ghost" size="lg" className="w-full text-expense sm:w-auto" onClick={() => setOpen(true)}>
          <Trash2 className="size-4" aria-hidden />
          Excluir conta
        </Button>
      </div>
      <DeleteAccountDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}
