import { prisma } from "../../config/db.js";

export async function createGoal(input: {
  employeeId: string;
  title: string;
  description: string;
  dueDate: string;
  progress: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK";
  type: "INDIVIDUAL" | "TEAM" | "COMPANY";
}) {
  return prisma.goal.create({
    data: {
      ...input,
      dueDate: new Date(input.dueDate)
    }
  });
}

export async function updateGoal(
  id: string,
  input: {
    employeeId?: string;
    title?: string;
    description?: string;
    dueDate?: string;
    progress?: number;
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK";
    type?: "INDIVIDUAL" | "TEAM" | "COMPANY";
  }
) {
  return prisma.goal.update({
    where: { id },
    data: {
      ...input,
      ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {})
    }
  });
}

export async function listGoalsForManager(managerId: string) {
  return prisma.goal.findMany({
    where: {
      employee: {
        managerId
      }
    },
    include: {
      employee: true
    },
    orderBy: {
      dueDate: "asc"
    }
  });
}

export async function createReviewCycle(input: {
  name: string;
  type: "MID_YEAR" | "ANNUAL";
  startDate: string;
  endDate: string;
}) {
  return prisma.reviewCycle.create({
    data: {
      ...input,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate)
    }
  });
}

export async function submitReview(cycleId: string, input: {
  revieweeId: string;
  reviewerId: string;
  type: "SELF" | "PEER" | "MANAGER" | "DIRECT_REPORT";
  ratings: Record<string, number>;
  comments?: string;
}) {
  return prisma.review.create({
    data: {
      cycleId,
      revieweeId: input.revieweeId,
      reviewerId: input.reviewerId,
      type: input.type,
      ratings: input.ratings,
      comments: input.comments,
      status: "SUBMITTED"
    }
  });
}

export async function getReviewAggregate(employeeId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      revieweeId: employeeId,
      status: {
        in: ["SUBMITTED", "CALIBRATED", "FINALIZED"]
      }
    }
  });

  const summary = reviews.reduce<Record<string, { total: number; count: number }>>((acc, review) => {
    const ratings = review.ratings as Record<string, number>;
    Object.entries(ratings).forEach(([key, value]) => {
      acc[key] ??= { total: 0, count: 0 };
      acc[key].total += value;
      acc[key].count += 1;
    });
    return acc;
  }, {});

  const averages = Object.fromEntries(
    Object.entries(summary).map(([key, value]) => [key, Number((value.total / value.count).toFixed(2))])
  );

  return {
    reviewCount: reviews.length,
    averages,
    reviews
  };
}
