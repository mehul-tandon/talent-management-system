import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { success } from "../../utils/api-response.js";
import { getDashboardMetrics } from "./analytics.service.js";

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await getDashboardMetrics();
  res.json(success(metrics));
});
