# 03 — Estrutura do Projeto e Configuração por Ambiente

> Unidade 3 (ambiente isolado, estrutura em pacotes, blueprints, factory, configuração por ambiente, execução, modo debug, `.env`).

## Objetivo

Definir a estrutura de pastas do frontend (App Router), a organização por **features** (equivalente aos *blueprints*), o isolamento de dependências e a configuração separada por ambiente.

## Escopo

**Cobre:** árvore de diretórios, roteamento, variáveis de ambiente, `next.config`, execução em dev × produção.
**Não cobre:** composição/DI (04), scripts e testes (05). Gerenciador de pacotes: **pnpm 12**. Node: **≥ 22.16**. Next.js: **16**.

## Regras e padrões

### Isolamento de dependências

- Dependências em `node_modules/` local; nunca instale pacotes do projeto globalmente.
- Versione o `pnpm-lock.yaml`; fixe versões (`pnpm add --save-exact`); Node declarado em `engines` (`>=22.16.0`) e `.nvmrc`; pnpm fixado em `packageManager`.
- Componentes shadcn/ui são adicionados com `pnpm dlx shadcn@<versão> add <componente>` (config em `components.json`) e as versões que ele instalar devem ser fixadas em seguida.

### Árvore de diretórios

```
finance-control-front/
├── docs/
├── public/
├── src/
│   ├── app/                              # roteamento (App Router) — somente composição
│   │   ├── layout.tsx                    # raiz: fontes, Providers
│   │   ├── error.tsx  loading.tsx  not-found.tsx
│   │   ├── (public)/                     # AuthShell (faixa da marca + formulário)
│   │   │   ├── login/page.tsx            # RF01 (?next)
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx   # ?token= do e-mail do Better Auth
│   │   └── (private)/
│   │       ├── layout.tsx                # exige sessão; compõe o formulário global de transação e o sino
│   │       ├── dashboard/page.tsx        # RF05
│   │       ├── transactions/page.tsx     # RF03 + RF06 (filtros e ?page= na URL)
│   │       ├── categories/page.tsx       # RF02
│   │       ├── recurrences/page.tsx      # RF04
│   │       ├── recurrences/[id]/page.tsx # agenda de 6 meses
│   │       ├── accounts/page.tsx         # contas e cartões (fontes_valor)
│   │       ├── accounts/[id]/page.tsx
│   │       ├── import-export/page.tsx    # RF07
│   │       ├── import-export/export/route.ts  # download do CSV (TODO(back): /api/v1/exports)
│   │       ├── notifications/page.tsx
│   │       └── profile/page.tsx          # nome e senha (Better Auth)
│   ├── features/                         # um diretório por domínio
│   │   ├── auth/                         # login, cadastro, senha, perfil
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── transactions/                 # inclui o formulário global (TransactionSheet)
│   │   ├── recurrences/
│   │   ├── dashboard/                    # gráficos em SVG puro
│   │   ├── data-exchange/                # importar (CSV/PDF Nubank via backend) e exportar
│   │   └── notifications/
│   ├── components/
│   │   ├── ui/                           # primitivos shadcn/ui (button/input/select/textarea ajustados à identidade)
│   │   ├── common/                       # peças visuais compartilhadas: Money, Field, FormSheet, CategoryIcon…
│   │   └── layout/                       # AppShell, AuthShell, PageSection, menus, ShellProvider
│   ├── lib/
│   │   ├── api/                          # client.ts (get/post/postForm/put/delete), errors.ts, server.ts
│   │   ├── auth/                         # auth-client.ts, session.ts
│   │   ├── config/env.ts                 # ÚNICO lugar que lê process.env
│   │   ├── actions/                      # ActionResult, toActionResult, validationFailure
│   │   ├── forms/                        # applyActionError (erros da action → campos do RHF)
│   │   ├── format/                       # money.ts, date.ts
│   │   ├── mock-backend/                 # backend simulado (TODO(back)) — ver abaixo
│   │   └── search-params.ts
│   └── proxy.ts                          # "middleware" do Next 16 (verificação otimista de sessão)
├── tests/
│   ├── unit/
│   └── e2e/                              # Playwright
├── next.config.ts
├── playwright.config.ts
├── vitest.config.ts
├── biome.json
├── components.json                       # configuração do shadcn/ui
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```

### Módulo de feature

```
features/categories/
├── index.ts                     # API pública da feature
├── data-source.ts               # interface + implementação (hoje: mock-backend; depois: getApi())
├── actions.ts                   # Server Actions (finas): validam com Zod e chamam o data source
├── schemas.ts                   # espelho do contrato (// SYNC:) + schema do formulário
├── components/                  # CategoriesView, CategorySheet...
└── categories.test.ts
```

### Camada de dados enquanto o backend não tem as rotas de domínio

Cada feature expõe um **data source** (interface) que as páginas e as Server Actions usam. Hoje a implementação
chama `src/lib/mock-backend` — um backend simulado **em memória, por usuário, só no servidor**, que segue o contrato
de `finance-control-back/docs` (02 e 07): mesmos campos, enums do banco, erros 400/404/409 por campo e regras como
RNF02, natureza só em despesas e materialização de recorrências. Cada data source tem um comentário `TODO(back)`
com as chamadas `getApi()` equivalentes; ao implementar uma rota no backend, troca-se só essa implementação.

