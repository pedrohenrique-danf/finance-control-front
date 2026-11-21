import { describe, expect, it } from "vitest";
import {
  advancedCount,
  filtersToSearchParams,
  hasAnyFilter,
  MAX_PAGE,
  parsePage,
  parseTransactionFilters,
  quickToQuery,
} from "./filters";
import {
  type Transaction,
  toTransactionFormValues,
  toTransactionInput,
  transactionFormSchema,
  transactionInputSchema,
} from "./schemas";

const NOW = new Date(2026, 10, 21);
const CAT = "11111111-1111-4111-8111-111111111111";
const ACC = "22222222-2222-4222-8222-222222222222";

describe("filtros do extrato na URL", () => {
  it("valores ausentes ou inválidos viram o padrão", () => {
    expect(
      parseTransactionFilters({ filtro: "xpto", status: "pago", de: "21/11/2026", categorias: "abc,<script>" }, NOW),
    ).toEqual({
      month: "2026-11",
      q: "",
      quick: "todas",
      categoryIds: [],
      accountIds: [],
      status: null,
      from: null,
      to: null,
    });
  });

  it("ida e volta preserva os filtros", () => {
    const filters = parseTransactionFilters(
      {
        month: "2026-10",
        q: " mercado ",
        filtro: "despesas",
        categorias: `${CAT}`,
        contas: ACC,
        status: "pendente",
        de: "2026-10-01",
        ate: "2026-10-15",
      },
      NOW,
    );
    expect(filters.q).toBe("mercado");
    const params = Object.fromEntries(filtersToSearchParams(filters, 3));
    expect(params).toEqual({
      month: "2026-10",
      q: "mercado",
      filtro: "despesas",
      categorias: CAT,
      contas: ACC,
      status: "pendente",
      de: "2026-10-01",
      ate: "2026-10-15",
      page: "3",
    });
    expect(parseTransactionFilters(params, NOW)).toEqual(filters);
    expect(advancedCount(filters)).toBe(4);
    expect(hasAnyFilter(filters)).toBe(true);
  });

  it("página: inteiro ≥ 1 e com teto", () => {
    expect(parsePage({})).toBe(1);
    expect(parsePage({ page: "0" })).toBe(1);
    expect(parsePage({ page: "2.5" })).toBe(1);
    expect(parsePage({ page: "4" })).toBe(4);
    expect(parsePage({ page: "999" })).toBe(MAX_PAGE);
  });

  it("chips viram tipo ou natureza do banco", () => {
    expect(quickToQuery("receitas")).toEqual({ type: "receita" });
    expect(quickToQuery("fixas")).toEqual({ nature: "fixa" });
    expect(quickToQuery("todas")).toEqual({});
  });
});

describe("formulário de transação ↔ contrato", () => {
  const form = {
    type: "despesa" as const,
    amount: "89.90",
    description: " Academia ",
    date: "2026-11-15",
    categoryId: CAT,
    valueSourceId: ACC,
    nature: "fixa" as const,
    status: "pendente" as const,
  };

  it("despesa leva natureza; receita nunca leva", () => {
    const expense = toTransactionInput(transactionFormSchema.parse(form));
    expect(transactionInputSchema.parse(expense)).toMatchObject({ description: "Academia", nature: "fixa" });
    const income = toTransactionInput(transactionFormSchema.parse({ ...form, type: "receita" }));
    expect(income.nature).toBeNull();
    expect(transactionInputSchema.safeParse(income).success).toBe(true);
  });

  it.each([
    [{ amount: "0.00" }, "amount"],
    [{ description: "  " }, "description"],
    [{ date: "" }, "date"],
    [{ date: "1999-12-31" }, "date"],
    [{ categoryId: "" }, "categoryId"],
    [{ valueSourceId: "" }, "valueSourceId"],
  ])("rejeita %j", (patch, path) => {
    const result = transactionFormSchema.safeParse({ ...form, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([path]);
  });

  it("edição: categoria apagada ou de outro tipo volta vazia", () => {
    const t: Transaction = {
      id: "t",
      type: "receita",
      nature: null,
      description: "Freela",
      amount: "100.00",
      date: "2026-11-01",
      status: "efetivada",
      origin: "manual",
      categoryId: CAT,
      valueSourceId: ACC,
      recurrenceId: null,
    };
    const values = toTransactionFormValues(
      t,
      [{ id: CAT, name: "Mercado", type: "despesa", color: "#636851", icon: null }],
      [{ id: ACC, name: "Nubank", active: true }],
    );
    expect(values).toMatchObject({ categoryId: "", valueSourceId: ACC, nature: "variavel" });
  });
});
