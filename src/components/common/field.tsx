import { cn } from "@/lib/utils";

/** Id da mensagem de erro de um campo (para `aria-describedby`). */
export function fieldErrorId(id: string): string {
  return `${id}-error`;
}

/** Props de acessibilidade de um controle com possível erro. */
export function fieldA11y(id: string, error: string | undefined) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? fieldErrorId(id) : undefined,
  } as const;
}

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string | undefined;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Rótulo + controle + erro/ajuda. O controle recebe `fieldA11y(id, error)`. */
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? fieldErrorId(htmlFor) : undefined} role="alert" className="text-xs font-medium text-expense">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Classe do item ativo (ex.: despesa em terracota, receita em verde). */
  activeClassName?: string;
}

/** Controle segmentado (ex.: Despesa | Receita). Semântica de radiogroup. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-muted p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: controle segmentado com visual de botão (padrão WAI-ARIA radiogroup)
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10 rounded-xl text-sm font-semibold transition-all duration-200",
              active
                ? (option.activeClassName ?? "bg-card text-foreground shadow-soft")
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Chip de filtro (pílula). */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors duration-150",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
