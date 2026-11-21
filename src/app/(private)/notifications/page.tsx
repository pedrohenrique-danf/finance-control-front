import type { Metadata } from "next";
import { NotificationsView, notificationsDataSource } from "@/features/notifications";

export const metadata: Metadata = { title: "Notificações" };

/** Últimas 50 notificações (geradas pelas ações do usuário). */
export default async function NotificationsPage() {
  const { data, meta } = await notificationsDataSource.list(1, 50);
  return <NotificationsView notifications={data} unread={meta.unread} />;
}
