import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Erro geral de formulário (não ligado a um campo). Anunciado por leitores de tela. */
export function FormAlert({ message, className }: { message: string | undefined; className?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-expense/25 bg-expense-soft px-3.5 py-3 text-sm font-medium text-expense",
        className,
      )}
    >
      <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
