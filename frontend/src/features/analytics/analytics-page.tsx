import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { DashboardMetrics } from "../../types/api";
import { PageHeader } from "../../components/page-header";

export function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get<DashboardMetrics>("/analytics/dashboard")
  });

  return (
    <section className="page-grid">
      <PageHeader
        title="Analytics & Reporting"
        description="Core KPIs are aggregated server-side and exposed through a role-aware analytics endpoint."
      />

      <div className="two-column-grid">
        <article className="panel">
          <h3>Headcount Overview</h3>
          <div className="metric-block">
            <span>Total employees</span>
            <strong>{data?.headcount.total ?? "--"}</strong>
          </div>
          <div className="metric-block">
            <span>Active employees</span>
            <strong>{data?.headcount.active ?? "--"}</strong>
          </div>
        </article>

        <article className="panel">
          <h3>Recruitment Efficiency</h3>
          <div className="metric-block">
            <span>Average resume match</span>
            <strong>{data?.recruitment.averageMatchScore ?? "--"}%</strong>
          </div>
          <div className="metric-block">
            <span>Total applications</span>
            <strong>{data?.recruitment.applications ?? "--"}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}
