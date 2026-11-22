"use client";
import { XIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Rodapé fixo (botões de ação). */
  footer?: React.ReactNode;
  /** Conteúdo extra no cabeçalho, ao lado do título (ex.: botão excluir). */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

const DESKTOP_QUERY = "(min-width: 64rem)"; // breakpoint `lg`

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** true a partir de `lg` (no servidor, assume mobile). */
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

/**
 * Painel de formulário responsivo: sobe de baixo no mobile (bottom sheet)
 * e abre como painel lateral direito a partir de `lg`.
 */
export function FormSheet({ open, onOpenChange, title, description, footer, headerAction, children }: FormSheetProps) {
  const desktop = useIsDesktop();
  return (
    <Sheet open={open} onOpenChange={(next) => onOpenChange(next)}>
      <SheetContent
        side={desktop ? "right" : "bottom"}
        showCloseButton={false}
        className={cn(
          "gap-0 border-0 bg-background p-0 shadow-card",
          desktop
            ? "data-[side=right]:w-[440px] data-[side=right]:max-w-[calc(100vw-2rem)] data-[side=right]:rounded-l-3xl data-[side=right]:sm:max-w-[440px]"
            : "max-h-[92dvh] rounded-t-3xl",
        )}
      >
        {desktop ? null : (
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-accent-soft" aria-hidden />
        )}
        <div className="flex shrink-0 items-center gap-2 px-5 pt-3 pb-2 lg:pt-6">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg font-bold text-primary-dark">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="text-sm text-muted-foreground">{description}</SheetDescription>
            ) : (
              <SheetDescription className="sr-only">{title}</SheetDescription>
            )}
          </div>
          {headerAction}
          <SheetClose
            render={<Button variant="ghost" size="icon" className="-mr-2 rounded-full text-muted-foreground" />}
            aria-label="Fechar"
          >
            <XIcon className="size-5" />
          </SheetClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-border bg-card px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
