"use client";
import { ArrowLeft, Bell, Menu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useShell } from "./shell-context";

const iconButton =
  "tap relative grid place-items-center rounded-full text-primary-dark transition-colors hover:bg-muted active:bg-accent-soft/60";

/** Botão ☰ (abre o menu lateral no mobile). */
export function MenuButton() {
  const { setDrawerOpen } = useShell();
  return (
    <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu" className={iconButton}>
      <Menu className="size-[22px]" aria-hidden />
    </button>
  );
}

/** Seta de voltar (telas de detalhe). Usa link explícito para funcionar sem histórico. */
export function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} aria-label="Voltar" className={iconButton}>
      <ArrowLeft className="size-[22px]" aria-hidden />
    </Link>
  );
}

/** Sino com o número de notificações não lidas. */
export function NotificationBell({ className }: { className?: string }) {
  const { unreadNotifications: unread } = useShell();
  return (
    <Link
      href="/notifications"
      aria-label={unread ? `Notificações, ${unread} não lidas` : "Notificações"}
      className={cn(iconButton, className)}
    >
      <Bell className="size-[22px]" aria-hidden />
      {unread > 0 ? (
        <span className="num absolute top-1.5 right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-expense px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}

/** Botão de ícone do cabeçalho para ações contextuais (ex.: "+ Nova categoria"). */
export function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={iconButton}>
      {children}
    </button>
  );
}
