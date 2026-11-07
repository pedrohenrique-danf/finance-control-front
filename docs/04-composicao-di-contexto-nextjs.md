# 04 — Composição, Injeção de Dependência e Contextos no Next.js

> Unidade 4 (importações circulares, Application Factory, lazy initialization, IoC/DI, ciclo de vida, Application Context × Request Context, monólito modular), traduzida para Next.js/React.

## Objetivo

Definir como o frontend monta suas dependências (fábricas injetáveis), separa o que vive **por aplicação** do que vive **por requisição**, evita ciclos e mantém módulos de feature desacoplados.

## Escopo

**Cobre:** fábricas, DI manual, fronteira server/client, contexto por requisição, React Context, regras anti-ciclo, ciclo de vida.
**Não cobre:** código do cliente HTTP (02) nem proteção de rotas em detalhe (07). Não há "Application Factory" literal: o Next.js cria a aplicação; o equivalente aqui são **fábricas de dependências**.

## Regras e padrões

### Equivalências (Flask → Next.js)

| Flask (Unidade 4) | Next.js no projeto |
|---|---|
| `create_app()` | `createApiClient(deps)` e `createXxxApi(api)` — fábricas que recebem dependências |
| `init_app(app)` | cada feature expõe uma fábrica; nada é criado ao importar o módulo |
| `current_app`, `g` | `getApi()`/`getSession()` memoizados **por requisição** com `cache()` do React |
| Request Context (`request`, `session`) | `cookies()`, `headers()`, `searchParams`, `params` do Next (por requisição) |
| Application Context | configuração validada (`getServerEnv()`) — imutável e somente leitura |
| Blueprints | módulos de `features/` |
| Monólito modular | um app Next.js, features isoladas; sem micro-frontends |

### Ciclo de vida

| Fase | O que acontece | Onde |
|---|---|---|
| Build/setup | validação de config, geração estática | `next build`, `lib/config/env.ts` |
| Requisição (servidor) | Server Components e Actions rodam; `getApi()` repassa o cookie | `app/**`, `features/**/actions.ts` |
| Hidratação (navegador) | Client Components assumem a interatividade | componentes com `"use client"` |

### Server × Client

- **Padrão: Server Component** — busca dados com `getApi()` e renderiza.
- **`"use client"`** apenas em folhas interativas: formulários, diálogos, seletores, Better Auth client.
- Client Components não importam módulos `server-only` (`lib/api/server.ts`, `lib/config/env.ts`).
- Dados passam do servidor ao cliente por **props serializáveis** (strings, números, objetos simples).
- Mutação: **Server Action** fina → `toActionResult(() => api.xxx())` → `revalidatePath(...)`.

### Estado por requisição × global

- **Nunca** guarde dados de usuário/requisição em variável de módulo no servidor: o módulo é compartilhado entre requisições concorrentes (vazamento entre usuários).
- Use `cache()` do React para memoizar **dentro** de uma requisição.
- React Context só para estado **de cliente** (tema, toasts). Não use Context para dados de domínio carregados no servidor.
- URL é estado: mês e página ficam em `searchParams` (compartilhável e renderizável no servidor).

### Injeção de dependência

- DI manual por parâmetro; sem biblioteca de container.
- Features recebem `ApiClient` (interface), nunca importam `fetch` nem o cliente global.
- Testes injetam `ApiClient` falso ou `fetchFn` falso.

### Regras anti-ciclo

1. Direção única: `app → features → components/lib`. `lib` e `components` nunca importam de `features`/`app`.
2. Features se conhecem apenas pelo `index.ts`; para compartilhar tipo ou função, extraia para `lib/` ou `components/`.
3. Proibido contornar ciclo com import no fim do arquivo ou `require` tardio.
4. Barrel (`index.ts`) apenas na borda da feature.

## Exemplos de código

### Fábrica de API por feature + acesso por requisição

