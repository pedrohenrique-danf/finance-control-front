import "server-only";
import { requireSession } from "@/lib/auth/session";
import { mockNotifications } from "@/lib/mock-backend";
import { type NotificationPage, notificationPageSchema } from "./schemas";

export interface NotificationsDataSource {
  list(page: number, pageSize: number): Promise<NotificationPage>;
  unreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

// TODO(back): as rotas de notificações ainda não existem no finance-control-back. Ao implementá-las, troque por
// getApi() (contrato: backend docs/07):
//   list        → api.get("/api/v1/notifications", notificationPageSchema, { page, pageSize })
//   unreadCount → (list com pageSize=1).meta.unread
//   markRead    → api.put(`/api/v1/notifications/${id}`, { status: "lida" }, notificationSchema)
//   markAllRead → api.put("/api/v1/notifications", { status: "lida" }, …)
const mockDataSource: NotificationsDataSource = {
  async list(page, pageSize) {
    const { user } = await requireSession();
    return notificationPageSchema.parse(mockNotifications.list(user.id, page, pageSize));
  },

  async unreadCount() {
    const { user } = await requireSession();
    return mockNotifications.unreadCount(user.id);
  },

  async markRead(id) {
    const { user } = await requireSession();
    mockNotifications.markRead(user.id, id);
  },

  async markAllRead() {
    const { user } = await requireSession();
    mockNotifications.markAllRead(user.id);
  },
};

export const notificationsDataSource: NotificationsDataSource = mockDataSource;
