"use client";

import { fieldA11y, fieldErrorId } from "@/components/common/field";
import { digitsToDecimal, formatMoneyPlain } from "@/lib/format/money";
import { cn } from "@/lib/utils";

/** Valor grande "R$ 0,00" dos formulários de lançamento: cada dígito entra pela direita; teclado numérico. */
export function AmountField({
  id,
  value,
  onChange,
  tone,
  error,
}: {
  id: string;
  /** String decimal positiva ("1234.50"). */
  value: string;
  onChange: (value: string) => void;
  tone: "receita" | "despesa";
  error: string | undefined;
}) {
  const income = tone === "receita";
  return (
    <div className={cn("rounded-3xl px-4 py-5 transition-colors", income ? "bg-income-soft" : "bg-expense-soft")}>
      <div className="flex flex-col items-center">
        <label htmlFor={id} className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Valor
        </label>
        <div className={cn("mt-1 flex items-baseline justify-center gap-1.5", income ? "text-income" : "text-expense")}>
          <span className="text-xl font-bold" aria-hidden>
            R$
          </span>
          <input
            {...fieldA11y(id, error)}
            inputMode="numeric"
            autoComplete="off"
            value={formatMoneyPlain(value || "0")}
            onChange={(e) => onChange(digitsToDecimal(e.target.value))}
            onFocus={(e) => {
              const input = e.currentTarget;
              requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
            }}
            className="num field-sizing-content max-w-full min-w-[4ch] bg-transparent text-center text-[42px] leading-none font-extrabold caret-current outline-none"
          />
        </div>
      </div>
      {error ? (
        <p id={fieldErrorId(id)} role="alert" className="mt-2 text-center text-xs font-medium text-expense">
          {error}
        </p>
      ) : null}
    </div>
  );
}
