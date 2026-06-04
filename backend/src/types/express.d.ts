import type { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  role: Role;
  employeeId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
