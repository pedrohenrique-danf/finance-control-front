"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, toActionResult, validationFailure } from "@/lib/actions/action-result";
import { categoriesDataSource } from "./data-source";
import { type Category, categoryFormSchema } from "./schemas";

const idSchema = z.uuid();

/** Categorias aparecem em extrato, início e formulários: revalida toda a área logada. */
function revalidate() {
  revalidatePath("/", "layout");
}

export async function createCategoryAction(input: unknown): Promise<ActionResult<Category>> {
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => categoriesDataSource.create(parsed.data));
  if (result.ok) revalidate();
  return result;
}

export async function updateCategoryAction(id: string, input: unknown): Promise<ActionResult<Category>> {
  const parsedId = idSchema.safeParse(id);
  const parsed = categoryFormSchema.omit({ type: true }).safeParse(input);
  if (!parsedId.success) return validationFailure(parsedId.error);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => categoriesDataSource.update(parsedId.data, parsed.data));
  if (result.ok) revalidate();
  return result;
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const result = await toActionResult(() => categoriesDataSource.remove(parsedId.data));
  if (result.ok) revalidate();
  return result;
}
