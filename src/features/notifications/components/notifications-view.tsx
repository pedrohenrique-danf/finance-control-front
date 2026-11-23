"use client";

import {
  ArrowLeftRight,
  CheckCheck,
  Download,
  type LucideIcon,
  Repeat,
  Settings2,
  Tag,
  Upload,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { PageSection } from "@/components/layout/page-section";
import { useShell } from "@/components/layout/shell-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate, todayIso, toIsoDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { markAllNotificationsReadAction, markNotificationReadAction } from "../actions";
import type { Notification, NotificationType } from "../schemas";

const ICONS: Record<NotificationType, { icon: LucideIcon; bubble: string }> = {
  transacao_registrada: { icon: ArrowLeftRight, bubble: "bg-muted text-primary" },
  recorrencia_criada: { icon: Repeat, bubble: "bg-alert-soft text-alert-strong" },
  categoria_criada: { icon: Tag, bubble: "bg-muted text-primary" },
  conta_criada: { icon: WalletCards, bubble: "bg-muted text-primary" },
  importacao_concluida: { icon: Upload, bubble: "bg-income-soft text-income" },
  exportacao_pronta: { icon: Download, bubble: "bg-accent-soft text-foreground" },
};

const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function dayLabel(iso: string, today: string): string {
  const day = toIsoDate(new Date(iso));
  if (day === today) return "Hoje";
  const yesterday = toIsoDate(new Date(new Date(`${today}T12:00:00`).getTime() - 86_400_000));
  return day === yesterday ? "Ontem" : formatDate(day);
}

function groupByDay(items: Notification[], today: string) {
  const groups: Array<{ label: string; items: Notification[] }> = [];
  for (const n of items) {
    const label = dayLabel(n.createdAt, today);
    const last = groups.at(-1);
    if (last && last.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  }
  return groups;
}

export function NotificationsView({ notifications, unread }: { notifications: Notification[]; unread: number }) {
  const router = useRouter();
  const { openEditTransaction } = useShell();
  const [, startTransition] = useTransition();
  const [items, markOptimistic] = useOptimistic(notifications, (current, id: string | "all") =>
    current.map((n) => (id === "all" || n.id === id ? { ...n, status: "lida" as const } : n)),
  );
  const unreadNow = items.filter((n) => n.status !== "lida").length;

  function open(n: Notification) {
    startTransition(async () => {
      if (n.status !== "lida") {
        markOptimistic(n.id);
        const result = await markNotificationReadAction(n.id);
        if (!result.ok) toast.error(result.error.message);
      }
    });
    if (n.transactionId) openEditTransaction(n.transactionId);
    else if (n.recurrenceId) router.push(`/recurrences/${n.recurrenceId}`);
    else if (n.type === "importacao_concluida" || n.type === "exportacao_pronta") router.push("/import-export");
  }

  function markAll() {
    startTransition(async () => {
      markOptimistic("all");
      const result = await markAllNotificationsReadAction();
      if (!result.ok) toast.error(result.error.message);
      else toast.success("Todas as notificações foram marcadas como lidas.");
    });
  }

  return (
    <PageSection
      title="Notificações"
      description="Avisos gerados pelas suas ações: lançamentos, cadastros, importações e exportações."
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {unreadNow === 0
            ? "Nenhuma notificação nova."
            : `${unreadNow} ${unreadNow === 1 ? "notificação não lida" : "notificações não lidas"}`}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {unread > 0 && unreadNow > 0 ? (
            <Button variant="ghost" className="text-primary" onClick={markAll}>
              <CheckCheck aria-hidden /> Marcar todas como lidas
            </Button>
          ) : null}
          <Link href="/profile#avisos" className={buttonVariants({ variant: "ghost", className: "text-primary" })}>
            <Settings2 aria-hidden /> Escolher avisos
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          art="bell"
          title="Nenhuma notificação"
          description="Quando você lançar uma transação, criar uma categoria ou importar um extrato, o aviso aparece aqui."
        />
      ) : (
        <div className="space-y-5">
          {groupByDay(items, todayIso()).map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="mb-1.5 px-1 text-[13px] font-bold text-primary-dark">{group.label}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                {group.items.map((n) => {
                  const meta = ICONS[n.type];
                  const unreadItem = n.status !== "lida";
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => open(n)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40",
                          unreadItem && "bg-accent-soft/25",
                        )}
                      >
                        <span
                          className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-full", meta.bubble)}
                        >
                          <meta.icon className="size-[18px]" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={cn("truncate text-sm", unreadItem ? "font-bold" : "font-semibold")}>
                              {n.title}
                            </span>
                            <span className="num shrink-0 text-[11px] text-muted-foreground">
                              {time.format(new Date(n.createdAt))}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[13px] break-words text-muted-foreground">
                            {n.message}
                          </span>
                        </span>
                        {unreadItem ? (
                          <>
                            <span className="mt-2 size-2.5 shrink-0 rounded-full bg-expense" aria-hidden />
                            <span className="sr-only">Não lida</span>
                          </>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageSection>
  );
}