```ts
// src/features/transactions/api.ts
export function createTransactionsApi(api: ApiClient) {
  return {
    list: (q: { month: string; page?: number; pageSize?: number }) =>
      api.get("/api/v1/transactions", transactionsPageSchema, q),
    create: (input: CreateTransactionPayload) =>
      api.post("/api/v1/transactions", input, transactionSchema),
    remove: (id: string) => api.delete(`/api/v1/transactions/${id}`),
  };
}

// src/features/transactions/server.ts
import "server-only";
export const getTransactionsApi = async () => createTransactionsApi(await getApi());
```

### Server Component (leitura)

```tsx
// src/app/(private)/transactions/page.tsx
import { getTransactionsApi } from "@/features/transactions/server";
import { TransactionsTable } from "@/features/transactions";
import { monthSchema } from "@/features/transactions/schemas";
import { currentMonth } from "@/lib/format/date";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; page?: string }>;   // Promise no Next 16
}) {
  const sp = await searchParams;
  const month = monthSchema.safeParse(sp.month).success ? sp.month! : currentMonth();
  const page = Math.max(1, Number(sp.page) || 1);

  const api = await getTransactionsApi();
  const result = await api.list({ month, page, pageSize: 20 });   // 401/404/5xx tratados (02)

  return <TransactionsTable month={month} items={result.data} meta={result.meta} />;
}
```

### Server Action (mutação)

```ts
// src/features/transactions/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/actions/action-result";
import { createTransactionFormSchema, toCreateTransactionPayload } from "./schemas";
import { getTransactionsApi } from "./server";

export async function createTransactionAction(raw: unknown): Promise<ActionResult> {
  const parsed = createTransactionFormSchema.safeParse(raw);   // validação do cliente repetida no servidor
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: "Dados inválidos.",
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) } };
  }
  const result = await toActionResult(async () => {
    await (await getTransactionsApi()).create(toCreateTransactionPayload(parsed.data));
  });
  if (result.ok) revalidatePath("/transactions");
  return result;
}
```

### Contexto de cliente (somente UI)

```tsx
// src/components/providers.tsx
"use client";
export function Providers({ children }: { children: React.ReactNode }) {
  // somente provedores de UI (tema, toasts). Nenhum dado de domínio aqui.
  return <>{children}</>;
}
```

### Teste com dependência injetada

```ts
it("lista transações usando o ApiClient injetado", async () => {
  const calls: string[] = [];
  const fakeApi = {
    get: async (path: string) => { calls.push(path); return { data: [], meta: { page: 1, pageSize: 20, total: 0 } }; },
  } as unknown as ApiClient;

  const api = createTransactionsApi(fakeApi);
  const result = await api.list({ month: "2026-11" });

  expect(calls).toEqual(["/api/v1/transactions"]);
  expect(result.meta.total).toBe(0);
});
```

## Boas práticas e anti-padrões

| Faça | Evite |
|---|---|
| Fábricas que recebem dependências | `export const api = createApiClient(...)` global com cookie |
| `cache()` por requisição | Variável de módulo guardando sessão/usuário no servidor |
| Server Component + props serializáveis | Buscar dados em `useEffect` |
| Context só para UI | Context com dados de domínio e lógica de negócio |
| Mês/página em `searchParams` | Estado de filtro duplicado em `useState` sem necessidade |
| Features isoladas por `index.ts` | Import de `features/a/internal.ts` dentro de `features/b` |
| Extrair para `lib/` para quebrar ciclo | Mover `import` para o fim do arquivo |

## Checklist de conformidade

- [ ] Nenhuma instância de cliente HTTP criada no topo de módulo.
- [ ] Nenhum dado de usuário em variável de módulo do servidor.
- [ ] Server Components fazem leitura; Server Actions fazem mutação e chamam `revalidatePath`.
- [ ] `"use client"` só em folhas; nenhum import `server-only` em Client Component.
- [ ] Features dependem de `ApiClient` injetado; testes usam fake.
- [ ] Sem ciclos (`lib`/`components` não importam `features`/`app`).
