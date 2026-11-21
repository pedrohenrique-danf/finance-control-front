import { cn } from "@/lib/utils";

/** Folha + barras crescentes. Herda `currentColor`. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("size-10", className)} aria-hidden>
      <path d="M8 40C8 22 20 9 40 8c0 20-13 32-32 32Z" fill="currentColor" opacity="0.22" />
      <path d="M8 40C8 22 20 9 40 8c0 20-13 32-32 32Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M17 33v-5M24 33v-10M31 33V17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="text-xl font-extrabold tracking-tight">
        Finance<span className="font-medium opacity-80">Control</span>
      </span>
    </div>
  );
}
