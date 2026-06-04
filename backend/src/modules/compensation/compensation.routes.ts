import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/rbac.js";
import { validate } from "../../middlewares/validate.js";
import { getEmployeeCompensation, postCompensation } from "./compensation.controller.js";
import { compensationCreateSchema, employeeCompensationListSchema } from "./compensation.schema.js";

const router = Router();

router.use(authenticate);
router.post(
  "/",
  requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER"),
  validate(compensationCreateSchema),
  postCompensation
);
router.get(
  "/employee/:employeeId",
  requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER", "EMPLOYEE"),
  validate(employeeCompensationListSchema),
  getEmployeeCompensation
);

export default router;
