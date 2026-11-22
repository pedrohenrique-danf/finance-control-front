import { describe, expect, it } from "vitest";
import {
  exportCsvHref,
  type ImportPreview,
  type ImportRow,
  matchAccount,
  matchCategory,
  suggestAccount,
} from "./schemas";

const accounts = [
  { id: "c1", name: "Carteira", type: "carteira", institution: "Dinheiro", active: true },
  { id: "n1", name: "Nubank", type: "conta_corrente", institution: "Nubank", active: true },
  { id: "n2", name: "Roxinho", type: "cartao_credito", institution: "Nubank", active: true },
  { id: "i1", name: "Inter", type: "cartao_credito", institution: "Banco Inter", active: true },
];
const preview = (source: ImportPreview["source"]): ImportPreview => ({
  source,
  fileName: "x",
  period: null,
  rows: [],
  errors: [],
});
const row = (patch: Partial<ImportRow>): ImportRow => ({
  line: 2,
  date: "2026-11-01",
  description: "x",
  amount: "1.00",
  type: "despesa",
  nature: "variavel",
  status: "efetivada",
  categoryName: null,
  accountName: null,
  installment: null,
  suggestedSkip: false,
  note: null,
  ...patch,
});

describe("sugestões da revisão de importação", () => {
  it("conta: cartão Nubank para a fatura, conta corrente Nubank para o extrato, primeira ativa no CSV", () => {
    expect(suggestAccount(preview("nubank_fatura"), accounts)).toBe("n2");
    expect(suggestAccount(preview("nubank_extrato"), accounts)).toBe("n1");
    expect(suggestAccount(preview("csv"), accounts)).toBe("c1");
    expect(
      suggestAccount(preview("nubank_fatura"), [{ ...accounts[3], active: true } as (typeof accounts)[number]]),
    ).toBe("i1");
  });

  it("categoria e conta pelo nome do CSV, sem acento/maiúsculas e só do mesmo tipo", () => {
    const categories = [
      { id: "a", name: "Alimentação", type: "despesa" as const },
      { id: "s", name: "Salário", type: "receita" as const },
    ];
    expect(matchCategory(row({ categoryName: "alimentacao" }), categories)).toBe("a");
    expect(matchCategory(row({ categoryName: "Salário" }), categories)).toBe("");
    expect(matchCategory(row({ categoryName: null }), categories)).toBe("");
    expect(matchAccount(row({ accountName: "NUBANK" }), accounts)).toBe("n1");
    expect(matchAccount(row({ accountName: "Itaú" }), accounts)).toBeNull();
  });
});

describe("exportação", () => {
  it("o link aponta direto para a rota do backend (mesma origem pelo rewrite)", () => {
    expect(exportCsvHref("2026-11")).toBe("/api/v1/exports/transactions?month=2026-11&format=csv");
  });
});
