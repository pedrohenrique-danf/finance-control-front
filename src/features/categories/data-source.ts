import "server-only";
import { requireSession } from "@/lib/auth/session";
import { mockCategories, mockDashboard } from "@/lib/mock-backend";
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

// TODO(back): as rotas de categorias ainda não existem no finance-control-back. Ao implementá-las, troque
// por uma implementação com getApi() (o parse com os schemas abaixo continua igual):
//   list   → api.get("/api/v1/categories", categoryListSchema)
//   create → api.post("/api/v1/categories", input, categorySchema)
//   update → api.put(`/api/v1/categories/${id}`, input, categorySchema)
//   remove → api.delete(`/api/v1/categories/${id}`)
//   totais do mês → api.get("/api/v1/dashboard/summary", …, { month }).byCategory  (backend docs/02)
const mockDataSource: CategoriesDataSource = {
  async list() {
    const { user } = await requireSession();
    return categoryListSchema.parse({ data: mockCategories.list(user.id) }).data;
  },

  async listWithTotals(month) {
    const { user } = await requireSession();
    const categories = categoryListSchema.parse({ data: mockCategories.list(user.id) }).data;
    const totals = categoryTotalsSchema.parse({ data: mockDashboard.summary(user.id, month).byCategory }).data;
    const totalOf = (type: CategoryType, categoryId: string | null) =>
      totals.find((t) => t.type === type && t.categoryId === categoryId)?.total ?? "0.00";
    const byType = (type: CategoryType): CategoryTotalsByType => ({
      categories: categories.filter((c) => c.type === type).map((c) => ({ ...c, total: totalOf(type, c.id) })),
      uncategorizedTotal: totalOf(type, null),
    });
    return { despesa: byType("despesa"), receita: byType("receita") };
  },

  async create(input) {
    const { user } = await requireSession();
    return categorySchema.parse(mockCategories.create(user.id, input));
  },

  async update(id, input) {
    const { user } = await requireSession();
    return categorySchema.parse(mockCategories.update(user.id, id, input));
  },

  async remove(id) {
    const { user } = await requireSession();
    mockCategories.remove(user.id, id);
  },
};

export const categoriesDataSource: CategoriesDataSource = mockDataSource;
