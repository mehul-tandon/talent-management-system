import type { Request, Response } from "express";
import type { ApplicationStage } from "@prisma/client";
import { asyncHandler } from "../../utils/async-handler.js";
import { success } from "../../utils/api-response.js";
import {
  applyToJob,
  createJob,
  listApplications,
  listJobs,
  parseApplication,
  updateApplicationStage,
  updateJob
} from "./recruitment.service.js";

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const jobs = await listJobs(req.query.publicOnly === "true");
  res.json(success(jobs));
});

export const postJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await createJob(req.body, req.user!.id);
  res.status(201).json(success(job));
});

export const patchJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await updateJob(String(req.params.id), req.body);
  res.json(success(job));
});

export const postApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await applyToJob(String(req.params.id), req.body, req.file);
  res.status(201).json(success(application));
});

export const getApplications = asyncHandler(async (req: Request, res: Response) => {
  const applications = await listApplications(req.query.stage as ApplicationStage | undefined);
  res.json(success(applications));
});

export const patchApplicationStage = asyncHandler(async (req: Request, res: Response) => {
  const application = await updateApplicationStage(String(req.params.id), req.body.stage);
  res.json(success(application));
});

export const postApplicationParse = asyncHandler(async (req: Request, res: Response) => {
  const application = await parseApplication(String(req.params.id));
  res.json(success(application));
});
