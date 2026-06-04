import { z } from "zod";

export const jobCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    departmentId: z.string().min(1),
    jdText: z.string().min(20),
    requiredSkills: z.array(z.string()).default([]),
    openings: z.coerce.number().min(1).default(1),
    status: z.enum(["DRAFT", "OPEN", "CLOSED", "ON_HOLD"]).default("DRAFT")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const jobUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    departmentId: z.string().min(1).optional(),
    jdText: z.string().min(20).optional(),
    requiredSkills: z.array(z.string()).optional(),
    openings: z.coerce.number().min(1).optional(),
    status: z.enum(["DRAFT", "OPEN", "CLOSED", "ON_HOLD"]).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).default({})
});

export const applicationCreateSchema = z.object({
  body: z.object({
    applicantName: z.string().min(1),
    email: z.string().email(),
    resumeUrl: z.string().url().optional(),
    resumeText: z.string().min(20).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).default({})
});

export const applicationStageSchema = z.object({
  body: z.object({
    stage: z.enum(["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"])
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).default({})
});

export const applicationListSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    stage: z.enum(["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]).optional()
  })
});
