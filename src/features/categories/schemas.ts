import { z } from "zod";

// SYNC: finance-control-back docs/07 (createCategorySchema / updateCategorySchema) e
// src/db/schema/categories.ts (nome ≤ 60 no banco; o contrato limita a 50).
export const transactionTypes = ["receita", "despesa"] as const;
export type CategoryType = (typeof transactionTypes)[number];

export const CATEGORY_NAME_MAX = 50;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(transactionTypes),
  color: z.string(),
  icon: z.string().nullable(),
});
export type Category = z.output<typeof categorySchema>;

export const categoryListSchema = z.object({ data: z.array(categorySchema) });

export const categoryTotalsSchema = z.object({
  data: z.array(z.object({ type: z.enum(transactionTypes), categoryId: z.string().nullable(), total: z.string() })),
});

/** Categoria com o total lançado no mês selecionado. */
export type CategoryWithTotal = Category & { total: string };

/** Categorias de um tipo com totais do mês, incluindo o que ficou "Sem categoria" (RNF02). */
export interface CategoryTotalsByType {
  categories: CategoryWithTotal[];
  uncategorizedTotal: string;
}

const hexColor = /^#[0-9a-fA-F]{6}$/;

/** Formulário de criação/edição (o tipo só é enviado na criação: é imutável no backend). */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Dê um nome à categoria.")
    .max(CATEGORY_NAME_MAX, `Use no máximo ${CATEGORY_NAME_MAX} caracteres.`),
  type: z.enum(transactionTypes),
  color: z.string().regex(hexColor, "Escolha uma cor."),
  icon: z.string().trim().min(1, "Escolha um ícone.").max(40),
});
export type CategoryFormValues = z.output<typeof categoryFormSchema>;
