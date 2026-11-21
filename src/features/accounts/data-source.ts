import "server-only";
import { ApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/session";
import { mockValueSources } from "@/lib/mock-backend";
import { type Account, type AccountInput, accountListSchema, accountSchema } from "./schemas";

/** Acesso a dados de contas e cartões (tabela fontes_valor). */
export interface AccountsDataSource {
  list(): Promise<Account[]>;
  /** null quando não existe ou é de outro usuário (404). */
  get(id: string): Promise<Account | null>;
  create(input: AccountInput): Promise<Account>;
  update(id: string, input: AccountInput): Promise<Account>;
}

// TODO(back): as rotas de fontes_valor ainda não existem no finance-control-back (contrato: docs/02 e 07).
// Ao implementá-las, troque por getApi() mantendo o parse com os schemas:
//   list   → api.get("/api/v1/value-sources", accountListSchema)
//   get    → api.get(`/api/v1/value-sources/${id}`, accountSchema)  (404 → null)
//   create → api.post("/api/v1/value-sources", input, accountSchema)
//   update → api.put(`/api/v1/value-sources/${id}`, input, accountSchema)
const mockDataSource: AccountsDataSource = {
  async list() {
    const { user } = await requireSession();
    return accountListSchema.parse({ data: mockValueSources.list(user.id) }).data;
  },

  async get(id) {
    const { user } = await requireSession();
    try {
      return accountSchema.parse(mockValueSources.get(user.id, id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async create(input) {
    const { user } = await requireSession();
    return accountSchema.parse(mockValueSources.create(user.id, input));
  },

  async update(id, input) {
    const { user } = await requireSession();
    return accountSchema.parse(mockValueSources.update(user.id, id, input));
  },
};

export const accountsDataSource: AccountsDataSource = mockDataSource;
