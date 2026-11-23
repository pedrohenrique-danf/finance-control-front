import { describe, expect, it } from "vitest";
import {
  exportCsvHref,
  type ImportPreview,
  type ImportRow,
  matchAccount,
  matchCategory,
  previewTitle,
  suggestAccount,
} from "./schemas";

const accounts = [
  { id: "c1", name: "Carteira", type: "carteira", institution: "Dinheiro", active: true },
  { id: "n1", name: "Nubank", type: "conta_corrente", institution: "Nubank", active: true },
  { id: "n2", name: "Roxinho", type: "cartao_credito", institution: "Nubank", active: true },
  { id: "i1", name: "Inter", type: "cartao_credito", institution: "Banco Inter", active: true },
];
const preview = (source: ImportPreview["source"], patch: Partial<ImportPreview> = {}): ImportPreview => ({
  source,
  format: source === "csv" || source === "csv_banco" ? "csv" : source === "ofx" ? "ofx" : "pdf",
  institution: source.startsWith("nubank") ? "Nubank" : null,
  kind: source === "nubank_fatura" ? "cartao" : source === "nubank_extrato" ? "conta" : null,
  ...patch,
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

  it("conta: banco identificado no OFX/CSV ('Inter' casa com 'Banco Inter'), tipo pelo kind", () => {
    expect(suggestAccount(preview("ofx", { institution: "Inter", kind: "cartao" }), accounts)).toBe("i1");
    expect(suggestAccount(preview("csv_banco", { institution: "Nubank", kind: "conta" }), accounts)).toBe("n1");
    // banco sem conta cadastrada: a primeira do tipo certo
    expect(suggestAccount(preview("ofx", { institution: "Itaú", kind: "cartao" }), accounts)).toBe("n2");
    // sem banco nem tipo: a primeira ativa
    expect(suggestAccount(preview("csv_banco"), accounts)).toBe("c1");
    expect(suggestAccount(preview("picpay_extrato", { institution: "PicPay", kind: "conta" }), accounts)).toBe("n1");
  });

  it("título da revisão mostra tipo de documento e banco quando identificados", () => {
    expect(previewTitle(preview("nubank_fatura"))).toBe("Fatura do cartão Nubank");
    expect(previewTitle(preview("ofx", { institution: "Itaú", kind: "conta" }))).toBe("Extrato Itaú (OFX)");
    expect(previewTitle(preview("csv_banco", { institution: "Inter", kind: "cartao" }))).toBe(
      "Fatura do cartão Inter (CSV)",
    );
    expect(previewTitle(preview("csv_banco"))).toBe("CSV do banco");
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
