import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";

export async function createCompensationRecord(input: {
  employeeId: string;
  effectiveDate: string;
  baseSalary: number;
  bonus?: number;
  currency?: string;
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    select: { id: true, deletedAt: true }
  });

  if (!employee || employee.deletedAt) {
    throw new AppError("Employee not found", 404, "EMP_NOT_FOUND");
  }

  return prisma.compensation.create({
    data: {
      employeeId: input.employeeId,
      effectiveDate: new Date(input.effectiveDate),
      baseSalary: input.baseSalary,
      bonus: input.bonus,
      currency: input.currency ?? "INR"
    }
  });
}

export async function listEmployeeCompensation(employeeId: string) {
  return prisma.compensation.findMany({
    where: { employeeId },
    orderBy: { effectiveDate: "desc" }
  });
}
