import { BottomNav } from "./bottom-nav";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileDrawer, type ShellUser } from "./mobile-drawer";
import { ShellProvider } from "./shell-context";

interface AppShellProps {
  user: ShellUser;
  children: React.ReactNode;
  /** Painéis globais compostos pelo `app/` (ex.: formulário de transação aberto pelo botão "+"). */
  overlays?: React.ReactNode;
  unreadNotifications?: number;
  initialHideValues?: boolean;
}

/**
 * Casca da área logada (mobile-first):
 * - mobile: cabeçalho da página + menu lateral + barra inferior com botão "+";
 * - `lg`+: barra lateral fixa com o menu completo.
 */
export function AppShell({ user, children, overlays, unreadNotifications, initialHideValues }: AppShellProps) {
  return (
    <ShellProvider
      {...(unreadNotifications !== undefined ? { unreadNotifications } : {})}
      {...(initialHideValues !== undefined ? { initialHideValues } : {})}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <DesktopSidebar user={user} />
      <MobileDrawer user={user} />
      <div className="min-h-dvh lg:pl-72">
        <main id="conteudo" className="mx-auto w-full max-w-5xl px-5 pb-32 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
      {overlays}
    </ShellProvider>
  );
}
