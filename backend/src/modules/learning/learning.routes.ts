import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { requireRoles } from "../../middlewares/rbac.js";
import { validate } from "../../middlewares/validate.js";
import { getCourses, getEmployeeEnrollments, postCourse, postEnrollment } from "./learning.controller.js";
import { courseCreateSchema, employeeEnrollmentListSchema, enrollmentUpsertSchema } from "./learning.schema.js";

const router = Router();

router.use(authenticate);
router.get("/courses", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER", "EMPLOYEE"), getCourses);
router.post("/courses", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER"), validate(courseCreateSchema), postCourse);
router.post("/enrollments", requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER"), validate(enrollmentUpsertSchema), postEnrollment);
router.get(
  "/enrollments/employee/:employeeId",
  requireRoles("SUPER_ADMIN", "HR_ADMIN", "HR_MANAGER", "DEPT_MANAGER", "EMPLOYEE"),
  validate(employeeEnrollmentListSchema),
  getEmployeeEnrollments
);

export default router;
