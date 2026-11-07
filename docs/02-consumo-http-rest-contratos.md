# 02 — Consumo de HTTP/REST e Contratos da API

> Unidade 2 (HTTP, requisição/resposta, métodos, status codes, REST, JSON, `curl`) sob a ótica do **consumidor** da API.

## Objetivo

Definir como o frontend chama o backend: cliente HTTP único, tratamento padronizado de erros por status code, validação das respostas e sincronização dos contratos.

## Escopo

**Cobre:** cliente HTTP, `ApiError`, mapeamento status → comportamento de UI, cache, contratos, rotas consumidas.
**Não cobre:** autenticação em detalhe (07), formulários (06). O contrato é definido pelo backend (`finance-control-back/docs/02-http-rest-api.md`).

## Regras e padrões

### Cliente HTTP único

- **Todo** acesso à API usa `createApiClient` (`src/lib/api/client.ts`). Proibido `fetch` direto em componentes.
- Duas instâncias, uma por contexto:
  - **Servidor** (Server Components/Actions): `getApi()` — `baseUrl = BACKEND_URL`, repassa o cookie da requisição.
  - **Navegador** (se necessário): `baseUrl = ""` (mesma origem via rewrites), `credentials: "same-origin"`.
- Dados privados: `cache: "no-store"` explícito (não dependa do padrão da versão do Next).
- Toda resposta de sucesso é validada com Zod (o contrato pode mudar sem aviso).
- Sempre trate: resposta `204` (sem corpo), erro sem JSON, falha de rede.

### Mapeamento status → comportamento

| Status | `code` | Comportamento na UI |
|---|---|---|
| 200 / 201 | — | sucesso; em 201 use o corpo retornado (e `Location` se precisar da URI) |
| 204 | — | sucesso sem corpo (exclusão) |
| 400 | `VALIDATION_ERROR` | mostrar `details` junto aos campos (`path` → campo do formulário) |
| 401 | `UNAUTHENTICATED` | redirecionar para `/login?next=<rota interna atual>` |
| 403 | `FORBIDDEN` | mensagem "sem permissão" |
| 404 | `NOT_FOUND` | `notFound()` em páginas; mensagem em ações |
| 409 | `CONFLICT` | mensagem no formulário (ex.: categoria duplicada) |
| 5xx / rede | `INTERNAL_ERROR` | `error.tsx` com botão "tentar novamente" e **`requestId`** para suporte |

**400 ≠ 404:** entrada inválida é erro de formulário; recurso inexistente é "não encontrado".

### Rotas consumidas (espelho do backend)

| Método | URI | Uso |
|---|---|---|
| GET | `/api/v1/categories` | RF02 listar |
| POST/PUT/DELETE | `/api/v1/categories[/:id]` | RF02 criar/editar/excluir |
| GET | `/api/v1/transactions?month=YYYY-MM&page=&pageSize=` | RF06 tabela |
| POST/PUT/DELETE | `/api/v1/transactions[/:id]` | RF03 |
| GET/POST/DELETE | `/api/v1/recurrences[/:id]` | RF04 |
| GET | `/api/v1/dashboard/summary?month=YYYY-MM` | RF05 cards |
| POST | `/api/v1/imports` | RF07 |
| GET | `/api/v1/exports/transactions?month=YYYY-MM&format=csv` | RF07 |
| `*` | `/api/auth/*` | Better Auth (ver 07) |

### Contratos entre repositórios

- A autoridade é o schema Zod do **backend**. O frontend mantém espelho em `src/features/<dominio>/schemas.ts`.
- Todo arquivo espelhado começa com `// SYNC: finance-control-back/src/modules/<dominio>/<dominio>.schemas.ts`.
- Mecanismo de sincronização (cópia manual, pacote compartilhado, geração) é **[PENDENTE DE DEFINIÇÃO]**. Até lá: cópia manual, revisada no mesmo PR da mudança de contrato, e fluxo Playwright que exercita o contrato real.
- Mudou campo, enum, rota ou formato de erro? Atualize **os dois** repositórios.

## Exemplos de código

### Erro tipado e envelope

```ts
// src/lib/api/errors.ts
import { z } from "zod";

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    requestId: z.string().optional(),
  }),
});

export interface FieldIssue { path: string; message: string }

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: FieldIssue[];
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, details?: FieldIssue[], requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  try {
    const { error } = errorEnvelopeSchema.parse(await res.json());
    return new ApiError(res.status, error.code, error.message, error.details, error.requestId);
  } catch {
    return new ApiError(res.status, "UNKNOWN", `Falha na requisição (HTTP ${res.status}).`);
  }
}
```

