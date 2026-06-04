import crypto from "node:crypto";
import { Role } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/app-error.js";
import { generateEmployeeCode } from "../../utils/employee-code.js";
import { compareValue, hashValue } from "../../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { env } from "../../config/env.js";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function registerUser(input: {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  departmentId: string;
  designation: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
  }

  const passwordHash = await hashValue(input.password);
  const empCode = await generateEmployeeCode(prisma);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
      employee: {
        create: {
          empCode,
          firstName: input.firstName,
          lastName: input.lastName,
          designation: input.designation,
          hireDate: new Date(),
          departmentId: input.departmentId,
          status: "ONBOARDING"
        }
      }
    },
    include: {
      employee: true
    }
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: true }
  });

  if (!user || !(await compareValue(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const basePayload = {
    sub: user.id,
    role: user.role,
    employeeId: user.employee?.id ?? null
  };

  const accessToken = signAccessToken(basePayload);
  const refreshToken = signRefreshToken(basePayload);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee
    }
  };
}

export async function refreshSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: tokenHash },
    include: { user: { include: { employee: true } } }
  });

  if (!session || session.expiresAt < new Date()) {
    throw new AppError("Refresh session expired", 401, "REFRESH_INVALID");
  }

  const basePayload = {
    sub: payload.sub,
    role: payload.role,
    employeeId: payload.employeeId
  };

  const nextAccessToken = signAccessToken(basePayload);
  const nextRefreshToken = signRefreshToken(basePayload);

  await prisma.session.update({
    where: { refreshTokenHash: tokenHash },
    data: {
      refreshTokenHash: hashToken(nextRefreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
    }
  });

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      employee: session.user.employee
    }
  };
}

export async function logoutSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.session.deleteMany({
    where: { refreshTokenHash: tokenHash }
  });
}
