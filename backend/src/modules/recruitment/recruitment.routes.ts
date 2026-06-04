import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/rbac.js";
import { validate } from "../../middlewares/validate.js";
import {
  getApplications,
  getJobs,
  patchApplicationStage,
  patchJob,
  postApplication,
  postApplicationParse,
  postJob
} from "./recruitment.controller.js";
import {
  applicationCreateSchema,
  applicationListSchema,
  applicationStageSchema,
  jobCreateSchema,
  jobUpdateSchema
} from "./recruitment.schema.js";
import { resumeUpload } from "./recruitment.upload.js";

const router = Router();

router.get("/jobs", getJobs);
router.post("/jobs/:id/apply", resumeUpload, validate(applicationCreateSchema), postApplication);

router.use(authenticate);
router.post("/jobs", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER"), validate(jobCreateSchema), postJob);
router.patch("/jobs/:id", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER"), validate(jobUpdateSchema), patchJob);
router.get(
  "/applications",
  requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER"),
  validate(applicationListSchema),
  getApplications
);
router.patch("/applications/:id/stage", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER"), validate(applicationStageSchema), patchApplicationStage);
router.post("/applications/:id/parse", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER"), postApplicationParse);

export default router;
