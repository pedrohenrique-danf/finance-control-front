import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Campo de data nativo (`type="date"`): calendário do sistema no celular, valor "YYYY-MM-DD".
 * Sem biblioteca de calendário (nenhuma dependência nova).
 */
export function DateInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <div className="relative">
      <CalendarDays
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-sage"
        aria-hidden
      />
      <Input
        type="date"
        min="2000-01-01"
        className={cn("num pl-10 [&::-webkit-calendar-picker-indicator]:opacity-60", className)}
        {...props}
      />
    </div>
  );
}
