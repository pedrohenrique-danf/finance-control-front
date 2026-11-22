import "server-only";
import { getApi } from "@/lib/api/server";
import { requireSession } from "@/lib/auth/session";
import { mockDataExchange } from "@/lib/mock-backend";
import {
  type ConfirmImportInput,
  type DataOperation,
  dataOperationListSchema,
  dataOperationSchema,
  type ImportPreview,
  importPreviewSchema,
} from "./schemas";

export interface DataExchangeDataSource {
  /** Real: o backend lê o CSV/PDF (POST /api/v1/imports/preview). */
  preview(file: File): Promise<ImportPreview>;
  confirm(input: ConfirmImportInput): Promise<DataOperation>;
  history(): Promise<DataOperation[]>;
  exportCsv(month: string): Promise<{ fileName: string; content: string }>;
}

export const dataExchangeDataSource: DataExchangeDataSource = {
  async preview(file) {
    const api = await getApi();
    const form = new FormData();
    form.set("file", file, file.name);
    return api.postForm("/api/v1/imports/preview", form, importPreviewSchema);
  },

  // TODO(back): as rotas abaixo ainda não existem no finance-control-back (contrato: docs/07). Ao implementá-las:
  //   confirm   → api.post("/api/v1/imports", input, dataOperationSchema)
  //   history   → api.get("/api/v1/data-operations", dataOperationListSchema)
  //   exportCsv → link direto para /api/v1/exports/transactions?month=&format=csv (rewrite do Next)
  async confirm(input) {
    const { user } = await requireSession();
    return dataOperationSchema.parse(mockDataExchange.confirmImport(user.id, input));
  },

  async history() {
    const { user } = await requireSession();
    return dataOperationListSchema.parse({ data: mockDataExchange.history(user.id) }).data;
  },

  async exportCsv(month) {
    const { user } = await requireSession();
    return mockDataExchange.exportCsv(user.id, month);
  },
};
