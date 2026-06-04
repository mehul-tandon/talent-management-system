import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/app-error.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid authorization header", 401, "AUTH_REQUIRED"));
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      employeeId: payload.employeeId
    };
    return next();
  } catch {
    return next(new AppError("Invalid or expired token", 401, "TOKEN_INVALID"));
  }
}
