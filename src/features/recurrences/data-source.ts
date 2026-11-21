import "server-only";
import { ApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/session";
import { mockRecurrences } from "@/lib/mock-backend";
import {
  type Recurrence,
  type RecurrenceCreateInput,
  type RecurrenceDetail,
  type RecurrenceUpdateInput,
  recurrenceDetailSchema,
  recurrenceListSchema,
  recurrenceSchema,
} from "./schemas";

export interface RecurrencesDataSource {
  list(): Promise<Recurrence[]>;
  /** null quando não existe ou é de outro usuário (404). */
  get(id: string): Promise<RecurrenceDetail | null>;
  create(input: RecurrenceCreateInput): Promise<Recurrence>;
  update(id: string, input: RecurrenceUpdateInput): Promise<Recurrence>;
  remove(id: string): Promise<void>;
}

// TODO(back): as rotas de recorrências ainda não existem no finance-control-back. Ao implementá-las, troque por
// getApi() mantendo o parse com os schemas (contrato: backend docs/02 e 07):
//   list   → api.get("/api/v1/recurrences", recurrenceListSchema)
//   get    → api.get(`/api/v1/recurrences/${id}`, recurrenceDetailSchema)  (404 → null)
//   create → api.post("/api/v1/recurrences", input, recurrenceSchema)
//   update → api.put(`/api/v1/recurrences/${id}`, input, recurrenceSchema)
//   remove → api.delete(`/api/v1/recurrences/${id}`)
const mockDataSource: RecurrencesDataSource = {
  async list() {
    const { user } = await requireSession();
    return recurrenceListSchema.parse({ data: mockRecurrences.list(user.id) }).data;
  },

  async get(id) {
    const { user } = await requireSession();
    try {
      return recurrenceDetailSchema.parse(mockRecurrences.get(user.id, id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async create(input) {
    const { user } = await requireSession();
    return recurrenceSchema.parse(mockRecurrences.create(user.id, input));
  },

  async update(id, input) {
    const { user } = await requireSession();
    return recurrenceSchema.parse(mockRecurrences.update(user.id, id, input));
  },

  async remove(id) {
    const { user } = await requireSession();
    mockRecurrences.remove(user.id, id);
  },
};

export const recurrencesDataSource: RecurrencesDataSource = mockDataSource;
