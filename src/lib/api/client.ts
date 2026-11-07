import type { z } from "zod";
import { toApiError } from "./errors";

export interface ApiClientDeps {
  baseUrl: string; // "" no navegador (mesma origem); BACKEND_URL no servidor
  fetchFn?: typeof fetch; // injetável em testes
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  credentials?: RequestCredentials;
}

type Query = Record<string, string | number | undefined>;

/** Cliente HTTP único da aplicação. Todo acesso à API passa por aqui. */
export function createApiClient(deps: ApiClientDeps) {
  const fetchFn = deps.fetchFn ?? fetch;

  async function send(method: string, path: string, opts: { body?: unknown; query?: Query } = {}) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) params.set(k, String(v));
    const qs = params.size > 0 ? `?${params}` : "";

    const headers = new Headers(await deps.getHeaders?.());
    headers.set("Accept", "application/json");
    if (opts.body !== undefined) headers.set("Content-Type", "application/json");

    const res = await fetchFn(`${deps.baseUrl}${path}${qs}`, {
      method,
      headers,
      body: opts.body === undefined ? null : JSON.stringify(opts.body),
      credentials: deps.credentials ?? "same-origin",
      cache: "no-store",
    });
    if (!res.ok) throw await toApiError(res);
    return res;
  }

  return {
    async get<S extends z.ZodType>(path: string, schema: S, query?: Query): Promise<z.output<S>> {
      return schema.parse(await (await send("GET", path, query ? { query } : {})).json());
    },
    async post<S extends z.ZodType>(path: string, body: unknown, schema: S): Promise<z.output<S>> {
      return schema.parse(await (await send("POST", path, { body })).json());
    },
    async put<S extends z.ZodType>(path: string, body: unknown, schema: S): Promise<z.output<S>> {
      return schema.parse(await (await send("PUT", path, { body })).json());
    },
    async delete(path: string): Promise<void> {
      await send("DELETE", path); // 204: sem corpo
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
