import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mockCategories, mockValueSources, fromCents, toCents } = await import("./index");
const { buildDemoData } = await import("./seed");
const { userData } = await import("./store");

let userId: string;
beforeEach(() => {
  userId = crypto.randomUUID();
});

describe("dinheiro em centavos", () => {
  it.each([
    ["0.10", 10],
    ["1234.56", 123456],
    ["-12.30", -1230],
  ])("%s ↔ %i", (decimal, cents) => {
    expect(toCents(decimal)).toBe(cents);
    expect(fromCents(cents)).toBe(decimal);
  });

  it("soma sem erro de ponto flutuante", () => {
    expect(fromCents(toCents("0.10") + toCents("0.20"))).toBe("0.30");
  });
});

describe("seed de demonstração respeita as regras do banco", () => {
  const data = buildDemoData(new Date(2026, 10, 21));

  it("natureza só em despesas; valor sempre positivo; enums válidos", () => {
    for (const t of data.transactions) {
      expect(t.type === "receita" ? t.nature === null : t.nature !== null).toBe(true);
      expect(Number(t.amount)).toBeGreaterThan(0);
      expect(["pendente", "efetivada"]).toContain(t.status);
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("lançamentos futuros do mês atual ficam pendentes", () => {
    const future = data.transactions.filter((t) => t.date > "2026-11-21");
    expect(future.length).toBeGreaterThan(0);
    expect(future.every((t) => t.status === "pendente")).toBe(true);
  });

  it("projeção de recorrência é única por data (uq_transacoes_recorrencia_data)", () => {
    const keys = data.transactions.filter((t) => t.recurrenceId).map((t) => `${t.recurrenceId}:${t.date}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("categorias simuladas", () => {
  it("rejeita nome repetido no mesmo tipo com 409 em `name`", () => {
    mockCategories.create(userId, { name: "Pets", type: "despesa", color: "#636851", icon: "paw" });
    expect(() =>
      mockCategories.create(userId, { name: "Pets", type: "despesa", color: "#636851", icon: "paw" }),
    ).toThrowError(expect.objectContaining({ status: 409, details: [expect.objectContaining({ path: "name" })] }));
    // mesmo nome em outro tipo é permitido
    expect(
      mockCategories.create(userId, { name: "Pets", type: "receita", color: "#636851", icon: "paw" }),
    ).toBeTruthy();
  });

  it("excluir mantém as transações como Sem categoria (RNF02)", () => {
    const data = userData(userId);
    const target = data.categories.find((c) => c.name === "Alimentação");
    if (!target) throw new Error("seed sem Alimentação");
    const linked = data.transactions.filter((t) => t.categoryId === target.id).length;
    expect(linked).toBeGreaterThan(0);

    mockCategories.remove(userId, target.id);

    expect(data.categories.some((c) => c.id === target.id)).toBe(false);
    expect(data.transactions.filter((t) => t.categoryId === null).length).toBeGreaterThanOrEqual(linked);
  });

  it("totais do mês somam por tipo e categoria", () => {
    const data = userData(userId);
    const month = data.transactions[0]?.date.slice(0, 7) ?? "";
    const totals = mockCategories.monthlyTotals(userId, month);
    const expected = data.transactions
      .filter((t) => t.date.startsWith(month) && t.type === "despesa")
      .reduce((acc, t) => acc + toCents(t.amount), 0);
    const actual = totals.filter((t) => t.type === "despesa").reduce((acc, t) => acc + toCents(t.total), 0);
    expect(actual).toBe(expected);
  });
});

describe("contas simuladas", () => {
  it("saldo atual = inicial + receitas − despesas efetivadas", () => {
    const created = mockValueSources.create(userId, {
      name: "Conta teste",
      type: "conta_corrente",
      institution: null,
      initialBalance: "100.00",
      active: true,
    });
    const data = userData(userId);
    const base = { nature: null, origin: "manual", categoryId: null, recurrenceId: null } as const;
    data.transactions.push(
      {
        ...base,
        id: "a",
        type: "receita",
        description: "x",
        amount: "50.25",
        date: "2026-11-01",
        status: "efetivada",
        valueSourceId: created.id,
      },
      {
        ...base,
        id: "b",
        type: "despesa",
        nature: "variavel",
        description: "y",
        amount: "30.10",
        date: "2026-11-02",
        status: "efetivada",
        valueSourceId: created.id,
      },
      {
        ...base,
        id: "c",
        type: "despesa",
        nature: "variavel",
        description: "z",
        amount: "999.00",
        date: "2026-11-03",
        status: "pendente",
        valueSourceId: created.id,
      },
    );
    expect(mockValueSources.get(userId, created.id).currentBalance).toBe("120.15");
  });

  it("nome de conta é único por usuário e 404 para id inexistente", () => {
    expect(() =>
      mockValueSources.create(userId, {
        name: "Nubank",
        type: "outro",
        institution: null,
        initialBalance: "0.00",
        active: true,
      }),
    ).toThrowError(expect.objectContaining({ status: 409 }));
    expect(() => mockValueSources.get(userId, crypto.randomUUID())).toThrowError(
      expect.objectContaining({ status: 404 }),
    );
  });
});
