import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { uploadsRoot } from "./config/uploads.js";
import authRoutes from "./modules/auth/auth.routes.js";
import employeeRoutes from "./modules/employees/employees.routes.js";
import recruitmentRoutes from "./modules/recruitment/recruitment.routes.js";
import performanceRoutes from "./modules/performance/performance.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import learningRoutes from "./modules/learning/learning.routes.js";
import compensationRoutes from "./modules/compensation/compensation.routes.js";
import { auditLog } from "./middlewares/audit-log.js";
import { errorHandler, notFound } from "./middlewares/error-handler.js";
import { prisma } from "./config/db.js";

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true
  })
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(auditLog);
app.use("/uploads", express.static(uploadsRoot));

app.get("/health", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1", recruitmentRoutes);
app.use("/api/v1", performanceRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/learning", learningRoutes);
app.use("/api/v1/compensation", compensationRoutes);

app.use(notFound);
app.use(errorHandler);
