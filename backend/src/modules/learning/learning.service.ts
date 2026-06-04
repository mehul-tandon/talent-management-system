import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";

export async function listCourses() {
  return prisma.course.findMany({
    include: {
      _count: {
        select: { enrollments: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createCourse(input: {
  title: string;
  description: string;
  durationHrs: number;
  level: string;
  skills?: string[];
  isMandatory?: boolean;
}) {
  return prisma.course.create({
    data: {
      ...input,
      skills: input.skills ?? [],
      isMandatory: input.isMandatory ?? false
    }
  });
}

export async function enrollEmployee(input: {
  employeeId: string;
  courseId: string;
  score?: number;
  certificateUrl?: string;
  completedAt?: string;
}) {
  const [employee, course] = await Promise.all([
    prisma.employee.findUnique({ where: { id: input.employeeId }, select: { id: true, deletedAt: true } }),
    prisma.course.findUnique({ where: { id: input.courseId }, select: { id: true } })
  ]);

  if (!employee || employee.deletedAt) {
    throw new AppError("Employee not found", 404, "EMP_NOT_FOUND");
  }

  if (!course) {
    throw new AppError("Course not found", 404, "COURSE_NOT_FOUND");
  }

  return prisma.enrollment.upsert({
    where: {
      employeeId_courseId: {
        employeeId: input.employeeId,
        courseId: input.courseId
      }
    },
    create: {
      employeeId: input.employeeId,
      courseId: input.courseId,
      score: input.score,
      certificateUrl: input.certificateUrl,
      completedAt: input.completedAt ? new Date(input.completedAt) : undefined
    },
    update: {
      score: input.score,
      certificateUrl: input.certificateUrl,
      completedAt: input.completedAt ? new Date(input.completedAt) : null
    },
    include: {
      employee: true,
      course: true
    }
  });
}

export async function listEmployeeEnrollments(employeeId: string) {
  return prisma.enrollment.findMany({
    where: { employeeId },
    include: {
      course: true
    },
    orderBy: {
      enrolledAt: "desc"
    }
  });
}
