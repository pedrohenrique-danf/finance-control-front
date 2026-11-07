import { describe, expect, it } from "vitest";
import { currentMonth, formatDate, todayIso } from "./date";
import { formatMoney, parseMoneyInput } from "./money";

describe("dinheiro", () => {
  it.each([
    ["1.234,50", "1234.50"],
    ["89,9", "89.9"],
    ["100", "100"],
  ])("converte %s em %s", (input, expected) => expect(parseMoneyInput(input)).toBe(expected));

  it.each(["89.90", "abc", "1,234,50", "", "-5"])("rejeita %s", (input) => expect(parseMoneyInput(input)).toBeNull());

  it("formata em BRL", () => expect(formatMoney("1234.50").replace(/\s/g, " ")).toBe("R$ 1.234,50"));
});

describe("datas", () => {
  it("formata data sem deslocar o fuso", () => expect(formatDate("2026-11-05")).toBe("05/11/2026"));
  it("gera mês e dia correntes", () => {
    const now = new Date(2026, 0, 7);
    expect(currentMonth(now)).toBe("2026-01");
    expect(todayIso(now)).toBe("2026-01-07");
  });
});
