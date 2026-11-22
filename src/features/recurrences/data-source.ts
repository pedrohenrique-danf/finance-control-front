import "server-only";
import { nullIfNotFound } from "@/lib/api/errors";
import { getApi } from "@/lib/api/server";
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

const path = (id: string) => `/api/v1/recurrences/${encodeURIComponent(id)}`;

// Contrato: finance-control-back docs/02 e 07 ("Despesas fixas").
export const recurrencesDataSource: RecurrencesDataSource = {
  async list() {
    const api = await getApi();
    return (await api.get("/api/v1/recurrences", recurrenceListSchema)).data;
  },

  async get(id) {
    const api = await getApi();
    return nullIfNotFound(api.get(path(id), recurrenceDetailSchema));
  },

  async create(input) {
    const api = await getApi();
    return api.post("/api/v1/recurrences", input, recurrenceSchema);
  },

  async update(id, input) {
    const api = await getApi();
    return api.put(path(id), input, recurrenceSchema);
  },

  async remove(id) {
    const api = await getApi();
    await api.delete(path(id));
  },
};
