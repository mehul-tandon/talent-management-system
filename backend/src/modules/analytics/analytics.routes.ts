import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { getDashboard } from "./analytics.controller.js";

const router = Router();

router.use(authenticate);
router.get("/dashboard", getDashboard);

export default router;
