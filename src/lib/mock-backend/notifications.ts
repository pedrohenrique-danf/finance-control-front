import "server-only";
import { formatDate } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";
import { notFound, userData } from "./store";
import type { NotificationRecord, NotificationType, TransactionRecord, UserData } from "./types";

// Simula: GET /api/v1/notifications, PUT /api/v1/notifications/:id e PUT /api/v1/notifications
// (backend docs/07, "Notificações"). No backend real a geração fica nos serviços de cada módulo.

export interface NotificationPage {
  data: NotificationRecord[];
  meta: { page: number; pageSize: number; total: number; unread: number };
}

/** Registra uma notificação no canal app (já "enviada"). */
export function notify(
  data: UserData,
  input: {
    type: NotificationType;
    title: string;
    message: string;
    transactionId?: string | null;
    recurrenceId?: string | null;
  },
): void {
  data.notifications.push({
    id: crypto.randomUUID(),
    type: input.type,
    title: input.title,
    message: input.message,
    status: "enviada",
    createdAt: new Date().toISOString(),
    readAt: null,
    transactionId: input.transactionId ?? null,
    recurrenceId: input.recurrenceId ?? null,
  });
}

/** Texto padrão de uma transação lançada ("Mercado · R$ 89,90 em 21/11/2026"). */
export function notifyTransaction(data: UserData, t: TransactionRecord): void {
  notify(data, {
    type: "sistema",
    title: t.type === "receita" ? "Receita registrada" : "Despesa registrada",
    message: `${t.description} · ${formatMoney(t.amount)} em ${formatDate(t.date)}`,
    transactionId: t.id,
  });
}

export const mockNotifications = {
  list(userId: string, page: number, pageSize: number): NotificationPage {
    const all = [...userData(userId).notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * pageSize;
    return {
      data: all.slice(start, start + pageSize),
      meta: { page, pageSize, total: all.length, unread: all.filter((n) => n.status !== "lida").length },
    };
  },

  unreadCount(userId: string): number {
    return userData(userId).notifications.filter((n) => n.status !== "lida").length;
  },

  markRead(userId: string, id: string): NotificationRecord {
    const found = userData(userId).notifications.find((n) => n.id === id);
    if (!found) throw notFound("Notificação");
    if (found.status !== "lida") {
      found.status = "lida";
      found.readAt = new Date().toISOString();
    }
    return found;
  },

  markAllRead(userId: string): void {
    const now = new Date().toISOString();
    for (const n of userData(userId).notifications) {
      if (n.status === "lida") continue;
      n.status = "lida";
      n.readAt = now;
    }
  },
};
