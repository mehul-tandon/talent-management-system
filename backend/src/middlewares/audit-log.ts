import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db.js";
import { logger } from "../config/logger.js";

const MUTATION_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function extractEntity(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const apiVersionIndex = segments.findIndex((segment) => segment === "v1");
  return segments[apiVersionIndex + 1] ?? "system";
}

function extractEntityId(req: Request) {
  const paramId = req.params.id;
  if (typeof paramId === "string" && paramId.length > 0) {
    return paramId;
  }

  const bodyId = req.body?.id;
  if (typeof bodyId === "string" && bodyId.length > 0) {
    return bodyId;
  }

  return req.user?.employeeId ?? req.user?.id ?? "n/a";
}

function extractIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim() ?? req.ip;
  }

  return req.ip;
}

export function auditLog(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !MUTATION_METHODS.has(req.method)) {
    return next();
  }

  const requestBodySnapshot = req.body && Object.keys(req.body).length > 0 ? req.body : undefined;

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400) {
      return;
    }

    void prisma.auditLog
      .create({
        data: {
          userId: req.user?.id,
          action: req.method,
          entity: extractEntity(req.path),
          entityId: extractEntityId(req),
          newValue: requestBodySnapshot,
          ip: extractIp(req)
        }
      })
      .catch((error) => {
        logger.warn("Audit log write failed", { error, path: req.path, method: req.method });
      });
  });

  return next();
}
