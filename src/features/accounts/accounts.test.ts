import { describe, expect, it } from "vitest";
import { fromCentsTotal } from "./balance";
import { type Account, accountInputSchema, toAccountFormValues, toAccountInput } from "./schemas";

const account: Account = {
  id: "1",
  name: "Nubank",
  type: "conta_corrente",
  institution: null,
  initialBalance: "-150.00",
  active: true,
  currentBalance: "10.00",
};

describe("formulário de conta ↔ contrato", () => {
  it("saldo negativo vira chave + valor positivo e volta igual", () => {
    const values = toAccountFormValues(account);
    expect(values).toMatchObject({ initialBalance: "150.00", negative: true, institution: "" });
    expect(accountInputSchema.parse(toAccountInput(values))).toEqual({
      name: "Nubank",
      type: "conta_corrente",
      institution: null,
      initialBalance: "-150.00",
      active: true,
    });
  });

  it("zero nunca vira -0.00", () => {
    const values = { ...toAccountFormValues(null), name: "Carteira", initialBalance: "0.00", negative: true };
    expect(toAccountInput(values).initialBalance).toBe("0.00");
  });

  it("rejeita tipo fora do enum do banco", () => {
    expect(
      accountInputSchema.safeParse({ ...toAccountInput(toAccountFormValues(account)), type: "checking" }).success,
    ).toBe(false);
  });
});

describe("fromCentsTotal", () => {
  it("soma saldos com sinais em centavos", () => {
    expect(fromCentsTotal(["2350.00", "-1234.56", "0.10", "0.20"])).toBe("1115.74");
    expect(fromCentsTotal(["-10.00", "5.00"])).toBe("-5.00");
    expect(fromCentsTotal([])).toBe("0.00");
  });
});
