import "server-only";
import { z } from "zod";
import { getApi } from "@/lib/api/server";
import { type NotificationPage, notificationPageSchema, notificationSchema } from "./schemas";

export interface NotificationsDataSource {
  list(page: number, pageSize: number): Promise<NotificationPage>;
  unreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

const markAllReadSchema = z.object({ updated: z.number() });

// Contrato: finance-control-back docs/07 ("Notificações").
export const notificationsDataSource: NotificationsDataSource = {
  async list(page, pageSize) {
    const api = await getApi();
    return api.get("/api/v1/notifications", notificationPageSchema, { page, pageSize });
  },

  async unreadCount() {
    const api = await getApi();
    return (await api.get("/api/v1/notifications", notificationPageSchema, { page: 1, pageSize: 1 })).meta.unread;
  },

  async markRead(id) {
    const api = await getApi();
    await api.put(`/api/v1/notifications/${encodeURIComponent(id)}`, { status: "lida" }, notificationSchema);
  },

  async markAllRead() {
    const api = await getApi();
    await api.put("/api/v1/notifications", { status: "lida" }, markAllReadSchema);
  },
};
