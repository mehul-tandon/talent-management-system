import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env.js";

export interface JwtPayload {
  sub: string;
  role: Role;
  employeeId: string | null;
  type: "access" | "refresh";
}

export function signAccessToken(payload: Omit<JwtPayload, "type">) {
  return jwt.sign(
    { ...payload, type: "access" satisfies JwtPayload["type"] },
    env.JWT_ACCESS_SECRET,
    { expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m` }
  );
}

export function signRefreshToken(payload: Omit<JwtPayload, "type">) {
  return jwt.sign(
    { ...payload, type: "refresh" satisfies JwtPayload["type"] },
    env.JWT_REFRESH_SECRET,
    { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` }
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
