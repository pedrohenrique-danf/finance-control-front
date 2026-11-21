import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  mockCategories,
  mockDashboard,
  mockDataExchange,
  mockNotifications,
  mockRecurrences,
  mockValueSources,
  mockTransactions,
  fromCents,
  toCents,
} = await import("./index");
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

describe("recorrências simuladas (RF04)", () => {
  const now = new Date(2026, 10, 21); // 21/11/2026
  const setup = () => {
    const id = crypto.randomUUID();
    const data = userData(id);
    const despesa = data.categories.find((c) => c.type === "despesa");
    const conta = data.valueSources[0];
    if (!despesa || !conta) throw new Error("seed incompleto");
    const base = {
      type: "despesa" as const,
      description: "Plano de celular",
      amount: "59.90",
      dueDay: 31,
      startDate: "2026-09-10",
      endDate: null,
      categoryId: despesa.id,
      valueSourceId: conta.id,
    };
    return { id, data, base };
  };

  it("criar lança de startDate até o mês corrente, pendente, fixa e no último dia em meses curtos", () => {
    const { id, data, base } = setup();
    const rec = mockRecurrences.create(id, base, now);
    const posted = data.transactions.filter((t) => t.recurrenceId === rec.id).map((t) => [t.date, t.status, t.nature]);
    expect(posted).toEqual([
      ["2026-09-30", "pendente", "fixa"],
      ["2026-10-31", "pendente", "fixa"],
      ["2026-11-30", "pendente", "fixa"],
    ]);
    // idempotente: reativar/editar não duplica
    mockRecurrences.update(id, rec.id, { ...base, active: true }, now);
    expect(data.transactions.filter((t) => t.recurrenceId === rec.id)).toHaveLength(3);
  });

  it("agenda de 6 meses: lançados com a situação da transação, futuros como prevista, respeitando a data final", () => {
    const { id, base } = setup();
    const rec = mockRecurrences.create(id, { ...base, endDate: "2027-02-28" }, now);
    const { schedule } = mockRecurrences.get(id, rec.id, now);
    expect(schedule.map((s) => [s.month, s.dueDate, s.status])).toEqual([
      ["2026-11", "2026-11-30", "pendente"],
      ["2026-12", "2026-12-31", "prevista"],
      ["2027-01", "2027-01-31", "prevista"],
      ["2027-02", "2027-02-28", "prevista"],
    ]);
  });

  it("pausada não lança; encerrar mantém os lançamentos sem vínculo (RNF02)", () => {
    const { id, data, base } = setup();
    const rec = mockRecurrences.create(id, { ...base, startDate: "2026-11-01" }, now);
    mockRecurrences.update(id, rec.id, { ...base, startDate: "2026-11-01", active: false }, now);
    expect(mockRecurrences.get(id, rec.id, now).active).toBe(false);
    const posted = data.transactions.filter((t) => t.recurrenceId === rec.id).map((t) => t.id);
    mockRecurrences.remove(id, rec.id);
    expect(data.transactions.filter((t) => posted.includes(t.id)).every((t) => t.recurrenceId === null)).toBe(true);
    expect(() => mockRecurrences.get(id, rec.id, now)).toThrowError(expect.objectContaining({ status: 404 }));
  });

  it("categoria de outro tipo e fim antes do início dão 400 por campo", () => {
    const { id, data, base } = setup();
    const receita = data.categories.find((c) => c.type === "receita");
    expect(() => mockRecurrences.create(id, { ...base, categoryId: receita?.id ?? null }, now)).toThrowError(
      expect.objectContaining({ status: 400, details: [expect.objectContaining({ path: "categoryId" })] }),
    );
    expect(() => mockRecurrences.create(id, { ...base, endDate: "2026-01-01" }, now)).toThrowError(
      expect.objectContaining({ details: [expect.objectContaining({ path: "endDate" })] }),
    );
  });

  it("repetir todo mês ao lançar: liga a transação à nova recorrência sem duplicar a data", () => {
    const { id, data, base } = setup();
    const tx = mockTransactions.create(
      id,
      {
        type: "despesa",
        nature: "variavel",
        description: "Academia nova",
        amount: "99.00",
        date: "2026-10-15",
        status: "efetivada",
        categoryId: base.categoryId,
        valueSourceId: base.valueSourceId,
      },
      { dueDay: 15, endDate: null },
      now,
    );
    expect(tx).toMatchObject({ origin: "recorrencia", nature: "fixa", status: "efetivada" });
    const linked = data.transactions.filter((t) => t.recurrenceId === tx.recurrenceId);
    expect(linked.map((t) => [t.date, t.status])).toEqual([
      ["2026-10-15", "efetivada"],
      ["2026-11-15", "pendente"],
    ]);
  });
});

