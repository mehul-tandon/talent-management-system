import { z } from "zod";

export const departmentCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    location: z.string().optional(),
    costCenter: z.string().optional(),
    parentId: z.string().optional(),
    headId: z.string().optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});
