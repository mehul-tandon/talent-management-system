import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { success } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { env } from "../../config/env.js";
import { loginUser, logoutSession, refreshSession, registerUser } from "./auth.service.js";
import { prisma } from "../../config/db.js";

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.NODE_ENV === "production",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json(
    success({
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee
    })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body.email, req.body.password);
  setRefreshCookie(res, result.refreshToken);
  res.json(success({ accessToken: result.accessToken, user: result.user }));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401, "REFRESH_REQUIRED");
  }

  const result = await refreshSession(refreshToken);
  setRefreshCookie(res, result.refreshToken);
  res.json(success({ accessToken: result.accessToken, user: result.user }));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  if (refreshToken) {
    await logoutSession(refreshToken);
  }

  res.clearCookie("refreshToken");
  res.json(success({ loggedOut: true }));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { employee: true }
  });

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  res.json(
    success({
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee
    })
  );
});
