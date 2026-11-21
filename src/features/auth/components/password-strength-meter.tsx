import { cn } from "@/lib/utils";
import { PASSWORD_STRENGTH_LABELS, type PasswordStrength, passwordStrength } from "../password-strength";

const BAR_CLASS: Record<PasswordStrength, string> = {
  0: "bg-muted",
  1: "bg-expense",
  2: "bg-alert",
  3: "bg-accent-fresh",
  4: "bg-income",
};

/** Medidor de força da senha (4 barras + rótulo anunciado a leitores de tela). */
export function PasswordStrengthMeter({ value }: { value: string }) {
  const strength = passwordStrength(value);
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-colors duration-200",
              i <= strength ? BAR_CLASS[strength] : "bg-muted",
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
        {strength > 0 ? (
          <>
            Força da senha: <span className="font-semibold text-foreground">{PASSWORD_STRENGTH_LABELS[strength]}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
