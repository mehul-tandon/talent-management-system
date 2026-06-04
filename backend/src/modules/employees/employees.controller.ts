import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { success } from "../../utils/api-response.js";
import { createEmployee, getEmployeeById, listEmployees, updateEmployee } from "./employees.service.js";

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const result = await listEmployees(req.query as unknown as Parameters<typeof listEmployees>[0]);
  res.json(success(result.data, result.meta));
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await getEmployeeById(String(req.params.id));
  res.json(success(employee));
});

export const postEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await createEmployee(req.body);
  res.status(201).json(success(employee));
});

export const patchEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await updateEmployee(String(req.params.id), req.body);
  res.json(success(employee));
});
