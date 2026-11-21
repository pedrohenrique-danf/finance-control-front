import { z } from "zod";

// SYNC: finance-control-back src/modules/data-exchange/import.types.ts e docs/07 ("Importar e exportar").
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = [".csv", ".pdf"] as const;

export const importSources = ["csv", "nubank_fatura", "nubank_extrato"] as const;
export type ImportSource = (typeof importSources)[number];

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
  fileName: z.string(),
  period: z.object({ start: z.string(), end: z.string() }).nullable(),
  rows: z.array(importRowSchema),
  errors: z.array(importErrorSchema),
});
export type ImportPreview = z.output<typeof importPreviewSchema>;

/** Corpo de POST /imports (confirmação das linhas revisadas). */
export const confirmImportSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  format: z.enum(["csv", "pdf"]),
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
  format: z.enum(["csv", "xlsx", "pdf"]),
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

export const SOURCE_LABELS: Record<ImportSource, string> = {
  csv: "Planilha CSV",
  nubank_fatura: "Fatura do cartão Nubank",
  nubank_extrato: "Extrato da conta Nubank",
};

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/** Conta sugerida: no PDF, a conta Nubank do tipo certo (cartão na fatura, conta corrente no extrato). */
export function suggestAccount(preview: ImportPreview, accounts: readonly ExchangeAccount[]): string {
  const active = accounts.filter((a) => a.active);
  if (preview.source === "csv") return active[0]?.id ?? "";
  const wantedType = preview.source === "nubank_fatura" ? "cartao_credito" : "conta_corrente";
  const isNubank = (a: ExchangeAccount) => fold(`${a.name} ${a.institution ?? ""}`).includes("nubank");
  const pick =
    active.find((a) => isNubank(a) && a.type === wantedType) ?? active.find((a) => a.type === wantedType) ?? active[0];
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
