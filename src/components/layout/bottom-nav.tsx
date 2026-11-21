"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS, isActivePath, type NavItem } from "./nav-items";
import { useShell } from "./shell-context";

function BottomNavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors",
        active && "text-primary",
      )}
    >
      <span
        className={cn(
          "grid h-7 w-12 place-items-center rounded-full transition-all",
          active && "bg-accent-soft/70 text-primary-dark",
        )}
      >
        <item.icon className="size-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
      </span>
      {item.label}
    </Link>
  );
}

/** Barra inferior do mobile com o botão central "Nova transação". */
export function BottomNav() {
  const pathname = usePathname();
  const { openNewTransaction } = useShell();
  const [first, second, third, fourth] = BOTTOM_NAV_ITEMS;

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-2">
        {[first, second].map((item) =>
          item ? (
            <li key={item.href}>
              <BottomNavLink item={item} active={isActivePath(pathname, item.href)} />
            </li>
          ) : null,
        )}
        <li className="flex justify-center">
          <button
            type="button"
            onClick={() => openNewTransaction()}
            aria-label="Nova transação"
            className="-mt-7 grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-fab ring-4 ring-background transition-transform duration-200 hover:bg-primary-dark active:scale-95"
          >
            <Plus className="size-7" strokeWidth={2.5} aria-hidden />
          </button>
        </li>
        {[third, fourth].map((item) =>
          item ? (
            <li key={item.href}>
              <BottomNavLink item={item} active={isActivePath(pathname, item.href)} />
            </li>
          ) : null,
        )}
      </ul>
    </nav>
  );
}
