# 07 — Autenticação e Segurança no Frontend

> Transversal às Unidades 2, 4 e 6: sessão e contexto de requisição, proteção de rotas, validação e segredos (RF01, RNF03, RNF04).

## Objetivo

Definir como o frontend usa o **Better Auth (cliente)** para cadastro/login, como protege rotas privadas e como evita vazamento de dados e vulnerabilidades comuns. A autenticação em si (hash, sessão, OAuth) é implementada **no backend**.

## Escopo

**Cobre:** cliente Better Auth, login/cadastro/logout, Google, proteção de rotas (middleware/proxy + verificação no servidor), tratamento de 401, segurança do navegador.
**Não cobre:** configuração do Better Auth no servidor (ver backend 07). Versão instalada: **Better Auth 1.7.18** (mesma do backend; mantenha as duas sincronizadas). Ao atualizar, reconfirme os nomes da API do cliente.

## Regras e padrões

### Princípios

- O frontend **nunca** lê, armazena ou envia o token de sessão manualmente. O cookie é `httpOnly` e gerenciado pelo backend.
- **Proibido**: tokens em `localStorage`/`sessionStorage`, JWT caseiro, hash de senha no cliente.
- A estratégia **mesma origem** (rewrites para o backend) é a recomendada e já está configurada em `next.config.ts`; a decisão formal é **[PENDENTE DE DEFINIÇÃO]** (ver 03): o cookie de sessão fica no domínio do frontend, o que permite o middleware ler sua presença. Com origens distintas, o middleware não enxerga o cookie e a proteção deve depender apenas da verificação no servidor.
- Login e cadastro rodam **no navegador** (Better Auth client), porque o `Set-Cookie` precisa chegar ao navegador. Server Actions **não** repassam `Set-Cookie` do backend.

### Proteção de rotas (RNF03) — duas camadas

1. **Middleware/proxy (otimista):** apenas verifica a **presença** do cookie de sessão e redireciona para `/login`. Melhora a UX, **não** é segurança.
2. **Layout privado (autoritativo):** `requireSession()` consulta o backend (`/api/auth/get-session`) a cada requisição de servidor. Sem sessão válida → `redirect("/login")`.

O backend é a barreira real: toda API privada devolve 401 sem sessão.

No Next 16 o antigo middleware chama-se **`src/proxy.ts`** e exporta a função `proxy`.

### Tratamento de sessão expirada

- Em Server Components/Actions, um `ApiError` 401 leva a `redirect("/login?next=<rota interna>")`.
- `next` aceita **somente caminhos internos** que comecem com `/` e não com `//` (evita *open redirect*).

### Segurança do navegador

- React escapa conteúdo por padrão. **Proibido** `dangerouslySetInnerHTML` com dado do usuário.
- Nunca interpole dado do usuário em URLs, HTML ou scripts sem codificar.
- Segredos: nada sensível em `NEXT_PUBLIC_*`, no código ou no bundle. `DATABASE_URL`, `BETTER_AUTH_SECRET`, credenciais do Google **não existem** neste repositório.
- Cabeçalhos de segurança (`X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`/`X-Frame-Options`) em `next.config.ts → headers()`. Política de CSP: **[PENDENTE DE DEFINIÇÃO]**.
- Logs e telemetria sem senha, cookie ou valores financeiros completos.
- Exibir `requestId` em erros 5xx; nunca stack trace.
- Mensagens de login genéricas ("E-mail ou senha inválidos") — não revele se o e-mail existe.

## Exemplos de código

### Cliente Better Auth (mesma origem)

```ts
// src/lib/auth/auth-client.ts
"use client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient(); // mesma origem: usa /api/auth via rewrites
```

### Formulário de login (Client Component)

```tsx
// src/features/auth/components/login-form.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { safeNextPath } from "@/features/auth/safe-next-path";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });
    if (error) return setError("E-mail ou senha inválidos.");
    router.replace(safeNextPath(next));
    router.refresh();
  }

  async function onGoogle() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (/* <form action={onSubmit}> com <label>s, botão "Entrar" e botão "Entrar com Google" */ null);
}
```

O cadastro usa `authClient.signUp.email({ email, password, name })` e valida a senha com Zod (mínimo acordado com o backend, **8 caracteres**).

### Redirecionamento seguro

```ts
// src/features/auth/safe-next-path.ts
export function safeNextPath(next: string | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
```

### Sessão no servidor

```ts
// src/lib/auth/session.ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getApi } from "@/lib/api/server";
import { ApiError } from "@/lib/api/errors";

const sessionSchema = z
  .looseObject({ user: z.object({ id: z.string(), name: z.string(), email: z.string() }) }) // Zod 4: substitui .passthrough()
  .nullable();                                   // o endpoint retorna null sem sessão

export const getSession = cache(async () => {
  const api = await getApi();
  try {
    return await api.get("/api/auth/get-session", sessionSchema);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
```

### Middleware/proxy (verificação otimista)

```ts
// src/proxy.ts  (Next 16)
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PRIVATE = ["/dashboard", "/transactions", "/categories", "/recurrences", "/import-export"];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(getSessionCookie(request));   // presença apenas — NÃO valida a sessão

  if (PRIVATE.some((p) => pathname.startsWith(p)) && !hasSessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (AUTH_PAGES.includes(pathname) && hasSessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/transactions/:path*", "/categories/:path*", "/recurrences/:path*", "/import-export/:path*", "/login", "/register"] };
```

### Cabeçalhos de segurança

```ts
// next.config.ts (trecho)
async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      // Content-Security-Policy: [PENDENTE DE DEFINIÇÃO]
    ],
  }];
}
```

### Testes

```ts
it.each([["/dashboard", "/dashboard"], ["//evil.com", "/dashboard"], ["https://evil.com", "/dashboard"], [undefined, "/dashboard"]])(
  "safeNextPath(%s) → %s", (input, expected) => expect(safeNextPath(input)).toBe(expected));
```

```ts
// E2E: tentativa de acesso sem login e logout
test("bloqueia rota privada sem sessão", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/login/);
});
```

## Boas práticas e anti-padrões

| Faça | Evite |
|---|---|
| Cookie `httpOnly` gerenciado pelo backend | Token em `localStorage` |
| Verificação autoritativa no servidor (`requireSession`) | Confiar apenas no middleware |
| Login/cadastro pelo Better Auth client | Reimplementar login com `fetch` e guardar token |
| Validar `next` como caminho interno | Redirecionar para qualquer URL do query string |
| Mensagem genérica de login | "Esse e-mail não existe" |
| Segredos só no servidor/backend | `NEXT_PUBLIC_*` com chave ou segredo |
| React escapando conteúdo | `dangerouslySetInnerHTML` com entrada do usuário |

## Checklist de conformidade

- [ ] Login/cadastro/Google usam `authClient`; nenhum token é manipulado manualmente.
- [ ] Rotas privadas passam por middleware/proxy **e** `requireSession()` no layout.
- [ ] 401 em servidor redireciona para `/login?next=` com caminho validado.
- [ ] Nenhum segredo em `NEXT_PUBLIC_*` ou no código; nenhum `DATABASE_URL`.
- [ ] Cabeçalhos de segurança configurados; CSP registrada como pendência ou definida.
- [ ] Sem `dangerouslySetInnerHTML` com dados do usuário.
- [ ] Teste E2E garante bloqueio de rota privada para anônimos.
