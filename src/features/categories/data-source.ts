import "server-only";
import { cache } from "react";
import { z } from "zod";
import { getApi } from "@/lib/api/server";
import {
  type Category,
  type CategoryFormValues,
  type CategoryTotalsByType,
  type CategoryType,
  categoryListSchema,
  categorySchema,
  categoryTotalsSchema,
} from "./schemas";

/** Acesso a dados de categorias. As telas e actions dependem só desta interface. */
export interface CategoriesDataSource {
  list(): Promise<Category[]>;
  listWithTotals(month: string): Promise<Record<CategoryType, CategoryTotalsByType>>;
  create(input: CategoryFormValues): Promise<Category>;
  update(id: string, input: Omit<CategoryFormValues, "type">): Promise<Category>;
  remove(id: string): Promise<void>;
}

/** Só o trecho do resumo do mês que a tela de categorias usa (backend docs/02, `byCategory`). */
const summaryTotalsSchema = z.object({ byCategory: categoryTotalsSchema.shape.data });

// Contrato: finance-control-back docs/02 e 07 ("Categorias").
// Layout (formulário global) e página pedem a lista na mesma requisição: uma chamada só.
const listCategories = cache(async () => {
  const api = await getApi();
  return (await api.get("/api/v1/categories", categoryListSchema)).data;
});

export const categoriesDataSource: CategoriesDataSource = {
  list: listCategories,

  async listWithTotals(month) {
    const api = await getApi();
    const [categories, { byCategory: totals }] = await Promise.all([
      listCategories(),
      api.get("/api/v1/dashboard/summary", summaryTotalsSchema, { month }),
    ]);
    const totalOf = (type: CategoryType, categoryId: string | null) =>
      totals.find((t) => t.type === type && t.categoryId === categoryId)?.total ?? "0.00";
    const byType = (type: CategoryType): CategoryTotalsByType => ({
      categories: categories.filter((c) => c.type === type).map((c) => ({ ...c, total: totalOf(type, c.id) })),
      uncategorizedTotal: totalOf(type, null),
    });
    return { despesa: byType("despesa"), receita: byType("receita") };
  },

  async create(input) {
    const api = await getApi();
    return api.post("/api/v1/categories", input, categorySchema);
  },

  async update(id, input) {
    const api = await getApi();
    return api.put(`/api/v1/categories/${encodeURIComponent(id)}`, input, categorySchema);
  },

  async remove(id) {
    const api = await getApi();
    await api.delete(`/api/v1/categories/${encodeURIComponent(id)}`);
  },
};
