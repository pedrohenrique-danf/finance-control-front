"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, toActionResult, validationFailure } from "@/lib/actions/action-result";
import { dataExchangeDataSource } from "./data-source";
import {
  ACCEPTED_EXTENSIONS,
  confirmImportSchema,
  type DataOperation,
  type ImportPreview,
  MAX_FILE_BYTES,
} from "./schemas";

function fileError(message: string): ActionResult<never> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message, fieldErrors: { file: message } } };
}

/** Envia o arquivo ao backend e devolve as linhas lidas (nada é gravado). */
export async function previewImportAction(formData: FormData): Promise<ActionResult<ImportPreview>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fileError("Escolha um arquivo CSV ou PDF.");
  if (file.size > MAX_FILE_BYTES) return fileError("O arquivo tem mais de 5 MB.");
  if (!ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return fileError("Formato não suportado. Envie um CSV ou PDF.");
  }
  return toActionResult(() => dataExchangeDataSource.preview(file));
}

export async function confirmImportAction(input: unknown): Promise<ActionResult<DataOperation>> {
  const parsed = confirmImportSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => dataExchangeDataSource.confirm(parsed.data));
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
