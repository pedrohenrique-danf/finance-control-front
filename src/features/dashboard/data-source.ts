import "server-only";
import { requireSession } from "@/lib/auth/session";
import { mockDashboard } from "@/lib/mock-backend";
import { type DashboardSummary, dashboardSummarySchema } from "./schemas";

export interface DashboardDataSource {
  summary(month: string): Promise<DashboardSummary>;
}

// TODO(back): a rota ainda não existe no finance-control-back. Ao implementá-la, troque por:
//   api.get("/api/v1/dashboard/summary", dashboardSummarySchema, { month })   (contrato: backend docs/02)
const mockDataSource: DashboardDataSource = {
  async summary(month) {
    const { user } = await requireSession();
    return dashboardSummarySchema.parse(mockDashboard.summary(user.id, month));
  },
};

export const dashboardDataSource: DashboardDataSource = mockDataSource;
