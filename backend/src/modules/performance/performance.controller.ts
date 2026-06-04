import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { success } from "../../utils/api-response.js";
import {
  createGoal,
  createReviewCycle,
  getReviewAggregate,
  listGoalsForManager,
  submitReview,
  updateGoal
} from "./performance.service.js";

export const postGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await createGoal(req.body);
  res.status(201).json(success(goal));
});

export const patchGoal = asyncHandler(async (req: Request, res: Response) => {
  const goal = await updateGoal(String(req.params.id), req.body);
  res.json(success(goal));
});

export const getManagerGoals = asyncHandler(async (req: Request, res: Response) => {
  const goals = await listGoalsForManager(String(req.params.managerId));
  res.json(success(goals));
});

export const postReviewCycle = asyncHandler(async (req: Request, res: Response) => {
  const cycle = await createReviewCycle(req.body);
  res.status(201).json(success(cycle));
});

export const postReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await submitReview(String(req.params.cycleId), req.body);
  res.status(201).json(success(review));
});

export const getReviewSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await getReviewAggregate(String(req.params.empId));
  res.json(success(summary));
});
