# 99 — Rastreabilidade (Frontend)

## Objetivo

Mostrar onde cada uma das seis unidades da disciplina e cada requisito do MVP foi contemplado na documentação do frontend.

## Escopo

Cobre o mapeamento **unidade → arquivo** e **requisito → arquivo**. Não cria regras novas.

## Regras e padrões

### Unidade → arquivo

| Unidade | Tema | Arquivo(s) | Conceitos contemplados |
|---|---|---|---|
| 1 | Introdução ao Python | [01-typescript-react-fundamentos.md](01-typescript-react-fundamentos.md) | tipagem estrita, `===`, props/objeto de opções (`*args`/`**kwargs`), TSDoc, HOF (decorators), uniões discriminadas, imutabilidade, composição × herança, polimorfismo por interface, módulos |
| 2 | HTTP, REST e primeiros passos | [02-consumo-http-rest-contratos.md](02-consumo-http-rest-contratos.md) | requisição/resposta, métodos, status codes (200/201/204/400/401/404/409/5xx), recursos e URIs, JSON, envelope de erro, cache |
| 3 | Primeira aplicação | [03-estrutura-projeto-configuracao.md](03-estrutura-projeto-configuracao.md) | isolamento de dependências, estrutura por features (blueprints), configuração por ambiente, `.env`, dev × produção |
| 4 | Application Factory e contextos | [04-composicao-di-contexto-nextjs.md](04-composicao-di-contexto-nextjs.md) | fábricas, lazy initialization, IoC/DI, importação circular, contexto de aplicação × de requisição, monólito modular |
| 5 | Empacotamento e testes | [05-empacotamento-scripts-testes.md](05-empacotamento-scripts-testes.md) | `package.json`, dependências runtime × dev, scripts, unit/E2E, cobertura |
| 6 | Estruturas básicas (dados) | [06-dados-formularios-validacao.md](06-dados-formularios-validacao.md) | espelho do modelo, restrições refletidas na UI, validação em duas camadas, RNF02 na interface |
| Transversal | Segurança | [07-autenticacao-seguranca.md](07-autenticacao-seguranca.md) | Better Auth client, proteção de rotas, segurança do navegador |
| Transversal | UI | [08-ui-responsividade-acessibilidade.md](08-ui-responsividade-acessibilidade.md) | mobile-first, estados de UI, acessibilidade |

### Conceito da disciplina → onde está

| Conceito exigido | Arquivo |
|---|---|
| Isolamento de dependências | 03, 05 |
| Modularização e separação de responsabilidades | 03, 04 |
| Application Factory (equivalente: fábricas) | 04 |
| Inversão de controle e injeção de dependência | 02, 04 |
| Configuração por ambiente | 03 |
| Ciclo de vida e contexto de requisição | 04 |
| Baixo acoplamento | 01, 04 |
| Monólito modular | 04 |
| Empacotamento e automação | 05 |
| Testes automatizados | 05 |
| Segurança e validação | 06, 07 |

### Requisito do MVP → arquivo

| Requisito | Arquivo(s) |
|---|---|
| RF01 Autenticação | 07 |
| RF02 Categorias | 02, 03, 06 |
| RF03 Transações | 04, 06 |
| RF04 Projeção de despesas fixas | 02, 03 |
| RF05 Dashboard | 02, 08 |
| RF06 Listagem mensal | 02, 06, 08 |
| RF07 Importação/exportação | 02, 08 (fluxo **[PENDENTE DE DEFINIÇÃO]**) |
| RNF01 Responsividade | 05, 08 |
| RNF02 Integridade relacional (reflexo na UI) | 05, 06, 08 |
| RNF03 Segurança | 03, 07 |
| RNF04 Validação | 06 |

### Consistência com o backend

| Tema | Frontend | Backend |
|---|---|---|
| Contrato da API | 02 | 02 |
| Schemas e validação | 06 | 07 |
| Autenticação | 07 | 07 |
| Configuração/ambientes | 03 | 03 |
| Composição/DI | 04 | 04 |
| Testes | 05 | 05 |

## Exemplos de código

Não se aplica (arquivo de referência cruzada).

## Boas práticas e anti-padrões

- Atualize esta tabela sempre que um arquivo de `docs/` for criado, renomeado ou removido.
- Não registre aqui regras novas; coloque-as no arquivo temático e referencie-o.

## Checklist de conformidade

- [ ] Todas as seis unidades têm ao menos um arquivo associado.
- [ ] Todos os RFs/RNFs do MVP têm arquivo associado.
- [ ] Itens `[PENDENTE DE DEFINIÇÃO]` do índice (`README.md`) estão refletidos nos arquivos citados.
- [ ] Contratos e convenções conferem com `finance-control-back/docs`.
