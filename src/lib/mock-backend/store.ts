import "server-only";
import { ApiError } from "@/lib/api/errors";
import { buildDemoData } from "./seed";
import type { UserData } from "./types";

// Estado em memória do processo do Next, por usuário. Some ao reiniciar o servidor.
// Fica em globalThis para sobreviver ao hot reload do `next dev`.
const globalStore = globalThis as typeof globalThis & { __fcMockBackend?: Map<string, UserData> };
globalStore.__fcMockBackend ??= new Map<string, UserData>();
const users = globalStore.__fcMockBackend;

/** Dados do usuário (semeados com a demonstração no primeiro acesso). */
export function userData(userId: string): UserData {
  let data = users.get(userId);
  if (!data) {
    data = buildDemoData();
    users.set(userId, data);
  }
  // Usuários criados antes de notificações/histórico existirem (hot reload do next dev).
  data.notifications ??= [];
  data.dataOperations ??= [];
  return data;
}

export function notFound(resource: string): ApiError {
  return new ApiError(404, "NOT_FOUND", `${resource} não encontrada.`);
}

export function conflict(path: string, message: string): ApiError {
  return new ApiError(409, "CONFLICT", message, [{ path, message }]);
}
