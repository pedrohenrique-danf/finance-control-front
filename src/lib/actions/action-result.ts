import { ApiError } from "@/lib/api/errors";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } };

/** Função de ordem superior (equivalente a decorator): converte ApiError em ActionResult. */
export async function toActionResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof ApiError) {
      const fieldErrors = Object.fromEntries((error.details ?? []).map((d) => [d.path, d.message]));
      return { ok: false, error: { code: error.code, message: error.message, fieldErrors } };
    }
    throw error; // erros inesperados e redirect()/notFound() do Next propagam
  }
}

/** Falha de validação no servidor (entrada da Server Action rejeitada pelo schema Zod). */
export function validationFailure(error: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> }): {
  ok: false;
  error: { code: string; message: string; fieldErrors: Record<string, string> };
} {
  const fieldErrors = Object.fromEntries(error.issues.map((i) => [i.path.map(String).join("."), i.message]));
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Confira os campos destacados.", fieldErrors } };
}
