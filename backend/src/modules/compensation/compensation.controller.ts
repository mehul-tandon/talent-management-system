import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { success } from "../../utils/api-response.js";
import { createCompensationRecord, listEmployeeCompensation } from "./compensation.service.js";

export const postCompensation = asyncHandler(async (req: Request, res: Response) => {
  const compensation = await createCompensationRecord(req.body);
  res.status(201).json(success(compensation));
});

export const getEmployeeCompensation = asyncHandler(async (req: Request, res: Response) => {
  const compensation = await listEmployeeCompensation(String(req.params.employeeId));
  res.json(success(compensation));
});
