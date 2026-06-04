import { prisma } from "../../config/db.js";
import { enqueueEmailDelivery } from "../../services/background-jobs.service.js";
import { createUserNotification } from "../../services/notifications.service.js";
import { AppError } from "../../utils/app-error.js";
import { generateEmployeeCode } from "../../utils/employee-code.js";
import { hashValue } from "../../utils/password.js";
import { generateTemporaryPassword } from "../../utils/temporary-password.js";

export interface ListEmployeesInput {
  departmentId?: string;
  status?: "ACTIVE" | "ONBOARDING" | "NOTICE_PERIOD" | "INACTIVE";
  search?: string;
  page: number;
  limit: number;
}

export async function listEmployees(input: ListEmployeesInput) {
  const where = {
    deletedAt: null,
    ...(input.departmentId ? { departmentId: input.departmentId } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            { firstName: { contains: input.search, mode: "insensitive" as const } },
            { lastName: { contains: input.search, mode: "insensitive" as const } },
            { designation: { contains: input.search, mode: "insensitive" as const } },
            { empCode: { contains: input.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        department: true,
        manager: true,
        user: {
          select: { email: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit
    }),
    prisma.employee.count({ where })
  ]);

  return {
    data,
    meta: {
      total,
      page: input.page,
      totalPages: Math.ceil(total / input.limit)
    }
  };
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
    include: {
      department: true,
      manager: true,
      directReports: true,
      goals: true,
      compensation: {
        orderBy: { effectiveDate: "desc" },
        take: 3
      },
      user: {
        select: { email: true, role: true, lastLogin: true }
      }
    }
  });

  if (!employee) {
    throw new AppError("Employee not found", 404, "EMP_NOT_FOUND");
  }

  return employee;
}

export async function createEmployee(input: {
  email: string;
  role: "HR_ADMIN" | "HR_MANAGER" | "DEPT_MANAGER" | "EMPLOYEE";
  firstName: string;
  lastName: string;
  designation: string;
  departmentId: string;
  managerId?: string;
  location?: string;
  phone?: string;
  hireDate?: string;
  status?: "ACTIVE" | "ONBOARDING" | "NOTICE_PERIOD" | "INACTIVE";
  skills?: string[];
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("User email already exists", 409, "EMAIL_EXISTS");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashValue(temporaryPassword);
  const empCode = await generateEmployeeCode(prisma);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      role: input.role,
      passwordHash,
      companyId: undefined as any,
      employee: {
        create: {
          companyId: undefined as any,
          empCode,
          firstName: input.firstName,
          lastName: input.lastName,
          designation: input.designation,
          departmentId: input.departmentId,
          managerId: input.managerId,
          location: input.location,
          phone: input.phone,
          hireDate: input.hireDate ? new Date(input.hireDate) : new Date(),
          status: input.status ?? "ONBOARDING",
          skills: input.skills ?? []
        }
      }
    },
    include: {
      employee: true
    }
  });

  await Promise.all([
    createUserNotification({
      userId: user.id,
      type: "EMPLOYEE_ONBOARDING",
      title: "Your TalentOS account is ready",
      message: "Use your temporary password to sign in and complete your onboarding tasks.",
      meta: {
        employeeId: user.employee?.id,
        email: input.email
      }
    }),
    enqueueEmailDelivery({
      to: input.email,
      subject: "Your TalentOS account has been created",
      text: `Hi ${input.firstName}, your TalentOS account is ready. Temporary password: ${temporaryPassword}. Please sign in and change it immediately.`,
      html: `<p>Hi ${input.firstName},</p><p>Your TalentOS account is ready.</p><p><strong>Temporary password:</strong> ${temporaryPassword}</p><p>Please sign in and change it immediately.</p>`
    })
  ]);

  return {
    ...user,
    onboarding: {
      temporaryPassword,
      passwordSetupRequired: true
    }
  };
}

export async function updateEmployee(
  id: string,
  input: {
    firstName?: string;
    lastName?: string;
    designation?: string;
    departmentId?: string;
    managerId?: string | null;
    location?: string | null;
    phone?: string | null;
    status?: "ACTIVE" | "ONBOARDING" | "NOTICE_PERIOD" | "INACTIVE";
    skills?: string[];
  }
) {
  await getEmployeeById(id);
  return prisma.employee.update({
    where: { id },
    data: input
  });
}
