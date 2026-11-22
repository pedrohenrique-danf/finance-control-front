import { UNCATEGORIZED_COLOR } from "@/components/common/category-icon";
import type { DashboardCategory, DashboardSummary } from "./schemas";

export interface Slice {
  key: string;
  name: string;
  color: string;
  total: number;
}

/** Máximo de fatias com nome próprio; o resto vira "Outras" (cor neutra, nunca uma cor gerada). */
export const MAX_SLICES = 6;
export const OTHERS_COLOR = "#D9DBCF";

/** Fatias do donut de despesas por categoria, da maior para a menor. */
export function expenseSlices(summary: DashboardSummary, categories: readonly DashboardCategory[]): Slice[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const slices = summary.byCategory
    .filter((e) => e.type === "despesa" && Number(e.total) > 0)
    .map((e): Slice => {
      const category = e.categoryId ? byId.get(e.categoryId) : undefined;
      return {
        key: e.categoryId ?? "sem-categoria",
        name: category?.name ?? "Sem categoria",
        color: category?.color ?? UNCATEGORIZED_COLOR,
        total: Number(e.total),
      };
    })
    .sort((a, b) => b.total - a.total);
  if (slices.length <= MAX_SLICES) return slices;
  const head = slices.slice(0, MAX_SLICES - 1);
  const rest = slices.slice(MAX_SLICES - 1).reduce((acc, s) => acc + s.total, 0);
  return [...head, { key: "outras", name: "Outras", color: OTHERS_COLOR, total: Math.round(rest * 100) / 100 }];
}

/** Percentuais inteiros que somam 100 (maior resto), para a legenda não fechar em 99% ou 101%. */
export function percentages(values: readonly number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map(Math.floor);
  let missing = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, rest: r - Math.floor(r) })).sort((a, b) => b.rest - a.rest);
  for (const { i } of order) {
    if (missing <= 0) break;
    floors[i] = (floors[i] ?? 0) + 1;
    missing--;
  }
  return floors;
}

/** Topo "redondo" do eixo Y (1, 2, 2,5 ou 5 × 10ⁿ) acima do maior valor. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value) ?? 10;
  return step * power;
}

/** Primeiro acesso: nada lançado no mês nem nos 5 anteriores. */
export function isEmptyHistory(summary: DashboardSummary): boolean {
  return summary.history.every((h) => Number(h.income) === 0 && Number(h.expense) === 0);
}