- O estado some ao reiniciar o `next dev`; cada usuário novo recebe os dados de demonstração do protótipo.
- Já é real: autenticação (Better Auth) e a leitura de arquivos de importação (`POST /api/v1/imports/preview`).

Regras: `app/` apenas importa de `features/*/index.ts`, `components/` e `lib/`. Uma feature **não importa** arquivos internos de outra. `components/` e `lib/` **não importam** de `features/` nem de `app/`.

### Variáveis de ambiente

| Variável | Escopo | Descrição |
|---|---|---|
| `BACKEND_URL` | **somente servidor** | URL base do backend (usada por `getApi()` e pelos rewrites) |
| `NEXT_PUBLIC_APP_URL` | pública, opcional | URL pública do frontend (links absolutos) |
| `E2E_BASE_URL` | só testes | URL alvo do Playwright |

Regras:

- Variável **sem** prefixo `NEXT_PUBLIC_` fica só no servidor. Tudo com esse prefixo vai ao navegador: **nunca** coloque segredo nele.
- `DATABASE_URL`, `BETTER_AUTH_SECRET` e credenciais Google **não existem** neste repositório.
- Valide variáveis com Zod em `lib/config/env.ts` (falha cedo).
- Referencie variáveis públicas literalmente (`process.env.NEXT_PUBLIC_APP_URL`) para que o Next as incorpore no build.
- Somente `.env.example` vai ao Git; `.env*.local` ignorados.
- Dev: `BACKEND_URL=http://localhost:3001` em `.env.local`. Produção: variáveis do provedor de hospedagem **[PENDENTE DE DEFINIÇÃO]**.
- `cacheComponents` do Next 16 está **desligado**: com ele, toda leitura de `cookies()` exigiria `<Suspense>`, o que conflita com o padrão `getApi()` (cookie repassado em Server Components).

### Estratégia de origem — **[PENDENTE DE DEFINIÇÃO]**

O `next.config.ts` já está configurado com a recomendação (rewrites de mesma origem); a decisão formal ainda deve ser registrada.

**Recomendado: mesma origem.** O navegador fala só com o frontend; o Next repassa `/api/*` ao backend (`rewrites`). Vantagens: cookie de sessão pertence ao domínio do frontend (o middleware consegue lê-lo), sem CORS, sem cookie de terceiro. Se for adotar origens distintas, o backend precisa de CORS com credenciais e cookie `SameSite=None; Secure`, e a proteção de rotas no middleware deixa de funcionar (cookie em outro domínio) — registre essa decisão antes de implementar.

### Execução

- `dev`: servidor de desenvolvimento do Next, com mensagens de erro detalhadas.
- `build` + `start`: **somente** isso em produção. Nunca `dev` em produção.
- O backend precisa estar acessível em `BACKEND_URL` para o frontend funcionar.

## Exemplos de código

### `src/lib/config/env.ts`

```ts
import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  BACKEND_URL: z.url(),   // Zod 4: z.url() substitui z.string().url()
});

let cached: z.output<typeof serverSchema> | undefined;

/** Lê e valida as variáveis de servidor uma vez. */
export function getServerEnv() {
  cached ??= (() => {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      const lines = parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`);
      throw new Error(`Variáveis de ambiente inválidas:\n${lines.join("\n")}`);
    }
    return parsed.data;
  })();
  return cached;
}
```

### `next.config.ts` (mesma origem via rewrites)

```ts
import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
  // headers(): cabeçalhos de segurança (ver 07); turbopack: loader do Tailwind
};

export default nextConfig;
```

(`next.config.ts` é arquivo de ferramenta: exceção à regra de ler `process.env` só em `lib/config/env.ts`.)

### `.env.example`

```dotenv
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `.gitignore` (trecho obrigatório)

```gitignore
node_modules/
.next/
.env*.local
.env
!.env.example
```

### Layout privado

```tsx
// src/app/(private)/layout.tsx
import { requireSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireSession();           // redireciona para /login se não houver sessão
  return <AppShell>{children}</AppShell>;
}
```

## Boas práticas e anti-padrões

| Faça | Evite |
|---|---|
| `app/` só compõe; lógica em `features/` | Regra de negócio dentro de `page.tsx` |
| Variáveis de servidor sem `NEXT_PUBLIC_` | Segredo em variável pública |
| Validar env com Zod | `process.env.X!` espalhado |
| Proxy/rewrites para mesma origem | CORS aberto e cookies de terceiros sem decisão |
| `.env.example` atualizado | Subir `.env` com valores reais |
| `build` + `start` em produção | `next dev` em produção |

## Checklist de conformidade

- [ ] Estrutura segue a árvore acima; features isoladas por `index.ts`.
- [ ] `process.env` só em `lib/config/env.ts` (exceção: arquivos de ferramenta como `next.config.ts`).
- [ ] Nenhum segredo ou `DATABASE_URL` no repositório.
- [ ] `.env.example` e `.gitignore` corretos.
- [ ] Rota privada protegida por layout com `requireSession()`.
- [ ] Decisão de origem (mesma origem × distintas) registrada.
