import { z } from "zod";

export const compensationCreateSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1),
    effectiveDate: z.string().datetime(),
    baseSalary: z.coerce.number().positive(),
    bonus: z.coerce.number().nonnegative().optional(),
    currency: z.string().min(3).max(3).default("INR")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const employeeCompensationListSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    employeeId: z.string().min(1)
  }),
  query: z.object({}).default({})
});
