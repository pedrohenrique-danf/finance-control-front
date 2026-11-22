import { describe, expect, it } from "vitest";
import {
  monthlyFixedTotal,
  type Recurrence,
  recurrenceCreateSchema,
  recurrenceFormSchema,
  recurrenceUpdateSchema,
  toRecurrenceCreateInput,
  toRecurrenceFormValues,
  toRecurrenceUpdateInput,
} from "./schemas";

const CAT = "11111111-1111-4111-8111-111111111111";
const ACC = "22222222-2222-4222-8222-222222222222";
const form = {
  type: "despesa" as const,
  amount: "1200.00",
  description: " Aluguel ",
  categoryId: CAT,
  valueSourceId: ACC,
  dueDay: 5,
  startDate: "2026-11-05",
  noEnd: true,
  endDate: "2027-01-01",
};

describe("formulário de despesa fixa ↔ contrato", () => {
  it("sem término envia endDate null; com término envia a data", () => {
    const values = recurrenceFormSchema.parse(form);
    expect(recurrenceCreateSchema.parse(toRecurrenceCreateInput(values))).toMatchObject({
      description: "Aluguel",
      endDate: null,
      type: "despesa",
    });
    const withEnd = recurrenceFormSchema.parse({ ...form, noEnd: false });
    expect(recurrenceUpdateSchema.parse(toRecurrenceUpdateInput(withEnd, false))).toMatchObject({
      endDate: "2027-01-01",
      active: false,
    });
  });

  it.each([
    [{ dueDay: 0 }, "dueDay"],
    [{ dueDay: 32 }, "dueDay"],
    [{ dueDay: Number.NaN }, "dueDay"],
    [{ noEnd: false, endDate: "" }, "endDate"],
    [{ noEnd: false, endDate: "2026-01-01" }, "endDate"],
    [{ categoryId: "" }, "categoryId"],
  ])("rejeita %j", (patch, path) => {
    const result = recurrenceFormSchema.safeParse({ ...form, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join("."))).toContain(path);
  });

  it("edição: categoria de outro tipo volta vazia; total fixo soma só despesas ativas", () => {
    const r: Recurrence = {
      id: "r",
      type: "despesa",
      description: "Aluguel",
      amount: "1200.00",
      dueDay: 5,
      startDate: "2026-11-05",
      endDate: null,
      active: true,
      categoryId: CAT,
      valueSourceId: ACC,
    };
    const values = toRecurrenceFormValues(
      r,
      [{ id: CAT, name: "Salário", type: "receita", color: "#5E7A3A", icon: null }],
      {
        accountId: ACC,
        today: "2026-11-21",
      },
    );
    expect(values).toMatchObject({ categoryId: "", noEnd: true, endDate: "" });
    expect(
      monthlyFixedTotal([
        r,
        { ...r, id: "b", amount: "99.90" },
        { ...r, id: "c", amount: "50.00", active: false },
        { ...r, id: "d", amount: "4200.00", type: "receita" },
      ]),
    ).toBe("1299.90");
  });
});
