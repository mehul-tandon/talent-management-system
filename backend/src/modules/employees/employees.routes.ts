import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/rbac.js";
import { validate } from "../../middlewares/validate.js";
import { getEmployee, getEmployees, patchEmployee, postEmployee } from "./employees.controller.js";
import { employeeCreateSchema, employeeListSchema, employeeUpdateSchema } from "./employees.schema.js";

const router = Router();

router.use(authenticate);
router.get("/", validate(employeeListSchema), getEmployees);
router.get("/:id", getEmployee);
router.post("/", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER"), validate(employeeCreateSchema), postEmployee);
router.patch("/:id", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER"), validate(employeeUpdateSchema), patchEmployee);

export default router;
