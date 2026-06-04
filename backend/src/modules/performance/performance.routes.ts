import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/rbac.js";
import { validate } from "../../middlewares/validate.js";
import {
  getManagerGoals,
  getReviewSummary,
  patchGoal,
  postGoal,
  postReview,
  postReviewCycle
} from "./performance.controller.js";
import {
  goalCreateSchema,
  goalUpdateSchema,
  reviewCycleCreateSchema,
  reviewSubmitSchema
} from "./performance.schema.js";

const router = Router();

router.use(authenticate);
router.post("/goals", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER", "EMPLOYEE"), validate(goalCreateSchema), postGoal);
router.patch("/goals/:id", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER", "EMPLOYEE"), validate(goalUpdateSchema), patchGoal);
router.get("/goals/team/:managerId", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER"), getManagerGoals);
router.post("/reviews/cycle", requireRoles("SUPER_ADMIN", "HR_ADMIN"), validate(reviewCycleCreateSchema), postReviewCycle);
router.post("/reviews/:cycleId/submit", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER", "EMPLOYEE"), validate(reviewSubmitSchema), postReview);
router.get("/reviews/360/:empId", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER"), getReviewSummary);

export default router;
