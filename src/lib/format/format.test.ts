import { describe, expect, it } from "vitest";
import {
  currentMonth,
  daysBetween,
  formatDate,
  formatDayHeader,
  formatMonthLabel,
  formatMonthShort,
  parseMonthParam,
  relativeDays,
  shiftMonth,
  todayIso,
} from "./date";
import { digitsToDecimal, formatMoney, formatMoneyPlain, formatMoneySigned, parseMoneyInput } from "./money";

describe("dinheiro", () => {
  it.each([
    ["1.234,50", "1234.50"],
    ["89,9", "89.9"],
    ["100", "100"],
  ])("converte %s em %s", (input, expected) => expect(parseMoneyInput(input)).toBe(expected));

  it.each(["89.90", "abc", "1,234,50", "", "-5"])("rejeita %s", (input) => expect(parseMoneyInput(input)).toBeNull());

  it("formata em BRL", () => expect(formatMoney("1234.50")).toBe("R$ 1.234,50"));
  it("formata valor negativo", () => expect(formatMoney("-20.00")).toBe("-R$ 20,00"));
  it("formata sem símbolo", () => expect(formatMoneyPlain("1234.5")).toBe("1.234,50"));

  it("prefixa o sinal pelo tipo", () => {
    expect(formatMoneySigned("10.00", "receita")).toBe("+ R$ 10,00");
    expect(formatMoneySigned("10.00", "despesa")).toBe("− R$ 10,00");
  });

  it.each([
    ["", "0.00"],
    ["5", "0.05"],
    ["12345", "123.45"],
    ["R$ 1.234,56", "1234.56"],
    ["000150", "1.50"],
  ])("converte dígitos %s em %s", (input, expected) => expect(digitsToDecimal(input)).toBe(expected));
});

describe("datas", () => {
  it("formata data sem deslocar o fuso", () => expect(formatDate("2026-11-05")).toBe("05/11/2026"));
  it("gera mês e dia correntes", () => {
    const now = new Date(2026, 0, 7);
    expect(currentMonth(now)).toBe("2026-01");
    expect(todayIso(now)).toBe("2026-01-07");
  });

  it("valida o parâmetro de mês", () => {
    const now = new Date(2026, 10, 21);
    expect(parseMonthParam("2026-03", now)).toBe("2026-03");
    expect(parseMonthParam("2026-13", now)).toBe("2026-11");
    expect(parseMonthParam(undefined, now)).toBe("2026-11");
    expect(parseMonthParam(["2026-03"], now)).toBe("2026-11");
  });

  it("desloca meses atravessando o ano", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("gera rótulos de mês e dia", () => {
    expect(formatMonthLabel("2026-11")).toBe("Novembro 2026");
    expect(formatMonthShort("2026-03")).toBe("mar");
    expect(formatDayHeader("2026-11-18")).toBe("Qua, 18 nov");
  });

  it("calcula dias relativos", () => {
    expect(daysBetween("2026-11-21", "2026-11-24")).toBe(3);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(relativeDays(0)).toBe("hoje");
    expect(relativeDays(1)).toBe("amanhã");
    expect(relativeDays(-1)).toBe("ontem");
    expect(relativeDays(4)).toBe("em 4 dias");
    expect(relativeDays(-3)).toBe("há 3 dias");
  });
});
