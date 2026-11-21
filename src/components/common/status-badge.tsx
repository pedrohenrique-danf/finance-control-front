import { cn } from "@/lib/utils";

const TONES = {
  success: "bg-income-soft text-income",
  warning: "bg-alert-soft text-alert-strong",
  danger: "bg-expense-soft text-expense",
  neutral: "bg-muted text-primary",
  accent: "bg-accent-soft text-foreground",
  muted: "bg-muted text-muted-foreground",
} as const;

export type BadgeTone = keyof typeof TONES;

/** Pílula de status. O texto sempre acompanha a cor (informação nunca só por cor). */
export function StatusBadge({ tone, label, className }: { tone: BadgeTone; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-bold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
