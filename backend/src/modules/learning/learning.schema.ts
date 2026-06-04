import { z } from "zod";

export const courseCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(10),
    durationHrs: z.coerce.number().int().positive(),
    level: z.string().min(1),
    skills: z.array(z.string()).default([]),
    isMandatory: z.coerce.boolean().default(false)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const enrollmentUpsertSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1),
    courseId: z.string().min(1),
    score: z.coerce.number().int().min(0).max(100).optional(),
    certificateUrl: z.string().url().optional(),
    completedAt: z.string().datetime().optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const employeeEnrollmentListSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    employeeId: z.string().min(1)
  }),
  query: z.object({}).default({})
});
