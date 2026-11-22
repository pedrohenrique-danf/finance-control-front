# FinanceControl Frontend — Guia de Arquitetura e Padrões

## Objetivo

Este diretório é a **fonte única de padrões** do repositório `finance-control-front`. Serve a humanos e a agentes de IA. Leia este índice primeiro; depois leia apenas os arquivos relevantes à tarefa.

O frontend contém interface, páginas, componentes, formulários e a comunicação com a API do backend. **Não** acessa o banco, **não** contém regra de negócio financeira nem implementa autenticação própria: tudo isso é do backend (`finance-control-back/docs/`).

## Escopo

**Cobre:** estrutura do projeto, consumo da API REST, configuração por ambiente, composição e DI, componentes server/client, formulários e validação, autenticação no cliente, UI responsiva, scripts e testes.
**Não cobre:** API, banco, migrações, regras de negócio (ver backend).

## Arquitetura

```
 Navegador ──► Next.js (App Router)
                 ├─ Server Components  ──► getApi() (cookie repassado) ──┐
                 ├─ Server Actions     ──► getApi() (cookie repassado) ──┤──► Backend REST (/api/v1/*)
                 └─ Client Components  ──► Better Auth client ───────────┘    + Better Auth (/api/auth/*)
```

Regra: **leitura em Server Components, mutação em Server Actions**, Client Components apenas onde há interatividade. Dependências fluem `app → features → (components, lib)`.

## Stack

Versões fixadas no `package.json` (sem `^`/`latest`) e no `pnpm-lock.yaml`.

| Item                                                         | Definição                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Runtime                                                      | Node.js ≥ 22.16 (`engines` + `.nvmrc`)                                                      |
| Gerenciador de pacotes                                       | pnpm 12 (`packageManager`)                                                                  |
| Framework                                                    | Next.js 16 (App Router, Turbopack) + React 19                                               |
| Linguagem                                                    | TypeScript 6.0 (`strict`)                                                                   |
| Validação                                                    | Zod 4                                                                                       |
| Formulários                                                  | React Hook Form (conforme documento de requisitos do MVP) + adaptador `@hookform/resolvers` |
| UI                                                           | Tailwind CSS 4 + shadcn/ui (estilo `base-nova`, Base UI, ícones `lucide-react`, toasts `sonner`, tema `next-themes`) |
| Autenticação (cliente)                                       | Better Auth client 1.7 (`better-auth/react`)                                                |
| Testes unitários                                             | Vitest 5 (+ `@vitest/coverage-v8`)                                                          |
| Testes de componente                                         | **[PENDENTE DE DEFINIÇÃO]** (ex.: Testing Library, não definido)                            |
| Testes de fluxo                                              | Playwright (projetos `desktop` e `mobile`)                                                  |
| Lint e formatação                                            | Biome 2 (domínios `next` e `react`)                                                         |
| Hospedagem                                                   | Vercel (conforme documento do MVP) — confirmar **[PENDENTE DE DEFINIÇÃO]**                  |
| Cache/estado de servidor no cliente (SWR, React Query, etc.) | **não usar** (não definido)                                                                 |

> O documento do MVP citava Auth.js; o contexto atual do projeto define **Better Auth**. Better Auth prevalece.

## Decisões registradas

| Decisão                         | Escolha                                                                                                      | Arquivo    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| Versão do Next.js               | 16: o middleware é `src/proxy.ts` (função `proxy`), `cookies()` é assíncrono, `searchParams` é Promise        | 03, 04, 07 |
| `cacheComponents`               | **desligado**: leituras com cookie repassado (`getApi()`) não exigem `<Suspense>`                            | 03, 04     |
| Testes unitários                | Vitest                                                                                                       | 05         |
| Lint/formatação e pacotes       | Biome; pnpm 12                                                                                               | 05         |
| Identidade visual               | Protótipo Lovable migrado: paleta oliva/terrosa, Plus Jakarta Sans, cantos de 14 px; **só tema claro**      | 08         |
| Primitivos shadcn/ui            | `button`, `input`, `select` e `textarea` **ajustados** à identidade (alturas de 44–48 px, variantes receita/despesa). Exceção à regra de não editar `components/ui` | 08 |
| Componentes compartilhados      | `src/components/common` (Money, Field, FormSheet, CategoryIcon, MoneyInput, AmountField…)                 | 03         |
| Layout                          | Responsivo: mobile com barra inferior e botão "+", desktop com barra lateral fixa; painéis sobem de baixo no mobile e abrem à direita no desktop | 08 |
| Gráficos                        | SVG puro (sem biblioteca); cores validadas para daltonismo; tabela equivalente para leitores de tela        | 08         |
| Camada de dados                 | Data source por feature; hoje `src/lib/mock-backend` (TODO(back)) até o backend ter as rotas              | 03         |
| `status` da transação           | `pendente`/`efetivada`; na tela "Pago"/"Recebido"/"Pendente"                                               | 06         |
| Importação/exportação (RF07)    | CSV padrão Excel pt-BR (`;`, dd/mm/aaaa, 1.234,56) nos dois sentidos; PDF de fatura e extrato do Nubank lido **no backend** (pdfjs-dist), com pré-visualização antes de confirmar | 06, backend 07 |
| Notificações                    | Geradas pelas ações (lançar, criar categoria/conta/despesa fixa, importar, exportar); lembretes ficam para depois do MVP | backend 07 |

## Decisões pendentes (consolidado)

