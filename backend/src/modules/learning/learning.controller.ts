import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { success } from "../../utils/api-response.js";
import { createCourse, enrollEmployee, listCourses, listEmployeeEnrollments } from "./learning.service.js";

export const getCourses = asyncHandler(async (_req: Request, res: Response) => {
  const courses = await listCourses();
  res.json(success(courses));
});

export const postCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await createCourse(req.body);
  res.status(201).json(success(course));
});

export const postEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await enrollEmployee(req.body);
  res.status(201).json(success(enrollment));
});

export const getEmployeeEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const enrollments = await listEmployeeEnrollments(String(req.params.employeeId));
  res.json(success(enrollments));
});
