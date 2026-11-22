"use client";
import { useOptionalShell } from "@/components/layout/shell-context";
import { formatMoney, formatMoneySigned, HIDDEN_MONEY } from "@/lib/format/money";
import { cn } from "@/lib/utils";

interface MoneyProps {
  /** String decimal do contrato ("1234.50"). */
  value: string;
  /** Com `signed`, prefixa "+" (receita) ou "−" (despesa). */
  type?: "receita" | "despesa";
  signed?: boolean;
  className?: string;
}

/** Valor monetário que respeita o "ocultar valores" da área logada. */
export function Money({ value, type, signed, className }: MoneyProps) {
  const shell = useOptionalShell();
  const hidden = shell?.hideValues ?? false;
  const text = hidden ? HIDDEN_MONEY : signed && type ? formatMoneySigned(value, type) : formatMoney(value);
  return (
    <span className={cn("num whitespace-nowrap", className)}>
      {hidden ? <span className="sr-only">Valor oculto</span> : null}
      <span aria-hidden={hidden || undefined}>{text}</span>
    </span>
  );
}
