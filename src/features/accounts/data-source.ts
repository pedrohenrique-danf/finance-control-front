import "server-only";
import { cache } from "react";
import { nullIfNotFound } from "@/lib/api/errors";
import { getApi } from "@/lib/api/server";
import { type Account, type AccountInput, accountListSchema, accountSchema } from "./schemas";

/** Acesso a dados de contas e cartões (tabela fontes_valor). */
export interface AccountsDataSource {
  list(): Promise<Account[]>;
  /** null quando não existe ou é de outro usuário (404). */
  get(id: string): Promise<Account | null>;
  create(input: AccountInput): Promise<Account>;
  update(id: string, input: AccountInput): Promise<Account>;
}

// Contrato: finance-control-back docs/02 e 07 ("Contas e cartões").
// Layout (formulário global) e página pedem a lista na mesma requisição: uma chamada só.
const listAccounts = cache(async () => {
  const api = await getApi();
  return (await api.get("/api/v1/value-sources", accountListSchema)).data;
});

export const accountsDataSource: AccountsDataSource = {
  list: listAccounts,

  async get(id) {
    const api = await getApi();
    return nullIfNotFound(api.get(`/api/v1/value-sources/${encodeURIComponent(id)}`, accountSchema));
  },

  async create(input) {
    const api = await getApi();
    return api.post("/api/v1/value-sources", input, accountSchema);
  },

  async update(id, input) {
    const api = await getApi();
    return api.put(`/api/v1/value-sources/${encodeURIComponent(id)}`, input, accountSchema);
  },
};
