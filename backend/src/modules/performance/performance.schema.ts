import { z } from "zod";

export const goalCreateSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    dueDate: z.string().datetime(),
    progress: z.coerce.number().min(0).max(100).default(0),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "AT_RISK"]).default("NOT_STARTED"),
    type: z.enum(["INDIVIDUAL", "TEAM", "COMPANY"]).default("INDIVIDUAL")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const goalUpdateSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    dueDate: z.string().datetime().optional(),
    progress: z.coerce.number().min(0).max(100).optional(),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "AT_RISK"]).optional(),
    type: z.enum(["INDIVIDUAL", "TEAM", "COMPANY"]).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).default({})
});

export const reviewCycleCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    type: z.enum(["MID_YEAR", "ANNUAL"]),
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const reviewSubmitSchema = z.object({
  body: z.object({
    revieweeId: z.string().min(1),
    reviewerId: z.string().min(1),
    type: z.enum(["SELF", "PEER", "MANAGER", "DIRECT_REPORT"]),
    ratings: z.record(z.number().min(1).max(5)),
    comments: z.string().optional()
  }),
  params: z.object({
    cycleId: z.string().min(1)
  }),
  query: z.object({}).default({})
});
