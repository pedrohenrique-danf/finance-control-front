import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mockCategories, mockDashboard, mockValueSources, mockTransactions, fromCents, toCents } = await import(
  "./index"
);
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
    const totals = mockDashboard.summary(userId, month).byCategory;
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

describe("transações simuladas", () => {
  function ids() {
    const data = userData(userId);
    const despesa = data.categories.find((c) => c.type === "despesa");
    const receita = data.categories.find((c) => c.type === "receita");
    const conta = data.valueSources[0];
    if (!despesa || !receita || !conta) throw new Error("seed incompleto");
    return { despesa: despesa.id, receita: receita.id, conta: conta.id };
  }

  it("cria, filtra por busca sem acento e pagina com totais do conjunto filtrado", () => {
    const { despesa, conta } = ids();
    mockTransactions.create(userId, {
      type: "despesa",
      nature: "variavel",
      description: "Pão de queijo",
      amount: "12.50",
      date: "2030-01-10",
      status: "efetivada",
      categoryId: despesa,
      valueSourceId: conta,
    });
    const page = mockTransactions.list(userId, { month: "2030-01", q: "PAO", page: 1, pageSize: 20 });
    expect(page.data).toHaveLength(1);
    expect(page.meta.summary).toEqual({ income: "0.00", expense: "12.50", balance: "-12.50" });
    expect(page.meta.dayTotals).toEqual({ "2030-01-10": "-12.50" });
  });

  it("pagina do mais recente para o mais antigo", () => {
    const month = userData(userId).transactions[0]?.date.slice(0, 7) ?? "";
    const first = mockTransactions.list(userId, { month, page: 1, pageSize: 5 });
    const second = mockTransactions.list(userId, { month, page: 2, pageSize: 5 });
    expect(first.data).toHaveLength(5);
    expect(first.meta.totalPages).toBeGreaterThan(1);
    const dates = [...first.data, ...second.data].map((t) => t.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("rejeita categoria de outro tipo e natureza em receita (400 por campo)", () => {
    const { despesa, receita, conta } = ids();
    const base = {
      description: "x",
      amount: "1.00",
      date: "2030-01-01",
      status: "efetivada" as const,
      valueSourceId: conta,
    };
    expect(() =>
      mockTransactions.create(userId, { ...base, type: "receita", nature: null, categoryId: despesa }),
    ).toThrowError(
      expect.objectContaining({ status: 400, details: [expect.objectContaining({ path: "categoryId" })] }),
    );
    expect(() =>
      mockTransactions.create(userId, { ...base, type: "receita", nature: "fixa", categoryId: receita }),
    ).toThrowError(expect.objectContaining({ details: [expect.objectContaining({ path: "nature" })] }));
  });

  it("período de datas ignora o mês; excluir dá 404 na segunda vez", () => {
    const { despesa, conta } = ids();
    const created = mockTransactions.create(userId, {
      type: "despesa",
      nature: "fixa",
      description: "Teste período",
      amount: "5.00",
      date: "2031-03-03",
      status: "pendente",
      categoryId: despesa,
      valueSourceId: conta,
    });
    const byPeriod = mockTransactions.list(userId, {
      month: "2020-01",
      from: "2031-03-01",
      to: "2031-03-31",
      page: 1,
      pageSize: 20,
    });
    expect(byPeriod.data.map((t) => t.id)).toEqual([created.id]);
    mockTransactions.remove(userId, created.id);
    expect(() => mockTransactions.remove(userId, created.id)).toThrowError(expect.objectContaining({ status: 404 }));
  });
});

describe("resumo do dashboard simulado", () => {
  const now = new Date(2026, 10, 21);
  const userWithSeed = () => {
    const id = crypto.randomUUID();
    const data = userData(id);
    Object.assign(data, buildDemoData(now));
    return { id, data };
  };

  it("saldo do mês só com efetivadas; previsto com pendentes", () => {
    const { id, data } = userWithSeed();
    const s = mockDashboard.summary(id, "2026-11", now);
    const month = data.transactions.filter((t) => t.date.startsWith("2026-11"));
    const sum = (f: (t: (typeof month)[number]) => boolean) =>
      fromCents(month.filter(f).reduce((acc, t) => acc + toCents(t.amount), 0));
    expect(s.paidIncome).toBe(sum((t) => t.type === "receita" && t.status === "efetivada"));
    expect(s.balance).toBe(fromCents(toCents(s.paidIncome) - toCents(s.paidExpenses)));
    expect(s.forecast).toBe(fromCents(toCents(s.income) - toCents(s.fixedExpenses) - toCents(s.variableExpenses)));
    expect(s.history.map((h) => h.month)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
  });

  it("próximas fixas: só a partir de hoje, não efetivadas, ordenadas e no máximo 3", () => {
    const { id } = userWithSeed();
    const s = mockDashboard.summary(id, "2026-11", now);
    expect(s.upcoming.length).toBeLessThanOrEqual(3);
    expect(s.upcoming.every((u) => u.dueDate >= "2026-11-21")).toBe(true);
    expect(s.upcoming.map((u) => u.dueDate)).toEqual([...s.upcoming.map((u) => u.dueDate)].sort());
    expect(s.upcoming[0]).toMatchObject({ description: "Streaming", dueDate: "2026-11-22" });
  });
});
