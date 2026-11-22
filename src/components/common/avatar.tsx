import { cn } from "@/lib/utils";

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Avatar com iniciais (a foto do Google, quando houver, é tratada no perfil). */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft font-bold text-foreground",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
