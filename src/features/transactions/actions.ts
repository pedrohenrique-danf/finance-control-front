"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, toActionResult, validationFailure } from "@/lib/actions/action-result";
import { transactionsDataSource } from "./data-source";
import { type Transaction, transactionInputSchema } from "./schemas";

/** Transações mexem em extrato, início, categorias e saldos das contas. */
function revalidate() {
  revalidatePath("/", "layout");
}

/** Leitura sob demanda para o formulário global de edição (aberto de qualquer tela). */
export async function getTransactionAction(id: string): Promise<ActionResult<Transaction>> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const transaction = await transactionsDataSource.get(parsedId.data);
  if (!transaction) return { ok: false, error: { code: "NOT_FOUND", message: "Transação não encontrada." } };
  return { ok: true, data: transaction };
}

export async function createTransactionAction(input: unknown): Promise<ActionResult<Transaction>> {
  const parsed = transactionInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => transactionsDataSource.create(parsed.data));
  if (result.ok) revalidate();
  return result;
}

export async function updateTransactionAction(id: string, input: unknown): Promise<ActionResult<Transaction>> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const parsed = transactionInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => transactionsDataSource.update(parsedId.data, parsed.data));
  if (result.ok) revalidate();
  return result;
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const result = await toActionResult(() => transactionsDataSource.remove(parsedId.data));
  if (result.ok) revalidate();
  return result;
}
