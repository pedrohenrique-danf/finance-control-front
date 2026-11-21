"use client";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import type { ShellUser } from "./mobile-drawer";
import { NavList } from "./nav-list";
import { useShell } from "./shell-context";
import { SignOutButton } from "./sign-out-button";

/** Barra lateral fixa a partir de `lg`. */
export function DesktopSidebar({ user }: { user: ShellUser }) {
  const { openNewTransaction } = useShell();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border bg-card lg:flex">
      <div className="px-6 pt-7 pb-5 text-primary-dark">
        <Logo markClassName="size-9" />
      </div>
      <div className="px-4 pb-3">
        <Button size="lg" className="w-full" onClick={() => openNewTransaction()}>
          <Plus aria-hidden /> Nova transação
        </Button>
      </div>
      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 py-2">
        <NavList />
      </nav>
      <div className="border-t border-border px-3 pt-3 pb-5">
        <div className="flex items-center gap-3 px-3 pb-2">
          <Avatar name={user.name} className="size-10 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
