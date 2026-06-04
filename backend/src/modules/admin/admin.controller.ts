import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { success } from "../../utils/api-response.js";
import { createDepartment, listDepartments } from "./admin.service.js";

export const getDepartments = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await listDepartments();
  res.json(success(departments));
});

export const postDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await createDepartment(req.body);
  res.status(201).json(success(department));
});
