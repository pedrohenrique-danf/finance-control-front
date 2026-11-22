import { describe, expect, it } from "vitest";
import { expenseSlices, isEmptyHistory, MAX_SLICES, niceMax, percentages } from "./chart-data";
import type { DashboardSummary } from "./schemas";

const base: DashboardSummary = {
  month: "2026-11",
  income: "0.00",
  fixedExpenses: "0.00",
  variableExpenses: "0.00",
  paidIncome: "0.00",
  paidExpenses: "0.00",
  balance: "0.00",
  forecast: "0.00",
  byCategory: [],
  history: [{ month: "2026-11", income: "0.00", expense: "0.00" }],
  upcoming: [],
};

describe("dados dos gráficos", () => {
  it("percentuais inteiros sempre fecham 100", () => {
    expect(percentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(percentages([0, 0])).toEqual([0, 0]);
    expect(percentages([1299.9, 779.8, 762.37, 386, 282.7, 235, 90.8]).reduce((a, b) => a + b)).toBe(100);
  });

  it("eixo Y arredonda para cima num valor redondo", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(4870)).toBe(5000);
    expect(niceMax(5200)).toBe(10000);
    expect(niceMax(180)).toBe(200);
    expect(niceMax(2300)).toBe(2500);
  });

  it("fatias: só despesas, maior primeiro, sem categoria em cinza e excesso agrupado em Outras", () => {
    const categories = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i}`,
      name: `Cat ${i}`,
      color: "#636851",
      icon: null,
    }));
    const summary: DashboardSummary = {
      ...base,
      byCategory: [
        ...categories.map((c, i) => ({ type: "despesa" as const, categoryId: c.id, total: `${(i + 1) * 10}.00` })),
        { type: "despesa", categoryId: null, total: "5.00" },
        { type: "receita", categoryId: "c0", total: "999.00" },
      ],
    };
    const slices = expenseSlices(summary, categories);
    expect(slices).toHaveLength(MAX_SLICES);
    expect(slices[0]).toMatchObject({ name: "Cat 7", total: 80 });
    expect(slices.at(-1)).toMatchObject({ name: "Outras", total: 30 + 20 + 10 + 5 });
    const small = expenseSlices({ ...base, byCategory: [{ type: "despesa", categoryId: null, total: "5.00" }] }, []);
    expect(small[0]).toMatchObject({ name: "Sem categoria", color: "#B9BBAE" });
  });

  it("primeiro acesso = histórico todo zerado", () => {
    expect(isEmptyHistory(base)).toBe(true);
    expect(isEmptyHistory({ ...base, history: [{ month: "2026-10", income: "1.00", expense: "0.00" }] })).toBe(false);
  });
});
