# 01 — Fundamentos de TypeScript e React no Frontend

> Unidade 1 (variáveis, tipos, funções, type hints, docstrings, decorators, estruturas de dados, POO, módulos) traduzida para TypeScript + React.

## Objetivo

Definir como escrever TypeScript e componentes React tipados, legíveis e compostos, usando os equivalentes dos conceitos de Python estudados.

## Escopo

**Cobre:** tipagem, props, funções, estruturas de dados, imutabilidade, composição (hooks e componentes), funções de ordem superior (decorators), módulos, nomes.
**Não cobre:** chamadas HTTP (02), estrutura de pastas (03), formulários (06).

## Regras e padrões

### Mapa Python → TypeScript/React

| Conceito (Unidade 1) | Padrão no projeto |
|---|---|
| Type hints (PEP 484) | `strict: true`; tipos explícitos em props, retornos de funções exportadas e fronteiras |
| `=` × `==` | `===` sempre; nunca `==` |
| `None` | `null` (ausente conhecido); `undefined` (não informado). Ex.: categoria excluída ⇒ `categoryId: null` |
| `*args` / `**kwargs` | rest `...args`; objeto de opções tipado; **props** de componentes |
| Docstring (PEP 257) | TSDoc em funções/hooks exportados não óbvios |
| Decorators | funções de ordem superior (`toActionResult(fn)`), HOF/wrappers; **não use** decorators experimentais |
| `__main__` | nenhum módulo executa efeitos ao ser importado; efeitos ficam em `useEffect`/Server Actions/rotas |
| dict / set / tuple | `Record`, `Map`, `Set`; tuplas `readonly` |
| `@dataclass(frozen=True)` | tipos `Readonly`, `z.infer` de schemas Zod |
| Encapsulamento / `@property` | componentes expõem **props** mínimas; lógica interna em hooks/funções; sem estado compartilhado mutável |
| Herança × composição | **composição**: componentes filhos (`children`), hooks, funções. **Nunca** herança entre componentes |
| Polimorfismo / duck typing | props por `interface`/união discriminada; componentes intercambiáveis pela mesma interface |
| Módulos (PEP 8, imports no topo) | ES Modules; imports no topo; alias `@/` |

### Tipagem

- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
- Dados externos (resposta da API, `searchParams`, `FormData`, `localStorage`) são `unknown` até passar por Zod.
- Tipos de domínio vêm de schemas Zod: `type Transaction = z.output<typeof transactionSchema>`.
- Props: `interface XProps` (ou `type`) nomeada; não use `React.FC`.
- Estados de UI como **união discriminada**, não vários booleanos:

```ts
type Loadable<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

### Componentes e hooks

- Componente = função pura de props → JSX. Um componente, uma responsabilidade.
- Lógica reaproveitável vira **hook** `useXxx` (somente em Client Components) ou **função pura** em `lib/`.
- Estado derivado se calcula na renderização; não duplique em `useState`.
- Imutabilidade: nunca mute props nem estado; crie novos arrays/objetos.
- Sem `useEffect` para buscar dados: use Server Components (arquivo 04).

### Nomes

| Item | Convenção | Exemplo |
|---|---|---|
| Arquivos de componente | `kebab-case.tsx` | `summary-card.tsx` |
| Componentes | `PascalCase` | `SummaryCard` |
| Hooks | `useCamelCase` | `useMonthParam` |
| Funções/variáveis | `camelCase` | `formatMoney` |
| Rotas (pastas do App Router) | `kebab-case` em inglês | `app/(private)/transactions` |
| Texto da UI | pt-BR | "Saldo do mês" |

## Exemplos de código

### Props tipadas e composição

```tsx
// src/components/layout/page-section.tsx
interface PageSectionProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageSection({ title, description, actions, children }: PageSectionProps) {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
```

### União discriminada para o resultado de ações (substitui exceções na UI)

```ts
// src/lib/actions/action-result.ts
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
```

> Chame `redirect()` **fora** do `try`/`toActionResult`: ele funciona lançando uma exceção interna do Next.

### Estruturas de dados imutáveis

```ts
const next = categories.map((c) => (c.id === updated.id ? updated : c)); // novo array
const byId = new Map(categories.map((c) => [c.id, c] as const));
```

### Imports

```ts
import { z } from "zod";                          // pacotes
import { formatMoney } from "@/lib/format/money"; // internos (alias)
import { SummaryCard } from "./summary-card";     // relativos
```

## Boas práticas e anti-padrões

| Faça | Evite |
|---|---|
| `unknown` + Zod nas fronteiras | `any`, `as` para forçar tipo |
| Server Component por padrão | `"use client"` no topo de tudo |
| União discriminada de estados | `isLoading`, `isError`, `isEmpty` independentes |
| Hooks/funções puras reutilizáveis | Copiar e colar lógica entre componentes |
| Composição com `children` | Componente-deus com dezenas de props booleanas |
| Estado derivado na renderização | `useEffect` para sincronizar estado |
| Dinheiro como string decimal | `number` para armazenar/somar valores |
| `===` e tipos estritos | Coerção implícita |

## Checklist de conformidade

- [ ] `tsc --noEmit` passa sem `any`.
- [ ] Props e retornos exportados estão tipados.
- [ ] Dados externos passam por Zod antes de uso.
- [ ] Nenhum `useEffect` usado para buscar dados.
- [ ] `"use client"` apenas em componentes que precisam de estado/eventos/APIs do navegador.
- [ ] Nenhuma mutação de props/estado.
- [ ] Imports no topo; sem ciclos entre módulos.
