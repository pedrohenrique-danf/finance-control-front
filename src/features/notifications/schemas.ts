import { z } from "zod";

// SYNC: finance-control-back docs/07 ("Notificações") e src/shared/enums.ts (notificationTypes/Statuses).
/** Um tipo por ação do usuário no app (não há lembretes, e-mail ou push). */
export const notificationTypes = [
  "transacao_registrada",
  "recorrencia_criada",
  "categoria_criada",
  "conta_criada",
  "importacao_concluida",
  "exportacao_pronta",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

/** Rótulos da tela de preferências, na ordem do contrato. */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { label: string; description: string }> = {
  transacao_registrada: { label: "Lançamentos", description: "Ao registrar uma receita ou despesa." },
  recorrencia_criada: {
    label: "Despesas e receitas fixas",
    description: "Ao criar uma fixa ou usar “repetir todo mês”.",
  },
  categoria_criada: { label: "Categorias", description: "Ao criar uma categoria." },
  conta_criada: { label: "Contas e cartões", description: "Ao cadastrar uma conta ou cartão." },
  importacao_concluida: { label: "Importações", description: "Ao concluir a importação de um extrato." },
  exportacao_pronta: { label: "Exportações", description: "Ao gerar o CSV do mês." },
};

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

export const notificationPreferenceSchema = z.object({ type: z.enum(notificationTypes), active: z.boolean() });
export type NotificationPreference = z.output<typeof notificationPreferenceSchema>;
export const notificationPreferenceListSchema = z.object({ data: z.array(notificationPreferenceSchema) });
