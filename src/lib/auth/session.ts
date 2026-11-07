import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { getApi } from "@/lib/api/server";

const sessionSchema = z
  .looseObject({ user: z.object({ id: z.string(), name: z.string(), email: z.string() }) })
  .nullable(); // o endpoint retorna null sem sessão

export type Session = NonNullable<z.output<typeof sessionSchema>>;

/** Sessão da requisição atual, consultada no backend (autoritativa). */
export const getSession = cache(async (): Promise<Session | null> => {
  const api = await getApi();
  try {
    return await api.get("/api/auth/get-session", sessionSchema);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
