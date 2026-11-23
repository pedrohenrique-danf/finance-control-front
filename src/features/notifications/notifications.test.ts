import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_TYPE_LABELS,
  notificationPageSchema,
  notificationPreferenceListSchema,
  notificationTypes,
} from "./schemas";

describe("preferências de notificação", () => {
  it("todo tipo do contrato tem rótulo e descrição", () => {
    expect(Object.keys(NOTIFICATION_TYPE_LABELS).sort()).toEqual([...notificationTypes].sort());
  });

  it("aceita a lista do backend e recusa tipo fora do contrato", () => {
    const ok = { data: notificationTypes.map((type) => ({ type, active: type !== "categoria_criada" })) };
    expect(notificationPreferenceListSchema.parse(ok).data).toHaveLength(6);
    expect(() =>
      notificationPreferenceListSchema.parse({ data: [{ type: "lembrete_registro", active: true }] }),
    ).toThrow();
  });

  it("notificação com tipo antigo (sistema) não passa no contrato", () => {
    const page = (type: string) => ({
      data: [
        {
          id: "1",
          type,
          title: "t",
          message: "m",
          status: "enviada",
          createdAt: "2026-11-22T10:00:00.000Z",
          readAt: null,
          transactionId: null,
          recurrenceId: null,
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, unread: 1 },
    });
    expect(notificationPageSchema.safeParse(page("transacao_registrada")).success).toBe(true);
    expect(notificationPageSchema.safeParse(page("sistema")).success).toBe(false);
  });
});