describe("notificações geradas pelas ações", () => {
  it("criar categoria, conta, transação e despesa fixa gera avisos; marcar como lida zera o contador", () => {
    const id = crypto.randomUUID();
    const data = userData(id);
    expect(mockNotifications.unreadCount(id)).toBe(0);
    const category = mockCategories.create(id, { name: "Pets", type: "despesa", color: "#636851", icon: "paw" });
    mockValueSources.create(id, {
      name: "Inter",
      type: "conta_corrente",
      institution: null,
      initialBalance: "0.00",
      active: true,
    });
    const tx = mockTransactions.create(id, {
      type: "despesa",
      nature: "variavel",
      description: "Ração",
      amount: "89.90",
      date: "2026-11-21",
      status: "efetivada",
      categoryId: category.id,
      valueSourceId: data.valueSources[0]?.id ?? null,
    });
    const page = mockNotifications.list(id, 1, 10);
    expect(page.meta).toMatchObject({ total: 3, unread: 3 });
    expect(page.data.map((n) => n.title).sort()).toEqual(["Categoria criada", "Conta criada", "Despesa registrada"]);
    const txNotification = page.data.find((n) => n.transactionId === tx.id);
    expect(txNotification?.message).toBe("Ração · R$ 89,90 em 21/11/2026");

    mockNotifications.markRead(id, txNotification?.id ?? "");
    expect(mockNotifications.unreadCount(id)).toBe(2);
    mockNotifications.markAllRead(id);
    expect(mockNotifications.unreadCount(id)).toBe(0);
    expect(() => mockNotifications.markRead(id, crypto.randomUUID())).toThrowError(
      expect.objectContaining({ status: 404 }),
    );
  });
});

describe("importação e exportação simuladas", () => {
  it("confirmar cria transações de origem importação, a operação com erros e a notificação", () => {
    const id = crypto.randomUUID();
    const data = userData(id);
    const despesa = data.categories.find((c) => c.type === "despesa");
    const before = data.transactions.length;
    const op = mockDataExchange.confirmImport(id, {
      fileName: "fatura.pdf",
      format: "pdf",
      rows: [
        {
          date: "2026-10-01",
          description: "Coffee House.",
          amount: "8.50",
          type: "despesa",
          nature: "variavel",
          status: "efetivada",
          categoryId: despesa?.id ?? null,
          valueSourceId: null,
        },
        {
          date: "2026-10-12",
          description: "Estorno",
          amount: "30.00",
          type: "receita",
          nature: null,
          status: "efetivada",
          categoryId: null,
          valueSourceId: null,
        },
      ],
      errors: [{ line: 9, field: null, message: "Lançamento não reconhecido.", content: "?" }],
    });
    expect(op).toMatchObject({
      type: "importacao",
      format: "pdf",
      status: "concluida_com_erros",
      successRows: 2,
      errorRows: 1,
      periodStart: "2026-10-01",
      periodEnd: "2026-10-12",
    });
    expect(data.transactions.length - before).toBe(2);
    expect(data.transactions.at(-1)).toMatchObject({ origin: "importacao", description: "Estorno" });
    expect(mockNotifications.list(id, 1, 5).data[0]).toMatchObject({ type: "importacao_concluida" });
    expect(mockDataExchange.history(id)[0]?.id).toBe(op.id);
  });

  it("categoria de outro tipo é rejeitada por linha", () => {
    const id = crypto.randomUUID();
    const receita = userData(id).categories.find((c) => c.type === "receita");
    expect(() =>
      mockDataExchange.confirmImport(id, {
        fileName: "a.csv",
        format: "csv",
        rows: [
          {
            date: "2026-10-01",
            description: "x",
            amount: "1.00",
            type: "despesa",
            nature: "variavel",
            status: "efetivada",
            categoryId: receita?.id ?? null,
            valueSourceId: null,
          },
        ],
        errors: [],
      }),
    ).toThrowError(
      expect.objectContaining({ status: 400, details: [expect.objectContaining({ path: "rows.0.categoryId" })] }),
    );
  });

  it("exporta no formato da importação (BOM, ;, dd/mm/aaaa, 1.234,56) e registra a operação", () => {
    const id = crypto.randomUUID();
    const data = userData(id);
    data.transactions.push({
      id: "t1",
      type: "despesa",
      nature: "variavel",
      description: 'Loja "A"; B',
      amount: "1234.50",
      date: "2030-02-03",
      status: "pendente",
      origin: "manual",
      categoryId: null,
      valueSourceId: null,
      recurrenceId: null,
    });
    const { fileName, content } = mockDataExchange.exportCsv(id, "2030-02");
    expect(fileName).toBe("financecontrol-2030-02.csv");
    expect(content.startsWith("﻿data;descricao;valor;tipo;natureza;situacao;categoria;conta\r\n")).toBe(true);
    expect(content).toContain('03/02/2030;"Loja ""A""; B";1.234,50;despesa;variavel;pendente;;');
    expect(mockDataExchange.history(id)[0]).toMatchObject({
      type: "exportacao",
      successRows: 1,
      periodEnd: "2030-02-28",
    });
  });
});
