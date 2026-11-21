"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

/** Encerra a sessão no Better Auth (cookie httpOnly) e volta ao login. */
export function SignOutButton({ className, onDone }: { className?: string; onDone?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const { error } = await authClient.signOut();
    setPending(false);
    if (error) {
      toast.error("Não foi possível sair. Tente novamente.");
      return;
    }
    onDone?.();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className={cn(
        "flex h-12 w-full items-center gap-3.5 rounded-xl px-3 text-[15px] font-semibold text-expense transition-colors hover:bg-expense-soft disabled:opacity-60",
        className,
      )}
    >
      <LogOut className="size-5" aria-hidden />
      {pending ? "Saindo…" : "Sair"}
    </button>
  );
}
