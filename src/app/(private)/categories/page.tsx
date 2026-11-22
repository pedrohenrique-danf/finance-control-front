import type { Metadata } from "next";
import { CategoriesView, categoriesDataSource } from "@/features/categories";
import { parseMonthParam } from "@/lib/format/date";

export const metadata: Metadata = { title: "Categorias" };

// RF02: categorias de receitas e despesas, com o total lançado no mês.
export default async function CategoriesPage({ searchParams }: PageProps<"/categories">) {
  const month = parseMonthParam((await searchParams).month);
  const data = await categoriesDataSource.listWithTotals(month);
  return <CategoriesView month={month} data={data} />;
}
