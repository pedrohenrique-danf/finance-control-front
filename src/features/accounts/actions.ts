"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, toActionResult, validationFailure } from "@/lib/actions/action-result";
import { accountsDataSource } from "./data-source";
import { type Account, accountInputSchema } from "./schemas";

/** Contas aparecem em início, extrato e formulários: revalida toda a área logada. */
function revalidate() {
  revalidatePath("/", "layout");
}

export async function createAccountAction(input: unknown): Promise<ActionResult<Account>> {
  const parsed = accountInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => accountsDataSource.create(parsed.data));
  if (result.ok) revalidate();
  return result;
}

export async function updateAccountAction(id: string, input: unknown): Promise<ActionResult<Account>> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const parsed = accountInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() => accountsDataSource.update(parsedId.data, parsed.data));
  if (result.ok) revalidate();
  return result;
}
