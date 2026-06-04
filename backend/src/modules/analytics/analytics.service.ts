import { prisma } from "../../config/db.js";

export async function getDashboardMetrics() {
  const [employeeCount, activeEmployees, openJobs, reviewCount, applicationStageBreakdown, applicationScoreAggregate, goalProgressAggregate] = await Promise.all([
    prisma.employee.count({ where: { deletedAt: null } }),
    prisma.employee.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.jobPosting.count({ where: { status: "OPEN", deletedAt: null } }),
    prisma.review.count(),
    prisma.application.groupBy({
      by: ["stage"],
      _count: { _all: true },
      _avg: { aiMatchScore: true }
    }),
    prisma.application.aggregate({
      _count: { _all: true },
      _avg: { aiMatchScore: true }
    }),
    prisma.goal.aggregate({
      _avg: { progress: true }
    })
  ]);

  const stageBreakdown = applicationStageBreakdown.reduce<Record<string, number>>((acc, stage) => {
    acc[stage.stage] = stage._count._all;
    return acc;
  }, {});

  const averageMatchScore = Math.round(applicationScoreAggregate._avg.aiMatchScore ?? 0);
  const goalProgress = Math.round(goalProgressAggregate._avg.progress ?? 0);

  return {
    headcount: {
      total: employeeCount,
      active: activeEmployees
    },
    recruitment: {
      openJobs,
      applications: applicationScoreAggregate._count._all,
      averageMatchScore,
      stageBreakdown
    },
    performance: {
      reviewCount,
      averageGoalProgress: goalProgress
    }
  };
}