### Cliente HTTP (fábrica injetável)

```ts
// src/lib/api/client.ts
import type { z } from "zod";

export interface ApiClientDeps {
  baseUrl: string;                                   // "" no navegador; BACKEND_URL no servidor
  fetchFn?: typeof fetch;                            // injetável em testes
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  credentials?: RequestCredentials;
}

type Query = Record<string, string | number | undefined>;

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
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: deps.credentials ?? "same-origin",
      cache: "no-store",
    });
    if (!res.ok) throw await toApiError(res);
    return res;
  }

  return {
    async get<S extends z.ZodType>(path: string, schema: S, query?: Query): Promise<z.output<S>> {
      return schema.parse(await (await send("GET", path, { query })).json());
    },
    async post<S extends z.ZodType>(path: string, body: unknown, schema: S): Promise<z.output<S>> {
      return schema.parse(await (await send("POST", path, { body })).json());
    },
    async put<S extends z.ZodType>(path: string, body: unknown, schema: S): Promise<z.output<S>> {
      return schema.parse(await (await send("PUT", path, { body })).json());
    },
    async delete(path: string): Promise<void> {
      await send("DELETE", path);                    // 204: sem corpo
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
```

### Cliente do servidor com cookie repassado

```ts
// src/lib/api/server.ts
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/config/env";
import { createApiClient } from "./client";

/** Uma instância por requisição (memoização do React). `cookies()` é assíncrono no Next 16. */
export const getApi = cache(async () => {
  const cookieHeader = (await cookies()).toString();
  return createApiClient({
    baseUrl: getServerEnv().BACKEND_URL,
    getHeaders: () => ({ cookie: cookieHeader }),
  });
});
```

### API por domínio (fábrica sobre o cliente)

```ts
// src/features/categories/api.ts
import { z } from "zod";
import type { ApiClient } from "@/lib/api/client";
import { categorySchema, type CreateCategoryInput } from "./schemas";

const listSchema = z.object({ data: z.array(categorySchema) });

export function createCategoriesApi(api: ApiClient) {
  return {
    list: async () => (await api.get("/api/v1/categories", listSchema)).data,
    create: (input: CreateCategoryInput) => api.post("/api/v1/categories", input, categorySchema),
    update: (id: string, input: Omit<CreateCategoryInput, "type">) =>
      api.put(`/api/v1/categories/${id}`, input, categorySchema),
    remove: (id: string) => api.delete(`/api/v1/categories/${id}`),
  };
}
```

### Teste do cliente com `fetch` falso

```ts
it("converte envelope de erro em ApiError", async () => {
  const fetchFn = async () =>
    new Response(
      JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details: [{ path: "name", message: "Obrigatório." }] } }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  const api = createApiClient({ baseUrl: "", fetchFn: fetchFn as typeof fetch });

  await expect(api.post("/api/v1/categories", {}, categorySchema)).rejects.toMatchObject({
    status: 400, code: "VALIDATION_ERROR", details: [{ path: "name" }],
  });
});
```

## Boas práticas e anti-padrões

| Faça | Evite |
|---|---|
| Um cliente HTTP, injetável | `fetch` espalhado em componentes |
| Validar respostas com Zod | `as Category[]` sobre `res.json()` |
| Decidir pelo `status`/`code`, não pelo texto da mensagem | Comparar strings de mensagem |
| Exibir `requestId` em erros 5xx | Mostrar stack trace ou mensagem técnica |
| `cache: "no-store"` em dado privado | Cachear respostas de usuário |
| Tratar 204 sem `.json()` | `await res.json()` após DELETE |
| Atualizar os dois repositórios ao mudar contrato | Mudar só um lado |

## Checklist de conformidade

- [ ] Nenhum `fetch` fora de `src/lib/api` (exceto Better Auth client).
- [ ] Toda resposta de sucesso passa por `schema.parse`.
- [ ] 400, 401, 404, 409 e 5xx têm tratamento definido na UI.
- [ ] Schemas espelhados têm o cabeçalho `// SYNC:` correto.
- [ ] Testes do cliente cobrem erro com envelope, erro sem JSON e 204.
- [ ] Contrato confere com o backend (rotas, campos, enums, formatos).
