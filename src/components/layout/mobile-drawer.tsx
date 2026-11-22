"use client";
import { Avatar } from "@/components/common/avatar";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { NavList } from "./nav-list";
import { useShell } from "./shell-context";
import { SignOutButton } from "./sign-out-button";

export interface ShellUser {
  name: string;
  email: string;
}

/** Menu lateral do mobile (abre pelo botão ☰ do cabeçalho). */
export function MobileDrawer({ user }: { user: ShellUser }) {
  const { drawerOpen, setDrawerOpen } = useShell();
  const close = () => setDrawerOpen(false);

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => setDrawerOpen(open)}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[84%] max-w-[330px] gap-0 border-0 bg-card p-0 shadow-card lg:hidden"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navegação principal</SheetDescription>
        <div className="bg-primary-dark px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-6 text-primary-foreground">
          <Avatar name={user.name} className="size-14 text-lg ring-2 ring-primary-foreground/25" />
          <p className="mt-3 text-base font-bold">{user.name}</p>
          <p className="truncate text-sm opacity-80">{user.email}</p>
        </div>
        <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 py-3">
          <NavList onNavigate={close} />
        </nav>
        <div className="border-t border-border px-3 pt-2 pb-6">
          <SignOutButton onDone={close} />
          <p className="px-3 pt-1 text-xs text-muted-foreground">FinanceControl · versão 0.1.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
