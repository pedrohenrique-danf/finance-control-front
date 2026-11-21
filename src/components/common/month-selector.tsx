"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { formatMonthLabel, shiftMonth } from "@/lib/format/date";
import { cn } from "@/lib/utils";

/** ‹ Novembro 2026 › — altera `?month=YYYY-MM` na URL (e volta para a página 1). */
export function MonthSelector({
  month,
  size = "lg",
  className,
}: {
  month: string;
  size?: "lg" | "sm";
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(target: string) {
    const params = new URLSearchParams(searchParams);
    params.set("month", target);
    params.delete("page");
    return `${pathname}?${params}`;
  }

  const btn =
    "tap grid place-items-center rounded-full text-primary-dark transition-colors hover:bg-muted active:bg-accent-soft/60";
  return (
    <nav aria-label="Selecionar mês" className={cn("flex items-center justify-between gap-2", className)}>
      <Link href={hrefFor(shiftMonth(month, -1))} className={btn} aria-label="Mês anterior" scroll={false}>
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <p aria-live="polite" className={cn("font-bold text-primary-dark", size === "lg" ? "text-lg" : "text-[15px]")}>
        {formatMonthLabel(month)}
      </p>
      <Link href={hrefFor(shiftMonth(month, 1))} className={btn} aria-label="Próximo mês" scroll={false}>
        <ChevronRight className="size-5" aria-hidden />
      </Link>
    </nav>
  );
}
