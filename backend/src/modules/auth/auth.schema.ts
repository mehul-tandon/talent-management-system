import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER", "EMPLOYEE"]).default("HR_ADMIN"),
    firstName: z.string().optional().default("New"),
    lastName: z.string().optional().default("User"),
    departmentId: z.string().optional(),
    designation: z.string().optional().default("Pending Assignment")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});
