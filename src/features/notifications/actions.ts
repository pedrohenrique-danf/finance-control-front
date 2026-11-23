"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionResult, toActionResult, validationFailure } from "@/lib/actions/action-result";
import { notificationsDataSource } from "./data-source";
import { notificationTypes } from "./schemas";

/** O contador do sino fica no layout da área logada. */
function revalidate() {
  revalidatePath("/", "layout");
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) return validationFailure(parsedId.error);
  const result = await toActionResult(() => notificationsDataSource.markRead(parsedId.data));
  if (result.ok) revalidate();
  return result;
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const result = await toActionResult(() => notificationsDataSource.markAllRead());
  if (result.ok) revalidate();
  return result;
}

const preferenceInputSchema = z.object({ type: z.enum(notificationTypes), active: z.boolean() });

export async function setNotificationPreferenceAction(input: { type: string; active: boolean }): Promise<ActionResult> {
  const parsed = preferenceInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const result = await toActionResult(() =>
    notificationsDataSource.setPreference(parsed.data.type, parsed.data.active),
  );
  if (!result.ok) return result;
  revalidatePath("/profile");
  return { ok: true, data: undefined };
}
