import { cn } from "@/lib/utils";
import { BackLink, MenuButton, NotificationBell } from "./header-controls";

interface PageSectionProps {
  title: string;
  description?: string;
  /** Ação contextual à direita do título (substitui o sino de notificações no mobile). */
  action?: React.ReactNode;
  /** Tela de detalhe: mostra "voltar" para esta rota no lugar do menu (mobile). */
  backHref?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Cabeçalho + conteúdo de uma página da área logada. Um único `h1` por página.
 * Mobile: [☰ ou ←] título centralizado [ação ou 🔔]. Desktop: título à esquerda, ações e sino à direita.
 */
export function PageSection({ title, description, action, backHref, className, children }: PageSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <header className="sticky top-0 z-20 -mx-5 bg-background/90 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pt-8 lg:pb-2 lg:backdrop-blur-none">
        <div className="flex items-center gap-1 lg:gap-3">
          <div className={cn("flex", !backHref && "lg:hidden")}>
            {backHref ? <BackLink href={backHref} /> : <MenuButton />}
          </div>
          <div className="min-w-0 flex-1 text-center lg:text-left">
            <h1 className="truncate text-base font-bold text-primary-dark lg:text-2xl lg:font-extrabold">{title}</h1>
            {description ? <p className="hidden text-sm text-muted-foreground lg:block">{description}</p> : null}
          </div>
          <div className="flex min-w-11 items-center justify-end gap-1">
            {action}
            <NotificationBell className={cn(action ? "hidden lg:grid" : undefined)} />
          </div>
        </div>
      </header>
      {children}
    </section>
  );
}