| #   | Decisão                                                                                                     | Arquivo    |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Mesma origem (proxy/rewrites para o backend — **recomendado** e já configurado em `next.config.ts`) × origens distintas | 02, 03, 07 |
| 2   | Como sincronizar contratos (schemas Zod) entre os dois repositórios                                         | 02, 06     |
| 3   | Ferramenta de teste de componentes                                                                          | 05         |
| 4   | Política de CSP                                                                                             | 07         |
| 5   | Ferramenta de acessibilidade automatizada                                                                   | 08         |
| 6   | Hospedagem (Vercel a confirmar), plataforma de CI e meta de cobertura                                       | 05         |
| 7   | Páginas de termos de uso e política de privacidade (o cadastro exige o aceite)                             | 07         |
| 8   | Envio do e-mail de redefinição de senha (`sendResetPassword` no backend)                                    | 07         |
| 9   | Materialização dos meses futuros das despesas fixas (job diário × na leitura) — backend                     | backend 07 |

## Setup rápido

```bash
pnpm install                       # instala dependências
cp .env.example .env.local         # BACKEND_URL=http://localhost:3001
pnpm exec playwright install chromium   # navegador dos testes E2E (uma vez)
pnpm dev                           # http://localhost:3000 (o backend precisa estar rodando)
pnpm verify                        # typecheck + lint + testes unitários
pnpm test:e2e                      # Playwright (desktop + mobile); exige o backend rodando
```

## Convenções compartilhadas com o backend

| Tema     | Convenção                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Prefixos | `/api/v1/*` (negócio), `/api/auth/*` (Better Auth)                                                                         |
| IDs      | UUID (string)                                                                                                              |
| Dinheiro | string decimal `"1234.50"`; o usuário digita/vê formato pt-BR (`1.234,50`)                                                 |
| Datas    | `"YYYY-MM-DD"`; mês `"YYYY-MM"`                                                                                            |
| Enums    | valores do banco: `receita`/`despesa`; `fixa`/`variavel`; `pendente`/`efetivada`; `manual`/`recorrencia`/`importacao`     |
| Coleção  | `{ data: T[], meta?: { page, pageSize, total } }`; recurso único: objeto direto                                            |
| Erro     | `{ error: { code, message, details?, requestId } }`                                                                        |
| Códigos  | `VALIDATION_ERROR` 400 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `INTERNAL_ERROR` 500 |
| Sessão   | cookie `httpOnly` do Better Auth — o JavaScript do frontend nunca lê o token                                               |

## Telas

| Rota | Tela | Dados |
| --- | --- | --- |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Autenticação (RF01) | Better Auth real (redefinição depende do e-mail no backend) |
| `/dashboard` | Início: saldo, cards, gráficos, próximas fixas, últimas transações (RF05) | mock-backend |
| `/transactions` | Extrato com busca, filtros e "Carregar mais" (RF06); formulário global pelo "+" (RF03) | mock-backend |
| `/categories` | Categorias com total do mês (RF02) | mock-backend |
| `/recurrences`, `/recurrences/[id]` | Despesas fixas e agenda de 6 meses (RF04) | mock-backend |
| `/accounts`, `/accounts/[id]` | Contas e cartões | mock-backend |
| `/import-export` | Importar CSV/PDF Nubank e exportar CSV (RF07) | leitura do arquivo **real** no backend; confirmação, histórico e exportação no mock-backend |
| `/notifications` | Notificações geradas pelas ações | mock-backend |
| `/profile` | Nome e senha | Better Auth real |

## Índice

| Arquivo                                                                          | Conteúdo                                             |
| -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [01-typescript-react-fundamentos.md](docs/01-typescript-react-fundamentos.md)         | Tipos, componentes, hooks, composição, módulos       |
| [02-consumo-http-rest-contratos.md](docs/02-consumo-http-rest-contratos.md)           | Cliente HTTP, erros, status codes, contratos         |
| [03-estrutura-projeto-configuracao.md](docs/03-estrutura-projeto-configuracao.md)     | Pastas, App Router, ambientes, rewrites              |
| [04-composicao-di-contexto-nextjs.md](docs/04-composicao-di-contexto-nextjs.md)       | Fábricas, DI, server/client, contexto por requisição |
| [05-empacotamento-scripts-testes.md](docs/05-empacotamento-scripts-testes.md)         | Scripts, dependências, testes, Playwright            |
| [06-dados-formularios-validacao.md](docs/06-dados-formularios-validacao.md)           | Modelos, formulários, Zod, dinheiro e datas          |
| [07-autenticacao-seguranca.md](docs/07-autenticacao-seguranca.md)                     | Better Auth no cliente, proteção de rotas, segurança |
| [08-ui-responsividade-acessibilidade.md](docs/08-ui-responsividade-acessibilidade.md) | Dashboard, tabela, mobile-first, acessibilidade      |
| [99-rastreabilidade.md](docs/99-rastreabilidade.md)                                   | Unidade → arquivo; requisito → arquivo               |

## Regras globais

- TypeScript `strict`; nunca `any`.
- Nenhum segredo em código ou em `NEXT_PUBLIC_*`. `DATABASE_URL` **nunca** existe no frontend.
- Todo acesso à API passa pelo cliente em `src/lib/api`. Nunca `fetch` solto em componentes.
- Use Server Components por padrão; `"use client"` somente em folhas interativas.
- Toda entrada de formulário é validada no cliente (UX) **e** reenviada para validação do servidor (autoridade).
- Todo texto visível ao usuário em pt-BR.

## Checklist de conformidade (global)

- [ ] Li os arquivos relevantes antes de implementar.
- [ ] Nenhuma tecnologia nova foi introduzida sem autorização.
- [ ] Itens `[PENDENTE DE DEFINIÇÃO]` foram perguntados, não assumidos.
- [ ] Contrato (campos, enums, erros) idêntico ao do backend.
- [ ] Telas funcionam em 360 px de largura (mobile-first).
