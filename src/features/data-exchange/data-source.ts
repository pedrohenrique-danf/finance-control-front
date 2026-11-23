import "server-only";
import { getApi } from "@/lib/api/server";
import {
  type ConfirmImportInput,
  type DataOperation,
  dataOperationListSchema,
  dataOperationSchema,
  type ImportPreview,
  importPreviewSchema,
} from "./schemas";

/**
 * Importar e exportar (backend docs/07, "Importar e exportar"). A exportação não passa por aqui: a tela aponta
 * direto para /api/v1/exports/transactions (rewrite do Next, mesma origem, cookie de sessão).
 */
export interface DataExchangeDataSource {
  /** O backend lê o CSV/PDF (POST /api/v1/imports/preview), sem gravar. */
  preview(file: File): Promise<ImportPreview>;
  confirm(input: ConfirmImportInput): Promise<DataOperation>;
  history(): Promise<DataOperation[]>;
}

export const dataExchangeDataSource: DataExchangeDataSource = {
  async preview(file) {
    const api = await getApi();
    const form = new FormData();
    form.set("file", file, file.name);
    return api.postForm("/api/v1/imports/preview", form, importPreviewSchema);
  },

  async confirm(input) {
    const api = await getApi();
    return api.post("/api/v1/imports", input, dataOperationSchema);
  },

  async history() {
    const api = await getApi();
    return (await api.get("/api/v1/data-operations", dataOperationListSchema)).data;
  },
};
