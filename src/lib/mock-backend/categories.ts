import "server-only";
import { conflict, notFound, userData } from "./store";
import type { CategoryRecord } from "./types";

// Simula: GET/POST /api/v1/categories, PUT/DELETE /api/v1/categories/:id (finance-control-back docs/02).

type CreateInput = Omit<CategoryRecord, "id">;
type UpdateInput = Omit<CategoryRecord, "id" | "type">; // o tipo é imutável

const byName = (a: CategoryRecord, b: CategoryRecord) => a.name.localeCompare(b.name, "pt-BR");

function assertUniqueName(list: CategoryRecord[], candidate: Pick<CategoryRecord, "name" | "type">, ignoreId?: string) {
  // uq_categorias_usuario_tipo_nome
  if (list.some((c) => c.id !== ignoreId && c.type === candidate.type && c.name === candidate.name)) {
    throw conflict("name", "Já existe uma categoria com este nome.");
  }
}

export const mockCategories = {
  list(userId: string): CategoryRecord[] {
    return [...userData(userId).categories].sort(byName);
  },

  create(userId: string, input: CreateInput): CategoryRecord {
    const data = userData(userId);
    assertUniqueName(data.categories, input);
    const created = { id: crypto.randomUUID(), ...input };
    data.categories.push(created);
    return created;
  },

  update(userId: string, id: string, input: UpdateInput): CategoryRecord {
    const data = userData(userId);
    const current = data.categories.find((c) => c.id === id);
    if (!current) throw notFound("Categoria");
    assertUniqueName(data.categories, { name: input.name, type: current.type }, id);
    Object.assign(current, input);
    return current;
  },

  /** RNF02: transações e recorrências ficam "Sem categoria" (ON DELETE SET NULL). */
  remove(userId: string, id: string): void {
    const data = userData(userId);
    if (!data.categories.some((c) => c.id === id)) throw notFound("Categoria");
    data.categories = data.categories.filter((c) => c.id !== id);
    for (const t of data.transactions) if (t.categoryId === id) t.categoryId = null;
    for (const r of data.recurrences) if (r.categoryId === id) r.categoryId = null;
  },
};
