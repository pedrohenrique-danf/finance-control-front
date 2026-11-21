import "server-only";
import { ApiError } from "@/lib/api/errors";
import { formatDate, formatMonthLabel } from "@/lib/format/date";
import { formatMoneyPlain } from "@/lib/format/money";
import { notify } from "./notifications";
import { userData } from "./store";
import type { DataOperationRecord, TransactionRecord, UserData } from "./types";

// Simula: POST /api/v1/imports, GET /api/v1/data-operations e GET /api/v1/exports/transactions
// (backend docs/07, "Importar e exportar"). A leitura do arquivo (POST /imports/preview) já é real no backend.

export interface ConfirmImportInput {
  fileName: string;
  format: "csv" | "pdf";
  rows: Array<
    Pick<TransactionRecord, "date" | "description" | "amount" | "type" | "nature" | "status"> & {
      categoryId: string | null;
      valueSourceId: string | null;
    }
  >;
  errors: DataOperationRecord["errors"];
}

export type DataOperation = Omit<DataOperationRecord, "errors">;

function validateRows(data: UserData, rows: ConfirmImportInput["rows"]): void {
  const issues: Array<{ path: string; message: string }> = [];
  rows.forEach((row, i) => {
    if (row.categoryId) {
      const category = data.categories.find((c) => c.id === row.categoryId);
      if (!category) issues.push({ path: `rows.${i}.categoryId`, message: "Categoria não encontrada." });
      else if (category.type !== row.type) {
        issues.push({ path: `rows.${i}.categoryId`, message: "Tipo da categoria incompatível." });
      }
    }
    if (row.valueSourceId && !data.valueSources.some((s) => s.id === row.valueSourceId)) {
      issues.push({ path: `rows.${i}.valueSourceId`, message: "Conta não encontrada." });
    }
    if ((row.type === "receita") !== (row.nature === null)) {
      issues.push({ path: `rows.${i}.nature`, message: "Natureza só se aplica a despesas." });
    }
  });
  if (issues.length) throw new ApiError(400, "VALIDATION_ERROR", "Dados inválidos.", issues.slice(0, 50));
}

const strip = ({ errors: _errors, ...operation }: DataOperationRecord): DataOperation => operation;

function csvCell(value: string): string {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export const mockDataExchange = {
  confirmImport(userId: string, input: ConfirmImportInput): DataOperation {
    const data = userData(userId);
    validateRows(data, input.rows);
    const now = new Date().toISOString();
    const dates = input.rows.map((r) => r.date).sort();
    for (const row of input.rows) {
      data.transactions.push({
        id: crypto.randomUUID(),
        ...row,
        origin: "importacao",
        recurrenceId: null,
      });
    }
    const operation: DataOperationRecord = {
      id: crypto.randomUUID(),
      type: "importacao",
      format: input.format,
      status: input.errors.length ? "concluida_com_erros" : "concluida",
      fileName: input.fileName,
      periodStart: dates[0] ?? null,
      periodEnd: dates.at(-1) ?? null,
      totalRows: input.rows.length + input.errors.length,
      successRows: input.rows.length,
      errorRows: input.errors.length,
      errorMessage: null,
      createdAt: now,
      completedAt: now,
      errors: input.errors,
    };
    data.dataOperations.push(operation);
    notify(data, {
      type: "importacao_concluida",
      title: "Importação concluída",
      message: `${input.rows.length} ${input.rows.length === 1 ? "transação importada" : "transações importadas"} de ${input.fileName}${
        input.errors.length ? ` (${input.errors.length} com erro)` : ""
      }.`,
    });
    return strip(operation);
  },

  history(userId: string): DataOperation[] {
    return [...userData(userId).dataOperations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(strip);
  },

  /** CSV do mês no formato de importação (padrão Excel pt-BR, com BOM). */
  exportCsv(userId: string, month: string): { fileName: string; content: string } {
    const data = userData(userId);
    const categoryName = new Map(data.categories.map((c) => [c.id, c.name]));
    const accountName = new Map(data.valueSources.map((s) => [s.id, s.name]));
    const rows = data.transactions.filter((t) => t.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
    const lines = [
      "data;descricao;valor;tipo;natureza;situacao;categoria;conta",
      ...rows.map((t) =>
        [
          formatDate(t.date),
          t.description,
          formatMoneyPlain(t.amount),
          t.type,
          t.nature ?? "",
          t.status,
          t.categoryId ? (categoryName.get(t.categoryId) ?? "") : "",
          t.valueSourceId ? (accountName.get(t.valueSourceId) ?? "") : "",
        ]
          .map(csvCell)
          .join(";"),
      ),
    ];
    const fileName = `financecontrol-${month}.csv`;
    const now = new Date().toISOString();
    const [y, m] = month.split("-").map(Number) as [number, number];
    data.dataOperations.push({
      id: crypto.randomUUID(),
      type: "exportacao",
      format: "csv",
      status: "concluida",
      fileName,
      periodStart: `${month}-01`,
      periodEnd: `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`,
      totalRows: rows.length,
      successRows: rows.length,
      errorRows: 0,
      errorMessage: null,
      createdAt: now,
      completedAt: now,
      errors: [],
    });
    notify(data, {
      type: "exportacao_pronta",
      title: "Exportação pronta",
      message: `${formatMonthLabel(month)}: ${rows.length} ${rows.length === 1 ? "transação" : "transações"} em ${fileName}.`,
    });
    return { fileName, content: `﻿${lines.join("\r\n")}\r\n` };
  },
};
