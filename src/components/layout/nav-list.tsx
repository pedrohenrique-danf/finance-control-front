"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActivePath, NAV_ITEMS } from "./nav-items";
import { useShell } from "./shell-context";

/** Lista do menu principal (compartilhada pela barra lateral do desktop e pelo menu do mobile). */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { unreadNotifications } = useShell();

  return (
    <ul className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        const showBadge = item.href === "/notifications" && unreadNotifications > 0;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center gap-3.5 rounded-xl px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted",
                active && "bg-accent-soft font-bold hover:bg-accent-soft",
              )}
            >
              <item.icon className="size-5 text-secondary-foreground/70" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {showBadge ? (
                <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-expense px-1.5 text-[11px] font-bold text-primary-foreground">
                  {unreadNotifications}
                  <span className="sr-only"> não lidas</span>
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
