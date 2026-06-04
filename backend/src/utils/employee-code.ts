import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";

const EMPLOYEE_CODE_PREFIX = "EMP";

function buildCandidateEmployeeCode() {
  return `${EMPLOYEE_CODE_PREFIX}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function generateEmployeeCode(prisma: Pick<PrismaClient, "employee">, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const empCode = buildCandidateEmployeeCode();
    const existingEmployee = await prisma.employee.findFirst({
      where: { empCode },
      select: { id: true }
    });

    if (!existingEmployee) {
      return empCode;
    }
  }

  throw new Error("Unable to generate a unique employee code");
}
