import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/rbac.js";
import { validate } from "../../middlewares/validate.js";
import { getDepartments, postDepartment } from "./admin.controller.js";
import { departmentCreateSchema } from "./admin.schema.js";

const router = Router();

router.use(authenticate);
router.get("/departments", getDepartments);
router.post("/departments", requireRoles("SUPER_ADMIN", "HR_ADMIN"), validate(departmentCreateSchema), postDepartment);

export default router;
