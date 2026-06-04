import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { DashboardMetrics } from "../../types/api";
import { PageHeader } from "../../components/page-header";
import { StatCard } from "../../components/stat-card";

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardMetrics>("/analytics/dashboard")
  });

  return (
    <section className="page-grid">
      <PageHeader
        title="Executive Dashboard"
        description="A real-time control view over headcount, recruiting throughput, and performance activity."
      />

      <div className="stats-grid">
        <StatCard label="Total Headcount" value={data?.headcount.total ?? "--"} tone="accent" />
        <StatCard label="Active Employees" value={data?.headcount.active ?? "--"} />
        <StatCard label="Open Roles" value={data?.recruitment.openJobs ?? "--"} />
        <StatCard label="Applications" value={data?.recruitment.applications ?? "--"} />
        <StatCard label="Avg Resume Match" value={`${data?.recruitment.averageMatchScore ?? "--"}%`} />
        <StatCard label="Avg Goal Progress" value={`${data?.performance.averageGoalProgress ?? "--"}%`} />
      </div>

      <div className="two-column-grid">
        <article className="panel">
          <h3>Applicant Pipeline</h3>
          <div className="list-stack">
            {Object.entries(data?.recruitment.stageBreakdown ?? {}).map(([stage, count]) => (
              <div className="row-between" key={stage}>
                <span>{stage}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h3>What This Build Includes</h3>
          <ul className="bullet-list">
            <li>JWT auth with refresh cookie flow</li>
            <li>Employee directory and detail-ready API shape</li>
            <li>Job postings, applications, and AI-style resume scoring fallback</li>
            <li>Goals, review cycles, and 360 review aggregation</li>
            <li>Department management and analytics aggregation</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
