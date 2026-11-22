import "server-only";
import { getApi } from "@/lib/api/server";
import { type DashboardSummary, dashboardSummarySchema } from "./schemas";

export interface DashboardDataSource {
  summary(month: string): Promise<DashboardSummary>;
}

// Contrato: finance-control-back docs/02 ("Resumo do dashboard").
export const dashboardDataSource: DashboardDataSource = {
  async summary(month) {
    const api = await getApi();
    return api.get("/api/v1/dashboard/summary", dashboardSummarySchema, { month });
  },
};
