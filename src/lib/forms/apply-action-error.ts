import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "@/lib/actions/action-result";

type ActionError = Extract<ActionResult, { ok: false }>["error"];

/**
 * Leva o erro de uma Server Action ao formulário: erros por campo (400/409 com `details`)
 * vão para os campos conhecidos; o restante vira erro geral (`root`).
 */
export function applyActionError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: ActionError,
  fields: readonly Path<T>[],
): void {
  let mapped = false;
  for (const [path, message] of Object.entries(error.fieldErrors ?? {})) {
    const field = fields.find((f) => f === path);
    if (field) {
      setError(field, { message }, { shouldFocus: !mapped });
      mapped = true;
    }
  }
  if (!mapped) setError("root", { message: error.message });
}
