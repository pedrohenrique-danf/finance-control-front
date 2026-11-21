import { z } from "zod";

// SYNC: finance-control-back docs/07 ("Notificações") e src/shared/enums.ts (notificationTypes/Statuses).
export const notificationTypes = [
  "lembrete_registro",
  "vencimento_despesa",
  "importacao_concluida",
  "exportacao_pronta",
  "sistema",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(notificationTypes),
  title: z.string(),
  message: z.string(),
  status: z.enum(["pendente", "enviada", "lida", "falha"]),
  createdAt: z.string(),
  readAt: z.string().nullable(),
  transactionId: z.string().nullable(),
  recurrenceId: z.string().nullable(),
});
export type Notification = z.output<typeof notificationSchema>;

export const notificationPageSchema = z.object({
  data: z.array(notificationSchema),
  meta: z.object({ page: z.number(), pageSize: z.number(), total: z.number(), unread: z.number() }),
});
export type NotificationPage = z.output<typeof notificationPageSchema>;
