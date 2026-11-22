"use client";

import { Input } from "@/components/ui/input";
import { digitsToDecimal, formatMoneyPlain } from "@/lib/format/money";
import { cn } from "@/lib/utils";

type MoneyInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "inputMode"> & {
  /** String decimal positiva do contrato ("1234.50"). */
  value: string;
  onChange: (value: string) => void;
};

/**
 * Campo de valor em reais com máscara de centavos: cada dígito entra pela direita
 * (1 → 0,01; 12 → 0,12; 1234 → 12,34). Teclado numérico no celular.
 */
export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" aria-hidden>
        R$
      </span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={cn("num pl-11", className)}
        value={formatMoneyPlain(value || "0")}
        onChange={(event) => onChange(digitsToDecimal(event.target.value))}
      />
    </div>
  );
}
