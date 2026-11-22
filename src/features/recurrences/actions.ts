"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, toActionResult, validationFailure } from "@/lib/actions/action-result";
import { recurrencesDataSource } from "./data-source";
import { type Recurrence, recurrenceCreateSchema, recurrenceUpdateSchema } from "./schemas";

/** Recorrências lançam transações: mexem em extrato, início, contas e categorias. */
function revalidate() {
  revalidatePath("/", "layout");
}

export async function createRecurrenceAction(input: unknown): Promise<ActionResult<Recurrence>> {
  const parsed = recurrenceCreateSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => recurrencesDataSource.create(parsed.data));
  if (result.ok) revalidate();
  return result;
}

export async function updateRecurrenceAction(id: string, input: unknown): Promise<ActionResult<Recurrence>> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const parsed = recurrenceUpdateSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => recurrencesDataSource.update(parsedId.data, parsed.data));
  if (result.ok) revalidate();
  return result;
}

/** Pausar/reativar pela lista: PUT com o recurso inteiro, trocando só `active`. */
export async function setRecurrenceActiveAction(id: string, active: boolean): Promise<ActionResult<Recurrence>> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const current = await recurrencesDataSource.get(parsedId.data);
  if (!current) return { ok: false, error: { code: "NOT_FOUND", message: "Recorrência não encontrada." } };
  const input = recurrenceUpdateSchema.parse({
    description: current.description,
    amount: current.amount,
    dueDay: current.dueDay,
    startDate: current.startDate,
    endDate: current.endDate,
    categoryId: current.categoryId,
    valueSourceId: current.valueSourceId,
    active: active === true,
  });
  const result = await toActionResult(() => recurrencesDataSource.update(parsedId.data, input));
  if (result.ok) revalidate();
  return result;
}

export async function deleteRecurrenceAction(id: string): Promise<ActionResult> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const result = await toActionResult(() => recurrencesDataSource.remove(parsedId.data));
  if (result.ok) revalidate();
  return result;
}
