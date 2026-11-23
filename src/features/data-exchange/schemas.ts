import { z } from "zod";

// SYNC: finance-control-back src/modules/data-exchange/import.types.ts e docs/07 ("Importar e exportar").
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = [".csv", ".txt", ".ofx", ".qfx", ".pdf"] as const;
/** Valor do `accept` do campo de arquivo. */
export const ACCEPT_ATTRIBUTE = [...ACCEPTED_EXTENSIONS, "text/csv", "application/pdf", "application/x-ofx"].join(",");

export const importSources = ["csv", "csv_banco", "ofx", "nubank_fatura", "nubank_extrato", "picpay_extrato"] as const;
export type ImportSource = (typeof importSources)[number];
export const importFormats = ["csv", "pdf", "ofx"] as const;
export type ImportFormat = (typeof importFormats)[number];

export const importRowSchema = z.object({
  line: z.number(),
  date: z.string(),
  description: z.string(),
  amount: z.string(),
  type: z.enum(["receita", "despesa"]),
  nature: z.enum(["fixa", "variavel"]).nullable(),
  status: z.enum(["pendente", "efetivada"]),
  categoryName: z.string().nullable(),
  accountName: z.string().nullable(),
  installment: z.string().nullable(),
  suggestedSkip: z.boolean(),
  note: z.string().nullable(),
});
export type ImportRow = z.output<typeof importRowSchema>;

export const importErrorSchema = z.object({
  line: z.number(),
  field: z.string().nullable(),
  message: z.string(),
  content: z.string().nullable(),
});
export type ImportError = z.output<typeof importErrorSchema>;

export const importPreviewSchema = z.object({
  source: z.enum(importSources),
  format: z.enum(importFormats),
  /** Banco identificado no arquivo ("Nubank", "Itaú"...). */
  institution: z.string().nullable(),
  /** Extrato de conta ou fatura de cartão. */
  kind: z.enum(["conta", "cartao"]).nullable(),
  fileName: z.string(),
  period: z.object({ start: z.string(), end: z.string() }).nullable(),
  rows: z.array(importRowSchema),
  errors: z.array(importErrorSchema),
});
export type ImportPreview = z.output<typeof importPreviewSchema>;

/** Corpo de POST /imports (confirmação das linhas revisadas). */
export const confirmImportSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  format: z.enum(importFormats),
  rows: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        description: z.string().trim().min(1).max(160),
        amount: z.string().regex(/^\d{1,12}\.\d{2}$/),
        type: z.enum(["receita", "despesa"]),
        nature: z.enum(["fixa", "variavel"]).nullable(),
        status: z.enum(["pendente", "efetivada"]),
        categoryId: z.uuid().nullable(),
        valueSourceId: z.uuid().nullable(),
      }),
    )
    .min(1, "Selecione ao menos uma linha para importar.")
    .max(2000),
  errors: z.array(importErrorSchema).max(2000),
});
export type ConfirmImportInput = z.output<typeof confirmImportSchema>;

export const dataOperationSchema = z.object({
  id: z.string(),
  type: z.enum(["importacao", "exportacao"]),
  format: z.enum(["csv", "xlsx", "pdf", "ofx"]),
  status: z.enum(["pendente", "processando", "concluida", "concluida_com_erros", "falhou"]),
  fileName: z.string().nullable(),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  totalRows: z.number(),
  successRows: z.number(),
  errorRows: z.number(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});
export type DataOperation = z.output<typeof dataOperationSchema>;
export const dataOperationListSchema = z.object({ data: z.array(dataOperationSchema) });

/** Dados de outras features (compostos pelo app/). */
export interface ExchangeCategory {
  id: string;
  name: string;
  type: "receita" | "despesa";
}
export interface ExchangeAccount {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  active: boolean;
}

/**
 * Download do CSV do mês direto do backend (GET /api/v1/exports/transactions): o rewrite do Next mantém a mesma
 * origem, então o cookie de sessão vai junto. O backend registra a operação e gera a notificação.
 */
export function exportCsvHref(month: string): string {
  return `/api/v1/exports/transactions?${new URLSearchParams({ month, format: "csv" })}`;
}

export const SOURCE_LABELS: Record<ImportSource, string> = {
  csv: "Planilha CSV",
  csv_banco: "CSV do banco",
  ofx: "Arquivo OFX",
  nubank_fatura: "Fatura do cartão Nubank",
  nubank_extrato: "Extrato da conta Nubank",
  picpay_extrato: "Extrato da conta PicPay",
};

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/** Título da revisão: o leitor e, quando identificados, o tipo de documento e o banco. */
export function previewTitle(preview: ImportPreview): string {
  if (preview.source !== "csv_banco" && preview.source !== "ofx") return SOURCE_LABELS[preview.source];
  if (!preview.kind && !preview.institution) return SOURCE_LABELS[preview.source];
  const what = preview.kind === "cartao" ? "Fatura do cartão" : "Extrato";
  return `${what}${preview.institution ? ` ${preview.institution}` : ""} (${preview.format.toUpperCase()})`;
}

/** Nome do banco reduzido para comparar com o nome/instituição da conta ("Banco Inter" → "inter"). */
const institutionKey = (name: string) =>
  fold(name)
    .replace(/\b(banco|bank|do|da|s\.?a\.?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Conta sugerida: a conta do banco identificado e do tipo certo (cartão na fatura, conta corrente no extrato);
 * sem banco, a primeira do tipo certo; na planilha do app, a primeira conta ativa.
 */
export function suggestAccount(preview: ImportPreview, accounts: readonly ExchangeAccount[]): string {
  const active = accounts.filter((a) => a.active);
  if (preview.source === "csv") return active[0]?.id ?? "";
  const wantedType = preview.kind === "cartao" ? "cartao_credito" : preview.kind === "conta" ? "conta_corrente" : null;
  const key = preview.institution ? institutionKey(preview.institution) : "";
  const isSameBank = (a: ExchangeAccount) => key !== "" && fold(`${a.name} ${a.institution ?? ""}`).includes(key);
  const pick =
    active.find((a) => isSameBank(a) && (!wantedType || a.type === wantedType)) ??
    (wantedType ? active.find((a) => a.type === wantedType) : undefined) ??
    active.find(isSameBank) ??
    active[0];
  return pick?.id ?? "";
}

/** Categoria pelo nome informado no CSV (mesmo tipo, sem diferenciar acento/maiúsculas). */
export function matchCategory(row: ImportRow, categories: readonly ExchangeCategory[]): string {
  if (!row.categoryName) return "";
  const wanted = fold(row.categoryName);
  return categories.find((c) => c.type === row.type && fold(c.name) === wanted)?.id ?? "";
}

/** Conta pelo nome informado no CSV; null quando não informada ou não encontrada. */
export function matchAccount(row: ImportRow, accounts: readonly ExchangeAccount[]): string | null {
  if (!row.accountName) return null;
  const wanted = fold(row.accountName);
  return accounts.find((a) => fold(a.name) === wanted)?.id ?? null;
}
