import { z } from "zod";

export const employeeCreateSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    designation: z.string().min(1),
    departmentId: z.string().min(1),
    managerId: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    hireDate: z.string().datetime().optional(),
    status: z.enum(["ACTIVE", "ONBOARDING", "NOTICE_PERIOD", "INACTIVE"]).optional(),
    skills: z.array(z.string()).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const employeeUpdateSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    designation: z.string().min(1).optional(),
    departmentId: z.string().min(1).optional(),
    managerId: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    status: z.enum(["ACTIVE", "ONBOARDING", "NOTICE_PERIOD", "INACTIVE"]).optional(),
    skills: z.array(z.string()).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).default({})
});

export const employeeListSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    departmentId: z.string().optional(),
    status: z.enum(["ACTIVE", "ONBOARDING", "NOTICE_PERIOD", "INACTIVE"]).optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10)
  })
});
